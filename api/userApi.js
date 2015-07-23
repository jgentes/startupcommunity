var bcrypt = require('bcryptjs'),
  Q = require('q'),
  request = require('request'),
  url = require('url'),
  jwt = require('jwt-simple'),
  moment = require('moment'),
  config = require('../config.json')[process.env.NODE_ENV || 'development'],
  db = require('orchestrate')(config.db.key),
  mandrill = require('mandrill-api/mandrill'),
  mandrill_client = new mandrill.Mandrill(config.mandrill);

require('request-debug')(request); // Very useful for debugging oauth and api req/res

var UserApi = function() {
    this.ensureAuthenticated = handleEnsureAuthenticated;
    this.userSearch = handleUserSearch;
    this.directSearch = handleDirectSearch;
    this.createToken = handleCreateToken;
    this.createAPIToken = handleCreateAPIToken;
    this.invitePerson = handleInvitePerson;
    this.linkedin = handleLinkedin;
    this.getProfile = handleGetProfile;
    this.setRole = handleSetRole;
    this.removeProfile = handleRemoveProfile;
    this.unlink = handleUnlink;
    this.signup = handleSignup;
    this.login = handleLogin;
    this.maintenance = handleMaintenance;
    this.feedback = handleFeedback;
};


/*
 |--------------------------------------------------------------------------
 | Internal functions
 |--------------------------------------------------------------------------
 */

