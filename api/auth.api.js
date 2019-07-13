var bcrypt = require('bcryptjs'),
  request = require('request'),
  jwt = require('jsonwebtoken'),
  fs = require('fs'),
  crypto = require('crypto'),
  NewsletterApi = require(__dirname + '/newsletter.api.js'),
  newsletterApis = new NewsletterApi(),
  { cdb, idb, mdb, Op } = require('../db'),
  sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var AuthApi = function() {
  this.ensureAuthenticated = handleEnsureAuthenticated;
  this.createAPIToken = handleCreateAPIToken;
  this.createToken = handleCreateToken;
  this.inviteUser = handleInviteUser;
  this.linkedin = handleLinkedin;
  this.signup = handleSignup;
  this.login = handleLogin;
};

/*
 |--------------------------------------------------------------------------
 | Internal functions
 |--------------------------------------------------------------------------
 */

var schema = {
  invite: function(email, invitor_email, location_id, resources) {

    var communities = [location_id];

    for (var n in resources) {
      communities.push(resources[n]);
    }

    return {
      "home": location_id,
      "email": email,
      "invitor_email": invitor_email,
      "invite_communities": communities
    };
  },
  signupform: function(formdata) {
    var hash = bcrypt.hashSync(formdata.password, 8);
    return {
      "type": "user",
      "name": formdata.name,
      "email": formdata.email,
      "password": hash,
      "avatar": "",
      "communities": []
    };
  }
};

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function handleEnsureAuthenticated(req, res, next) {

  if (!req.headers.authorization) {
    console.log('Session is anonymous.');
    return res.status(204).end();
  }
  try {

    if (!req.user || req.user === undefined) {
      req.user = {}; //required step to pursue auth through refresh
    }
    else {
      console.log('Existing user in request');
    }

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      req.user = jwt.verify(req.headers.authorization.split(' ')[1], process.env.SC_TOKEN_SECRET);
    }

    next();
  }
  catch (e) {
    console.warn('WARNING: EnsureAuth failure: ', e);
    return res.status(204).end();
  }
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function handleCreateToken(req, user) {
  return jwt.sign(user.id, process.env.SC_TOKEN_SECRET);
}

function handleCreateAPIToken(req, res) {
  // todo needs to be redone if jwt-simple is no longer used
  /*var payload = {
   iss: req.hostname,
   sub: req.user,
   iat: moment().valueOf(),
   exp: moment().add(90, 'days').valueOf()
   };
   return res.status(201).send(jwt.encode(payload, process.env.API_TOKEN_SECRET));*/

  cdb.findById(req.user)
    .then(response => {
      if (response) {
        response = response.toJSON();
        console.log('Matching user found.');
        /* if (response.api_key === undefined) {
         // get user account and re-upload with api_key
           db.update({api_key: jwt.encode(payload, process.env.API_TOKEN_SECRET)}, {where: {id: req.user}})
             .then(function () {
               console.log("Profile updated.");
             })
             .catch(function (err) {

               if(err.code == 'ER_EMPTY_QUERY') console.log('No changes to update..');

               console.error("Profile update failed:");
               console.error(err.body);
             });
         }*/
      }
      else {
        console.warn('WARNING:  API Token for a user that does not exist!!');
      }
    })
    .catch(function(err) {
      console.log("WARNING: ", err);
      return res.status(202).send({ message: 'Something went wrong: ' + String(err) });
    });

}
/*
function formatFindResults(items) {
  if (items.docs && items.docs.length) {
    for (i in items.docs) {
      items.docs[i] = {
        path: {key: items.docs[i]._id},
        value: items.docs[i]
      };
    }
  }
  return items;
}
*/
/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
function handleSignup(req, res) {
  var user = schema.signupform(req.body);

  cdb.findOne({ where: { type: 'user', email: req.body.email } })
    .then(result => {

      if (result) {
        console.log('User already exists');
        return res.status(401).send({ message: 'That email address is already registered to a user.' }); //username already exists
      }
      else {
        console.log('Email is free for use');
        cdb.create(user)
          .then(u => {
            if (u) {
              console.log("USER:");
              console.log(user);
              // TODO put token in user record
              return res.send({ token: handleCreateToken(req, u), user: u });
            }
            else {
              console.warn("WARNING: Search couldn't find user after posting new user!");
              return res.status(401).send({ message: 'Something went wrong!' });
            }
          });
      }
    })
    .catch(function(err) {
      console.warn("WARNING: auth222", err);
      return res.status(202).send({ message: "Something went wrong." });
    });
}


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */

