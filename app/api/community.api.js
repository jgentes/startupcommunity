var path = require('path'),
  { sequelize, cdb, mdb, Op } = require('../../db');

//var util = require('util'); //for util.inspect on request

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function() {
  this.getCommunity = handleGetCommunity;
  this.getNeighbors = handleGetNeighbors;
  this.getResources = handleGetResources;
  this.getTeam = handleGetTeam;
  this.setCommunity = handleSetCommunity;
  this.editCommunity = handleEditCommunity;
  this.deleteCommunity = handleDeleteCommunity;
  this.getId = handleGetId;
  this.getCompanies = handleGetCompanies;
  this.getPeople = handleGetPeople;
  this.convert_state = handleConvert_state;
};

var handleConvert_state = function(name, to) {
  name = name.toUpperCase();
  var states = [
    { 'name': 'Alabama', 'abbrev': 'AL' }, { 'name': 'Alaska', 'abbrev': 'AK' }, {
      'name': 'Arizona',
      'abbrev': 'AZ'
    }, { 'name': 'Arkansas', 'abbrev': 'AR' }, { 'name': 'California', 'abbrev': 'CA' },
    { 'name': 'Colorado', 'abbrev': 'CO' }, { 'name': 'Connecticut', 'abbrev': 'CT' }, {
      'name': 'Delaware',
      'abbrev': 'DE'
    }, { 'name': 'Florida', 'abbrev': 'FL' }, { 'name': 'Georgia', 'abbrev': 'GA' },
    { 'name': 'Hawaii', 'abbrev': 'HI' }, { 'name': 'Idaho', 'abbrev': 'ID' }, {
      'name': 'Illinois',
      'abbrev': 'IL'
    }, { 'name': 'Indiana', 'abbrev': 'IN' }, { 'name': 'Iowa', 'abbrev': 'IA' },
    { 'name': 'Kansas', 'abbrev': 'KS' }, { 'name': 'Kentucky', 'abbrev': 'KY' }, {
      'name': 'Louisiana',
      'abbrev': 'LA'
    }, { 'name': 'Maine', 'abbrev': 'ME' }, { 'name': 'Maryland', 'abbrev': 'MD' },
    { 'name': 'Massachusetts', 'abbrev': 'MA' }, { 'name': 'Michigan', 'abbrev': 'MI' }, {
      'name': 'Minnesota',
      'abbrev': 'MN'
    }, { 'name': 'Mississippi', 'abbrev': 'MS' }, { 'name': 'Missouri', 'abbrev': 'MO' },
    { 'name': 'Montana', 'abbrev': 'MT' }, { 'name': 'Nebraska', 'abbrev': 'NE' }, {
      'name': 'Nevada',
      'abbrev': 'NV'
    }, { 'name': 'New Hampshire', 'abbrev': 'NH' }, { 'name': 'New Jersey', 'abbrev': 'NJ' },
    { 'name': 'New Mexico', 'abbrev': 'NM' }, { 'name': 'New York', 'abbrev': 'NY' }, {
      'name': 'North Carolina',
      'abbrev': 'NC'
    }, { 'name': 'North Dakota', 'abbrev': 'ND' }, { 'name': 'Ohio', 'abbrev': 'OH' },
    { 'name': 'Oklahoma', 'abbrev': 'OK' }, { 'name': 'Oregon', 'abbrev': 'OR' }, {
      'name': 'Pennsylvania',
      'abbrev': 'PA'
    }, { 'name': 'Rhode Island', 'abbrev': 'RI' }, { 'name': 'South Carolina', 'abbrev': 'SC' },
    { 'name': 'South Dakota', 'abbrev': 'SD' }, { 'name': 'Tennessee', 'abbrev': 'TN' }, {
      'name': 'Texas',
      'abbrev': 'TX'
    }, { 'name': 'Utah', 'abbrev': 'UT' }, { 'name': 'Vermont', 'abbrev': 'VT' },
    { 'name': 'Virginia', 'abbrev': 'VA' }, { 'name': 'Washington', 'abbrev': 'WA' }, {
      'name': 'West Virginia',
      'abbrev': 'WV'
    }, { 'name': 'Wisconsin', 'abbrev': 'WI' }, { 'name': 'Wyoming', 'abbrev': 'WY' }
  ];
  var returnthis = false;
  for (var i = 0; i < states.length; i++) {
    if (to == 'name') {
      if (states[i].abbrev == name) {
        returnthis = states[i].name;
        break;
      }
    }
    else if (to == 'abbrev') {
      if (states[i].name.toUpperCase() == name) {
        returnthis = states[i].abbrev;
        break;
      }
    }
  }
  return returnthis;
};


