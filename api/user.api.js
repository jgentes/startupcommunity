var Q = require('q'),
  url = require('url'),
  jwt = require('jsonwebtoken'),
  aws = require('aws-sdk'),
  fs = require('fs'),
  communityApi = require(__dirname + '/community.api.js'),
  communityApis = new communityApi(),
  { cdb, sequelize, Op } = require('../db'),
  sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

function handleUserSearch(req, res) {
  var communities = req.query.communities || [],
    clusters = req.query.clusters || [],
    roles = req.query.roles,
    query = req.query.query,
    limit = req.query.limit,
    offset = req.query.offset < 0 ? 0 : req.query.offset || 0,
    key = req.query.api_key;

  var allowed = false;
  var userperms;

  // create searchstring
  var selector = {
    [Op.and]: [
      { type: "user" }
    ]
  };

  var community_search = [];
  var state_suffix = null;

  // remove dups
  communities = [...new Set(communities)];
  clusters = [...new Set(clusters)];
  roles = [...new Set(roles)];

  if (communities && communities.length) {
    communities.forEach(c => {
      // determine whether one of the communities is a state
      state_suffix = communityApis.convert_state(c.replace('-', ' '), 'abbrev'); // returns false if no match

      community_search.push({
        [Op.like]: '%"' + c + '"%'
      });
    });
  }

  var preState = [{
    communities: {
      [Op.or]: community_search
    }
  }]

  if (state_suffix) preState.push({
    home: {
      [Op.like]: '%-' + state_suffix.toLowerCase()
    }
  });

  selector[Op.and].push({
    [Op.or]: preState
  });

  if (clusters && clusters.length > 0 && clusters[0] !== '*') {
    var cluster_search = [];
    clusters.forEach(c => {
      cluster_search.push({
        [Op.like]: '%"' + c + '"%'
      });
    });

    selector[Op.and].push({
      [Op.or]: [{
          skills: {
            [Op.or]: cluster_search
          }
        },
        {
          parents: {
            [Op.or]: cluster_search
          }
        }
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
      sel['roles.' + roles[i]] = {
        [Op.ne]: null
      };
      selroles.push(sel);
      /* searchstring += 'roles.' + roles[i] + ':[a* TO z*]'; // scope to role
       if (i < (roles.length - 1)) { searchstring += ' AND '; }*/
    }
    if (selroles.length)
      for (var s in selroles) selector[Op.and].push({
        [Op.or]: [selroles[s]]
      });
    /*    searchstring += ')';*/
  }

  const processUsers = users => {
    const rows = users && users.rows ? users.rows : users;
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
          if (users.count) r.count = users.count;
        });
      }
      catch (error) {
        console.warn('WARNING: user144 ', error);
      }
    }
    return res.send(rows);
  };

  console.log('Pulling Users: ', JSON.stringify(selector));

  if (query && query != '*') {
    //query runs without other parameters
    sequelize.query('SELECT * FROM communities WHERE TYPE="user" AND MATCH (name, headline, summary, skills, description) AGAINST ("' + query + '" IN NATURAL LANGUAGE MODE) LIMIT ' + Number(offset) + ', ' + Number(limit), { model: cdb }).then(processUsers);
  }
  else cdb.findAndCountAll({
    where: selector,
    offset: Number(offset) || 0,
    limit: Number(limit) || 16,
    order: sequelize.random()
  }).then(processUsers);
}

function handleDirectSearch(req, res) {
  //TODO check for key to protect info?
  var query = req.query.query,
    limit = req.query.limit,
    offset = req.query.offset < 0 ? 0 : req.query.offset || 0;

  sequelize.query('SELECT * FROM communities WHERE TYPE="user" AND MATCH (name, headline, summary, skills, description) AGAINST ("' + query + '" IN NATURAL LANGUAGE MODE) LIMIT ' + Number(offset) + ', ' + Number(limit), { model: cdb })
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

        }
        catch (error) {
          console.warn('WARNING: user206', error);
        }

        return res.status(200).send(rows);
      }
      else {
        return res.status(202).send({ message: "Something went wrong." });
      }
    });
}


/*
 |--------------------------------------------------------------------------
 | Contact User
 |--------------------------------------------------------------------------
 */

