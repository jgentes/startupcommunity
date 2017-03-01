var Q = require('q'),
    request = require('request'),
    url = require('url'),
    CommunityApi = require(__dirname + '/community.api.js'),
    communityApis = new CommunityApi(),
    aws = require('aws-sdk'),
    db = require('orchestrate')(process.env.DB_KEY),
  Cloudant = require('cloudant'),
  cloudant = Cloudant({
    account: '2001b05d-38e3-44f7-b569-b13a66a81b70-bluemix',
    key: 'ingidlettlysenemediserni',
    password: '42a75fe750f1f707299b5a5c230322d207a99a60',
    plugin: 'promises'
  }),
  cdb = cloudant.db.use(process.env.DB_COMMUNITIES);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CompanyApi = function() {
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
            "profile": {
                "home": location_key,
                "name": profile.name,
                "parents": [profile.parent.toLowerCase()],
                "headline": profile.headline,
                "summary": profile.summary,
                "avatar": profile.avatar || "",
                "stage": profile.stage,
                "industries": profile.industries,
                "website": profile.website,
                "address": {
                    "street": profile.street,
                    "city": profile.city,
                    "state": profile.state
                },
                "angellist": {
                    "id": profile.id,
                    "angellist_url": profile.angellist_url
                }
            },
            "community_profiles": {},
            "communities": communities
        };

        newprofile.community_profiles[location_key] = newprofile.profile;

        return newprofile;
    }
};

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

function handleCompanySearch(req, res){
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
          console.warn("WARNING: company85", err);
          return deferred.reject(new Error(err));
        });
    } catch (err) {
      return deferred.reject(new Error(err));
    }
  }

  // create searchstring
  searchstring = 'communities:(';
  var state = "";

  if (communities) {
    for (c in communities) {

      // determine whether one of the communities is a state
      var state_suffix = communityApis.convert_state(communities[c].replace('-',' '), 'abbrev'); // returns false if no match

      if (state_suffix) {
        var state = " AND profile.home: ('" + communities[c] + "' OR '*-'" + state_suffix.toLowerCase() + "')";
        var remove = communities.indexOf(communities[c]);
        if (remove > -1) communities.splice(remove, 1); // to avoid issues with length check
        if (communities.length == 0) searchstring += "*";
      } else {
        searchstring += "'" + communities[c] + "'";
        if (c < (communities.length - 1)) { searchstring += ' AND '; }
      }
    }
  } else searchstring += '*';

  if (get_resources === "true") {
    searchstring += ") AND resource: true" + state;
  } else searchstring += ") AND" + state;

  if (clusters && clusters.length > 0 && clusters[0] !== '*') {
    clusters = clusters.splice(',');
    searchstring += ' AND (';

    var clusterstring = '';

    if (clusters.indexOf('all') < 0) clusters.push('all');

    for (i in clusters) {
      clusterstring += "'" + clusters[i] + "'";
      if (i < (clusters.length - 1)) { clusterstring += ' OR '; }
    }

    searchstring += 'profile.industries:(' + clusterstring + ') OR profile.parents:(' + clusterstring + '))'; // scope to industries within the cluster

  }

  if (stages && stages.length > 0 && stages[0] !== '*') {
    stages = stages.splice(',');
    searchstring += ' AND (';

    for (i in stages) {
      searchstring += "profile.stage:'" + stages[i] + "'"; // scope to stage
      if (i < (stages.length - 1)) { searchstring += ' OR '; }
    }
    searchstring += ')';
  }

  if (types && types.length > 0 && types[0] !== '*') {
    types = types.splice(',');
    searchstring += ' AND (';

    for (i in types) {
      searchstring += "resource_types:'" + types[i] + "'"; // scope to stage
      if (i < (types.length - 1)) { searchstring += ' OR '; }
    }
    searchstring += ')';
  }



  if (query) { searchstring += ' AND ' + '(profile.*: ' + query + ')'; }

  console.log('Pulling Companies: ' + searchstring);

  cdb.find({selector: {type: 'company', '$text': searchstring}, skip: Number(offset) || 0, limit: Number(limit) || 16})
    .then(function(result){
      result = formatFindResults(result);

      var i;

      try {
        for (i=0; i < result.docs.length; i++) {

          result.docs[i].value["key"] = result.docs[i].path.key;
        }
      } catch (error) {
        console.warn('WARNING: company144 ', error);
      }

      result.next =
        '/api/2.1/companies?communities[]=' + req.query.communities +
        '&clusters[]=' + (req.query.clusters || '*') +
        '&stages[]=' + (req.query.stages || '*') +
        '&types=' + (req.query.types || '*') +
        '&limit=' + (Number(req.query.limit) || 16) +
        '&offset=' + ((Number(req.query.offset) || 0) + (Number(req.query.limit) || 16)) +
        '&get_resources=' + (req.query.get_resources || false) +
        '&query=' + (req.query.query || '*');

      result.prev =
        '/api/2.1/compaies?communities[]=' + req.query.communities +
        '&clusters[]=' + (req.query.clusters || '*') +
        '&stages[]=' + (req.query.stages || '*') +
        '&types=' + (req.query.types || '*') +
        '&limit=' + (Number(req.query.limit) || 16) +
        '&offset=' + (req.query.offset ? (Number(req.query.offset) - ((Number(req.query.limit) || 16))) : 0) +
        '&get_resources=' + (req.query.get_resources || false) +
        '&query=' + (req.query.query || '*');

      result.results = result.docs;
      delete result.docs;

      res.send(result);

    })
    .catch(function(err){
      console.log('WARNING: ', err);
      res.send({message:err.message});
    });
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
        Key:  'logos/' + company_name + '_' + filename,
        Expires: 60,
        ACL: 'public-read'
    };
    s3.getSignedUrl('putObject', s3_params, function (err, signedUrl) {
        var parsedUrl = url.parse(signedUrl);
        parsedUrl.search = null;
        var objectUrl = url.format(parsedUrl);

        if (!err) {
            res.send({ put: signedUrl, get: objectUrl });
        } else res.status(400).send({ message: "Something went wrong." });

    });
}