var schema = {
  community: function(community, location_key) {

    var community_profiles = {};
    community_profiles[location_key] = {
      "parents": community.parents,
      "name": community.name,
      "icon": "fa-circle-o",
      "headline": community.headline,
      "industries": community.industries,
      "embed": community.embed || []
    };

    return {
      "type": community.type,
      "name": community.name,
      "icon": "fa-circle-o",
      "headline": community.headline,
      "communities": [location_key],
      "community_profiles": community_profiles
    };
  }
};

var buildSearch = (community_key, location_key) => {
  if (!location_key) return '';
  if (!community_key || community_key == 'undefined') community_key = location_key;

  // determine whether location is a state
  var state_suffix = handleConvert_state(location_key.replace('-', ' '), 'abbrev'); // returns false if no match
  var state = state_suffix ? '%-' + state_suffix.toLowerCase() : ')';

  // add search based on home suffix (which allows for roll-up to state level)
  var search = state_suffix ? {
    [Op.or]: [
      { home: location_key },
      {
        home: {
          [Op.like]: state
        }
      }
    ]
  } : {
    communities: {
      [Op.or]: [{
        [Op.like]: '%"' + location_key + '"%'
      }]
    }
  };

  if (community_key != '*' && !state_suffix && community_key != location_key) search.communities[Op.or].push({
    [Op.like]: '%"' + community_key + '"%'
  });

  return search;
}

var buildClusterSearch = (cluster_key, industry_keys = []) => {
  if (!cluster_key) return null;
  var cluster_search = [];
  
  if (!Array.isArray(industry_keys)) industry_keys = [industry_keys];
  if (industry_keys.length && industry_keys.indexOf('all') < 0) industry_keys.push('all');

  if (industry_keys.length) {
    industry_keys.forEach(i => {
      cluster_search.push({
        [Op.like]: '%"' + i + '"%'
      });
    });
  }
  else cluster_search.push({
    [Op.like]: '%"' + cluster_key + '"%'
  });

  return cluster_search;
}

var addkeys = function(data) {
  for (var i in data) {
    // delete sensitive data
    if (data[i].password) delete data[i].password;
    if (data[i].email) delete data[i].email;
    if (data[i].newsletter) delete data[i].newsletter;
    if (data[i].linkedin) {
      if (data[i].linkedin.emailAddress) delete data[i].linkedin.emailAddress;
      if (data[i].linkedin.access_token) delete data[i].linkedin.access_token;
    }
  }
  return data;
};

async function handleGetCommunity(req, res) {
  let param = req.params.community || req.query.community;
  if (!param) return res.status(404).send({ message: 'Please specify a community!' });
  
  if (!Array.isArray(param)) param = [param];
  
  param.forEach(p => p.replace(/\s+/g, '-')); // replace spaces with dashes if needed

  console.log('Pulling community for ' + param);

  const community = await cdb.findAll({
      where: {
        "slug": {
          [Op.in]: param
        }
      }
    })
    .catch(err => console.warn("WARNING: ", err));

  if (!community.length) {
    console.log('INFO: Community not found!');
    return res.status(404).send({ message: 'Community not found.' });
  }

  return res.status(200).send(community);
}

