var Q = require('q'),
  url = require('url'),
  jwt = require('jsonwebtoken'),
  aws = require('aws-sdk'),
  knowtify = require('knowtify-node'),
  jqparam = require('jquery-param'),
  { cdb, sequelize, Op } = require('../../db');

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
    [Op.and]: [
      {type: "user"}
    ]
  };
  
  var community_search = [];
  
  if (communities && communities.length) {
    communities.forEach(c => {
      community_search.push({[Op.like]: '%"' + c + '"%'});
    });
  }
  
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
  selector[Op.and].push({communities: {[Op.or]: community_search}});

  //searchstring += ")" + state;

  if (clusters && clusters.length > 0 && clusters[0] !== '*') {
    var cluster_search = [];
    clusters.forEach(c => {
      cluster_search.push({[Op.like]: '%"' + c + '"%'});
    });

    selector[Op.and].push({
      [Op.or]: [
        {skills: {[Op.or]: cluster_search}},
        {parents: {[Op.or]: cluster_search}}
      ]
    });

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

    selector[Op.and] = [];
    /*

     roles = roles.splice(',');
     searchstring += ' AND (';
     */
    var selroles = [];
    for (var i in roles) {
      var sel = {};
      sel['roles.' + roles[i]] = {[Op.ne]: null};
      selroles.push(sel);
      /* searchstring += 'roles.' + roles[i] + ':[a* TO z*]'; // scope to role
       if (i < (roles.length - 1)) { searchstring += ' AND '; }*/
    }
    if (selroles.length) for (var s in selroles) selector[Op.and].push({[Op.or]: [selroles[s]]});
    /*    searchstring += ')';*/
  }
  
  const processUsers = rows => {
    if (rows.length) {

      try {
        rows.forEach(r => {
          if (r.password) delete r.password;

          if (r.email) delete r.email;

          if (r.linkedin) {
            if (r.linkedin.emailAddress) delete r.linkedin.emailAddress;
            if (r.linkedin.access_token) delete r.linkedin.access_token;
          }

          if (r.newsletter) delete r.newsletter;
        });
      } catch (error) {
        console.warn('WARNING: user144 ', error);
      }

      rows.next = '/api/2.1/users?' + jqparam({
          communities: communities,
          clusters: (clusters || '*'),
          roles: (roles || '*'),
          limit: (Number(limit) || 16),
          offset: ((Number(offset) || 0) + (Number(limit) || 16)),
          query: (query || '*')
        });

      rows.prev = '/api/2.1/users?' + jqparam({
          communities: communities,
          clusters: (clusters || '*'),
          roles: (roles || '*'),
          limit: (Number(limit) || 16),
          offset: (offset ? (Number(offset) - ((Number(limit) || 16))) : 0),
          query: (query || '*')
        });

      res.send(rows);
    } else {
      console.log('WARNING: No users!');
      res.send({message: 'No users found!'});
    }
  };
  
  console.log('Pulling Users: ', JSON.stringify(selector));

  if (query) {
    //query runs without other parameters
    sequelize.query('SELECT * FROM communities WHERE TYPE="user" AND MATCH (name, headline, summary, skills, description) AGAINST ("'+query+'" IN NATURAL LANGUAGE MODE) LIMIT '+Number(offset)+', '+Number(limit), { model: cdb}).then(processUsers);
  } else cdb.findAll({ where: selector }, { offset: Number(offset) || 0, limit: Number(limit) || 16 }).then(processUsers);
}