var schema = {
    linkedin: function(profile, email) {
        return {
            "type": "user",
            "context": {
                "location": "us",
                "community": ""
            },
            "profile": {
                "name": profile.firstName + " " + profile.lastName,
                "email": profile.emailAddress || email,
                "linkedin": profile,
                "avatar": profile.pictureUrl || ""
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

var findKey = function(obj, key, results, value) {
    if (!obj) {
        return results;
    }

    var keys = Object.keys(obj);

    for (var i = 0; (i < keys.length); i++) {
        var name = keys[i];
        var subkeys = obj[name];

        if (typeof subkeys === 'object') {
            if (name === key) {
                if (value) {
                    if (obj[name] == value) {
                        results.push(subkeys);
                    }
                } else results.push(subkeys);
            }
            findKey(subkeys, key, results, value);

        } else {
            if (name === key) {
                if (results.indexOf(subkeys) === -1) {
                    if (value) {
                        if (obj[name] == value) {
                            results.push(obj);
                        }
                    } else results.push(obj);
                }
            }
        }
    }
    return results;
};

/*
 |--------------------------------------------------------------------------
 | Search API
 |--------------------------------------------------------------------------
 */

var searchInCommunity = function(location, community, industry, role, limit, offset, query, key) {
    var allowed = false;
    var userperms;

    if (key) { //check api key to determine if restricted profile data is included with results
        try {
            var payload = jwt.decode(key, config.API_token_secret);
            // Assuming key never expires
            //check perms!
            console.log('test then remove me')
            //todo test this
            db.get(config.db.collections.users, payload.sub)
              .then(function (response) {
                  if (location && community) {
                      userperms = findKey(response.body.communities, location + '.' + community, []);
                  } else if (location && !community) {
                      userperms = findKey(response.body.communities, (location || community), []);
                  }
                  if (userperms[0].roles.indexOf("admin") > -1) { allowed=true; }
              })
              .fail(function(err){
                  console.warn("WARNING: SEARCH FAIL:" + err);
                  return deferred.reject(new Error(err));
              });
        } catch (err) {
            return deferred.reject(new Error(err));
        }
    }

    // create searchstring
    var searchstring = 'communities.';
    if ((location && community) && (location !== community)) {
        searchstring += '*' + location + '.' + community + '.*:*';
    } else {
        searchstring += '*' + (location || community) + '.*:*';
    }
    searchstring += ' AND type:user'; // first argument to scope to community & limit to users

    if (industry && industry[0] !== '*') {
        industry = industry.split(',');
        searchstring += ' AND (';
        for (var i in industry) {
            searchstring += 'communities.*.' + industry[i] + '.*:*'; // scope to industry
            if (i < (industry.length - 1)) { searchstring += ' || '; }
        }
        searchstring += ')';
    }

    if (role && role[0] !== '*') {
        role = role.split(',');
        searchstring += ' AND (';

        for (var i in role) {
            searchstring += 'communities.*.' + (location || community) + '.*:' + role[i]; // scope to role
            if (i < (role.length - 1)) { searchstring += ' || '; }
        }
        searchstring += ')';
    }

    if (query) { searchstring += ' && ' + '(' + query + ')'; }

    var deferred = Q.defer();
    db.newSearchBuilder()
      .collection(config.db.collections.communities)
      .limit(Number(limit) || 32)
      .offset(Number(offset) || 0)
      .query(searchstring)
      .then(function(result){
          var i;

          try {
              for (i=0; i < result.body.results.length; i++) {
                  if (result.body.results[i].path.collection) delete result.body.results[i].path.collection;
                  if (result.body.results[i].path.ref) delete result.body.results[i].path.ref;
                  if (result.body.results[i].value.profile.password) delete result.body.results[i].value.profile.password;
                  if (result.body.results[i].value.type) delete result.body.results[i].value.type;
                  if (result.body.results[i].value.context) delete result.body.results[i].value.context;

                  if (!allowed) {
                      if (result.body.results[i].value.profile.email) delete result.body.results[i].value.profile.email;
                  }

                  if (result.body.results[i].value.linkedin) {
                      if (delete result.body.results[i].value.profile.linkedin.emailAddress) delete result.body.results[i].value.profile.linkedin.emailAddress;
                      if (result.body.results[i].value.profile.linkedin.access_token) delete result.body.results[i].value.profile.linkedin.access_token;
                  }

                  result.body.results[i].value["key"] = result.body.results[i].path.key; //todo haven't verified this is needed to solve people list > person view issues
              }
          } catch (error) {
              console.warn('WARNING:  Possible database entry corrupted: ');
              console.log(result.body.results);
          }

          if (result.body.next) {
              var getnext = url.parse(result.body.next, true);
              result.body.next = '/api/1.1/search' + getnext.search;
          }
          if (result.body.prev) {
              var getprev = url.parse(result.body.prev, true);
              result.body.prev = '/api/1.1/search' + getprev.search;
          }
          deferred.resolve(result.body);
      })
      .fail(function(err){
          console.log(err.body.message);
          deferred.reject(err.body.message);
      });

    return deferred.promise;

};

function handleDirectSearch(req, res) {
    //TODO check for key to protect info?
    db.newSearchBuilder()
        .collection(config.db.collections.communities)
        .limit(Number(req.query.limit) || 100)
        .offset(Number(req.query.offset) || 10)
        .query(req.query.query)
        .then(function(result){
            var i;

            try {
                for (i = 0; i < result.body.results.length; i++) {
                    if (result.body.results[i].value.profile.password) {
                        delete result.body.results[i].value.profile.password;
                    }
                    if (result.body.results[i].value.profile.email) {
                        delete result.body.results[i].value.profile.email;
                    }
                    if (result.body.results[i].value.type) {
                        delete result.body.results[i].value.type;
                    }
                    if (result.body.results[i].value.context) {
                        delete result.body.results[i].value.context;
                    }

                    delete result.body.results[i].path.collection;
                    delete result.body.results[i].path.ref;

                    if (result.body.results[i].value.linkedin) {
                        delete result.body.results[i].value.profile.linkedin.emailAddress;
                        delete result.body.results[i].value.profile.linkedin.access_token;
                    }
                }

                if (result.body.next) {
                    var getnext = url.parse(result.body.next, true);
                    result.body.next = '/api/1.1/search' + getnext.search;
                }
                if (result.body.prev) {
                    var getprev = url.parse(result.body.prev, true);
                    result.body.prev = '/api/1.1/search' + getprev.search;
                }
            } catch (error) {
                console.warn('WARNING:  Possible database entry corrupted: ');
                console.log(result.body.results);
            }

            res.status(200).send(result.body);
        })
        .fail(function(err){
            console.log(err.body.message);
            res.status(400).send({ message: 'Something went wrong: ' + err});
        });
}

function handleUserSearch(req, res){
    var community = req.query.community,
      location = req.query.location,
      cluster = req.query.cluster,
      role = decodeURIComponent(req.query.role),
      query = req.query.search,
      limit = req.query.limit,
      offset = req.query.offset,
      key = req.query.api_key;

    searchInCommunity(location, community, cluster, role, limit, offset, query, key)
      .then(function(userlist){
          res.send(userlist);
      })
      .fail(function(err){
          console.warn(err);
          res.send({message:err});
      });
}

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function handleEnsureAuthenticated(req, res, next) {

    if (!req.headers.authorization) {
        console.log('Session is no longer valid.');
        return res.status(401).end();
    }
    try {

        var token = req.headers.authorization.split(' ')[1];
        var payload = jwt.decode(token, config.token_secret);

        if (payload.exp <= Date.now()) {
            console.log('Token has expired');
            return res.status(401).send({ message: 'Your session has expired. Please log in again.' });
        }

        if (req.user === undefined) {
            req.user = {}; //required step to pursue auth through refresh
        } else {
            console.log('Existing user in request:');
        }

        req.user = payload.sub;
        next();
    }
    catch (e) {
        console.log('EnsureAuth failure: ');
        console.log(e);
        return res.status(401).send({ message: 'Please logout or clear your local browser storage and try again.' });
    }
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function handleCreateToken(req, user) {
    var payload = {
        iss: req.hostname,
        sub: user.path.key,
        iat: moment().valueOf(),
        exp: moment().add(14, 'days').valueOf()
    };
    return jwt.encode(payload, config.token_secret);
}

function handleCreateAPIToken(req, res) {
    var payload = {
        iss: req.hostname,
        sub: req.user,
        iat: moment().valueOf(),
        exp: moment().add(90, 'days').valueOf()
    };
    res.status(201).send(jwt.encode(payload, config.API_token_secret));

    db.get(config.db.collections.users, req.user)
      .then(function(response){
          if (response.body.code !== "items_not_found") {
              console.log('Matching user found.');
              if (response.body.profile.api_key === undefined) {
                  response.body.profile["api_key"] = jwt.encode(payload, config.API_token_secret); // get user account and re-upload with api_key
                  db.put(config.db.collections.users, req.user, response.body)
                    .then(function () {
                        console.log("Profile updated.");
                    })
                    .fail(function (err) {
                        console.error("Profile update failed:");
                        console.error(err.body);
                    });
              }
          } else {
              console.warn('WARNING:  API Token for a user that does not exist!!');
          }
      })
      .fail(function(err){
          console.log("SEARCH FAIL:" + err);
          res.status(400).send({ message: 'Something went wrong: ' + err});
      });

}

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
function handleSignup(req, res) {
    var user = schema.signupform(req.body);

    db.newSearchBuilder()
      .collection(config.db.collections.users)
      .limit(1)
      .query('profile.email: "' + req.body.profile.email + '"')
      .then(function(result){
          if (result.body.results.length > 0) {
              console.log('User already exists');
              res.status(401).send({ message: 'That email address is already registered to a user.'}); //username already exists
          } else {
              console.log('Email is free for use');
              db.post(config.db.collections.users, user)
                .then(function () {
                    db.newSearchBuilder()
                      .collection(config.db.collections.users)
                      .limit(1)
                      .query('profile.email: "' + req.body.profile.email + '"')
                      .then(function(result){
                          if (result.body.results.length > 0) {
                              console.log("USER:");
                              console.log(user);
                              res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });
                          } else {
                              console.warn("WARNING: Search couldn't find user after posting new user!");
                              res.status(401).send({ message: 'Something went wrong!'});
                          }
                      })
                      .fail(function(err){
                          console.log("SEARCH FAIL:" + err);
                          res.status(400).send({ message: 'Something went wrong: ' + err});
                      })
                      .fail(function (err) {
                          console.log("POST FAIL:" + err.body);
                          res.status(400).send({ message: 'Something went wrong: ' + err});
                      });
                });
          }
      })
      .fail(function(err){
          console.log("SEARCH FAIL:" + err);
          res.status(400).send({ message: 'Something went wrong: ' + err});
      });
}


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */

function handleLogin(req, res) {
    db.newSearchBuilder()
      .collection(config.db.collections.users)
      .limit(1)
      .query('profile.email: "' + req.body.profile.email + '"')
      .then(function(result){
          if (result.body.results.length > 0) {
              console.log("FOUND USER");
              var hash = result.body.results[0].value.profile.password;
              if (bcrypt.compareSync(req.body.profile.password, hash)) {
                  res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });
              } else {
                  console.log("PASSWORDS DO NOT MATCH");
                  return res.status(401).send({ message: 'Wrong email and/or password' });
              }
          } else {
              console.log("COULD NOT FIND USER IN DB FOR SIGNIN");
              return res.status(401).send({ message: 'Wrong email and/or password' });
          }
      })
      .fail(function(err){
          console.log("SEARCH FAIL:" + err);
          res.status(400).send('Something went wrong: ' + err);
      });
}

/*
 |--------------------------------------------------------------------------
 | Invite Person
 |--------------------------------------------------------------------------
 */

function handleInvitePerson(req, res) {

    var invitePerson= JSON.parse(req.query.user);
    if (invitePerson) {
        var gettoken = function(invitePerson, callback) {
            db.newSearchBuilder()
              .collection(config.db.collections.users)
              .limit(1)
              .query('profile.linkedin.id: "' + invitePerson.userid + '"')
              .then(function(result){
                  if (result.body.results.length > 0) {
                      console.log("Found user, pulling access_token");
                      if (result.body.results[0].value.profile.linkedin.access_token) {
                          var access_token = result.body.results[0].value.profile.linkedin.access_token;
                          callback(access_token);
                      } else {
                          console.log("User does not have Linkedin access_token!");
                          return res.status(401).send({ message: 'Sorry, you need to login to StartupCommunity.org with Linkedin first.' });
                      }
                  } else {
                      console.log("COULD NOT FIND USER IN DB");
                      return res.status(401).send({ message: 'Something went wrong, please login again.' });
                  }
              })
              .fail(function(err){
                  console.log("SEARCH FAIL:" + err);
                  res.status(400).send({ message: 'Something went wrong: ' + err});
              });


        };

        gettoken(invitePerson, function(access_token) {

            getLinkedinProfile(invitePerson.url, invitePerson.email, access_token, function(result) {
                res.status(result.status).send(result);
            });

        });

    }
}
/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */

var getLinkedinProfile = function(url, email, access_token, profilecallback) {
    var querystring = require('querystring');
    request.get({ url: 'https://api.linkedin.com/v1/people/url=' + querystring.escape(url) + ':(id,first-name,last-name,picture-url;secure=true,headline,location,summary,public-profile-url)', qs: { oauth2_access_token: access_token, format: 'json' }, json: true },
      function(error, response, body) {
          if (!body.status || body.status === 200) {
              if (body.id !== undefined) {
                  var linkedinuser = schema.linkedin(body, email);
                  console.log('LINKEDIN USER:');
                  console.log(linkedinuser);
                  linkedinPull(linkedinuser, profilecallback);
              }
          } else {
              console.error('Linkedin profile error: ' + body.message);
              console.log(body);
              profilecallback(body);
          }
      });
};

var linkedinPull = function (linkedinuser, pullcallback) {

    console.log('Looking for existing user based on public Linkedin profile.');

    db.search(config.db.collections.users, 'profile.linkedin.publicProfileUrl: "' + linkedinuser.profile.linkedin.publicProfileUrl + '"')
      .then(function (result){
          console.log('Result of db search: ' + result.body.total_count);
          if (result.body.results.length > 0){
              if (result.body.results[0].value.profile.linkedin.id == linkedinuser.profile.linkedin.id){
                  console.log("Matched Linkedin user to database user: " + linkedinuser.profile.name);
                  pullcallback({ "status": 409, "message": "It looks like " + linkedinuser.profile.name + " is already in the system.", "data": result.body.results[0].value });
              } else {
                  console.warn("WARNING: There's already an existing user with that public Linkedin profile.");
                  pullcallback({ "status": 200, "data": result.body.results[0].value });
              }
          } else {
              console.log('No existing linkedin user found!');
              db.post(config.db.collections.users, linkedinuser)
                .then(function () {
                    console.log("REGISTERED: " + linkedinuser.profile.email);
                    pullcallback({ "status": 200, "data": linkedinuser });
                })
                .fail(function (err) {
                    console.error("PUT FAIL:");
                    console.error(err);
                });
          }
      })
      .fail(function(err){
          console.log("SEARCH FAIL:" + err);
          res.status(400).send({ message: 'Something went wrong: ' + err});
      });

};

function handleLinkedin(req, res) {
    var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
    var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url;secure=true,headline,location,specialties,positions,summary,industry,public-profile-url)';

    var params = {
        client_id: config.linkedin.clientID,
        redirect_uri: req.body.redirectUri,
        client_secret: config.linkedin.clientSecret,
        code: req.body.code,
        grant_type: 'authorization_code'
    };
    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, { form: params, json: true }, function(err, response, body) {

        if (response.statusCode !== 200) {
            return res.status(response.statusCode).send({ message: body.error_description });
        }

        var params = {
            oauth2_access_token: body.access_token,
            format: 'json'
        };

        var uploadcheck = 0;

        if (uploadcheck === 0) {
            // Step 2. Retrieve profile information about the current user.
            request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {

                if (err) {
                    console.log("Linkedin GET FAIL:");
                    console.log(err);
                    return res.status(401).send({ message: 'Something went wrong: ' + err});
                } else profile['access_token'] = params.oauth2_access_token;

                var userprofile = schema.linkedin(profile);

                // Step 3a. Link user accounts.
                if (req.headers.authorization) { // isloggedin already? [this use case is for linking a linkedin profile to an existing account

                    db.newSearchBuilder()
                      .collection(config.db.collections.users)
                      .limit(1)
                      .query('profile.linkedin.id: "' + profile.id + '"')
                      .then(function (result){
                          if (result.body.results.length > 0){
                              console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                              res.send({ token: req.headers.authorization.split(' ')[1], user: result.body.results[0] });
                          } else {

                              console.log('No Linkedin user in the system with that id; ok to add it.');
                              var token = req.headers.authorization.split(' ')[1];
                              var payload = jwt.decode(token, config.token_secret);

                              db.get(config.db.collections.users, payload.sub)
                                .then(function(response){
                                    if (response.body.code !== "items_not_found") {
                                        console.log('Matching user found.');
                                        response.body.profile["linkedin"] = profile; // get user account and re-upload with linkedin data
                                        db.put(config.db.collections.users, payload.sub, response.body)
                                          .then(function () {
                                              console.log("Profile updated: " + userprofile.profile.email);
                                          })
                                          .fail(function (err) {
                                              console.error("Profile update failed:");
                                              console.error(err.body);
                                          });
                                        res.send({ token: handleCreateToken(req, response.body), user: response.body });
                                    } else {
                                        return res.status(401).send({ message: "Sorry, we couldn't find you in our system. Please <a href='/' target='_self'>request an invitation</a>." });
                                    }
                                })
                                .fail(function(err){
                                    console.log("SEARCH FAIL:" + err);
                                    res.status(400).send({ message: 'Something went wrong: ' + err});
                                });
                          }
                      })
                      .fail(function(err){
                          console.log("SEARCH FAIL:" + err);
                          res.status(400).send({ message: 'Something went wrong: ' + err});
                      });


                } else {

                    db.newSearchBuilder()
                      .collection(config.db.collections.users)
                      .limit(1)
                      .query('profile.linkedin.id: "' + profile.id + '"')
                      .then(function (result){
                          if (result.body.results.length > 0){
                              console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                              result.body.results[0].value.profile["linkedin"] = profile; // get user account and re-upload with linkedin data
                              if (result.body.results[0].value.profile.avatar === "") {
                                  result.body.results[0].value.profile.avatar = result.body.results[0].value.profile.linkedin.pictureUrl;
                              }
                              if (result.body.results[0].value.profile.name !== result.body.results[0].value.profile.linkedin.firstName + ' ' + result.body.results[0].value.profile.linkedin.lastName) {
                                  result.body.results[0].value.profile.name = result.body.results[0].value.profile.linkedin.firstName + ' ' + result.body.results[0].value.profile.linkedin.lastName;
                              }
                              if (result.body.results[0].value.profile.email !== result.body.results[0].value.profile.linkedin.emailAddress) {
                                  result.body.results[0].value.profile.email = result.body.results[0].value.profile.linkedin.emailAddress;
                              }

                              db.put(config.db.collections.users, result.body.results[0].path.key, result.body.results[0].value)
                                .then(function () {
                                    console.log("Profile updated: " + userprofile.profile.email);
                                })
                                .fail(function (err) {
                                    console.error("Profile update failed:");
                                    console.error(err);
                                });

                              res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });
                          } else {
                              db.newSearchBuilder()
                                .collection(config.db.collections.users)
                                .limit(1)
                                .query('profile.email: "' + profile.emailAddress + '"')
                                .then(function(result){
                                    if (result.body.results.length > 0) {
                                        console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                                        result.body.results[0].value.profile["linkedin"] = profile; // get user account and re-upload with linkedin data
                                        db.put(config.db.collections.users, result.body.results[0].path.key, result.body.results[0].value)
                                          .then(function () {
                                              console.log("Profile updated: " + userprofile.profile.email);
                                          })
                                          .fail(function (err) {
                                              console.error("Profile update failed:");
                                              console.error(err);
                                          });
                                        res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });

                                    } else {
                                        console.log('No existing user found!');
                                        res.status(401).send({ profile: profile, message: "Sorry, we couldn't find you in our system. Please <a href='/' target='_self'>request an invitation</a>." });
                                    }
                                })
                                .fail(function(err){
                                    console.log("SEARCH FAIL:" + err);
                                    res.status(400).send({ message: 'Something went wrong: ' + err});
                                });

                              /* Do this to create a user account if no user exists
                               db.newSearchBuilder()
                               .collection(config.db.collections.users)
                               .limit(1)
                               .query('value.email: "' + profile.emailAddress + '"')
                               .then(function(result){
                               if (result.body.results.length > 0) {
                               console.log('Existing user found.');
                               res.status(409).send({ message: "Sorry, there's already a user with your email address." });

                               } else {
                               db.post(config.db.collections.users, userprofile)
                               .then(function () {
                               console.log("Profile created: " + JSON.stringify(userprofile));
                               res.send({ token: handleCreateToken(req, userprofile) });
                               })
                               .fail(function (err) {
                               console.error("POST fail:");
                               console.error(err.body);
                               });
                               }
                               })
                               .fail(function(err){
                               console.log("SEARCH FAIL:" + err);
                               res.status(401).send({ message: 'Something went wrong: ' + err});
                               });
                               */
                          }
                      });
                }
            });
        } else {

            var userlist = {};

            for (var i=0; i < userlist.length; i++) {
                getLinkedinProfile(userlist[i].url, userlist[i].email, params.oauth2_access_token, function(response) { console.log('User: ' + response.data); });
            }

        }
    });
}