function handleContactUser(req, res) {

  var user_id = req.query.user_id,
    formdata = req.query.formdata,
    location_id = req.query.location_id;

  var selector = {
    [Op.and]: []
  };

  var loc = {};
  loc[location_id] = {
    [Op.ne]: null
  };

  selector[Op.and].push({ type: "user" });
  selector[Op.and].push({ "roles.leader": loc });

  console.log(selector);

  cdb.findAll({ where: selector })
    .then(leaders => {
      if (leaders.length) {

        console.log("Found leader(s)");

        // now get user record for email address
        cdb.findById(user_id)
          .then(user => {
            if (user) {
              user = user.toJSON();
              var contacts = [],
                substitutions;

              for (var leader in leaders) contacts.push(leaders[leader].email);

              substitutions = {
                "title_bar": 'Connection Request',
                "source_name": formdata.name,
                "source_email": formdata.email,
                "source_company": formdata.company,
                "source_reason": formdata.reason,
                "target_name": user.name,
                "target_email": user.email,
                "target_avatar": user.avatar
              };

              // send notification to leaders

              const msg = {
                templateId: '23ce076f-8f36-4791-8086-13fa11812152',
                to: contacts,
                from: 'james@startupcommunity.org',
                subject: 'Connection request: ' + formdata.name + ' would like to connect with ' + user.name,
                html: fs.readFileSync(__dirname + '/templates/connection_request.html', 'utf8'),
                substitutionWrappers: ['%', '%'],
                substitutions
              };
              sgMail.send(msg)
                .then(() => {
                  console.log('Connection request sent!');
                  return res.status(200).end();

                  substitutions['title_bar'] = 'Connection Request Sent';

                  // send notification to requestor..
                  const msg2 = {
                    templateId: '23ce076f-8f36-4791-8086-13fa11812152',
                    to: formdata.email,
                    from: 'james@startupcommunity.org',
                    subject: 'Connection request sent!',
                    html: fs.readFileSync(__dirname + '/templates/connection_receipt.html', 'utf8'),
                    substitutionWrappers: ['%', '%'],
                    substitutions
                  };
                  sgMail.send(msg2)
                    .then(() => console.log('Connection receipt sent to ' + formdata.name))
                    .catch(err => console.log('WARNING: ', err.toString()));

                })
                .catch(err => console.log('WARNING: ', err.toString()));


            }
            else {
              console.warn("WARNING: user338");
              return res.status(202).send({ message: "Something went wrong." });
            }
          })

      }
      else {
        console.warn("WARNING: COULD NOT FIND LEADER FOR THIS COMMUNITY");
        return res.status(202).send({ message: "Sorry, we can't seem to find a leader for this community. We took note of your request and we'll look into this and get back to you via email ASAP." });
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
        user = user.toJSON();
        user["token"] = jwt.sign(userid, process.env.SC_TOKEN_SECRET);
        return res.status(200).send(user);
      }
      else {
        console.warn("Problem pulling user, sending 400 response. ");
        return res.status(400).send({ message: "Please try logging in again." });
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
  s3.getSignedUrl('putObject', s3_params, function(err, signedUrl) {
    var parsedUrl = url.parse(signedUrl);
    parsedUrl.search = null;
    var objectUrl = url.format(parsedUrl);

    if (!err) {
      return res.send({ put: signedUrl, get: objectUrl });
    }
    else return res.status(204).send({ message: "Something went wrong." });

  });
}

function handleUpdateProfile(req, res) {
  // req data is guaranteed by ensureauth
  var userid = req.user,
    profile = req.body.params.profile;

  console.log('Updating user profile: ' + userid);

  // validate user updates only their own record
  if (userid == profile.id) {
    delete profile.id;

    cdb.findById(userid)
      .then(user => {
        if (user) {

          cdb.update(profile, { where: { id: userid } })
            .then(response => {
              if (response) {
                return res.status(200).send({ token: jwt.sign(userid, process.env.SC_TOKEN_SECRET), user: profile });
              }
              else {
                console.warn("WARNING: user457");
                return res.status(202).send({ message: "Something went wrong." });
              }
            }).catch(err => {
              if (err.code == 'ER_EMPTY_QUERY') console.log('No changes to update..');
            });

        }
        else {
          console.warn("WARNING: user457");
          return res.status(202).send({ message: "Something went wrong." });
        }
      });

  }
  else {
    return res.status(400).send({ message: 'You may only update your own user record.' });
  }
}

function handleRemoveCommunity(req, res) {
  // req data is guaranteed by ensureauth
  var userid = req.user,
    user_id = req.body.params.user_id,
    community = req.body.params.community;

  console.log("Removing community '" + community.id + "' for user " + user_id);

  // first confirm that req.user has leader role in community
  cdb.findById(userid)
    .then(response => {
      if (response) {
        if (response.roles.leader[community.id]) {
          cdb.findById(user_id)
            .then(response => {
              if (response) {
                response = response.toJSON();
                for (var role in response.roles) {
                  for (var comm in response.roles[role]) {
                    if (response.roles[role][community.id]) {
                      delete response.roles[role][community.id];
                    }
                  }
                }
                if (response.communities.indexOf(community.id) > -1) {
                  response.communities.splice(response.communities.indexOf(community.id), 1);
                }
                cdb.update(response, { where: { id: user_id } })
                  .then(response => {
                    if (response) {
                      console.log('Successfully removed community from user profile.');
                      return res.status(201).send({ message: 'Community removed.' });
                    }
                    else {
                      console.warn("WARNING: ");
                      return res.status(202).send({ message: "Something went wrong." });
                    }
                  }).catch(err => {
                    if (err.code == 'ER_EMPTY_QUERY') console.log('No changes to update..');
                  });

              }
              else {
                console.warn("WARNING: ");
                return res.status(202).send({ message: "Something went wrong." });
              }
            });

        }
        else {
          console.warn('WARNING:  User does not have leader role in this community.');
          return res.status(202).send({ message: 'You do not have leader privileges for this community.' });
        }
      }
      else {
        console.warn("WARNING: ");
        return res.status(202).send({ message: "Something went wrong." });
      }
    });
}

function handleRemoveRole(req, res) {
  // req data is guaranteed by ensureauth
  var userid = req.user,
    role = req.body.params.role,
    community_id = req.body.params.community_id,
    del = false;

  console.log("Removing " + role + " for community " + community_id + " for user " + userid);

  // confirm user has role and remove it
  cdb.findById(userid)
    .then(response => {
      if (response) {
        response = response.toJSON();
        if (response.roles[role] && response.roles[role][community_id]) {
          delete response.roles[role][community_id];

          for (var r in response.roles) {
            if (response.roles[r][community_id]) var del = true;
          }

          if (del) {
            if (response.communities.indexOf(community_id) > -1) {
              response.communities.splice(response.communities.indexOf(community_id), 1);
            }
          }

          cdb.update(response, { where: { id: userid } })
            .then(response => {
              if (response) {
                console.log('Successfully removed role from user profile.');
                return res.status(201).send({ message: 'Role removed.' });
              }
              else {
                console.warn("WARNING: ");
                return res.status(202).send({ message: "Something went wrong." });
              }
            }).catch(err => {
              if (err.code == 'ER_EMPTY_QUERY') console.log('No changes to update..');
            });

        }
        else {
          console.warn('WARNING:  User does not have the ' + role + ' role for record ' + community_id + '.');
          return res.status(202).send({ message: 'You do not have the ' + role + ' role for record ' + community_id + '.' });
        }
      }
      else {
        console.warn("WARNING: ");
        return res.status(202).send({ message: "Something went wrong." });
      }
    });

}


function handleFeedback(req, res) {
  var userid = req.user,
    data = JSON.parse(decodeURIComponent(req.query.data));

  cdb.findById(userid)
    .then(response => {
      if (response) {
        response = response.toJSON();
        response['beta'] = data;

        cdb.update(response, { where: { id: userid } })
          .then(response => {
            if (response) {
              return res.status(201).send({ message: 'Profile updated.' });
            }
            else {
              console.warn('WARNING: user547');
              return res.status(202).send({ message: "Something went wrong." });
            }
          }).catch(err => {
            if (err.code == 'ER_EMPTY_QUERY') console.log('No changes to update..');
          });

      }
      else {
        console.warn('WARNING: user553');
        return res.status(202).send({ message: 'Something went wrong: ' });
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
              return res.status(200).send({ message: 'User removed' });
            }
            else {
              console.log("Remove FAIL:");
              return res.status(202).send({ message: 'Something went wrong: ' });
            }
          });
      }
    });
}

module.exports = UserApi;
