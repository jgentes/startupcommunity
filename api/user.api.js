var Q = require('q'),
  request = require('request'),
  url = require('url'),
  jwt = require('jwt-simple'),
  config = require('../config.json')[process.env.NODE_ENV || 'development'],
  db = require('orchestrate')(config.db.key),
  mandrill = require('mandrill-api/mandrill'),
  mandrill_client = new mandrill.Mandrill(config.mandrill);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var UserApi = function() {
    this.userSearch = handleUserSearch;
    this.directSearch = handleDirectSearch;
    this.invitePerson = handleInvitePerson;
    this.getProfile = handleGetProfile;
    this.setRole = handleSetRole;
    this.removeProfile = handleRemoveProfile;
    this.feedback = handleFeedback;
};


/*
 |--------------------------------------------------------------------------
 | Search API
 |--------------------------------------------------------------------------
 */


function handleUserSearch(req, res){
    var communities = req.query.communities,
        roles = req.query.roles,
        query = req.query.query,
        limit = req.query.limit,
        offset = req.query.offset,
        key = req.query.api_key;

    searchInCommunity(communities, roles, limit, offset, query, key)
        .then(function(userlist){
            res.send(userlist);
        })
        .fail(function(err){
            console.warn(err);
            res.send({message:err});
        });
}

var searchInCommunity = function(communities, roles, limit, offset, query, key) {
    var allowed = false;
    var userperms;

    if (key) { //check api key to determine if restricted profile data is included with results
        try {
            var payload = jwt.decode(key, config.API_token_secret);
            // Assuming key never expires
            //check perms!
            console.log('test then remove me')
            //todo THIS SECTION NEEDS TO BE REWRITTEN
            db.get(config.db.collections.users, payload.sub)
              .then(function (response) {
                    /*
                  if (location && community) {
                      userperms = findKey(response.body.communities, location + '.' + community, []);
                  } else if (location && !community) {
                      userperms = findKey(response.body.communities, (location || community), []);
                  }
                  if (userperms[0].roles.indexOf("admin") > -1) { allowed=true; }
                  */
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
    searchstring = 'communities:(';

    for (c in communities) {
        searchstring += '"' + communities[c] + '"';
        if (c < (communities.length - 1)) { searchstring += ' AND '; }
    }

    searchstring += ') AND type: "user"';

    if (roles && roles.length > 0) {
        roles = roles.splice(',');
        searchstring += ' AND (';

        for (i in roles) {
            searchstring += 'roles.' + roles[i] + '.*:*'; // scope to role
            if (i < (roles.length - 1)) { searchstring += ' AND '; }
        }
        searchstring += ')';
    }

    if (query) { searchstring += ' AND ' + '(' + query + ')'; }

    var deferred = Q.defer();
    db.newSearchBuilder()
      .collection(config.db.collections.communities)
      .limit(Number(limit) || 18)
      .offset(Number(offset) || 0)
      .query(searchstring)
      .then(function(result){
          var i;

          try {
              for (i=0; i < result.body.results.length; i++) {
                  if (result.body.results[i].path.collection) delete result.body.results[i].path.collection;
                  if (result.body.results[i].path.ref) delete result.body.results[i].path.ref;
                  if (result.body.results[i].value.profile.password) delete result.body.results[i].value.profile.password;

                  if (!allowed) {
                      if (result.body.results[i].value.profile.email) delete result.body.results[i].value.profile.email;
                  }

                  if (result.body.results[i].value.profile.linkedin) {
                      if (result.body.results[i].value.profile.linkedin.emailAddress) delete result.body.results[i].value.profile.linkedin.emailAddress;
                      if (result.body.results[i].value.profile.linkedin.access_token) delete result.body.results[i].value.profile.linkedin.access_token;
                  }

                  result.body.results[i].value["key"] = result.body.results[i].path.key;
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
                          res.status(401).send({ message: 'Sorry, you need to login to StartupCommunity.org with Linkedin first.' });
                      }
                  } else {
                      console.log("COULD NOT FIND USER IN DB");
                      res.status(401).send({ message: 'Something went wrong, please login again.' });
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
 | Get Profile
 |--------------------------------------------------------------------------
 */

function handleGetProfile(req, res) {
    var userid = req.param.userid || req.user;

    if (userid) {
        console.log('Pulling user profile: ' + userid);

        db.get(config.db.collections.communities, userid)
            .then(function(response){
                if (response.body.code !== "items_not_found") {
                    response.body["key"] = userid;
                    res.status(200).send(response.body);
                } else {
                    console.warn('WARNING:  User not found.');
                    res.status(200).send({ message: 'User not found.' });
                }
            })

            .fail(function(err){
                console.warn("WARNING: SEARCH FAIL:");
                console.warn(err);
                res.status(400).send({ message: 'Something went wrong: ' + err});
            });
    } else {
        // anonymous user
        console.log('ping');
        res.status(200).send({});
    }

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

module.exports = UserApi;