async function handleGetNeighbors(req, res) {
  console.log('handleGetNeighbors PARAMS: ', req.params);

  let param = req.params.community;
  if (!param) return res.status(404).send({ message: 'Please specify a community!' });

  param = param.replace(/\s+/g, '-');

  console.log('Pulling neighbors for ' + param);

  const community = await cdb.findAll({
      where: {
        [Op.and]: [{
          [Op.not]: {
            [Op.or]: [
              { type: 'user' },
              { type: 'company' },
              { slug: param }
            ]
          }
        }, {
          [Op.or]: [{
              communities: {
                [Op.like]: '%"' + param + '"%'
              }
            },
            {
              parents: {
                [Op.like]: '%"' + param + '"%'
              }
            },
          ]
        }]
      }
    })
    .catch(err => console.warn("WARNING: ", err));

  if (!community.length) console.log('INFO: No neighbors found!');

  return res.status(200).send(community);
}

async function handleGetTeam(req, res) {
  console.log('handleGetTeam PARAMS: ', req.params);

  let param = req.params.community;
  if (!param) return res.status(404).send({ message: 'Please specify a community!' });

  param = param.replace(/\s+/g, '-');

  console.log('Pulling team for ' + param);

  sequelize
    .query(
      'SELECT * FROM communities WHERE JSON_CONTAINS(roles->>\'$.*.' + param + '\', \'[' + param + ']\')', { model: cdb }
    ).then(team => {
      if (!team.length) {
        console.log('INFO: No team found!');
        return res.status(404).send({ message: 'No team found.' });
      }

      return res.status(200).send(addkeys(team));

    }).catch(err => console.warn("WARNING: ", err));
}

function handleGetResources(req, res) {

  var location_key = req.body.location_key,
    resources = req.body.resources,
    clusters = req.body.clusters,
    searchstring;

  var selector = {};

  if (resources && resources.length) {
    selector.id = {
      [Op.in]: resources
    };
  }
  else selector.communities = {
    [Op.like]: '%"' + location_key + '"%'
  };

  if (clusters) {
    selector[Op.or] = [{
        resource: {
          [Op.not]: false
        }
      },
      { type: "cluster" }
    ];
  }
  else selector.resource = true;

  if (!searchstring) return res.status(404).send({ message: 'Please specify a location!' });

  console.log(searchstring);

  cdb.findAll({ where: selector }).then(result => {
    if (result.length) {

      var newresponse = {};

      result.forEach(r => {
        newresponse[r.id] = r;
      });

      return res.status(200).send(newresponse);

    }
    else {
      console.log('INFO: No Resources found!');
      return res.status(404).send({ message: 'No resources found!' });
    }
  }).catch(err => console.warn("WARNING: ", err));

}

function getMore(selector, bookmark, callback) {
  //todo this is likely broken because bookmark may not be a thing?
  return cdb.findAll({
    where: {
      selector: selector,
      limit: 1000,
      bookmark: bookmark
    },
    raw: true
  }).then(results => callback).catch(err => console.warn("WARNING: ", err));
}

function handleGetCompanies(req, res) {
  console.log('PARAMS: ', req.params, 'QUERY: ', req.query);

  const search = buildSearch(req.params.community_key, req.params.location_key);
  const cluster_search = buildClusterSearch(req.query.cluster_key, req.query.industry_keys);
  const resources = req.query.resources;
  //if (req.query.cluster_key) community_key = '*'; // may need this
  //if (req.params.location_key == req.query.cluster_key) search = '';

  //var industrysearch = cluster_search ? '(profile.parents:(' + cluster_search + ') OR profile.industries:(' + cluster_search + ')) AND ' + search : search;

  // get companies & industries

  var selector = {
    [Op.and]: [
      { type: "company" },
      {
        resource: {
          [Op.not]: !resources
        }
      }
    ]
  };

  if (cluster_search && cluster_search.length) {
    selector[Op.or] = [{
        parents: {
          [Op.or]: cluster_search
        }
      },
      {
        industries: {
          [Op.or]: cluster_search
        }
      }
    ];
    if (search) selector[Op.and].push(search);
  }
  else selector[Op.and].push(search);

  console.log('Pulling ' + resources ? 'Resources' : 'Companies: ', selector);

  cdb.findAll({
    where: selector
  }).then(result => {
    if (!result.length) return res.status(404).send({ message: 'Nothing found!' });
    return res.status(200).send(addkeys(result));
  }).catch(err => console.warn("WARNING: ", err));
}