/*
 |--------------------------------------------------------------------------
 | Get Profile
 |--------------------------------------------------------------------------
 */

function handleGetProfile(req, res) {
    var userid = req.param.userid || req.user;
    console.log('Pulling user profile: ' + userid);

    db.get(config.db.collections.communities, userid)
      .then(function(response){
          if (response.body.code !== "items_not_found") {
              response.body["key"] = userid;
              res.status(200).send(response.body);
          } else {
              console.warn('WARNING:  User not found.');
              return res.status(200).send({ message: 'User not found.' });
          }
      })

      .fail(function(err){
          console.warn("WARNING: SEARCH FAIL:");
          console.warn(err);
          res.status(400).send({ message: 'Something went wrong: ' + err});
      });

}

/*
 |--------------------------------------------------------------------------
 | Put Profile
 |--------------------------------------------------------------------------
 */

function handleSetRole(req, res) {
    var userkey = req.query.userkey,
      community = req.query.community,
      industry = req.query.industry,
      role = req.query.role,
      status = (req.query.status == 'true'), // will convert string to bool
      allowed = false;

    function checkperms(allowed, callback) {
        if (!allowed) {
            db.get(config.db.collections.users, req.user)
              .then(function (response) {
                  userperms = findKey(response.body.communities, community, []); //todo this would mean an admin of anything would work, need to validate location + community
                  if (userperms[0].roles.indexOf("admin") > -1) { allowed=true; }
                  callback(allowed);
              })
              .fail(function(err){
                  console.warn("WARNING: SEARCH FAIL:" + err);
                  res.status(400).send({ message: 'Something went wrong: ' + err});
              });
        } else callback(allowed);
    }

    //check perms!
    if (userkey == req.user) { allowed = true; }
    checkperms(allowed, function (allowed) {
        if (allowed) {
            db.get(config.db.collections.users, userkey)
              .then(function (response) {
                  if (response.body.cities[community].clusters === undefined) { //need to create clusters key
                      response.body.cities[community]['clusters'] = {};
                  }
                  if (response.body.cities[community].clusters[industry] === undefined) { //need to create the industry in user profile
                      console.log('Adding user to cluster: ' + industry);
                      response.body.cities[community].clusters[industry] = { "roles": [] };
                  }
                  var thisindustry = response.body.cities[community].clusters[industry];

                  if (status === true) {
                      if (thisindustry.roles.indexOf(role) < 0) {
                          thisindustry.roles.push(role);
                      } // else they already have the role, no action needed
                  } else if (status === false) {
                      if (thisindustry.roles.indexOf(role) >= 0) {
                          thisindustry.roles.splice(thisindustry.roles.indexOf(role), 1);
                      } // else they do not have the role, no action needed
                  }
                  response.body.cities[community].clusters[industry] = thisindustry;

                  db.put(config.db.collections.users, userkey, response.body)
                    .then(function (finalres) {
                        res.status(201).send({ message: 'Profile updated.'});
                    })
                    .fail(function (err) {
                        console.warn('WARNING:  Problem with put: ' + err);
                        res.status(400).send({ message: 'Something went wrong: ' + err});
                    });

              })
              .fail(function (err) {
                  console.warn('WARNING:  Problem with get: ' + err);
                  res.status(400).send({ message: 'Something went wrong: ' + err});
              });
        } else {
            res.status(401).send({ message: 'You do not have permission to change this role.'});
        }
    });
}