function handleAddCompany(req, res) {
    // always use ensureAuth before this (to acquire req.user)
    var addCompany = req.body.params;

    var go = function() {
        // validate user is a member in the location/community
        db.get(process.env.DB_COMMUNITIES, req.user)
            .then(function(response){
                console.log(addCompany);

                var user = response.body,
                    update = false;

                if (!addCompany.location_key) addCompany.location_key = addCompany.community_key;

                if (user.communities.indexOf(addCompany.location_key) < 0) {
                    res.status(202).send({ message: 'You must be a member of this community to add a company.' });
                } else if (!addCompany.community_key || (user.roles && user.roles.leader && user.roles.leader[addCompany.community_key] && user.roles.leader[addCompany.community_key].indexOf(addCompany.location_key) < 0)) {
                    console.warn("No community specified, or user is not a leader in community: " + addCompany.community_key + " for location: " + addCompany.location_key + "!");
                    addCompany.community_key = addCompany.location_key;
                }

                var company = schema.company(addCompany.profile, addCompany.location_key, addCompany.community_key);

                var post = function() {
                    companyPost(company, addCompany.role, addCompany.location_key, req.user, addCompany.key, update, function(result) {
                        res.status(result.status).send(result.data);
                    });
                };

                // add company

                if (!addCompany.key) {
                    addCompany.key = addCompany.profile.url.toLowerCase();
                    post();
                } else if (addCompany.key && (addCompany.key !== addCompany.profile.url)) {
                    res.status(202).send({ message: 'Sorry, a url path cannot be changed.'})
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

            })

            .fail(function(err){
                console.warn("WARNING: ", err);
                res.status(400).send({ message: "Something went wrong. We have been alerted and will take a look and get back to you." });
            });
    };

    if (!addCompany.profile) {
        console.warn("No company specified!");
        res.status(400).send({ message: 'Some information was missing.' });
    } else {
        console.log('Adding company ' + addCompany.profile.name + ' to ' + addCompany.location_key + ' / ' + addCompany.community_key);

        // if no existing key is provided, validate the company.url doesn't already exist
        if (!addCompany.key) {
            db.get(process.env.DB_COMMUNITIES, addCompany.profile.url)
                .then(function() {
                    res.status(400).send({ message: 'That url is already in use. Please specify a different url path.'})
                })
                .fail(function() {
                    // url is good
                    go();
                })

        } else go();

    }
}

function handleDeleteCompany(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var params = req.body.params;

    var delete_it = function() {

        // pull it first to make sure it's a company

        db.get(process.env.DB_COMMUNITIES, params.company_key)
            .then(function(response) {

                if (response.body.type == 'company') {

                    db.remove(process.env.DB_COMMUNITIES, params.company_key, 'true')
                        .then(function () {

                            // company has been deleted, now delete references in user records

                            db.newSearchBuilder()
                                .collection(process.env.DB_COMMUNITIES)
                                .limit(100)
                                .offset(0)
                                .sortRandom()
                                .query('type:"user" AND roles.*.' + params.company_key + ':*')
                                .then(function (flush) {
                                    for (r in flush.body.results) {
                                        var flush_key = flush.body.results[r].path.key,
                                            flush_value = flush.body.results[r].value;
                                        
                                        for (i in flush_value.roles) {
                                            for (c in flush_value.roles[i]) {
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


                                        db.put(process.env.DB_COMMUNITIES, flush_key, flush_value)
                                            .then(function(response) {
                                                console.log('Deleted ' + params.company_key + ' from ' + flush_key);
                                            })
                                        
                                    }
                                    res.status(204).send({message: 'Company deleted!'});
                                })
                                .fail(function (err) {
                                    console.log("WARNING: ", err);
                                    res.status(202).send({message: "The company has been deleted, but something else went wrong."});
                                });
                        })
                        .fail(function (err) {
                            console.warn('WARNING: community620', err);
                            res.status(202).send({message: "Something went wrong."});
                        });
                } else {
                    console.warn('Not a company!');
                    res.status(202).send({message: "This isn't a company!"});
                }
            })
            .fail(function (err) {
                console.warn('No company found!');
                res.status(202).send({message: "No company found!"});
            });

    };

    try {
        console.log('Deleting company: ' + params.company_key);

        // first determine if the company has founders or team members. Pull from DB to prevent tampering.

        db.newSearchBuilder()
            .collection(process.env.DB_COMMUNITIES)
            .limit(100)
            .offset(0)
            .sortRandom()
            .query('type:"user" AND (roles.founder.' + params.company_key + ':* OR roles.team.' + params.company_key + ':*)')
            .then(function (team) {

                if (team.body && (team.body.count == 0)) {

                    // no founders or team members, so it can be deleted by anyone

                    delete_it();

                } else {

                    // need to validate whether the current user is one of the founders or team members

                    var del = false;
                    for (t in team.body.results) {

                        if (team.body.results[t].path.key == req.user) {
                            del = true;
                            delete_it();
                            break;
                        }
                    }

                    if (!del) res.status(202).send({message: "Only a founder or team member of this company may delete it."});
                }
            })
            .fail(function (err) {
                console.log("WARNING: ", err);
                res.status(202).send({message: err});
            });
    }
    catch(err) {
        console.warn("WARNING: ", err);
        res.status(202).send({message: err});
    }
}

var addRole = function(company_key, roles, location_key, user_key) {

    db.get(process.env.DB_COMMUNITIES, user_key)
        .then(function(response){

            if (response.body.code !== "items_not_found") {

                // add new role
                
                for (role in roles) {
                    if (!response.body.roles[roles[role]]) {
                        response.body.roles[roles[role]] = {};
                        response.body.roles[roles[role]][company_key] = [location_key];
                    } else if (!response.body.roles[roles[role]][company_key]) {
                        response.body.roles[roles[role]][company_key] = [location_key];
                    } else if (response.body.roles[roles[role]][company_key].indexOf(location_key) < 0) {
                        response.body.roles[roles[role]][company_key].push(location_key);
                    } // else the damn thing is already there

                    // add community
                    if (!response.body.communities) {
                        response.body["communities"] = {};
                    }

                    if (response.body.communities.indexOf(company_key) < 0) {
                        response.body.communities.push(company_key);
                    }
                }

                db.put(process.env.DB_COMMUNITIES, user_key, response.body)
                    .then(function(result) {
                        console.log('User ' + user_key + ' updated with ', roles);
                    })
                    .fail(function(err){
                        console.warn("WARNING: ", err);
                    });

            } else {
                console.warn('WARNING:  User not found.');
            }
        })

        .fail(function(err){
            console.warn("WARNING: ", err);
        });
};

function handleCheckUrl(req, res) {

    var website = req.body.params.website;

    console.log('Looking for existing company based on website url: ' + website);

    // cleanup url

    website = website.replace(/.*?:\/\//g, "");
    if(website.match(/^www\./)) website = website.substring(4);

    db.search(process.env.DB_COMMUNITIES, '(type = "company" AND (profile.website: "' + website + '" OR profile.website: "www.' + website + '"))')
        .then(function(result) {
            if (result.body.results.length > 0) {
                res.status(202).send({message: result.body.results[0].path.key});
            } else {
                res.status(404).send();                
            }
        });
}

var companyPost = function (company, role, location_key, user, key, update, callback) {

    db.put(process.env.DB_COMMUNITIES, key, company)
        .then(function (response) {

            var companykey = response.headers.location.split('/')[3];

            roles = role ? [role] : [];
            if (company.resource) roles.push('leader');
            
            if (roles.length) {
                addRole(companykey, roles, location_key, user);
            }

            if (update) {

                console.log("UPDATED: " + company.profile.name);
                company["message"] = "Well done! " + company.profile.name + " has been updated.";

            } else {

                // if resource, add creator as leader

                console.log("REGISTERED: " + company.profile.name + " as " + companykey);
                company["message"] = "Well done! You've added " + company.profile.name + " to the community.";

            }

            company["key"] = companykey;
            callback({"status": 200, "data": company});

        })
        .fail(function (err) {
            console.log("WARNING: ", err);
            callback({"status": 500, "data" : {"message": "Something went wrong."}});
        });
    
};

module.exports = CompanyApi;