function handleLogin(req, res) {
  cdb.findOne({ where: { type: 'user', email: req.body.email } })
    .then(user => {

      if (user) {
        user = user.toJSON();
        console.log("FOUND USER");
        var hash = user.password;
        if (bcrypt.compareSync(req.body.password, hash)) {
          // TODO put token in user record
          return res.send({ token: handleCreateToken(req, user), user });
        }
        else {
          console.log("PASSWORDS DO NOT MATCH");
          return res.status(401).send({ message: 'Wrong email and/or password' });
        }
      }
      else {
        console.log("COULD NOT FIND USER IN DB FOR SIGNIN");
        return res.status(401).send({ message: 'Wrong email and/or password' });
      }
    })
    .catch(function(err) {
      console.warn("WARNING: ", err);
      return res.status(202).send('Something went wrong: ' + String(err));
    });
}

/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */

function handleLinkedin(req, res) {
  // this function handles new user invites as well as existing user login
  var invite_code = req.body.invite_code,
    accessTokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken',
    emailUrl = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
    peopleApiUrl = 'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))'

  var params = {
    client_id: process.env.LINKEDIN_CLIENTID,
    redirect_uri: req.body.redirect_uri,
    client_secret: process.env.LINKEDIN_CLIENTSECRET,
    code: req.body.code,
    grant_type: 'authorization_code'
  };

  var accept_invite = async function(invitee_email, invitee_name, invitor_email) {
    console.log('invite accepted: ', invitee_email);

    // send 'invite accepted' email to person who sent the invite

    const html = fs.readFileSync(__dirname + '/templates/invitation_accepted.html', 'utf8');

    const msg = {
      templateId: '23ce076f-8f36-4791-8086-13fa11812152',
      to: invitor_email,
      from: 'james@startupcommunity.org',
      subject: invitee_name + ' has accepted your invitation.',
      html,
      substitutionWrappers: ['%', '%'],
      substitutions: {
        'title_bar': 'Invitation Accepted',
        'content': '<strong>Congrats!</strong> ' + invitee_name + ' has accepted your invitation and is now part of the community.'
      }
    };
    sgMail.send(msg).catch(err => console.log('WARNING: ', err.toString()));
    /*
        // add a question for their profile
        var datetime = new Date(); // added as milliseconds since epoch

        var question = {
          "type": 'question',
          "from": {
            "key": 'james',
            "name": 'James Gentes',
            "avatar": 'https://startupcommunity-dev.s3-us-west-2.amazonaws.com/profiles/james_me_wkids_square.png',
            "headline": 'Founder of StartupCommunity.org'
          },
          "to": invite_code,
          "published": datetime.getTime(),
          "content": 'What are you working on right now?',
          "replies": []
        };

        mdb.create(question)
          .then(function () {
            console.log('Question posted to new user account')
          })
          .catch(function (err) {
            console.error("POST FAIL:");
            console.error(err);
          });
    */
  };

  var delete_invite = function() {
    idb.findById(invite_code).then(i => {
      if (i) {
        idb.destroy({ where: { id: invite_code } })
          .then(result => {
            if (result) {
              console.log('Invitation applied and deleted: ' + invite_code);
            }
            else {
              console.warn('WARNING: Invitation was used but not deleted: ' + invite_code);
            }
          })
      }
    })
  };

  // Exchange authorization code for access token.
  request.post(accessTokenUrl, { form: params, json: true }, function(err, response, body) {
    if (response.statusCode !== 200) {
      console.log('ERROR: ', err || body)
      return res.status(response.statusCode).send({ message: body.error_description });
    }

    var params = {oauth2_access_token: body.access_token};

    // Retrieve profile information about the current user.
    request.get({ url: emailUrl, qs: params, json: true }, async function(err, response, profile) {
      if (err) {
        console.warn("WARNING: ", err);
        return res.status(401).send({ message: 'Something went wrong: ' + String(err) });
      }
      else {
        profile['access_token'] = params.oauth2_access_token;
        //profile.firstName = profile.firstName.localized.en_US;
        //profile.lastName = profile.lastName.localized.en_US;
        profile.emailAddress = profile.elements && profile.elements[0] && profile.elements[0]['handle~'] && profile.elements[0]['handle~']['emailAddress'];
        delete profile.elements;
      }

      // let's get their name as well
      await request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, person) {
        if (err) console.warn("WARNING: Problem obtaining profile details:", err);
        console.log('PEOPLE PROFILE: ', person);
      });

      // if this is an invitation, pull that invite data first
      if (invite_code) {
        idb.findById(invite_code)
          .then(result => {
            if (result) {
              console.log('Verified invitation');
              userCheck(result);
            }
            else {
              console.log('Invalid invite code: ' + invite_code);
              userCheck();
              //return res.status(404).send({message: 'Sorry, this invite code is not valid: ' + invite_code});
            }
          });
      }
      else userCheck();

      function addCommunities(user_profile, invite_profile) {
        // add invite data to existing user record and delete invite
        if (invite_profile && invite_profile.invite_communities) {

          if (!user_profile.communities) user_profile.communities = [];

          for (var i in invite_profile.invite_communities) {

            if (user_profile.communities) {
              if (user_profile.communities.indexOf(invite_profile.invite_communities[i]) < 0) {
                user_profile.communities.push(invite_profile.invite_communities[i]);
              }
            }
          }
        }
        return user_profile;
      }

      function userCheck(invite_profile) {

        // check to see if this linkedin account is already linked to an existing user
        cdb.findOne({ where: { "linkedin.id": profile.id } })
          .then(result => {

            if (result) {

              // yes, there is an existing user in the system that matched the linkedin id
              result = result.toJSON();
              let keepSynced = result.linkedin && result.linkedin.keepSynced;
              profile.keepSynced = keepSynced;
              result.linkedin = profile;

              console.log("Found existing user: " + profile.firstName + ' ' + profile.lastName);

              // get user account and update with latest linkedin data

              if (!result.avatar || keepSynced) result.avatar = profile.pictureUrl;
              if (!result.summary || keepSynced) result.summary = profile.summary;
              if (!result.headline || keepSynced) result.headline = profile.headline;
              if (!result.name || keepSynced) result.name = profile.firstName + ' ' + profile.lastName;
              if (!result.email || keepSynced) result.email = profile.emailAddress;

              result = addCommunities(result, invite_profile);

              cdb.update(result, { where: { id: result.id } })
                .then(() => {
                  console.log("Profile updated: " + result.name);
                  if (invite_profile) {
                    accept_invite(invite_profile.email, result.name, invite_profile.invitor_email);
                    delete_invite();
                  }
                })
                .catch(function(err) {
                  if (err.code == 'ER_EMPTY_QUERY') {
                    console.log('No changes to update..');
                  }
                  else console.error("Profile update failed: ", err);
                });

              var newresponse = result;
              newresponse.token = handleCreateToken(req, result);
              return res.send(newresponse);

            }
            else {

              // search by email
              cdb.findOne({ where: { email: profile.emailAddress } })
                .then(result => {

                  if (result) {
                    result = result.toJSON();
                    // yes, an existing user that matched email address of invitee.email
                    console.log("Found user: " + result.name);

                    // get user account and re-upload with linkedin data
                    result = addCommunities(result, invite_profile);
                    result.linkedin = profile;

                    cdb.update(result, { where: { id: result.id } })
                      .then(() => {
                        console.log("Profile updated: " + profile.emailAddress);
                        if (invite_profile) {
                          accept_invite(invite_profile.email, result.name, invite_profile.invitor_email);
                          delete_invite();
                        }
                      })
                      .catch(function(err) {
                        if (err.code == 'ER_EMPTY_QUERY') {
                          console.log('No changes to update..');
                        }
                        else console.warn("WARNING: ", err);
                      });

                    var newresponse = result;
                    newresponse.token = handleCreateToken(req, result);
                    return res.send(newresponse);

                  }
                  else {
                    console.log('No existing user found!');

                    if (invite_profile) {
                      console.log(invite_profile);
                      // note that we don't validate the invite email matches the linkedin email, so anyone can use the invite once.

                      var new_invite_profile = invite_profile.toJSON(); // must copy object or variable change will affect original object

                      // update the invite record with user details

                      new_invite_profile.id = invite_code;
                      new_invite_profile.type = "user";
                      new_invite_profile.linkedin = profile;
                      new_invite_profile.avatar = profile.pictureUrl;
                      new_invite_profile.name = profile.firstName + ' ' + profile.lastName;
                      new_invite_profile.summary = profile.summary;
                      new_invite_profile.headline = profile.headline;
                      new_invite_profile.email = profile.emailAddress;
                      new_invite_profile.communities = invite_profile.invite_communities;
                      new_invite_profile.roles = {};
                      delete new_invite_profile.invite_communities;
                      var invitor_email = invite_profile.invitor_email;
                      delete new_invite_profile.invitor_email;

                      cdb.create(new_invite_profile)
                        .then(p => {
                          if (p) {
                            console.log("Profile created: " + JSON.stringify(new_invite_profile));

                            var newresponse = new_invite_profile;
                            new_invite_profile.token = handleCreateToken(req, new_invite_profile);

                            accept_invite(invite_profile.email, new_invite_profile.name, invitor_email);

                            return res.send(newresponse);
                          }
                        })
                        .catch(function(err) {
                          console.warn("WARNING: ", err);
                        });

                    }
                    else {
                      return res.status(401).send({
                        profile: profile,
                        message: "We couldn't find " + profile.firstName + " " + profile.lastName + " with email address '" + profile.emailAddress + "' in our system. <br/><br/>Please <a href='/' target='_self'>click here to request an invitation</a>."
                      });
                    }

                  }
                })
                .catch(function(err) {
                  console.warn("WARNING:", err);
                  return res.status(202).send({ message: "Something went wrong." });
                });
            }
          })
          .catch(function(err) {
            console.warn("WARNING:", "Something went wrong. ", err);
          });
      }

    });
  });
}
/*

function formatSearchResults(items) {
  if (items.rows && items.rows.length) {
    for (i in items.rows) {
      items.rows[i].doc = {
        path: {key: items.rows[i].id},
        value: items.rows[i].doc
      };
    }
  }
  return items;
}
*/
/*
 |--------------------------------------------------------------------------
 | Invite Person
 |--------------------------------------------------------------------------
 */

