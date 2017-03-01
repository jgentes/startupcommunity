var Q = require('q'),
    request = require('request'),
    url = require('url'),
    jwt = require('jsonwebtoken'),
    CommunityApi = require(__dirname + '/community.api.js'),
    communityApis = new CommunityApi(),
    aws = require('aws-sdk'),
    knowtify = require('knowtify-node'),
    Cloudant = require('cloudant'),
    cloudant = Cloudant({
      account: '2001b05d-38e3-44f7-b569-b13a66a81b70-bluemix',
      key: 'ingidlettlysenemediserni',
      password: '42a75fe750f1f707299b5a5c230322d207a99a60',
      plugin: 'promises'
    }),
    cdb = cloudant.db.use(process.env.DB_COMMUNITIES);

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

  var allowed = false;
  var userperms;
  
  // create searchstring
  searchstring = 'communities:(';
  var state = "";

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

  searchstring += ")" + state;

  if (clusters && clusters.length > 0 && clusters[0] !== '*') {
    clusters = clusters.splice(',');
    searchstring += ' AND (';

    var clusterstring = '';

    if (clusters.indexOf('all') < 0) clusters.push('all');

    for (i in clusters) {
      clusterstring += clusters[i];
      if (i < (clusters.length - 1)) { clusterstring += ' OR '; }
    }

    searchstring += 'profile.skills:(' + clusterstring + ') OR profile.parents:(' + clusterstring + '))'; // scope to industries within the cluster
  }

  if (roles && roles.length > 0 && roles[0] !== "*") {
    roles = roles.splice(',');
    searchstring += ' AND (';

    for (i in roles) {
      searchstring += 'roles.' + roles[i] + ':[a* TO z*]'; // scope to role
      if (i < (roles.length - 1)) { searchstring += ' AND '; }
    }
    searchstring += ')';
  }

  if (query) { searchstring += ' AND ' + '(profile: ' + query + ')'; }

  console.log(searchstring);

  cdb.find({selector: {type: 'user', '$text': searchstring}, skip: Number(offset) || 0, limit: Number(limit) || 16})
    .then(function(result){
      result = formatFindResults(result);

      var i;

      try {
        for (i=0; i < result.docs.length; i++) {
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

      result.next =
        '/api/2.1/users?communities[]=' + communities +
        '&clusters[]=' + (clusters || '*') +
        '&roles[]=' + (roles || '*') +
        '&limit=' + (Number(limit) || 16) +
        '&offset=' + ((Number(offset) || 0) + (Number(limit) || 16)) +
        '&query=' + (query || '*');

      result.prev =
        '/api/2.1/users?communities[]=' + communities +
        '&clusters[]=' + (clusters || '*') +
        '&roles[]=' + (roles || '*') +
        '&limit=' + (Number(limit) || 16) +
        '&offset=' + (offset ? (Number(offset) - ((Number(limit) || 16))) : 0) +
        '&query=' + (query || '*');

      result.results = result.docs;
      delete result.docs;

      res.send(result);
    })
    .catch(function(err){
      console.log('WARNING: ', err);
      res.send({message:err.message});
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

function handleDirectSearch(req, res) {
    //TODO check for key to protect info?
    var allowed = false;

    cdb.find({selector: {type: 'user', '$text': req.query.query}, skip: Number(req.query.offset) || 0, limit: Number(req.query.limit) || 100})
        .then(function(result){
          result = formatFindResults(result);

            var i;

            try {
                for (i=0; i < result.docs.length; i++) {

                    if (result.docs[i].value.profile.password) delete result.docs[i].value.profile.password;

                    if (result.docs[i].value.profile.email) delete result.docs[i].value.profile.email;

                    if (result.docs[i].value.profile.linkedin) {
                        if (result.docs[i].value.profile.linkedin.emailAddress) delete result.docs[i].value.profile.linkedin.emailAddress;
                        if (result.docs[i].value.profile.linkedin.access_token) delete result.docs[i].value.profile.linkedin.access_token;
                    }

                    result.docs[i].value["key"] = result.docs[i].path.id;
                }

              result.next =
                '/api/2.1/users?communities[]=' + req.query.communities +
                '&clusters[]=' + (req.query.clusters || '*') +
                '&roles[]=' + (req.query.roles || '*') +
                '&limit=' + (Number(req.query.limit) || 16) +
                '&offset=' + ((Number(req.query.offset) || 0) + (Number(req.query.limit) || 16)) +
                '&query=' + (req.query.query || '*');

              result.prev =
                '/api/2.1/users?communities[]=' + req.query.communities +
                '&clusters[]=' + (req.query.clusters || '*') +
                '&roles[]=' + (req.query.roles || '*') +
                '&limit=' + (Number(req.query.limit) || 16) +
                '&offset=' + (req.query.offset ? (Number(req.query.offset) - ((Number(req.query.limit) || 16))) : 0) +
                '&query=' + (req.query.query || '*');

            } catch (error) {
                console.warn('WARNING: user206', error);
            }

          result.results = result.docs;
          delete result.docs;

            res.status(200).send(result);
        })
        .catch(function(err){
            console.log(err);
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
        location_key = req.query.location_key;

    // search format is 'roles.leader[community]: location'

    // create searchstring to get leader of community
    var searchstring = "roles.leader:" + location_key + " AND type: user";

  cdb.search('communities', 'communitySearch', {q: searchstring, include_docs: true})
        .then(function(result){
          result = formatSearchResults(result);

          //todo NEED TO VERIFY BELOW
            if (result.rows.length > 0) {
                console.log("Found leader(s)");
                var leaders = [];
                for (item in result.rows) {
                    leaders.push(result.rows[item]);
                }

                // now get user record for email address
                cdb.get(user_key)
                    .then(function(response){

                        if (response.body.code !== "items_not_found") {
                            var contacts = [],
                                knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

                            for (leader in leaders) {
                                contacts.push({
                                    "id" : leaders[leader].path.key,
                                    "name" : leaders[leader].doc.value.profile.name,
                                    "email" : leaders[leader].doc.value.profile.email,
                                    "data" : {
                                        "source_name": formdata.name,
                                        "source_email" : formdata.email,
                                        "source_company" : formdata.company,
                                        "source_reason" : formdata.reason,
                                        "target_name" : response.profile.name,
                                        "target_email" : response.profile.email,
                                        "target_avatar" : response.profile.avatar
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
                                                    "target_name" : response.profile.name,
                                                    "target_email" : response.profile.email,
                                                    "target_avatar" : response.profile.avatar
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

                    .catch(function(err){
                        console.warn("WARNING: user338", err);
                        res.status(202).send({ message: "Something went wrong."});
                    });




            } else {
                console.warn("WARNING: COULD NOT FIND LEADER FOR THIS COMMUNITY");
                res.status(202).send({ message: "Sorry, we can't seem to find a leader for this community. We took note of your request and we'll look into this and get back to you via email ASAP." });
            }
        })
        .catch(function(err){
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

    cdb.get(userid)
        .then(function(response){
          response["key"] = userid;
          response["token"] = jwt.sign(userid, process.env.SC_TOKEN_SECRET);
          res.status(200).send(response);
        })
        .catch(function(err){
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

        cdb.insert(userid, profile)
            .then(function(response){
                if (response.statusCode == 201) {
                    profile["key"] = userid;
                    res.status(200).send({ token: jwt.sign(userid, process.env.SC_TOKEN_SECRET), user: profile });

                } else {
                    console.warn('WARNING:  Something went wrong. This updates req.user, would only fail if not logged in or token expired.');
                    res.status(202).send({ message: 'Try logging out and back in again. We will also look into it on our end!' });
                }
            })

            .catch(function(err){
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
    cdb.get(userid)
        .then(function(response) {
            if (response.roles.leader[community.key]) {
                cdb.get(user_key)
                    .then(function(response) {
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
                        cdb.insert(user_key, response)
                            .then(function(response) {
                                console.log('Successfully removed community from user profile.');
                                res.status(201).send({ message: 'Community removed.'});
                            })
                            .catch(function(err){
                                console.warn("WARNING: ", err);
                                res.status(202).send({ message: "Something went wrong."});
                            });
                    })
                    .catch(function(err){
                        console.warn("WARNING: ", err);
                        res.status(202).send({ message: "Something went wrong."});
                    });
            } else {
                console.warn('WARNING:  User does not have leader role in this community.');
                res.status(202).send({ message: 'You do not have leader privileges for this community.' });
            }
        })
        .catch(function(err){
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
    cdb.get(userid)
        .then(function(response) {
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
                
                cdb.insert(userid, response)
                    .then(function(response) {
                        console.log('Successfully removed role from user profile.');
                        res.status(201).send({ message: 'Role removed.'});
                    })
                    .catch(function(err){
                        console.warn("WARNING: ", err);
                        res.status(202).send({ message: "Something went wrong."});
                    });

            } else {
                console.warn('WARNING:  User does not have the ' + role + ' role for record ' + community_key + '.');
                res.status(202).send({ message: 'You do not have the ' + role + ' role for record ' + community_key + '.' });
            }
        })
        .catch(function(err){
            console.warn("WARNING: ", err);
            res.status(202).send({ message: "Something went wrong."});
        });
}


function handleFeedback(req, res) {
    var userkey = req.user,
      data = JSON.parse(decodeURIComponent(req.query.data));

    cdb.get(userkey)
      .then(function (response) {
          response['beta'] = data;

          cdb.insert(userkey, response)
            .then(function (finalres) {
                res.status(201).send({ message: 'Profile updated.'});
            })
            .catch(function (err) {
                console.warn('WARNING: user547', err);
                res.status(202).send({ message: "Something went wrong."});
            });

      })
      .catch(function (err) {
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
    cdb.destroy(userid) // ideally I should store an undo option
      .then(function(result){
          console.log('User removed.');
          res.status(200).send({ message: 'User removed' });
      })
      .catch(function(err){
          console.log("Remove FAIL:" + err);
          res.status(202).send({ message: 'Something went wrong: ' + err });
      });
}

module.exports = UserApi;