function handleFeedback(req, res) {
    var userkey = req.user,
      data = JSON.parse(decodeURIComponent(req.query.data));

    db.get(config.db.collections.users, userkey)
      .then(function (response) {
          response.body['beta'] = data;

          db.put(config.db.collections.users, userkey, response.body)
            .then(function (finalres) {
                res.status(201).send({ message: 'Profile updated.'});
            })
            .fail(function (err) {
                console.warn('WARNING:  Problem with put: ' + err);
                res.status(400).send({ message: 'Something went wrong: ' + err});
            });

      })
      .fail(function (err) {
          console.warn('WARNING:  Problem with get: ' + err);
          res.status(400).send({ message: 'Something went wrong: ' + err});
      });
}

/*
 |--------------------------------------------------------------------------
 | Delete Profile
 |--------------------------------------------------------------------------
 */

function handleRemoveProfile(req, res) {
    var userid = req.params.userid;
    db.remove(config.db.collections.users, userid) // ideally I should store an undo option
      .then(function(result){
          console.log('User removed.');
          res.status(200).send({ message: 'User removed' });
      })
      .fail(function(err){
          console.log("Remove FAIL:" + err);
          res.status(400).send({ message: 'Something went wrong: ' + err });
      });
}

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */

function handleUnlink(req, res) {
    var provider = req.params.provider;
    db.get(config.db.collections.users, req.user)
      .then(function(response){
          if (response.body.code !== "items_not_found") {
              response.body[provider] = undefined;
              db.put(config.db.collections.users, req.user, response.body)
                .then(function() {
                    console.log('Successfully unlinked provider!');
                    res.status(200).end();
                })
                .fail(function(err) {
                    console.log('user update failed');
                    res.status(400).send({ message: 'Something went wrong! ' + err });
                });
          } else {
              console.log('User not found.');
              return res.status(400).send({ message: 'User not found' });
          }
      })
      .fail(function(err){
          console.log("SEARCH FAIL:" + err);
          res.status(400).send({ message: 'Something went wrong: ' + err});
      });
}

