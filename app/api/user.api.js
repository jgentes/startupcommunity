var Q = require('q'),
  request = require('request'),
  url = require('url'),
  jwt = require('jsonwebtoken'),
  CommunityApi = require(__dirname + '/community.api.js'),
  communityApis = new CommunityApi(),
  aws = require('aws-sdk'),
  knowtify = require('knowtify-node'),
  jqparam = require('jquery-param'),
  Cloudant = require('cloudant'),
  cloudant = Cloudant({
    account: process.env.DB_ACCOUNT,
    password: process.env.DB_PASSWORD,
    plugin: 'retry'
  }),
  cdb = cloudant.db.use(process.env.DB_COMMUNITIES),
  cdb_messages = cloudant.db.use(process.env.DB_MESSAGES);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var UserApi = function () {
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

function handleUserSearch(req, res) {
  var communities = req.query.communities,
    clusters = req.query.clusters,
    roles = req.query.roles,
    query = req.query.query,
    limit = req.query.limit,
    offset = req.query.offset,
    key = req.query.api_key;

  var allowed = false;
  var userperms;

  // create searchstring
  var selector = {
    "$and": [
      {"type": "user"}
    ]
  };
  searchstring = 'communities:(';
  var state = "";
  /*
   for (c in communities) {

   // determine whether one of the communities is a state
   var state_suffix = communityApis.convert_state(communities[c].replace('-',' '), 'abbrev'); // returns false if no match

   if (state_suffix) {
   state = " AND profile.home: (" + communities[c] + " OR *-" + state_suffix.toLowerCase() + ")";
   var remove = communities.indexOf(communities[c]);
   if (remove > -1) communities.splice(remove, 1); // to avoid issues with length check
   if (communities.length == 0) searchstring += "*";
   } else {
   searchstring += communities[c];
   if (c < (communities.length - 1)) { searchstring += ' AND '; }
   }
   }
   */
  selector["$and"].push({"communities": {"$in": communities}});

  //searchstring += ")" + state;

  if (clusters && clusters.length > 0 && clusters[0] !== '*') {

    selector["$and"].push(
      {
        "$or": [
          {"profile.skills": {"$in": clusters}},
          {"profile.parents": {"$in": clusters}}
        ]
      }
    );

    /*
     clusters = clusters.splice(',');
     searchstring += ' AND (';

     var clusterstring = '';

     if (clusters.indexOf('all') < 0) clusters.push('all');

     for (i in clusters) {
     clusterstring += clusters[i];
     if (i < (clusters.length - 1)) { clusterstring += ' OR '; }
     }

     searchstring += 'profile.skills:(' + clusterstring + ') OR profile.parents:(' + clusterstring + '))'; // scope to industries within the cluster
     */
  }

  if (roles && roles.length > 0 && roles[0] !== "*") {

    selector["$and"] = [];
    /*

     roles = roles.splice(',');
     searchstring += ' AND (';
     */
    var selroles = [];
    for (i in roles) {
      var sel = {};
      sel['roles.' + roles[i]] = {"$exists": true};
      selroles.push(sel);
      /* searchstring += 'roles.' + roles[i] + ':[a* TO z*]'; // scope to role
       if (i < (roles.length - 1)) { searchstring += ' AND '; }*/
    }
    if (selroles.length) for (s in selroles) selector["$and"].push({"$or": [selroles[s]]});
    /*    searchstring += ')';*/
  }

  if (query) {
    selector["$and"].push({"$text": query});
    /*searchstring += ' AND ' + '(profile: ' + query + ')'; */
  }

  var find = {selector: selector, skip: Number(offset) || 0, limit: Number(limit) || 16};

  console.log('Pulling Users: ', JSON.stringify(find));

  cdb.find(find, function (err, result) {
    if (!err) {
      result = formatFindResults(result);

      var i;

      try {
        for (i = 0; i < result.docs.length; i++) {
          if (result.docs[i].value.profile.password) delete result.docs[i].value.profile.password;

          if (result.docs[i].value.profile.email) delete result.docs[i].value.profile.email;

          if (result.docs[i].value.profile.linkedin) {
            if (result.docs[i].value.profile.linkedin.emailAddress) delete result.docs[i].value.profile.linkedin.emailAddress;
            if (result.docs[i].value.profile.linkedin.access_token) delete result.docs[i].value.profile.linkedin.access_token;
          }

          result.docs[i].value["key"] = result.docs[i].path.id;

          if (result.docs[i].value.newsletter) delete result.docs[i].value.newsletter;
        }
      } catch (error) {
        console.warn('WARNING: user144 ', error);
      }

      result.next = '/api/2.1/users?' + jqparam({
          communities: communities,
          clusters: (clusters || '*'),
          roles: (roles || '*'),
          limit: (Number(limit) || 16),
          offset: ((Number(offset) || 0) + (Number(limit) || 16)),
          query: (query || '*')
        });

      result.prev = '/api/2.1/users?' + jqparam({
          communities: communities,
          clusters: (clusters || '*'),
          roles: (roles || '*'),
          limit: (Number(limit) || 16),
          offset: (offset ? (Number(offset) - ((Number(limit) || 16))) : 0),
          query: (query || '*')
        });

      result.results = result.docs;
      delete result.docs;

      res.send(result);
    } else {
      console.log('WARNING: ', err);
      res.send({message: err.message});
    }
  })
}

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

function handleDirectSearch(req, res) {
  //TODO check for key to protect info?
  var allowed = false;

  cdb.find({
    selector: {type: 'user', '$text': req.query.query},
    skip: Number(req.query.offset) || 0,
    limit: Number(req.query.limit) || 100
  }, function (err, result) {
    if (!err) {
      result = formatFindResults(result);

      var i;

      try {
        for (i = 0; i < result.docs.length; i++) {

          if (result.docs[i].value.profile.password) delete result.docs[i].value.profile.password;

          if (result.docs[i].value.profile.email) delete result.docs[i].value.profile.email;

          if (result.docs[i].value.profile.linkedin) {
            if (result.docs[i].value.profile.linkedin.emailAddress) delete result.docs[i].value.profile.linkedin.emailAddress;
            if (result.docs[i].value.profile.linkedin.access_token) delete result.docs[i].value.profile.linkedin.access_token;
          }

          result.docs[i].value["key"] = result.docs[i].path.id;
        }

        result.next = '/api/2.1/users?' + jqparam({
            communities: req.query.communities,
            clusters: (req.query.clusters || '*'),
            roles: (req.query.roles || '*'),
            limit: (Number(req.query.limit) || 16),
            offset: ((Number(req.query.offset) || 0) + (Number(req.query.limit) || 16)),
            query: (req.query.query || '*')
          });

        result.prev = '/api/2.1/users?' + jqparam({
            communities: req.query.communities,
            clusters: (req.query.clusters || '*'),
            roles: (req.query.roles || '*'),
            limit: (Number(req.query.limit) || 16),
            offset: (req.query.offset ? (Number(req.query.offset) - ((Number(req.query.limit) || 16))) : 0),
            query: (req.query.query || '*')
          });

      } catch (error) {
        console.warn('WARNING: user206', error);
      }

      result.results = result.docs;
      delete result.docs;

      res.status(200).send(result);
    } else {
      console.log(err);
      res.status(202).send({message: "Something went wrong."});
    }
  })

}


/*
 |--------------------------------------------------------------------------
 | Contact User
 |--------------------------------------------------------------------------
 */

function handleContactUser(req, res) {

  var user_key = req.query.user_key,
    formdata = req.query.formdata,
    location_key = req.query.location_key;

  var selector = {};

  selector["$and"] = [{"type": "user"}];
  selector["$and"]["roles.leader"] = {};
  selector["$and"]["roles.leader"][location_key] = {"$exists": true};

  console.log(selector);

  cdb.find({
    selector: selector
  }, function (err, uber_result) {
    if (!err) {
      uber_result = formatFindResults(uber_result);


      //todo NEED TO VERIFY BELOW
      if (result.docs.length > 0) {
        console.log("Found leader(s)");
        var leaders = [];
        for (item in result.docs) {
          leaders.push(result.docs[item]);
        }

        // now get user record for email address
        cdb.get(user_key, function (err, response) {
          if (!err) {
            var contacts = [],
              knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

            for (leader in leaders) {

              contacts.push({
                "id": leaders[leader].doc.path.key,
                "name": leaders[leader].doc.value.profile.name,
                "email": leaders[leader].doc.value.profile.email,
                "data": {
                  "source_name": formdata.name,
                  "source_email": formdata.email,
                  "source_company": formdata.company,
                  "source_reason": formdata.reason,
                  "target_name": response.profile.name,
                  "target_email": response.profile.email,
                  "target_avatar": response.profile.avatar
                }
              })
            }

            // send notification to leaders
            knowtifyClient.contacts.upsert({
                "event": "contact_request",
                "contacts": contacts
              },
              function (success) {
                console.log('Contact request sent!');
                res.status(200).end();

                // send notification to requestor.. a user id is only required if I create the record with an associated id
                knowtifyClient.contacts.upsert({
                    "event": "contact_receipt",
                    "contacts": [{
                      "email": formdata.email,
                      "data": {
                        "source_name": formdata.name,
                        "source_email": formdata.email,
                        "source_company": formdata.company,
                        "source_reason": formdata.reason,
                        "target_name": response.profile.name,
                        "target_email": response.profile.email,
                        "target_avatar": response.profile.avatar
                      }
                    }]
                  },
                  function (success) {
                    console.log('Contact receipt sent to ' + formdata.name);
                  },
                  function (err) {
                    console.warn('WARNING');
                    console.log(err);
                  }
                );
              },
              function (err) {
                console.warn('WARNING');
                console.log(err);
                res.status(202).send({message: "Something went wrong."});
              }
            );
          } else {
            console.warn("WARNING: user338", err);
            res.status(202).send({message: "Something went wrong."});
          }
        })


      } else {
        console.warn("WARNING: COULD NOT FIND LEADER FOR THIS COMMUNITY");
        res.status(202).send({message: "Sorry, we can't seem to find a leader for this community. We took note of your request and we'll look into this and get back to you via email ASAP."});
      }
    } else {
      console.log("WARNING: user351", err);
      res.status(202).send({message: "Something went wrong."});
    }
  })

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

  cdb.get(userid, function (err, response) {
    if (!err) {
      response["key"] = userid;
      response["token"] = jwt.sign(userid, process.env.SC_TOKEN_SECRET);
      res.status(200).send(response);
    } else {
      console.warn("Problem pulling user, sending 400 response. ", err.body);
      res.status(400).send({message: "Please try logging in again."});
    }
  })


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
    Key: 'profiles/' + userid + '_' + filename,
    Expires: 60,
    ACL: 'public-read'
  };
  s3.getSignedUrl('putObject', s3_params, function (err, signedUrl) {
    var parsedUrl = url.parse(signedUrl);
    parsedUrl.search = null;
    var objectUrl = url.format(parsedUrl);

    if (!err) {
      res.send({put: signedUrl, get: objectUrl});
    } else res.status(204).send({message: "Something went wrong."});

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

    cdb.get(userid, function (err, user) {
      if (!err) {
        profile['_id'] = user._id;
        profile['_rev'] = user._rev;

        cdb.insert(profile, userid, function (err, response) {
          if (!err) {
            profile["key"] = userid;
            res.status(200).send({token: jwt.sign(userid, process.env.SC_TOKEN_SECRET), user: profile});
          } else {
            console.warn("WARNING: user457", err);
            res.status(202).send({message: "Something went wrong."});
          }
        })

      } else {
        console.warn("WARNING: user457", err);
        res.status(202).send({message: "Something went wrong."});
      }
    })

  } else {
    res.status(400).send({message: 'You may only update your own user record.'})
  }
}

function handleRemoveCommunity(req, res) {
  // req data is guaranteed by ensureauth
  var userid = req.user,
    user_key = req.body.params.user_key,
    community = req.body.params.community;

  console.log("Removing community '" + community.key + "' for user " + user_key);

  // first confirm that req.user has leader role in community
  cdb.get(userid, function (err, response) {
    if (!err) {
      if (response.roles.leader[community.key]) {
        cdb.get(user_key, function (err, response) {
          if (!err) {
            for (role in response.roles) {
              for (comm in response.roles[role]) {
                if (response.roles[role][community.key]) {
                  delete response.roles[role][community.key];
                }
              }
            }
            if (response.communities.indexOf(community.key) > -1) {
              response.communities.splice(response.communities.indexOf(community.key), 1);
            }
            cdb.insert(response, user_key, function (err, response) {
              if (!err) {
                console.log('Successfully removed community from user profile.');
                res.status(201).send({message: 'Community removed.'});
              } else {
                console.warn("WARNING: ", err);
                res.status(202).send({message: "Something went wrong."});
              }
            })

          } else {
            console.warn("WARNING: ", err);
            res.status(202).send({message: "Something went wrong."});
          }
        })

      } else {
        console.warn('WARNING:  User does not have leader role in this community.');
        res.status(202).send({message: 'You do not have leader privileges for this community.'});
      }
    } else {
      console.warn("WARNING: ", err);
      res.status(202).send({message: "Something went wrong."});
    }
  })

}

function handleRemoveRole(req, res) {
  // req data is guaranteed by ensureauth
  var userid = req.user,
    role = req.body.params.role,
    community_key = req.body.params.community_key,
    del = false;

  console.log("Removing " + role + " for community " + community_key + " for user " + userid);

  // confirm user has role and remove it
  cdb.get(userid, function (err, response) {
    if (!err) {
      if (response.roles[role] && response.roles[role][community_key]) {
        delete response.roles[role][community_key];

        for (r in response.roles) {
          if (response.roles[r][community_key]) var del = true;
        }

        if (del) {
          if (response.communities.indexOf(community_key) > -1) {
            response.communities.splice(response.communities.indexOf(community_key), 1);
          }
        }

        cdb.insert(response, userid, function (err, response) {
          if (!err) {
            console.log('Successfully removed role from user profile.');
            res.status(201).send({message: 'Role removed.'});
          } else {
            console.warn("WARNING: ", err);
            res.status(202).send({message: "Something went wrong."});
          }
        })


      } else {
        console.warn('WARNING:  User does not have the ' + role + ' role for record ' + community_key + '.');
        res.status(202).send({message: 'You do not have the ' + role + ' role for record ' + community_key + '.'});
      }
    } else {
      console.warn("WARNING: ", err);
      res.status(202).send({message: "Something went wrong."});
    }
  })

}


function handleFeedback(req, res) {
  var userkey = req.user,
    data = JSON.parse(decodeURIComponent(req.query.data));

  cdb.get(userkey, function (err, response) {
    if (!err) {
      response['beta'] = data;

      cdb.insert(response, userkey, function (err, finalres) {
        if (!err) {
          res.status(201).send({message: 'Profile updated.'});
        } else {
          console.warn('WARNING: user547', err);
          res.status(202).send({message: "Something went wrong."});
        }
      })

    } else {
      console.warn('WARNING: user553', err);
      res.status(202).send({message: 'Something went wrong: ' + err});
    }
  })

}

/*
 |--------------------------------------------------------------------------
 | Delete Profile
 |--------------------------------------------------------------------------
 */

function handleRemoveProfile(req, res) {
  var userid = req.params.userid;
  cdb.get(userid, function (err, result) {
    if (!err) {
      cdb.destroy(userid, result._rev, function (err, result) {
        if (!err) {
          console.log('User removed.');
          res.status(200).send({message: 'User removed'});
        } else {
          console.log("Remove FAIL:" + err);
          res.status(202).send({message: 'Something went wrong: ' + err});
        }
      }) // ideally I should store an undo option
    }
  });


}

module.exports = UserApi;