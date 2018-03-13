var Q = require('q'),
  url = require('url'),
  aws = require('aws-sdk'),
  communityApi = require(__dirname + '/community.api.js'),
  communityApis = new communityApi(),
  { cdb, sequelize, Op } = require('../../db');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CompanyApi = function() {
  this.companySearch = handleCompanySearch;
  this.addCompany = handleAddCompany;
  this.deleteCompany = handleDeleteCompany;
  this.getLogoUrl = handleGetLogoUrl;
  this.checkUrl = handleCheckUrl;
};

var schema = {
  company: function(profile, location_key, community_key) {

    var communities = location_key == community_key ? [location_key] : [location_key, community_key];

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

function handleCompanySearch(req, res) {
  var communities = req.query.communities,
    clusters = req.query.clusters,
    stages = req.query.stages,
    types = req.query.types,
    query = req.query.query,
    limit = req.query.limit,
    offset = req.query.offset < 0 ? 0 : req.query.offset || 0,
    get_resources = req.query.get_resources,
    key = req.query.api_key;

  var allowed = false;
  var userperms;

  //console.log(key); //concern is that a passed in key is new and overwrites existing key

  // create searchstring
  var selector = {
    [Op.and]: [
      { type: "company" }
    ]
  };

  var community_search = [];
  var state_suffix = null;
  
  if (communities && communities.length) {
    communities.forEach(c => {
      // determine whether one of the communities is a state
      state_suffix = communityApis.convert_state(c.replace('-', ' '), 'abbrev'); // returns false if no match
      
      community_search.push({
        [Op.like]: '%"' + c + '"%' });
    });
  }
  
  var preState = [{communities: {[Op.or]: community_search}}]
  
  if (state_suffix) preState.push({home: {[Op.like]: '%-' + state_suffix.toLowerCase()}});
  
  selector[Op.and].push({[Op.or]: preState});

  if (get_resources == "true") selector[Op.and].push({ resource: {
      [Op.not]: false } });

  if (clusters && clusters.length > 0 && clusters[0] !== '*') {
    var cluster_search = [];
    clusters.forEach(c => {
      cluster_search.push({
        [Op.like]: '%"' + c + '"%' });
    });

    selector[Op.and].push({
      [Op.or]: [
        { skills: {
            [Op.or]: cluster_search } },
        { parents: {
            [Op.or]: cluster_search } }
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

     searchstring += 'profile.industries:(' + clusterstring + ') OR profile.parents:(' + clusterstring + '))'; // scope to industries within the cluster
     */

  }
  if (stages && stages.length > 0 && stages[0] !== '*') {
    selector[Op.and].push({ stage: {
        [Op.in]: stages } });
    /* stages = stages.splice(',');
     searchstring += ' AND (';

     for (i in stages) {
     searchstring += "profile.stage:" + stages[i]; // scope to stage
     if (i < (stages.length - 1)) { searchstring += ' OR '; }
     }
     searchstring += ')';*/
  }

  if (types && types.length > 0 && types[0] !== '*') {
    var type_search = [];
    types.forEach(t => {
      type_search.push({
        [Op.like]: '%"' + t + '"%' });
    })

    selector[Op.and].push({ resource_types: {
        [Op.or]: type_search } });
    /*types = types.splice(',');
     searchstring += ' AND (';

     for (i in types) {
     searchstring += "resource_types:" + types[i]; // scope to stage
     if (i < (types.length - 1)) { searchstring += ' OR '; }
     }
     searchstring += ')';*/
  }

  console.log('Pulling Companies: ', JSON.stringify(selector));

  if (query && query != '*') {
    //query runs without other parameters
    sequelize.query('SELECT * FROM communities WHERE TYPE="company" AND MATCH (name, headline, summary, skills, description) AGAINST ("' + query + '" IN NATURAL LANGUAGE MODE) LIMIT ' + Number(offset) + ', ' + Number(limit), { model: cdb }).then(companies => res.send(companies.rows ? companies.rows : companies));
  }
  else cdb.findAndCountAll({
    where: selector, 
    offset: Number(offset) || 0, 
    limit: Number(limit) || 16,
    order: sequelize.random()
  }).then(companies => res.send(companies.rows ? companies.rows : companies));
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
  s3.getSignedUrl('putObject', s3_params, function(err, signedUrl) {
    var parsedUrl = url.parse(signedUrl);
    parsedUrl.search = null;
    var objectUrl = url.format(parsedUrl);

    if (!err) {
      return res.send({ put: signedUrl, get: objectUrl });
    }
    else return res.status(400).send({ message: "Something went wrong." });

  });
}

function handleAddCompany(req, res) {
  // always use ensureAuth before this (to acquire req.user)
  var addCompany = req.body.params;

  var go = function() {
    // validate user is a member in the location/community
    cdb.findById(req.user).then(response => {
      if (response) {
        console.log(addCompany);

        var user = response,
          update = false;

        if (!addCompany.location_key) addCompany.location_key = addCompany.community_key;
        if (user.communities.indexOf(addCompany.location_key) < 0) {
          return res.status(202).send({ message: 'You must be a member of this community to add a company.' });
        }
        else if (!addCompany.community_key || (user.roles && user.roles.leader && user.roles.leader[addCompany.community_key] && user.roles.leader[addCompany.community_key].indexOf(addCompany.location_key) < 0)) {
          console.warn("No community specified, or user is not a leader in community: " + addCompany.community_key + " for location: " + addCompany.location_key + "!");
          addCompany.community_key = addCompany.location_key;
        }

        var company = schema.company(addCompany, addCompany.location_key, addCompany.community_key);

        var post = function() {
          companyPost(company, addCompany.role, addCompany.location_key, req.user, addCompany.slug, update, function(result) {
            return res.status(result.status).send(result.data);
          });
        };

        // add company

        if (!addCompany.slug) {
          addCompany.slug = addCompany.url.toLowerCase();
          post();
        }
        else if (addCompany.slug && (addCompany.slug !== addCompany.url)) {
          return res.status(202).send({ message: 'Sorry, a url path cannot be changed.' })
        }
        else {
          update = true;
          post();
        }

        /*
         } else {
         console.warn("User is not a member of community: " + addCompany.community_key + " and location: " + addCompany.location_key + "!");
         return res.status(400).send({ message: 'You must be a member of this community and/or a leader of this resource to add a company to it.' });
         }
         */

      }
      else {
        console.warn("WARNING: ");
        return res.status(400).send({ message: "Something went wrong. We have been alerted and will take a look and get back to you." });
      }
    })

  };

  if (!addCompany) {
    console.warn("No company specified!");
    return res.status(400).send({ message: 'Some information was missing.' });
  }
  else {
    console.log('Adding company ' + addCompany.name + ' to ' + addCompany.location_key + ' / ' + addCompany.community_key);

    // if no existing key is provided, validate the company.url doesn't already exist
    if (!addCompany.slug) {
      cdb.findOne({ where: { slug: addCompany.url }}).then(result => {
        if (result) {
          return res.status(400).send({ message: 'That url is already in use. Please specify a different url path.' })
        }
        else {
          go();
        }
      })

    }
    else go();

  }
}

function handleDeleteCompany(req, res) {

  // always use ensureAuth before this (to acquire req.user)
  var params = req.body.params;

  var delete_it = function() {

    // pull it first to make sure it's a company

    cdb.findById(params.company_key).then(response => {

      if (response) {
        if (response.type == 'company') {

          cdb.destroy(response.id).then(response => {

            if (response) {
              const roles = {};
              roles[params.company_key] = {
                [Op.ne]: null };
              // company has been deleted, now delete references in user records
              cdb.findAll({
                where: {
                  [Op.and]: [
                    { type: 'user' },
                    roles
                  ]
                }
              }).then(flush => {
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


                    cdb.update(flush_value, { where: { id: flush_key } }).then(response => {
                      if (response) {
                        console.log('Deleted ' + params.company_key + ' from ' + flush_key);
                        return res.status(204).send({ message: 'Company deleted!' });
                      }
                      else {
                        console.log("WARNING: ");
                        return res.status(202).send({ message: "The company has been deleted, but something else went wrong." });
                      }
                    })
                  }

                }
                else {
                  console.log("WARNING: ");
                  return res.status(202).send({ message: "The company has been deleted, but something else went wrong." });
                }
              })
            }
            else {
              console.warn('WARNING: community620');
              return res.status(202).send({ message: "Something went wrong." });
            }
          })

        }
        else {
          console.warn('Not a company!');
          return res.status(202).send({ message: "This isn't a company!" });
        }
      }
      else {
        console.warn('No company found!');
        return res.status(202).send({ message: "No company found!" });
      }
    })

  };

  try {
    console.log('Deleting company: ' + params.company_key);

    // first determine if the company has founders or team members. Pull from DB to prevent tampering.
    //todo need to test this!
    sequelize
      .query(
        'SELECT * FROM communities WHERE JSON_CONTAINS(roles->>\'$.founder."' + params.company_key + '"\', \'[*]\') OR JSON_CONTAINS(roles->>\'$.team."' + params.company_key + '"\', \'[*]\')', { model: cdb }
      ).then(team => {
        if (!team.length) {

          // no founders or team members, so it can be deleted by anyone

          delete_it();

        }
        else {

          // need to validate whether the current user is one of the founders or team members

          var del = false;
          for (var t in team) {

            if (team[t].id == req.user) {
              del = true;
              delete_it();
              break;
            }
          }

          if (!del) return res.status(202).send({ message: "Only a founder or team member of this company may delete it." });
        }
      })

  }
  catch (err) {
    console.warn("WARNING: ", err);
    return res.status(202).send({ message: err });
  }
}

var addRole = function(company_key, roles, location_key, user_key) {

  cdb.findById(user_key)
    .then(response => {
      if (response) {
        // add new role

        for (var role in roles) {
          if (!response.roles[roles[role]]) {
            response.roles[roles[role]] = {};
            response.roles[roles[role]][company_key] = [location_key];
          }
          else if (!response.roles[roles[role]][company_key]) {
            response.roles[roles[role]][company_key] = [location_key];
          }
          else if (response.roles[roles[role]][company_key].indexOf(location_key) < 0) {
            response.roles[roles[role]][company_key].push(location_key);
          } // else the damn thing is already there

          // add community
          if (!response.communities) response.communities = [];

          if (response.communities.indexOf(company_key) < 0) {
            response.communities.push(company_key);
          }
        }

        cdb.update(response, { where: { id: user_key } }).then(result => {
          if (result) {
            console.log('User ' + user_key + ' updated with ', roles);
          }
          else {
            console.warn("WARNING: ");
          }
        })

      }
      else {
        console.warn("WARNING: ");
      }
    });
};

function handleCheckUrl(req, res) {

  var website = req.body.params.website;

  console.log('Looking for existing company based on website url: ' + website);

  // cleanup url

  website = website.replace(/.*?:\/\//g, "");
  if (website.match(/^www\./)) website = website.substring(4);

  cdb.findAll({
    where: {
      [Op.and]: [{ type: 'company' }, { profile: website }]
    }
  }).then(result => {
    if (result) {
      if (result.length) {
        return res.status(202).send({ message: result[0].id });
      }
      else {
        return res.status(404).send();
      }
    }
    else {
      console.warn("WARNING: ");
    }

  });

}

var companyPost = function(company, role, location_key, user, key, update, callback) {

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

      }
      else {

        // if resource, add creator as leader

        console.log("REGISTERED: " + company.name + " as " + companykey);
        company["message"] = "Well done! You've added " + company.name + " to the community.";

      }

      callback({ "status": 200, "data": company });
    }
    else {
      console.log("WARNING: ");
      callback({ "status": 500, "data": { "message": "Something went wrong." } });
    }
  });

};

module.exports = CompanyApi;