function handleGetPeople(req, res) {
  console.log('PARAMS: ', req.params, 'QUERY: ', req.query);

  const search = buildSearch(req.params.community_key, req.params.location_key);
  const cluster_search = buildClusterSearch(req.query.cluster_key, req.query.industry_keys);

  //if (req.query.cluster_key) community_key = '*'; // may need this
  //if (req.params.location_key == req.query.cluster_key) search = '';

  //var industrysearch = cluster_search ? '(profile.parents:(' + cluster_search + ') OR profile.industries:(' + cluster_search + ')) AND ' + search : search;

  var selector = {
    [Op.and]: [
      { type: "user" }
    ]
  };

  if (cluster_search && cluster_search.length) {
    selector[Op.or] = [{
        parents: {
          [Op.or]: cluster_search
        }
      },
      {
        skills: {
          [Op.or]: cluster_search
        }
      }
    ];
  }

  if (search) selector[Op.and].push(search);

  console.log('Pulling People: ', selector);

  cdb.findAll({
    where: selector,
    limit: 1000
  }).then(result => {
    if (!result.length) return res.status(404).send({ message: 'Nothing found!' });
    return res.status(200).send(addkeys(result));
  }).catch(err => console.warn("WARNING: ", err));
}

function handleSetCommunity(req, res) {

  // always use ensureAuth before this (to acquire req.user)

  var settings = req.body.params;

  console.log('Updating settings for ' + settings.location_key + ' / ' + settings.community_key);

  cdb.findById(req.user, { raw: true }).then(response => {
    if (response) {
      var user = response;

      // validate user has leader role within the location/community

      if (user.roles && user.roles.leader && user.roles.leader[settings.community_key] && user.roles.leader[settings.community_key].indexOf(settings.location_key) > -1) {

        // update the community

        cdb.findOne({ where: { slug: settings.community_key }, raw: true }).then(response => {
          if (response) {
            if (response.type !== 'location') { // use community_profiles
              if (response.community_profiles === undefined) { // create community_profiles
                response.community_profiles = {};
              }
              if (response.community_profiles[settings.location_key] === undefined) { // create this location
                response.community_profiles[settings.location_key] = {
                  "name": response.name,
                  "icon": response.icon,
                  "logo": response.logo,
                  "embed": settings.embed
                };
              }
              else {
                response.community_profiles[settings.location_key]["embed"] = settings.embed;
              }
            }
            else response.embed = settings.embed;

            cdb.update(response, { where: { slug: settings.community_key } }).then(finalres => {
              if (finalres) {
                return res.status(201).send({ message: 'Community settings updated.' });
              }
              else {
                console.warn('WARNING: community466 ');
                return res.status(202).send({ message: "Something went wrong." });
              }
            });
          }
          else {
            console.warn('WARNING: community472 ');
            return res.status(202).send({ message: "Something went wrong." });
          }
        });
      }
      else {
        console.warn("User is not a leader in location: " + settings.location_key + " and community: " + settings.community_key + "!");
        return res.status(202).send({ message: 'Sorry, you must be a Leader in this community to change these settings.' });
      }
    }
    else {
      console.warn("WARNING: community493");
    }
  }).catch(err => console.warn("WARNING: ", err))
}