/*
 |--------------------------------------------------------------------------
 | Maintenance Tasks
 |--------------------------------------------------------------------------
 */


function handleMaintenance(req, res) {
    var enabled = false;
    var startKey = '';
    var userlist = [];

    function getList(startKey, userlist) {
        db.list('users', {limit: 50, startKey: startKey})
          .then( function(data) {
              for (var item in data.body.results) {
                  // be careful to retrieve existing values from target key then append!
                  //data.body.results[item].value.cities = { "bend-or": { "admin": false, "cityAdvisor": true } };
                  //userlist.push(data.body.results[item]);

                  var newdata = {
                      "type": "user",
                      "context": {
                          "location": "bend-or",
                          "community": ""
                      },
                      "profile": {
                          "name": data.body.results[item].value.name,
                          "email": data.body.results[item].value.email,
                          "avatar": data.body.results[item].value.avatar,
                          "linkedin": data.body.results[item].value.linkedin
                      },
                      "communities": {
                          "usa": {
                              "oregon": {
                                  "deschutes-or": {
                                      "bend-or": {
                                          "type" : "location",
                                          "parent" : "deschutes-or",
                                          "profile" : {
                                              "country" : "United States",
                                              "state" : "Oregon",
                                              "county" : "Deschutes",
                                              "city" : "Bend",
                                              "name" : "Bend, OR"
                                          },
                                          "roles": [
                                              "advisor"
                                          ]
                                      }
                                  }
                              }
                          }
                      }

                  };

                  console.log('Adding record..');
                  db.post('communities-dev', newdata);
              }

              if (data.body.next) {
                  var nextkey = url.parse(data.body.next).query;
                  startKey = nextkey.substr(18, nextkey.length - 18);
                  console.log('Getting next group..' + startKey);
                  getList(startKey, userlist);
              } else {
                  console.log('Get done!' + userlist.length);
                  /*
                   for (var user in userlist) {
                   console.log('Updating ' + userlist[user].value.name);
                   db.put(config.db.collections.users, userlist[user].path.key, userlist[user].value)
                   .then(function(response) {
                   console.log('Record updated!');
                   });
                   }
                   */
              }


          });
    }

    if (enabled) {
        console.log('Starting maintenance..');
        getList(startKey, userlist);
    }
}

module.exports = UserApi;