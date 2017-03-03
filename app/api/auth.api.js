var bcrypt = require('bcryptjs'),
    request = require('request'),
    jwt = require('jsonwebtoken'),
    crypto = require('crypto'),
    NewsletterApi = require(__dirname + '/newsletter.api.js'),
    newsletterApis = new NewsletterApi(),
  Cloudant = require('cloudant'),
  cloudant = Cloudant({
    account: process.env.DB_ACCOUNT,
    password: process.env.DB_PASSWORD,
    plugin: 'promises'
  }),
  cdb = cloudant.db.use(process.env.DB_COMMUNITIES),
  cdb_messages = cloudant.db.use(process.env.DB_MESSAGES),
    knowtify = require('knowtify-node');

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
    invite: function(email, invitor_email, location_key, resources) {

        var communities = [location_key];

        for (n in resources) {
            communities.push(resources[n]);
        }

        return {
            "type": "invite",
            "profile": {
                "home": location_key,
                "email": email
            },
            "invitor_email" : invitor_email,
            "invite_communities": communities
        };
    },
    signupform: function(formdata) {
        var hash = bcrypt.hashSync(formdata.password, 8);
        return {
            "type": "user",
            "context": {
                "location": "us",
                "community": ""
            },
            "profile": {
                "name": formdata.name,
                "email": formdata.email,
                "password": hash,
                "avatar": ""
            },
            "communities": {
                "usa": {
                    "oregon": {
                        "deschutes-or": {
                            "bend-or": {
                                "roles": [
                                    "supporter"
                                ]
                            }
                        }
                    }
                }
            }
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
        } else {
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
    return jwt.sign(user.path.key, process.env.SC_TOKEN_SECRET);
}

function handleCreateAPIToken(req, res) {
    // todo needs to be redone if jwt-simple is no longer used
    /*var payload = {
        iss: req.hostname,
        sub: req.user,
        iat: moment().valueOf(),
        exp: moment().add(90, 'days').valueOf()
    };
    res.status(201).send(jwt.encode(payload, process.env.API_TOKEN_SECRET));*/

    cdb.get(req.user)
        .then(function(response){
            if (response.code !== "items_not_found") {
                console.log('Matching user found.');
                if (response.profile.api_key === undefined) {
                    // todo update next line
                    //response.body.profile["api_key"] = jwt.encode(payload, process.env.API_TOKEN_SECRET); // get user account and re-upload with api_key
                    cdb.insert(req.user, response)
                        .then(function () {
                            console.log("Profile updated.");
                        })
                        .catch(function (err) {
                            console.error("Profile update failed:");
                            console.error(err.body);
                        });
                }
            } else {
                console.warn('WARNING:  API Token for a user that does not exist!!');
            }
        })
        .catch(function(err){
            console.log("WARNING: ", err);
            res.status(202).send({ message: 'Something went wrong: ' + String(err)});
        });

}

function formatFindResults(items) {
  if (items.docs && items.docs.length) {
    for (i in items.docs) {
      items.docs[i] = {
        path: { key: items.docs[i]._id },
        value: items.docs[i]
      };
    }
  }
  return items;
}

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
function handleSignup(req, res) {
    var user = schema.signupform(req.body);

  cdb.find({selector: {type: 'user', 'profile.email': req.body.profile.email}, limit: 1})
    .then(function(result){
      result = formatFindResults(result);

            if (result.docs.length > 0) {
                console.log('User already exists');
                res.status(401).send({ message: 'That email address is already registered to a user.'}); //username already exists
            } else {
                console.log('Email is free for use');
                cdb.insert(user)
                    .then(function () {
                      cdb.find({selector: {type: 'user', 'profile.email': req.body.profile.email}, limit: 1})
                        .then(function(result){
                          result = formatFindResults(result);
                                if (result.docs.length > 0) {
                                    console.log("USER:");
                                    console.log(user);
                                    // TODO put token in user record
                                    res.send({ token: handleCreateToken(req, result.docs[0]), user: result.docs[0] });
                                } else {
                                    console.warn("WARNING: Search couldn't find user after posting new user!");
                                    res.status(401).send({ message: 'Something went wrong!'});
                                }
                            })
                            .catch(function(err){
                                console.log("WARNING: auth211", err);
                                res.status(202).send({ message: "Something went wrong."});
                            })
                            .catch(function (err) {
                                console.log("WARNING: auth215:", err);
                                res.status(202).send({ message: "Something went wrong."});
                            });
                    });
            }
        })
        .catch(function(err){
            console.warn("WARNING: auth222", err);
            res.status(202).send({ message: "Something went wrong."});
        });
}


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */

function handleLogin(req, res) {
  cdb.find({selector: {type: 'user', 'profile.email': req.body.profile.email}, limit: 1})
    .then(function(result){
      result = formatFindResults(result);

            if (result.docs.length > 0) {
                console.log("FOUND USER");
                var hash = result.docs[0].value.profile.password;
                if (bcrypt.compareSync(req.body.profile.password, hash)) {
                    // TODO put token in user record
                    res.send({ token: handleCreateToken(req, result.docs[0]), user: result.docs[0] });
                } else {
                    console.log("PASSWORDS DO NOT MATCH");
                    return res.status(401).send({ message: 'Wrong email and/or password' });
                }
            } else {
                console.log("COULD NOT FIND USER IN DB FOR SIGNIN");
                return res.status(401).send({ message: 'Wrong email and/or password' });
            }
        })
        .catch(function(err){
            console.warn("WARNING: ", err);
            res.status(202).send('Something went wrong: ' + String(err));
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
        accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken',
        peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url;secure=true,headline,location,summary,industry,public-profile-url)';

    var params = {
        client_id: process.env.LINKEDIN_CLIENTID,
        redirect_uri: req.body.redirectUri,
        client_secret: process.env.LINKEDIN_CLIENTSECRET,
        code: req.body.code,
        grant_type: 'authorization_code'
    };

    var accept_invite = function(invitee_email, invitee_name, invitor_email) {
        // update Knowtify with invitation accepted
        console.log('invite accepted: ', invitee_email);
        var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

        // send 'invite accepted' email to person who sent the invite
        knowtifyClient.contacts.upsert({
            "event": 'invite_accepted',
            "contacts": [
                {
                    "email": invitor_email,
                    "data": {
                        "invitee_name": invitee_name
                    }
                }
            ]
        });

        // update record of person who accepted the invite (to prevent reminder emails)
        knowtifyClient.contacts.upsert({
            "contacts": [
                {
                    "email": invitee_email,
                    "data": {
                        "invite_accepted": true
                    }
                }
            ]
        });

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

        cdb_mesages.insert(question)
            .then(function () {
                console.log('Question posted to new user account')
            })
            .catch(function (err) {
                console.error("POST FAIL:");
                console.error(err);
            });

    };

    var delete_invite = function() {
        cdb.destroy(invite_code, true)
            .then(function (result) {
                console.log('Invitation applied and deleted: ' + invite_code);
            })
            .catch(function (err) {
                console.warn('WARNING: Invitation was used but not deleted: ' + invite_code);
            })
    };

    var add_knowtify = function(user) {
        // send user info to Knowtify
        console.log('updating Knowtify')
        var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

        knowtifyClient.contacts.upsert({
            "contacts": [
                {
                    "email": user.profile.email,
                    "data": {
                        "name": user.profile.name,
                        "email": user.profile.email
                    }
                }
            ]
        });
    };

    // Exchange authorization code for access token.
    request.post(accessTokenUrl, {form: params, json: true}, function (err, response, body) {

        if (response.statusCode !== 200) {
            return res.status(response.statusCode).send({message: body.error_description});
        }

        var params = {
            oauth2_access_token: body.access_token,
            format: 'json'
        };

        // Retrieve profile information about the current user.
        request.get({url: peopleApiUrl, qs: params, json: true}, function (err, response, profile) {

            if (err) {
                console.warn("WARNING: ", err);
                return res.status(401).send({message: 'Something went wrong: ' + String(err)});
            } else profile['access_token'] = params.oauth2_access_token;

            // if this is an invitation, pull that invite data first
            if (invite_code) {
                db.newSearchBuilder()
                    .collection(process.env.DB_COMMUNITIES)
                    .limit(1)
                    .query('@value.type: "invite" AND @path.key: ' + invite_code)
                    .then(function (result) {
                        if (result.docs.length > 0) {
                            console.log('Verified invitation');
                            userCheck(result.docs[0].value);
                        } else {
                            console.log('Invalid invite code: ' + invite_code);
                            userCheck();
                            //return res.status(404).send({message: 'Sorry, this invite code is not valid: ' + invite_code});
                        }
                    })
            } else userCheck();

            function addCommunities(user_profile, invite_profile) {
                // add invite data to existing user record and delete invite
                if (invite_profile && invite_profile.invite_communities) {

                    if (!user_profile.value.communities) user_profile.value["communities"] = [];

                    for (i in invite_profile.invite_communities) {

                        if (user_profile.value.communities && user_profile.value.communities.indexOf(invite_profile.invite_communities[i]) < 0) {
                            user_profile.value.communities.push(invite_profile.invite_communities[i]);
                        }
                    }
                }
                return user_profile;
            }

            function userCheck(invite_profile) {

                // check to see if this linkedin account is already linked to an existing user
              cdb.find({selector: {type: 'user', 'profile.linkedin.id': profile.id}, limit: 1})
                .then(function(result){
                  result = formatFindResults(result);
                  console.log(result);

                        if (result.docs.length > 0) {

                            // yes, there is an existing user in the system that matched the linkedin id

                            console.log("Found existing user: " + profile.firstName + ' ' + profile.lastName);
                            result.docs[0].value.profile["linkedin"] = profile;

                            // get user account and update with latest linkedin data

                            if (!result.docs[0].value.profile.avatar) {
                                result.docs[0].value.profile['avatar'] = profile.pictureUrl;
                            }

                            if (!result.docs[0].value.profile.summary) {
                                result.docs[0].value.profile['summary'] = profile.summary;
                            }

                            if (!result.docs[0].value.profile.headline) {
                                result.docs[0].value.profile['headline'] = profile.headline;
                            }

                            if (!result.docs[0].value.profile.name) {
                                result.docs[0].value.profile.name = profile.firstName + ' ' + profile.lastName;
                            }

                            if (!result.docs[0].value.profile.email) {
                                result.docs[0].value.profile.email = profile.emailAddress;
                            }

                            result.docs[0] = addCommunities(result.docs[0], invite_profile);
                            result.docs[0].value['_id'] = result.docs[0].path.key;

                            cdb.insert(result.docs[0].value)
                                .then(function () {
                                    console.log("Profile updated: " + result.docs[0].value.profile.name);
                                    if (invite_profile) {
                                        accept_invite(invite_profile.profile.email, result.docs[0].value.profile.name, invite_profile.invitor_email);
                                        delete_invite();
                                    }
                                    add_knowtify(result.docs[0].value);
                                })
                                .catch(function (err) {
                                    console.error("Profile update failed: ", err);
                                });

                            var newresponse = result.docs[0];
                            newresponse['token'] = handleCreateToken(req, result.docs[0]);
                            res.send(newresponse);

                        } else {

                            // search by email
                          cdb.find({selector: {type: 'user', 'profile.email': profile.emailAddress}, limit: 1})
                            .then(function(result){
                              result = formatFindResults(result);

                                    if (result.docs.length > 0) {

                                        // yes, an existing user that matched email address of invitee.email

                                        console.log("Found user: " + profile.firstName + ' ' + profile.lastName);

                                        // get user account and re-upload with linkedin data

                                        result.docs[0].value.profile["linkedin"] = profile;

                                        result.docs[0] = addCommunities(result.docs[0], invite_profile);
                                      result.docs[0].value['_id'] = result.docs[0].path.key;

                                        cdb.insert(result.docs[0].value)
                                            .then(function () {
                                                console.log("Profile updated: " + profile.emailAddress);
                                                if (invite_profile) {
                                                    accept_invite(invite_profile.profile.email, profile.firstName + ' ' + profile.lastName, invite_profile.invitor_email);
                                                    delete_invite();
                                                }
                                                add_knowtify(result.docs[0].value);
                                            })
                                            .catch(function (err) {
                                                console.warn("WARNING: ", err);
                                            });

                                        var newresponse = result.docs[0];
                                        newresponse['token'] = handleCreateToken(req, result.docs[0])
                                        res.send(newresponse);

                                    } else {
                                        console.log('No existing user found!');

                                        if (invite_profile) {

                                            // note that we don't validate the invite email matches the linkedin email, so anyone can use the invite once.

                                            var new_invite_profile = JSON.parse(JSON.stringify(invite_profile)); // must copy object or variable change will affect original object

                                            // update the invite record with user details

                                            new_invite_profile.type = "user";
                                            new_invite_profile.profile.linkedin = profile;
                                            new_invite_profile.profile.avatar = profile.pictureUrl;
                                            new_invite_profile.profile.name = profile.firstName + ' ' + profile.lastName;
                                            new_invite_profile.profile.summary = profile.summary;
                                            new_invite_profile.profile.headline = profile.headline;
                                            new_invite_profile.profile.email = profile.emailAddress;
                                            new_invite_profile["communities"] = invite_profile.invite_communities;
                                            new_invite_profile["roles"] = {};
                                            delete new_invite_profile.invite_communities;
                                            var invitor_email = invite_profile.invitor_email;
                                            delete new_invite_profile.invitor_email;

                                            // need to add path for res.send
                                            var new_profile = {
                                                path: {
                                                    key: invite_code
                                                },
                                                value: new_invite_profile
                                            };

                                            new_invite_profile['_id'] = invite_code;

                                            cdb.insert(new_invite_profile)
                                                .then(function () {
                                                    console.log("Profile created: " + JSON.stringify(new_profile));

                                                    var newresponse = new_profile;
                                                    newresponse['token'] = handleCreateToken(req, new_profile);

                                                    res.send(newresponse);

                                                    add_knowtify(new_invite_profile);
                                                    accept_invite(invite_profile.profile.email, new_invite_profile.profile.name, invitor_email);
                                                })
                                                .catch(function (err) {
                                                    console.warn("WARNING: ", err);
                                                });

                                        } else {
                                            res.status(401).send({
                                                profile: profile,
                                                message: "We couldn't find " + profile.firstName + " " + profile.lastName + " with email address '" + profile.emailAddress + "' in our system. <br/><br/>Please <a href='/' target='_self'>click here to request an invitation</a>."
                                            });
                                        }

                                    }
                                })
                                .catch(function (err) {
                                    console.warn("WARNING:", err);
                                    res.status(202).send({message: "Something went wrong."});
                                });
                        }
                    })
                    .catch(function (err) {
                        console.warn("WARNING:", "Something went wrong. ", err);
                    });
            }

        });
    });
}


function formatSearchResults(items) {
  if (items.rows && items.rows.length) {
    for (i in items.rows) {
      items.rows[i].doc = {
        path: { key: items.rows[i].id },
        value: items.rows[i].doc
      };
    }
  }
  return items;
}

/*
 |--------------------------------------------------------------------------
 | Invite Person
 |--------------------------------------------------------------------------
 */

function handleInviteUser(req, res) {
    var inviteUser = req.body.params;
    console.log(inviteUser);

    console.log('Inviting ' + inviteUser.email + ' to ' + inviteUser.location_key + ' / ' + inviteUser.resources);

    var goInvite = function() {
        // validate user has leader role within the location/community, or let them through if they are a member of the location

        cdb.get(req.user)
            .then(function(response){

                if (response.code !== "items_not_found") {
                    var user = response.body;

                    if (user.communities.indexOf(inviteUser.location_key) < 0) {
                        res.status(202).send({ message: 'You must be a member of this community to invite someone.' });
                    }

                    for (u in inviteUser.resources) {         
                        
                        // add subscriber to newsletter lists
                        
                        newsletterApis.addSubscriber(inviteUser.location_key, inviteUser.resources[u], inviteUser)
                    }

                    // check to see if the email address already exists within the system
                  cdb.search('communities', 'communitySearch', {q: 'type: user AND (profile.linkedin.emailAddress: ' + inviteUser.email + ' OR profile.email: ' + inviteUser.email + ')', include_docs: true})
                    .then(function (result) {
                      result = formatSearchResults(result);
                    
                            if (result.rows.length > 0) {
                                console.log("Existing user found!");

                                var existing = result.rows[0].value;

                                if (!existing.communities) existing.communities = [];

                                for (n in inviteUser.resources) {
                                    if (existing.communities.indexOf(inviteUser.resources[n]) == -1) {
                                        existing.communities.push(inviteUser.resources[n]);
                                    }
                                }

                                if (existing.communities.indexOf(inviteUser.location_key) == -1) {
                                    existing.communities.push(inviteUser.location_key);
                                }

                                db.put(process.env.DB_COMMUNITIES, result.rows[0].path.key, existing)
                                    .then(function (response) {
                                        console.log("User updated!");
                                        res.status(200).send({message: 'Nice!  <a target="_blank" href="https://startupcommunity.org/' + result.rows[0].path.key + '">' + result.rows[0].value.profile.name + '</a> is a member of the community.'});
                                    })
                                    .catch(function(err) {
                                        console.log('WARNING: ', err);
                                        res.status(202).send({message: "Something went wrong."});
                                    })

                            } else {
                                // no existing user, so search for existing invite
                                db.newSearchBuilder()
                                    .collection(process.env.DB_COMMUNITIES)
                                    .limit(1)
                                    .query('@value.type: "invite" AND @value.profile.email: "' + inviteUser.email + '"')
                                    .then(function (result) {
                                        if (result.docs.length > 0) {
                                            console.log("Existing invite found!");
                                            res.status(200).send({message: 'An invitation has already been sent to ' + inviteUser.email + '. We will send a reminder.'});

                                            var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

                                            // update client with id of discovered invite

                                            knowtifyClient.contacts.upsert({
                                                    "contacts": [
                                                        {
                                                            "email": inviteUser.email,
                                                            "data": {
                                                                "invite_code": result.docs[0].path.key
                                                            }
                                                        }
                                                    ]
                                                },
                                                function (success) {
                                                    console.log('Record updated');
                                                    knowtifyClient.contacts.upsert({
                                                            "event": "reminder",
                                                            "contacts": [{
                                                                "email": inviteUser.email
                                                            }]
                                                        },
                                                        function (success) {
                                                            console.log('Invitation reminder sent to ' + inviteUser.email);
                                                        },
                                                        function (error) {
                                                            console.log('WARNING:', error);
                                                        });
                                                },
                                                function (error) {
                                                    console.log('WARNING:', error);
                                                });

                                        } else {
                                            
                                            // create user record with email address and community data
                                            var newUser = schema.invite(inviteUser.email, user.profile.email, inviteUser.location_key, inviteUser.resources);
                                            console.log('creating user');

                                            db.post(process.env.DB_COMMUNITIES, newUser)
                                                .then(function (response) {
                                                    var userkey = response.headers.location.split('/')[3]; // hope their response format doesn't change :-/

                                                    // send email with knowtify with unique link
                                                    var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

                                                    knowtifyClient.contacts.upsert({
                                                            "event": "invitation",
                                                            "contacts": [{
                                                                "email": inviteUser.email,
                                                                "data": {
                                                                    "invite_community": inviteUser.location_name.split(',')[0],
                                                                    "invite_url": inviteUser.location_key,
                                                                    "invite_code": userkey,
                                                                    "invite_message": inviteUser.message,
                                                                    "invitor_name": user.profile.name,
                                                                    "invitor_email": user.profile.email,
                                                                    "invitor_image": user.profile.avatar,
                                                                    "invite_accepted": false
                                                                }
                                                            }]
                                                        },
                                                        function (success) {
                                                            console.log('Invitation sent to ' + inviteUser.email + ' (' + userkey + ')');
                                                            res.status(200).send({message: "Done! We've sent an invitation to " + inviteUser.email});
                                                        },
                                                        function (error) {
                                                            console.log('WARNING: ', error);
                                                            res.status(202).send({message: "Woah! Something went wrong. We're looking into it, but also try waiting a few minutes and give it another shot."});

                                                            // rollback invitation
                                                            db.delete(process.env.DB_COMMUNITIES, userkey, true)
                                                        });
                                                })
                                                .catch(function(err) {
                                                    console.log('WARNING: ', err);
                                                    res.status(202).send({message: "Woah! Something went wrong.  We're looking into it, but also try waiting a few minutes and give it another shot."});
                                                })
                                        }
                                    })
                                    .catch(function(err) {
                                        console.log('WARNING: ', err);
                                        res.status(202).send({message: "Woah! Something went wrong. We're looking into it, but also try waiting a few minutes and give it another shot."});
                                    })
                            }
                        });

                } else {
                    console.warn('WARNING:  User not found.');
                }
            })

            .catch(function(err){
                console.warn("WARNING:", err);
            });
    };

    if (!req.user) {
      cdb.search('communities', 'communitySearch', {q: 'type: user AND roles.leader.' + inviteUser.location_key + ': ' + inviteUser.location_key, include_docs: true})
        .then(function (result) {
          result = formatSearchResults(result);
      
                if (result.rows.length > 0) {
                    console.log('Found leader to use for invite.');
                    req.user = result.rows[0].path.key;
                    goInvite();
                } else {
                    console.warn('WARNING: No leader found! Need one for user invitations to be sent.');
                    res.status(202).send({message: "There doesn't appear to be a leader for this community! We've been alerted and will look into it."});
                }
            })
            .catch(function (err) {
                console.warn("WARNING: ", err);
                res.status(202).send({message: "Something went wrong."});
            });
    } else goInvite();

}

module.exports = AuthApi;