function handleEditCommunity(req, res) {

  // always use ensureAuth before this (to acquire req.user)

  var settings = req.body.params;

  console.log('Editing community: ' + settings.community.name + ' in ' + settings.location_key);

  cdb.findById(req.user, { raw: true }).then(response => {
    if (response) {
      var user = response,
        leader = false;

      // validate user is a member in the location
      if (user.communities.indexOf(settings.location_key) > -1) {

        var pathname = settings.community.url || settings.community.name.toLowerCase().replace(/\s+/g, '-');

        // check to see if user is a leader of the community

        if (user.roles && user.roles.leader && user.roles.leader[pathname] && user.roles.leader[pathname].indexOf(settings.location_key) > -1) {
          leader = true;
          console.log('confirmed leader');
        }

        // check to see if the community exists

        cdb.findOne({ where: { slug: pathname }, raw: true }).then(response => {
          if (response) {
            // go to .catch if community doesn't exist (on .get rather than .search)
            // if community already exists and it's the same type as what's being created, we're good to add the community profile here

            if (response.type && (response.type == "cluster" || response.resource) && response.type == settings.community.type) {

              // create community_profiles (leadership not required if this is a new community)

              if (!response.community_profiles) response.community_profiles = {};

              if (!response.community_profiles[settings.location_key]) {

                // create this location
                console.log('creating location profile');

                response.community_profiles[settings.location_key] = {
                  "name": settings.community.name,
                  "headline": settings.community.headline,
                  "icon": response.icon,
                  "parents": settings.community.parents,
                  "industries": settings.community.industries,
                  "embed": settings.community.embed || []
                };

                // add community

                if (!response.communities) {
                  response["communities"] = [];
                }

                if (response.communities.indexOf(settings.location_key) < 0) {
                  response.communities.push(settings.location_key);
                }

                cdb.update(response, { where: { slug: pathname } }).then(finalres => {
                  if (finalres) {
                    update_user(req.user, 'leader', pathname, settings.location_key, function(good) {
                      if (good) {
                        return res.status(201).send({ message: 'Industry cluster created!' });
                      }
                      else {
                        return res.status(202).send({ message: "Something went wrong." });
                      }
                    })
                  }
                  else {
                    console.warn('WARNING: community533 ');
                    return res.status(202).send({ message: "Something went wrong." });
                  }
                })

              }
              else {

                if (leader) {

                  response.community_profiles[settings.location_key] = {
                    "name": settings.community.name,
                    "headline": settings.community.headline,
                    "icon": response.icon,
                    "parents": settings.community.parents,
                    "industries": settings.community.industries,
                    "embed": settings.community.embed || []
                  };

                  // add community

                  if (!response.communities) response.communities = {};

                  if (response.communities.indexOf(settings.location_key) < 0) {
                    response.communities.push(settings.location_key);
                  }

                  response.slug = pathname;

                  cdb.create(response).then(finalres => {
                    if (finalres) {
                      return res.status(201).send({ message: 'Successfully updated!' });
                    }
                    else {
                      console.warn('WARNING: ');
                      return res.status(202).send({ message: "Something went wrong." });
                    }
                  })

                }
                else return res.status(202).send({ message: settings.community.name + ' already exists in this location. Please change the name or delete the other one first.' });
              }

            }
            else {
              return res.status(202).send({ message: 'That name is taken. Try changing the name.' });
            }
          }
          else {
            // no existing path, go ahead and create

            var profile = schema.community(settings.community, settings.location_key);

            profile.slug = pathname;

            cdb.create(profile).then(finalres => {
              if (finalres) {
                update_user(req.user, 'leader', pathname, settings.location_key, function(good) {
                  if (good) {
                    return res.status(201).send({ message: 'Industry cluster created!' });
                  }
                  else return res.status(202).send({ message: "Something went wrong." });

                })
              }
              else {
                console.warn('WARNING: community565 ');
                return res.status(202).send({ message: "Something went wrong." });
              }
            })
          }
        })

      }
      else {
        console.warn("User is not a member of community: " + settings.community.slug + " and location: " + settings.location_key + "!");
        return res.status(202).send({ message: 'You must be a member of this community to add to it.' });
      }
    }
    else {
      console.warn("WARNING: community611");
    }
  }).catch(err => console.warn("WARNING: ", err))
}

