var Q = require('q'),
    request = require('request'),
    url = require('url'),
    jwt = require('jsonwebtoken'),
    CommunityApi = require(__dirname + '/community.api.js'),
    communityApis = new CommunityApi(),
    db = require('orchestrate')(process.env.DB_KEY),
    aws = require('aws-sdk'),
    knowtify = require('knowtify-node');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var UserApi = function() {
    this.userSearch = handleUserSearch;
    this.directSearch = handleDirectSearch;
    this.contactUser = handleContactUser;
    this.getProfile = handleGetProfile;
    this.getProfileUrl = handleGetProfileUrl;
    this.updateProfile = handleUpdateProfile;
    this.removeCommunity = handleRemoveCommunity;
    this.removeRole = handleRemoveRole;
    this.feedback = handleFeedback;
};


/*
 |--------------------------------------------------------------------------
 | Search API
 |--------------------------------------------------------------------------
 */


function handleUserSearch(req, res){
    var communities = req.query.communities,
        clusters = req.query.clusters,
        roles = req.query.roles,
        query = req.query.query,
        limit = req.query.limit,
        offset = req.query.offset,
        key = req.query.api_key;

    searchInCommunity(communities, clusters, roles, limit, offset, query, key)
        .then(function(userlist){
            res.send(userlist);
        })
        .fail(function(err){
            console.warn(err);
            res.send({message:err});
        });
}

