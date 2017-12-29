var Q = require('q'),
  request = require('request'),
  url = require('url'),
  CommunityApi = require(__dirname + '/community.api.js'),
  communityApis = new CommunityApi(),
  aws = require('aws-sdk'),
  jqparam = require('jquery-param'),
  {cdb, sequelize, Op} = require('../../db');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CompanyApi = function () {
  this.companySearch = handleCompanySearch;
  this.addCompany = handleAddCompany;
  this.deleteCompany = handleDeleteCompany;
  this.getLogoUrl = handleGetLogoUrl;
  this.checkUrl = handleCheckUrl;
};

var schema = {
  company: function (profile, location_key, community_key) {

    var communities = location_key == community_key ?
      [location_key] :
      [location_key, community_key];

    var newprofile = {
      "type": "company",
      "resource": profile.resource,
      "resource_types": profile.resource_types,
      "home": location_key,
      "name": profile.name,
      "parents": [profile.parent.toLowerCase()],
      "headline": profile.headline,
      "summary": profile.summary,
      "avatar": profile.avatar || "",
      "stage": profile.stage,
      "industries": profile.industries,
      "website": profile.website,
      "street": profile.street,
      "city": profile.city,
      "state": profile.state,
      "angellist": {
        "id": profile.id,
        "angellist_url": profile.angellist_url
      },
      "community_profiles": {},
      "communities": communities
    };

    newprofile.community_profiles[location_key] = {
      home: newprofile.home,
      name: newprofile.name,
      parents: newprofile.parents,
      headline: newprofile.headline,
      summary: newprofile.summary,
      avatar: newprofile.avatar,
      stage: newprofile.stage,
      industries: newprofile.industries,
      website: newprofile.website,
      street: newprofile.street,
      city: newprofile.city,
      state: newprofile.state,
      angellist: newprofile.angellist
    };

    return newprofile;
  }
};
/*
function formatSearchResults(items) {
  if (items.rows && items.rows.length) {
    for (var i in items.rows) {
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
*/
function handleCompanySearch(req, res) {
  var communities = req.query.communities,
    clusters = req.query.clusters,
    stages = req.query.stages,
    types = req.query.types,
    query = req.query.query,
    limit = req.query.limit,
    offset = req.query.offset,
    get_resources = req.query.get_resources,
    key = req.query.api_key;

  var allowed = false;
  var userperms;

  //console.log(key); //concern is that a passed in key is new and overwrites existing key

  // create searchstring
  var selector = {
    ["$and"]: [
      {"type": "company"}
    ]
  };
  var searchstring = 'communities:(';
  var state = "";
  /*
   if (communities) {
   for (c in communities) {

   // determine whether one of the communities is a state
   var state_suffix = communityApis.convert_state(communities[c].replace('-',' '), 'abbrev'); // returns false if no match

   if (state_suffix) {
   var state = " AND profile.home: (" + communities[c] + " OR *-" + state_suffix.toLowerCase() + ")";
   var remove = communities.indexOf(communities[c]);
   if (remove > -1) communities.splice(remove, 1); // to avoid issues with length check
   if (communities.length == 0) searchstring += "*";
   } else {
   searchstring += communities[c];
   if (c < (communities.length - 1)) { searchstring += ' AND '; }
   }
   }
   } else searchstring += '*';*/
  selector["$and"].push({"communities": {[Op.in]: communities}});

  /* if (get_resources === "true") {
   searchstring += ") AND resource: true" + state;
   } else searchstring += ")" + (state ? " AND" + state : '');*/

  if (get_resources == "true") selector["$and"].push({"resource": true});

  if (clusters && clusters.length > 0 && clusters[0] !== '*') {

    selector["$and"].push(
      {
        [Op.or]: [
          {"skills": {[Op.in]: clusters}},
          {"parents": {[Op.in]: clusters}}
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

     searchstring += 'profile.industries:(' + clusterstring + ') OR profile.parents:(' + clusterstring + '))'; // scope to industries within the cluster
     */

  }
  if (stages && stages.length > 0 && stages[0] !== '*') {
    selector["$and"].push({"stage": {[Op.in]: stages}});
    /* stages = stages.splice(',');
     searchstring += ' AND (';

     for (i in stages) {
     searchstring += "profile.stage:" + stages[i]; // scope to stage
     if (i < (stages.length - 1)) { searchstring += ' OR '; }
     }
     searchstring += ')';*/
  }

  if (types && types.length > 0 && types[0] !== '*') {
    selector["$and"].push({"resource_types": {[Op.in]: types}});
    /*types = types.splice(',');
     searchstring += ' AND (';

     for (i in types) {
     searchstring += "resource_types:" + types[i]; // scope to stage
     if (i < (types.length - 1)) { searchstring += ' OR '; }
     }
     searchstring += ')';*/
  }


  if (query) {
    //todo this will no doubt be broken
    selector["$and"].push({"$text": query});
    /*searchstring += ' AND ' + '(profile: ' + query + ')';*/
  }

  console.log('Pulling Companies: ', selector);

  cdb.findAll({where: selector},{offset: Number(offset) || 0, limit: Number(limit) || 16}).then(result => {
    if (result) {

      result.next = '/api/2.1/users?' + jqparam({
          communities: req.query.communities,
          clusters: (req.query.clusters || '*'),
          stages: (req.query.stages || '*'),
          types: (req.query.types || '*'),
          limit: (Number(req.query.limit) || 16),
          get_resources: (req.query.get_resources || false),
          offset: ((Number(req.query.offset) || 0) + (Number(req.query.limit) || 16)),
          query: (req.query.query || '*')
        });

      result.prev = '/api/2.1/users?' + jqparam({
          communities: req.query.communities,
          clusters: (req.query.clusters || '*'),
          stages: (req.query.stages || '*'),
          types: (req.query.types || '*'),
          limit: (Number(req.query.limit) || 16),
          get_resources: (req.query.get_resources || false),
          offset: (req.query.offset ? (Number(req.query.offset) - ((Number(req.query.limit) || 16))) : 0),
          query: (req.query.query || '*')
        });

      res.send(result);
    } else {
      console.log('WARNING: ');
      res.send({message: 'No companies found!'});
    }
  })
}

function handleGetLogoUrl(req, res) {
  // req data is guaranteed by ensureauth
  var company_name = req.query.company_name,
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
    Key: 'logos/' + company_name + '_' + filename,
    Expires: 60,
    ACL: 'public-read'
  };
  s3.getSignedUrl('putObject', s3_params, function (err, signedUrl) {
    var parsedUrl = url.parse(signedUrl);
    parsedUrl.search = null;
    var objectUrl = url.format(parsedUrl);

    if (!err) {
      res.send({put: signedUrl, get: objectUrl});
    } else res.status(400).send({message: "Something went wrong."});

  });
}

function handleAddCompany(req, res) {
  // always use ensureAuth before this (to acquire req.user)
  var addCompany = req.body.params;

  var go = function () {
    // validate user is a member in the location/community
    cdb.findById(req.user).then(response => {
      if (response) {
        console.log(addCompany);

        var user = response,
          update = false;

        if (!addCompany.location_key) addCompany.location_key = addCompany.community_key;

        if (user.communities.indexOf(addCompany.location_key) < 0) {
          res.status(202).send({message: 'You must be a member of this community to add a company.'});
        } else if (!addCompany.community_key || (user.roles && user.roles.leader && user.roles.leader[addCompany.community_key] && user.roles.leader[addCompany.community_key].indexOf(addCompany.location_key) < 0)) {
          console.warn("No community specified, or user is not a leader in community: " + addCompany.community_key + " for location: " + addCompany.location_key + "!");
          addCompany.community_key = addCompany.location_key;
        }

        var company = schema.company(addCompany, addCompany.location_key, addCompany.community_key);

        var post = function () {
          companyPost(company, addCompany.role, addCompany.location_key, req.user, addCompany.key, update, function (result) {
            res.status(result.status).send(result.data);
          });
        };

        // add company

        if (!addCompany.key) {
          addCompany.key = addCompany.url.toLowerCase();
          post();
        } else if (addCompany.key && (addCompany.key !== addCompany.url)) {
          res.status(202).send({message: 'Sorry, a url path cannot be changed.'})
        } else {
          update = true;
          post();
        }

        /*
         } else {
         console.warn("User is not a member of community: " + addCompany.community_key + " and location: " + addCompany.location_key + "!");
         res.status(400).send({ message: 'You must be a member of this community and/or a leader of this resource to add a company to it.' });
         }
         */

      } else {
        console.warn("WARNING: ");
        res.status(400).send({message: "Something went wrong. We have been alerted and will take a look and get back to you."});
      }
    })

  };

  if (!addCompany) {
    console.warn("No company specified!");
    res.status(400).send({message: 'Some information was missing.'});
  } else {
    console.log('Adding company ' + addCompany.name + ' to ' + addCompany.location_key + ' / ' + addCompany.community_key);

    // if no existing key is provided, validate the company.url doesn't already exist
    if (!addCompany.key) {
      cdb.findOne({where: {slug: addCompany.url}}).then(result => {
        if (result) {
          res.status(400).send({message: 'That url is already in use. Please specify a different url path.'})
        } else {
          go();
        }
      })

    } else go();

  }
}

function handleDeleteCompany(req, res) {

  // always use ensureAuth before this (to acquire req.user)
  var params = req.body.params;

  var delete_it = function () {

    // pull it first to make sure it's a company

    cdb.findById(params.company_key).then(response => {

      if (response) {
        if (response.type == 'company') {

          cdb.destroy(response.id).then(response => {

            if (response) {
              // company has been deleted, now delete references in user records
              cdb.findAll({where: 'type:user AND roles:' + params.company_key}).then(flush => {
                if (flush) {
                  for (var r in flush) {
                    var flush_key = flush[r].id,
                      flush_value = flush[r];

                    for (var i in flush_value.roles) {
                      for (var c in flush_value.roles[i]) {
                        if (c == params.company_key) {
                          delete flush_value.roles[i][c];
                        }
                      }
                    }

                    // remove from communities
                    if (flush_value.communities.indexOf(params.company_key) > -1) {
                      var findex = flush_value.communities.indexOf(params.company_key);
                      flush_value.communities.splice(findex, 1);
                    }


                    cdb.update(flush_value, {where: {id: flush_key}}).then(response => {
                      if (response) {
                        console.log('Deleted ' + params.company_key + ' from ' + flush_key);
                        res.status(204).send({message: 'Company deleted!'});
                      } else {
                        console.log("WARNING: ");
                        res.status(202).send({message: "The company has been deleted, but something else went wrong."});
                      }
                    })
                  }
                  
                } else {
                  console.log("WARNING: ");
                  res.status(202).send({message: "The company has been deleted, but something else went wrong."});
                }
              })
            } else {
              console.warn('WARNING: community620');
              res.status(202).send({message: "Something went wrong."});
            }
          })

        } else {
          console.warn('Not a company!');
          res.status(202).send({message: "This isn't a company!"});
        }
      } else {
        console.warn('No company found!');
        res.status(202).send({message: "No company found!"});
      }
    })

  };

  try {
    console.log('Deleting company: ' + params.company_key);

    // first determine if the company has founders or team members. Pull from DB to prevent tampering.
    sequelize
      .query(
        'SELECT * FROM communities WHERE JSON_CONTAINS(roles->>\'$.founder."' + params.company_key + '"\', \'[*]\') OR JSON_CONTAINS(roles->>\'$.team."' + params.company_key + '"\', \'[*]\')',
        { model: cdb}
      ).then(team => {
        if (!team.length) {

          // no founders or team members, so it can be deleted by anyone

          delete_it();

        } else {

          // need to validate whether the current user is one of the founders or team members

          var del = false;
          for (var t in team.rows) {

            if (team[t].id == req.user) {
              del = true;
              delete_it();
              break;
            }
          }

          if (!del) res.status(202).send({message: "Only a founder or team member of this company may delete it."});
        }
    })

  }
  catch (err) {
    console.warn("WARNING: ", err);
    res.status(202).send({message: err});
  }
}

var addRole = function (company_key, roles, location_key, user_key) {

  cdb.get(user_key, function (err, response) {
    if (!err) {
// add new role

      for (var role in roles) {
        if (!response.roles[roles[role]]) {
          response.roles[roles[role]] = {};
          response.roles[roles[role]][company_key] = [location_key];
        } else if (!response.roles[roles[role]][company_key]) {
          response.roles[roles[role]][company_key] = [location_key];
        } else if (response.roles[roles[role]][company_key].indexOf(location_key) < 0) {
          response.roles[roles[role]][company_key].push(location_key);
        } // else the damn thing is already there

        // add community
        if (!response.communities) {
          response.communities = {};
        }

        if (response.communities.indexOf(company_key) < 0) {
          response.communities.push(company_key);
        }
      }

      cdb.update(response, {where: {id: user_key}}).then(result => {
        if (result) {
          console.log('User ' + user_key + ' updated with ', roles);
        } else {
          console.warn("WARNING: ", err);
        }
      })

    } else {
      console.warn("WARNING: ", err);
    }
  })

};

function handleCheckUrl(req, res) {

  var website = req.body.params.website;

  console.log('Looking for existing company based on website url: ' + website);

  // cleanup url

  website = website.replace(/.*?:\/\//g, "");
  if (website.match(/^www\./)) website = website.substring(4);

  cdb.findAll({
    where: {[Op.and]: {type: 'company', profile: website}}}).then(result => {
    if (result) {
      if (result.length) {
        res.status(202).send({message: result[0].id});
      } else {
        res.status(404).send();
      }
    } else {
      console.warn("WARNING: ");
    }

  });

}

var companyPost = function (company, role, location_key, user, key, update, callback) {

  company.slug = key;
  cdb.create(company).then(response => {
    
    if (response) {
      var companykey = response.id;

      var roles = role ? [role] : [];
      if (company.resource) roles.push('leader');

      if (roles.length) {
        addRole(companykey, roles, location_key, user);
      }

      if (update) {

        console.log("UPDATED: " + company.name);
        company["message"] = "Well done! " + company.name + " has been updated.";

      } else {

        // if resource, add creator as leader

        console.log("REGISTERED: " + company.name + " as " + companykey);
        company["message"] = "Well done! You've added " + company.name + " to the community.";

      }
      
      callback({"status": 200, "data": company});
    } else {
      console.log("WARNING: ");
      callback({"status": 500, "data": {"message": "Something went wrong."}});
    }
  });

};

module.exports = CompanyApi;