function handleDeleteCommunity(req, res) {

  // always use ensureAuth before this (to acquire req.user)
  var settings = req.body.params;

  console.log('Deleting community: ' + settings.community.name + ' in ' + settings.location_key);

  cdb.findById(req.user, { raw: true }).then(response => {
    if (response) {
      var user = response;

      // validate user is a leader of the community in this location

      if (user.roles && user.roles.leader && user.roles.leader[settings.community.slug].indexOf(settings.location_key) > -1) {

        // get the community

        cdb.findOne({ where: { slug: settings.community.slug }, raw: true }).then(response => {
          if (response) {
            // remove the location profile

            if (response.type && (response.type == "cluster" || response.resource) && response.type == settings.community.type) {

              // community already exists, we're good to remove the community profile here

              if (response.community_profiles !== undefined && response.community_profiles[settings.location_key]) {
                delete response.community_profiles[settings.location_key];
              }

              // remove from community
              if (response.communities.indexOf(settings.location_key) > -1) {
                var index = response.communities.indexOf(settings.location_key);
                response.communities.splice(index, 1);
              }

              var wrapup = function() {
                if (settings.new_community_key) {

                  // this is a rename operation

                  rename_community(settings.community.slug, settings.location_key, settings.new_community_key);

                }
                else {

                  update_user(req.user, 'delete', settings.community.slug, settings.location_key, function(good) {
                    if (good) {
                      console.log('Community deleted.');
                      return res.status(204).send({ message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!' });
                    }
                    else {
                      return res.status(202).send({ message: "Something went wrong." });
                    }
                  })
                }
              };

              if (response.communities.length == 0) {

                // delete the whole thing

                cdb.destroy({ where: { id: settings.community.slug } }).then(finalres => {
                  if (finalres) {
                    wrapup();
                  }
                  else {
                    console.warn('WARNING: community620');
                    return res.status(202).send({ message: "Something went wrong." });
                  }
                })

              }
              else {

                response.slug = settings.community.slug;

                cdb.create(response).then(finalres => {
                  if (finalres) {
                    wrapup();
                  }
                  else {
                    console.warn('WARNING: community629 ');
                    return res.status(202).send({ message: "Something went wrong." });
                  }
                })
              }

            }
            else {
              console.log('WARNING: Cannot delete community');
              return res.status(202).send({ message: "You can't delete " + settings.community.name + " for some reason, but we've been notified and will look into it." });
            }
          }
          else {
            console.warn('WARNING: community644');
            return res.status(202).send({ message: "Something went wrong." });
          }
        })

      }
      else {
        console.warn("User is not a member of community: " + settings.community.slug + " and location: " + settings.location_key + "!");
        return res.status(202).send({ message: 'You must be a leader of this community to delete it.' });
      }
    }
    else {
      console.warn("WARNING: community699");
    }
  }).catch(err => console.warn("WARNING: ", err))
}

var update_user = function(user_key, role, community_key, location_key, callback) {

  cdb.findById(user_key, { raw: true }).then(response => {
    if (response) {
      // add role

      if (!response.roles) response.roles = {};

      if (role == 'delete') {

        try {
          if (response.roles.leader[community_key].indexOf(location_key) > -1) {
            response.roles.leader[community_key].splice(response.roles.leader[community_key].indexOf(location_key), 1);
          }
          if (response.roles.leader[community_key].length == 0) {
            delete response.roles.leader[community_key]
          }
          if (response.communities.indexOf(community_key) > -1) {
            response.communities.splice(response.communities.indexOf(community_key), 1);
          }
        }
        catch (e) {}

      }
      else {

        if (!response.roles[role]) {
          response.roles[role] = {};
          response.roles[role][community_key] = [location_key];
        }
        else if (!response.roles[role][community_key]) {
          response.roles[role][community_key] = [location_key];
        }
        else if (response.roles[role][community_key].indexOf(location_key) < 0) {
          response.roles[role][community_key].push(location_key);
        } // else the damn thing is already there

        // add community

        if (!response.communities) response.communities = [];

        if (response.communities.indexOf(community_key) < 0) {
          response.communities.push(community_key);
        }
      }

      response.slug = user_key;

      cdb.create(response).then(result => {
        if (result) {
          console.log('User ' + user_key + ' updated with community role.');
          callback(true);
        }
        else {
          console.warn("WARNING: community706");
          callback(false);
        }
      });
    }
    else {
      console.warn("WARNING: community715");
      callback(false);
    }
  }).catch(err => console.warn("WARNING: ", err));
};

var rename_community = function(old_community_key, location_key, new_community_key) {
  var startKey = 0;
  /*
   console.log('Renaming ' + old_community_key + ' to ' + new_community_key);

   var getUsers = function (startKey) {

   db.newSearchBuilder()
   .collection(process.env.DB_COMMUNITIES)
   .limit(50)
   .offset(startKey)
   .query('communities: "' + old_community_key + '" OR roles.*.' + old_community_key + ': "' + location_key + '" OR invite_communities: "' + old_community_key + '"')
   .then(function (data) {
   var item;

   for (item in data.body.results) {
   var key = data.body.results[item].id,
   newdata = data.body.results[item].doc.value; // get current record

   if (newdata.type == "invite") {

   // Rename community
   if (newdata.invite_communities.indexOf(old_community_key) > -1) {

   // only add the new community if the old one existed

   if (newdata.invite_communities.indexOf(new_community_key) < 0) newdata.invite_communities.push(new_community_key);

   newdata.invite_communities.splice(newdata.invite_communities.indexOf(old_community_key), 1);
   }

   } else {

   // Rename community
   if (newdata.communities.indexOf(old_community_key) > -1) {

   // only add the new community if the old one existed

   if (newdata.communities.indexOf(new_community_key) < 0) newdata.communities.push(new_community_key);

   newdata.communities.splice(newdata.communities.indexOf(old_community_key), 1);
   }

   for (role in newdata.roles) {
   for (community in newdata.roles[role]) {
   if (community == old_community_key) {
   if (!newdata.roles[role][new_community_key]) newdata.roles[role][new_community_key] = [];
   if (newdata.roles[role][new_community_key].indexOf(location_key) < 0) newdata.roles[role][new_community_key].push(location_key);
   delete newdata.roles[role][old_community_key];
   }
   }
   }

   }

   db.put(process.env.DB_COMMUNITIES, key, newdata)
   .then(function (result) {
   console.log('User ' + result.id + ' updated with new community data.');
   })
   .catch(function (err) {
   console.warn("WARNING: community706", err);
   });

   }

   if (data.body.next) {
   startKey = startKey + limit;
   console.log('Getting next group..' + startKey);
   getUsers(startKey);
   } else {
   console.log('Community renamed.')
   }
   })
   .catch(function (err) {
   console.warn("WARNING: community715", err);
   });
   };

   getUsers(startKey);*/

};

function handleGetId(req, res) {
  console.log('Pulling id: ' + req.params.id);

  function pullId() {
    cdb.findById(req.params.id, { raw: true }).then(result => {
      if (result) {
        return res.status(200).send(result);
      }
      else {
        console.warn('WARNING: Id not found!');
        return res.status(202).send({ message: 'Id not found.' });
      }
    }).catch(err => console.warn("WARNING: ", err));
  }

  pullId();
}

module.exports = CommunityApi;