var searchInCommunity = function(communities, clusters, roles, limit, offset, query, key) {
    var allowed = false;
    var userperms;

    if (key) { //check api key to determine if restricted profile data is included with results
        try {
            //var payload = jwt.decode(key, process.env.API_TOKEN_SECRET);
            // Assuming key never expires
            //check perms!
            console.log('test then remove me')
            //todo THIS SECTION NEEDS TO BE REWRITTEN
            db.get(process.env.DB_COMMUNITIES, payload.sub)
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
                  console.warn("WARNING: user75", err);
                  return deferred.reject(new Error(err));
              });
        } catch (err) {
            return deferred.reject(new Error(err));
        }
    }

    // create searchstring
    searchstring = '@value.communities:(';
    var state = "";

    for (c in communities) {

        // determine whether one of the communities is a state
        var state_suffix = communityApis.convert_state(communities[c].replace('-',' '), 'abbrev'); // returns false if no match

        if (state_suffix) {
            var state = ' AND @value.profile.home: ("' + communities[c] + '" OR "*-' + state_suffix.toLowerCase() + '")';
            var remove = communities.indexOf(communities[c]);
            if (remove > -1) communities.splice(remove, 1); // to avoid issues with length check
            if (communities.length == 0) searchstring += "*";
        } else {
            searchstring += '"' + communities[c] + '"';
            if (c < (communities.length - 1)) { searchstring += ' AND '; }
        }
    }

    searchstring += ') AND @value.type: "user"' + state;

    if (clusters && clusters.length > 0 && clusters[0] !== '*') {
        clusters = clusters.splice(',');
        searchstring += ' AND (';

        for (i in clusters) {
            searchstring += '@value.profile.skills:"' + clusters[i] + '" OR @value.profile.parents:"' + clusters[i] + '"'; // scope to industries within the cluster
            if (i < (clusters.length - 1)) { searchstring += ' OR '; }
        }
        searchstring += ')';
    }

    if (roles && roles.length > 0 && roles[0] !== "*") {
        roles = roles.splice(',');
        searchstring += ' AND (';

        for (i in roles) {
            searchstring += '@value.roles.' + roles[i] + '.*:*'; // scope to role
            if (i < (roles.length - 1)) { searchstring += ' AND '; }
        }
        searchstring += ')';
    }

    if (query) { searchstring += ' AND ' + '(@value.profile.*: ' + query + ')'; }

    console.log(searchstring);
    var deferred = Q.defer();
    db.newSearchBuilder()
      .collection(process.env.DB_COMMUNITIES)
      .limit(Number(limit) || 18)
      .offset(Number(offset) || 0)
      .sortRandom()
      .query(searchstring)
      .then(function(result){
          var i;

          try {
              for (i=0; i < result.body.results.length; i++) {
                  if (result.body.results[i].path.collection) delete result.body.results[i].path.collection;
                  if (result.body.results[i].path.ref) delete result.body.results[i].path.ref;
                  if (result.body.results[i].value.profile.password) delete result.body.results[i].value.profile.password;

                  if (result.body.results[i].value.profile.email) delete result.body.results[i].value.profile.email;

                  if (result.body.results[i].value.profile.linkedin) {
                      if (result.body.results[i].value.profile.linkedin.emailAddress) delete result.body.results[i].value.profile.linkedin.emailAddress;
                      if (result.body.results[i].value.profile.linkedin.access_token) delete result.body.results[i].value.profile.linkedin.access_token;
                  }

                  result.body.results[i].value["key"] = result.body.results[i].path.key;
                  
                  if (result.body.results[i].value.newsletter) delete result.body.results[i].value.newsletter;
              }
          } catch (error) {
              console.warn('WARNING: user144 ', error);
              console.log(result.body.results);
          }

          if (result.body.next) {
              var getnext = url.parse(result.body.next, true);
              result.body.next = '/api/2.1/search' + getnext.search;
          }
          if (result.body.prev) {
              var getprev = url.parse(result.body.prev, true);
              result.body.prev = '/api/2.1/search' + getprev.search;
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
    var allowed = false;

    db.newSearchBuilder()
        .collection(process.env.DB_COMMUNITIES)
        .limit(Number(req.query.limit) || 100)
        .offset(Number(req.query.offset))
        .query(req.query.query)
        .then(function(result){
            var i;

            try {
                for (i=0; i < result.body.results.length; i++) {
                    if (result.body.results[i].path.collection) delete result.body.results[i].path.collection;
                    if (result.body.results[i].path.ref) delete result.body.results[i].path.ref;
                    if (result.body.results[i].value.profile.password) delete result.body.results[i].value.profile.password;

                    if (result.body.results[i].value.profile.email) delete result.body.results[i].value.profile.email;

                    if (result.body.results[i].value.profile.linkedin) {
                        if (result.body.results[i].value.profile.linkedin.emailAddress) delete result.body.results[i].value.profile.linkedin.emailAddress;
                        if (result.body.results[i].value.profile.linkedin.access_token) delete result.body.results[i].value.profile.linkedin.access_token;
                    }

                    result.body.results[i].value["key"] = result.body.results[i].path.key;
                }

                if (result.body.next) {
                    var getnext = url.parse(result.body.next, true);
                    result.body.next = '/api/2.1/search' + getnext.search;
                }
                if (result.body.prev) {
                    var getprev = url.parse(result.body.prev, true);
                    result.body.prev = '/api/2.1/search' + getprev.search;
                }
            } catch (error) {
                console.warn('WARNING: user206', error);
            }

            res.status(200).send(result.body);
        })
        .fail(function(err){
            console.log(err.body.message);
            res.status(202).send({ message: "Something went wrong."});
        });
}


/*
 |--------------------------------------------------------------------------
 | Contact User
 |--------------------------------------------------------------------------
 */

function handleContactUser(req, res) {

    var user_key = req.query.user_key,
        formdata = req.query.formdata,
        community_key = req.query.community_key,
        location_key = req.query.location_key;

    if (user_key == community_key) community_key = location_key;

    // search format is 'roles.leader[community]: location'

    // create searchstring to get leader of community
    var searchstring = '(@value.roles.leader.' + community_key + ': *) AND @value.type: "user"';

    db.newSearchBuilder()
        .collection(process.env.DB_COMMUNITIES)
        .limit(10)
        .query(searchstring)
        .then(function(result){
            if (result.body.results.length > 0) {
                console.log("Found leader(s)");
                var leaders = [];
                for (item in result.body.results) {
                    leaders.push(result.body.results[item]);
                }

                // now get user record for email address
                db.get(process.env.DB_COMMUNITIES, user_key)
                    .then(function(response){
                        if (response.body.code !== "items_not_found") {
                            var contacts = [],
                                knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

                            for (leader in leaders) {
                                contacts.push({
                                    "id" : leaders[leader].path.key,
                                    "name" : leaders[leader].value.profile.name,
                                    "email" : leaders[leader].value.profile.email,
                                    "data" : {
                                        "source_name": formdata.name,
                                        "source_email" : formdata.email,
                                        "source_company" : formdata.company,
                                        "source_reason" : formdata.reason,
                                        "target_name" : response.body.profile.name,
                                        "target_email" : response.body.profile.email,
                                        "target_avatar" : response.body.profile.avatar
                                    }
                                })
                            }

                            // send notification to leaders
                            knowtifyClient.contacts.upsert({
                                    "event" : "contact_request",
                                    "contacts": contacts
                                },
                                function(success){
                                    console.log('Contact request sent!');
                                    res.status(200).end();

                                    // send notification to requestor.. a user id is only required if I create the record with an associated id
                                    knowtifyClient.contacts.upsert({
                                            "event" : "contact_receipt",
                                            "contacts": [{
                                                "email": formdata.email,
                                                "data" : {
                                                    "source_name": formdata.name,
                                                    "source_email" : formdata.email,
                                                    "source_company" : formdata.company,
                                                    "source_reason" : formdata.reason,
                                                    "target_name" : response.body.profile.name,
                                                    "target_email" : response.body.profile.email,
                                                    "target_avatar" : response.body.profile.avatar
                                                }
                                            }]
                                        },
                                        function(success){
                                            console.log('Contact receipt sent to ' + formdata.name);
                                        },
                                        function(err){
                                            console.warn('WARNING');
                                            console.log(err);
                                        }
                                    );

                                    // create event in user record for tracking purposes
                                    db.newEventBuilder()
                                        .from(process.env.DB_COMMUNITIES, user_key)
                                        .type('contact_request')
                                        .data({
                                            "community_key" : community_key,
                                            "location_key" : location_key,
                                            "leaders" : contacts,
                                            "source_name" : formdata.name,
                                            "source_email" : formdata.email,
                                            "source_company" : formdata.company,
                                            "source_reason" : formdata.reason
                                        })
                                        .create();

                                },
                                function(err){
                                    console.warn('WARNING');
                                    console.log(err);
                                    res.status(202).send({ message: "Something went wrong." });
                                }
                            );

                        } else {
                            console.warn('WARNING:  User not found.');
                            res.status(202).send({ message: "Sorry, we weren't able to find this user's record, which is really odd. Please contact us." });
                        }
                    })

                    .fail(function(err){
                        console.warn("WARNING: user338", err);
                        res.status(202).send({ message: "Something went wrong."});
                    });




            } else {
                console.warn("WARNING: COULD NOT FIND LEADER FOR THIS COMMUNITY");
                res.status(202).send({ message: "Sorry, we can't seem to find a leader for this community. We took note of your request and we'll look into this and get back to you via email ASAP." });
            }
        })
        .fail(function(err){
            console.log("WARNING: user351", err);
            res.status(202).send({ message: "Something went wrong."});
        });


}

/*
 |--------------------------------------------------------------------------
 | Get Profile
 |--------------------------------------------------------------------------
 */

function handleGetProfile(req, res) {
    // req data is guaranteed by ensureauth
    var userid = req.params.userid || req.user;
    console.log('Pulling user profile: ' + userid);

    db.get(process.env.DB_COMMUNITIES, userid)
        .then(function(response){
            if (response.body.code !== "items_not_found") {
                response.body["key"] = userid;
                response.body["token"] = jwt.sign(userid, process.env.SC_TOKEN_SECRET);
                res.status(200).send(response.body);
            } else {
                console.warn('WARNING:  User not found.');
                res.status(200).send({ message: 'User not found.' });
            }
        })
        .fail(function(err){
            console.warn("Problem pulling user, sending 400 response. ", err.body);
            res.status(400).send({ message: "Please try logging in again."});
        });

}

function handleGetProfileUrl(req, res) {
    // req data is guaranteed by ensureauth
    var userid = req.params.userid || req.user,
        filename = req.query.filename;

    aws.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        signatureVersion: 'v4',
        region: 'us-west-2'
    });

    var s3 = new aws.S3();
    var s3_params = {
        Bucket: process.env.AWS_BUCKET,
        Key:  'profiles/' + userid + '_' + filename,
        Expires: 60,
        ACL: 'public-read'
    };
    s3.getSignedUrl('putObject', s3_params, function (err, signedUrl) {
        var parsedUrl = url.parse(signedUrl);
        parsedUrl.search = null;
        var objectUrl = url.format(parsedUrl);

        if (!err) {
            res.send({ put: signedUrl, get: objectUrl });
        } else res.status(204).send({ message: "Something went wrong." });

    });
}