function handleInviteUser(req, res) {
  var inviteUser = req.body.params;
  console.log(inviteUser);

  console.log('Inviting ' + inviteUser.email + ' to ' + inviteUser.location_id + ' / ' + inviteUser.resources);

  var goInvite = function() {
    // validate user has leader role within the location/community, or let them through if they are a member of the location

    cdb.findById(req.user)
      .then(response => {
        if (response) {
          var user = response.toJSON();
          if (user.communities.indexOf(inviteUser.location_id) < 0) {
            return res.status(202).send({ message: 'You must be a member of this community to invite someone.' });
          }

          for (var u in inviteUser.resources) {

            // add subscriber to newsletter lists

            newsletterApis.addSubscriber(inviteUser.location_id, inviteUser.resources[u], inviteUser);
          }

          var sendMessage = async(invitecode, subject) => {
            var content = user.name + ' invites you to join the ' + inviteUser.location_name.split(',')[0] + ' Startup Community.';
            const html = fs.readFileSync(__dirname + '/templates/invitation.html', 'utf8');

            const msg = {
              templateId: '23ce076f-8f36-4791-8086-13fa11812152',
              to: inviteUser.email,
              from: user.email,
              subject: subject || content,
              html,
              substitutionWrappers: ['%', '%'],
              substitutions: {
                'title_bar': 'Invitation',
                'invite_url': 'https://startupcommunity.org/' + inviteUser.location_id + '/welcome?invite_code=' + invitecode,
                'invite_code': invitecode,
                'invite_email': inviteUser.email,
                'invite_message': inviteUser.message ? '"' + inviteUser.message + '"' : '',
                'invitor_image': user.avatar,
                'invitor_name': user.name,
                'content': content
              },
            };

            return sgMail.send(msg);
          }

          // check to see if the email address already exists within the system
          cdb.findOne({
              where: {
                [Op.or]: [{ "linkedin.emailAddress": inviteUser.email }, { email: inviteUser.email }]
              }
            })
            .then(result => {

              if (result) {
                console.log("Existing user found!");

                var existing = result.toJSON();

                if (!existing.communities) existing.communities = [];

                for (var n in inviteUser.resources) {
                  if (existing.communities.indexOf(inviteUser.resources[n]) == -1) {
                    existing.communities.push(inviteUser.resources[n]);
                  }
                }

                if (existing.communities.indexOf(inviteUser.location_id) == -1) {
                  existing.communities.push(inviteUser.location_id);
                }

                cdb.update(existing, { where: { id: result.id } })
                  .then(response => {
                    console.log("User updated!");
                    return res.status(200).send({ message: 'Nice!  <a target="_blank" href="https://startupcommunity.org/' + result.id + '">' + result.name + '</a> is a member of the community.' });
                  })
                  .catch(function(err) {

                    if (err.code == 'ER_EMPTY_QUERY') {
                      console.log('No changes to update..');
                    }
                    else {
                      console.log('WARNING: ', err);
                      return res.status(202).send({ message: "Something went wrong." });
                    }
                  });

              }
              else {
                // no existing user, so search for existing invite
                idb.findOne({ where: { email: inviteUser.email } })
                  .then(result => {

                    if (result) {
                      console.log("Existing invite found!");
                      sendMessage(result.id, "Invitation reminder from " + user.name)
                        .then(() => {
                          console.log('Invitation reminder sent to ' + inviteUser.email);
                        }).catch(err => {
                          console.log('WARNING: ', err.toString());
                        });

                      return res.status(200).send({ message: 'An invitation has already been sent to ' + inviteUser.email + '. We will send a reminder.' });
                    }
                    else {

                      // create user record with email address and community data
                      var newUser = schema.invite(inviteUser.email, user.email, inviteUser.location_id, inviteUser.resources);
                      console.log('creating user invitation');

                      idb.create(newUser)
                        .then(response => {

                          var invitecode = response.id;

                          sendMessage(invitecode).then(() => {
                            console.log('Invitation sent to ' + inviteUser.email + ' (' + invitecode + ')');
                            return res.status(200).send({ message: "Done! We've sent an invitation to " + inviteUser.email });

                          }).catch(err => {
                            console.log('WARNING: ', err.toString());
                            // rollback invitation
                            idb.destroy({ where: { id: invitecode } });
                            return res.status(202).send({ message: "Woah! Something went wrong. We're looking into it, but also try waiting a few minutes and give it another shot." });

                          });

                        })
                        .catch(function(err) {
                          console.log('WARNING: ', err);
                          return res.status(202).send({ message: "Woah! Something went wrong.  We're looking into it, but also try waiting a few minutes and give it another shot." });
                        });
                    }
                  })
                  .catch(function(err) {
                    console.log('WARNING: ', err);
                    return res.status(202).send({ message: "Woah! Something went wrong. We're looking into it, but also try waiting a few minutes and give it another shot." });
                  });
              }
            });
        }
      })

      .catch(function(err) {
        console.warn("WARNING:", err);
      });
  };

  if (!req.user) {
    //where['roles.leader.' + inviteUser.location_id] = {[Op.ne]:null};
    cdb.findById('james').then(result => {
      if (result) {
        result = result.toJSON();
        console.log('Found leader to use for invite.');
        req.user = result.id;
        goInvite();
      }
      else {
        console.warn('WARNING: No leader found! Need one for user invitations to be sent.');
        return res.status(202).send({ message: "There doesn't appear to be a leader for this community! We've been alerted and will look into it." });
      }
    })
  }
  else goInvite();

}

module.exports = AuthApi;