function handleDirectSearch(req, res) {
  //TODO check for key to protect info?

  sequelize.query('SELECT * FROM communities WHERE TYPE="user" AND MATCH (name, headline, summary, skills, description) AGAINST ("'+query+'" IN NATURAL LANGUAGE MODE) LIMIT '+Number(offset)+', '+Number(limit), { model: cdb})
  .then(rows => {
    if (rows.length) {
      try {
        rows.forEach(r => {
          if (r.password) delete r.password;

          if (r.email) delete r.email;

          if (r.linkedin) {
            if (r.linkedin.emailAddress) delete r.linkedin.emailAddress;
            if (r.linkedin.access_token) delete r.linkedin.access_token;
          }
        });

        rows.next = '/api/2.1/users?' + jqparam({
            communities: req.query.communities,
            clusters: (req.query.clusters || '*'),
            roles: (req.query.roles || '*'),
            limit: (Number(req.query.limit) || 16),
            offset: ((Number(req.query.offset) || 0) + (Number(req.query.limit) || 16)),
            query: (req.query.query || '*')
          });

        rows.prev = '/api/2.1/users?' + jqparam({
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

      res.status(200).send(rows);
    } else {
      res.status(202).send({message: "Something went wrong."});
    }
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

  var selector = {
    [Op.and]: []
  };

  var loc = {};
  loc[location_key] = {[Op.ne]: null};
  
  selector[Op.and].push({type: "user"});
  selector[Op.and].push({"roles.leader": loc});

  console.log(selector);

  cdb.findAll({where: selector})
  .then(leaders => {
    if (leaders.length) {
   
      console.log("Found leader(s)");

      // now get user record for email address
      cdb.findById(user_key)
      .then(user => {
        if (user) {
          var contacts = [],
            knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

          for (var leader in leaders) {

            contacts.push({
              "id": leader.id,
              "name": leader.name,
              "email": leader.email,
              "data": {
                "source_name": formdata.name,
                "source_email": formdata.email,
                "source_company": formdata.company,
                "source_reason": formdata.reason,
                "target_name": user.name,
                "target_email": user.email,
                "target_avatar": user.avatar
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
                      "target_name": user.name,
                      "target_email": user.email,
                      "target_avatar": user.avatar
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
          console.warn("WARNING: user338");
          res.status(202).send({message: "Something went wrong."});
        }
      })
          
    } else {
      console.warn("WARNING: COULD NOT FIND LEADER FOR THIS COMMUNITY");
        res.status(202).send({message: "Sorry, we can't seem to find a leader for this community. We took note of your request and we'll look into this and get back to you via email ASAP."});
    }
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

  cdb.findById(userid)
  .then(user => {
    if (user) {
      user["key"] = userid;
      user["token"] = jwt.sign(userid, process.env.SC_TOKEN_SECRET);
      res.status(200).send(user);
    } else {
      console.warn("Problem pulling user, sending 400 response. ");
      res.status(400).send({message: "Please try logging in again."});
    }
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

    cdb.findById(userid)
    .then(user => {
      if (user) {
        profile['_id'] = user._id;
        profile['_rev'] = user._rev;

        cdb.update(profile, {where: {id: userid}})
        .then(response => {
          if (response) {
            profile["key"] = userid;
            res.status(200).send({token: jwt.sign(userid, process.env.SC_TOKEN_SECRET), user: profile});
          } else {
            console.warn("WARNING: user457");
            res.status(202).send({message: "Something went wrong."});
          }
        })
        
      } else {
        console.warn("WARNING: user457");
        res.status(202).send({message: "Something went wrong."});
      }
    });

  } else {
    res.status(400).send({message: 'You may only update your own user record.'});
  }
}

function handleRemoveCommunity(req, res) {
  // req data is guaranteed by ensureauth
  var userid = req.user,
    user_key = req.body.params.user_key,
    community = req.body.params.community;

  console.log("Removing community '" + community.key + "' for user " + user_key);

  // first confirm that req.user has leader role in community
  cdb.findById(userid)
  .then(response => {
    if (response) {
      if (response.roles.leader[community.key]) {
        cdb.findById(user_key)
        .then(response => {
          if (response) {
            for (var role in response.roles) {
              for (var comm in response.roles[role]) {
                if (response.roles[role][community.key]) {
                  delete response.roles[role][community.key];
                }
              }
            }
            if (response.communities) response.communities = JSON.parse(response.communities);
            if (response.communities.indexOf(community.key) > -1) {
              response.communities.splice(response.communities.indexOf(community.key), 1);
            }
            cdb.update(response, {where: {id: user_key}})
            .then(response => {
              if (response) {
                console.log('Successfully removed community from user profile.');
                res.status(201).send({message: 'Community removed.'});
              } else {
                console.warn("WARNING: ");
                res.status(202).send({message: "Something went wrong."});
              }
            });

          } else {
            console.warn("WARNING: ");
            res.status(202).send({message: "Something went wrong."});
          }
        });
          
      } else {
        console.warn('WARNING:  User does not have leader role in this community.');
        res.status(202).send({message: 'You do not have leader privileges for this community.'});
      }
    } else {
      console.warn("WARNING: ");
      res.status(202).send({message: "Something went wrong."});
    }
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
  cdb.findById(userid)
  .then(response => {
    if (response) {
      if (response.roles[role] && response.roles[role][community_key]) {
        delete response.roles[role][community_key];

        for (var r in response.roles) {
          if (response.roles[r][community_key]) var del = true;
        }

        if (del) {
          if (response.communities) response.communities = JSON.parse(response.communities);
          if (response.communities.indexOf(community_key) > -1) {
            response.communities.splice(response.communities.indexOf(community_key), 1);
          }
        }

        cdb.update(response, {where: {id: userid}})
        .then(response => {
          if (response) {
            console.log('Successfully removed role from user profile.');
            res.status(201).send({message: 'Role removed.'});
          } else {
            console.warn("WARNING: ");
            res.status(202).send({message: "Something went wrong."});
          }
        });

      } else {
        console.warn('WARNING:  User does not have the ' + role + ' role for record ' + community_key + '.');
        res.status(202).send({message: 'You do not have the ' + role + ' role for record ' + community_key + '.'});
      }
    } else {
      console.warn("WARNING: ");
      res.status(202).send({message: "Something went wrong."});
    }
  });
    
}


function handleFeedback(req, res) {
  var userkey = req.user,
    data = JSON.parse(decodeURIComponent(req.query.data));

  cdb.findById(userkey)
  .then(response => {
    if (response) {
      response['beta'] = data;

      cdb.update(response, {where: {id: userkey}})
      .then(response => {
        if (response) {
          res.status(201).send({message: 'Profile updated.'});
        } else {
          console.warn('WARNING: user547');
          res.status(202).send({message: "Something went wrong."});
        }
      });
        
    } else {
      console.warn('WARNING: user553');
      res.status(202).send({message: 'Something went wrong: ' });
    }
  });
}

/*
 |--------------------------------------------------------------------------
 | Delete Profile
 |--------------------------------------------------------------------------
 */

function handleRemoveProfile(req, res) {
  var userid = req.params.userid;
  cdb.findById(userid)
  .then(result => {
    if (result) {
      cdb.destroy(userid)
      .then(result => {
        if (result) {
          console.log('User removed.');
          res.status(200).send({message: 'User removed'});
        } else {
          console.log("Remove FAIL:");
          res.status(202).send({message: 'Something went wrong: '});
        }
      });
    }
  });
}

module.exports = UserApi;