function handleUpdateProfile(req, res) {
    // req data is guaranteed by ensureauth
    var userid = req.user,
        profile = req.body.params.profile;

    console.log('Updating user profile: ' + userid);

    // validate user updates only their own record
    if (userid == profile.key) {
        delete profile.key;

        db.put(process.env.DB_COMMUNITIES, userid, profile)
            .then(function(response){
                if (response.statusCode == 201) {
                    profile["key"] = userid;
                    res.status(200).send({ token: jwt.sign(userid, process.env.SC_TOKEN_SECRET), user: profile });

                } else {
                    console.warn('WARNING:  Something went wrong. This updates req.user, would only fail if not logged in or token expired.');
                    res.status(202).send({ message: 'Try logging out and back in again. We will also look into it on our end!' });
                }
            })

            .fail(function(err){
                console.warn("WARNING: user457", err);
                res.status(202).send({ message: "Something went wrong."});
            });
    } else {
        res.status(400).send({ message: 'You may only update your own user record.'})
    }
}

function handleRemoveCommunity(req, res) {
    // req data is guaranteed by ensureauth
    var userid = req.user,
        user_key = req.body.params.user_key,
        community = req.body.params.community;

    console.log("Removing community '" + community.key + "' for user " + user_key);

    // first confirm that req.user has leader role in community
    db.get(process.env.DB_COMMUNITIES, userid)
        .then(function(response) {
            if (response.body.roles.leader[community.key]) {
                db.get(process.env.DB_COMMUNITIES, user_key)
                    .then(function(response) {
                        for (role in response.body.roles) {
                            for (comm in response.body.roles[role]) {
                                if (response.body.roles[role][community.key]) {
                                    delete response.body.roles[role][community.key];
                                }
                            }
                        }
                        if (response.body.communities.indexOf(community.key) > -1) {
                            response.body.communities.splice(response.body.communities.indexOf(community.key), 1);
                        }
                        db.put(process.env.DB_COMMUNITIES, user_key, response.body)
                            .then(function(response) {
                                console.log('Successfully removed community from user profile.');
                                res.status(201).send({ message: 'Community removed.'});
                            })
                            .fail(function(err){
                                console.warn("WARNING: ", err);
                                res.status(202).send({ message: "Something went wrong."});
                            });
                    })
                    .fail(function(err){
                        console.warn("WARNING: ", err);
                        res.status(202).send({ message: "Something went wrong."});
                    });
            } else {
                console.warn('WARNING:  User does not have leader role in this community.');
                res.status(202).send({ message: 'You do not have leader privileges for this community.' });
            }
        })
        .fail(function(err){
            console.warn("WARNING: ", err);
            res.status(202).send({ message: "Something went wrong."});
        });
}

function handleRemoveRole(req, res) {
    // req data is guaranteed by ensureauth
    var userid = req.user,
        role = req.body.params.role,
        community_key = req.body.params.community_key,
        del = false;    

    console.log("Removing " + role + " for community " + community_key + " for user " + userid);

    // confirm user has role and remove it
    db.get(process.env.DB_COMMUNITIES, userid)
        .then(function(response) {
            if (response.body.roles[role] && response.body.roles[role][community_key]) {
                delete response.body.roles[role][community_key];
                
                for (r in response.body.roles) {
                    if (response.body.roles[r][community_key]) var del = true;
                }
                
                if (del) {
                    if (response.body.communities.indexOf(community_key) > -1) {
                        response.body.communities.splice(response.body.communities.indexOf(community_key), 1);
                    }
                }
                
                db.put(process.env.DB_COMMUNITIES, userid, response.body)
                    .then(function(response) {
                        console.log('Successfully removed role from user profile.');
                        res.status(201).send({ message: 'Role removed.'});
                    })
                    .fail(function(err){
                        console.warn("WARNING: ", err);
                        res.status(202).send({ message: "Something went wrong."});
                    });

            } else {
                console.warn('WARNING:  User does not have the ' + role + ' role for record ' + community_key + '.');
                res.status(202).send({ message: 'You do not have the ' + role + ' role for record ' + community_key + '.' });
            }
        })
        .fail(function(err){
            console.warn("WARNING: ", err);
            res.status(202).send({ message: "Something went wrong."});
        });
}


function handleFeedback(req, res) {
    var userkey = req.user,
      data = JSON.parse(decodeURIComponent(req.query.data));

    db.get(process.env.DB_COMMUNITIES, userkey)
      .then(function (response) {
          response.body['beta'] = data;

          db.put(process.env.DB_COMMUNITIES, userkey, response.body)
            .then(function (finalres) {
                res.status(201).send({ message: 'Profile updated.'});
            })
            .fail(function (err) {
                console.warn('WARNING: user547', err);
                res.status(202).send({ message: "Something went wrong."});
            });

      })
      .fail(function (err) {
          console.warn('WARNING: user553', err);
          res.status(202).send({ message: 'Something went wrong: ' + err});
      });
}

/*
 |--------------------------------------------------------------------------
 | Delete Profile
 |--------------------------------------------------------------------------
 */

function handleRemoveProfile(req, res) {
    var userid = req.params.userid;
    db.remove(process.env.DB_COMMUNITIES, userid) // ideally I should store an undo option
      .then(function(result){
          console.log('User removed.');
          res.status(200).send({ message: 'User removed' });
      })
      .fail(function(err){
          console.log("Remove FAIL:" + err);
          res.status(202).send({ message: 'Something went wrong: ' + err });
      });
}

module.exports = UserApi;