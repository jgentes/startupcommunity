var path = require('path'),
  _ = require('lodash'),
  { sequelize, cdb, mdb, Op } = require('../db');

//var util = require('util'); //for util.inspect on request

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function() {
  this.getIndustries = handleGetIndustries;
  this.getCommunity = handleGetCommunity;
  this.getNeighbors = handleGetNeighbors;
  this.getResources = handleGetResources;
  this.getTeam = handleGetTeam;
  this.setCommunity = handleSetCommunity;
  this.setCommunityStats = handleSetCommunityStats;
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
  community: function(community, location_id) {

    var community_profiles = {};
    community_profiles[location_id] = {
      "parents": community.parents,
      "name": community.name,
      "home": community.home,
      "icon": "fa-circle-o",
      "headline": community.headline,
      "industries": community.industries,
      "embed": community.embed || []
    };

    return {
      "type": community.type,
      "name": community.name,
      "home": community.home,
      "icon": "fa-circle-o",
      "headline": community.headline,
      "communities": [location_id],
      "community_profiles": community_profiles
    };
  }
};

var buildSearch = (community_id, location_id) => {
  if (!location_id) return '';
  if (!community_id || community_id == 'undefined') community_id = location_id;

  // determine whether location is a state
  var state_suffix = handleConvert_state(location_id.replace('-', ' '), 'abbrev'); // returns false if no match
  var state = state_suffix ? '%-' + state_suffix.toLowerCase() : ')';

  // add search based on home suffix (which allows for roll-up to state level)
  var search = state_suffix ? {
    [Op.or]: [
      { home: location_id },
      {
        home: {
          [Op.like]: state
        }
      }
    ]
  } : {
    communities: {
      [Op.or]: [{
        [Op.like]: '%"' + location_id + '"%'
      }]
    }
  };

  if (community_id != '*' && !state_suffix && community_id != location_id) search.communities[Op.or].push({
    [Op.like]: '%"' + community_id + '"%'
  });

  return search;
}

var buildClusterSearch = (cluster_id, industry_ids = []) => {
  if (!cluster_id) return null;
  var cluster_search = [];

  if (!Array.isArray(industry_ids)) industry_ids = [industry_ids];
  if (industry_ids.length && industry_ids.indexOf('all') < 0) industry_ids.push('all');

  if (industry_ids.length) {
    industry_ids.forEach(i => {
      cluster_search.push({
        [Op.like]: '%"' + i + '"%'
      });
    });
  }
  else cluster_search.push({
    [Op.like]: '%"' + cluster_id + '"%'
  });

  return cluster_search;
}

var addkeys = function(data) {
  var entries = [];
  for (var i in data) {
    var entry = data[i].toJSON();
    // delete sensitive data
    if (entry.password) delete entry.password;
    if (entry.email) delete entry.email;
    if (entry.newsletter) delete entry.newsletter;
    if (entry.linkedin) {
      if (entry.linkedin.emailAddress) delete entry.linkedin.emailAddress;
      if (entry.linkedin.access_token) delete entry.linkedin.access_token;
    }
    entries.push(entry);
  }
  return entries;
};

var sortcounts = function(counts, newArray) {
  var sorted = _.fromPairs(_.sortBy(_.toPairs(counts), function(a) {
    return a[1];
  }).reverse());
  if (newArray) {
    var countArray = [];
    for (var s in sorted) {
      countArray.push({ label: s, count: sorted[s] });
    }
    return countArray;
  }
  else return sorted;
};

async function handleGetIndustries(req, res) {
  // this is used for left-hand nav industry population
  let location_id = req.query.location;
  let community_id = req.query.community;
  if (!location_id) return res.status(404).send({ message: 'Please specify a location!' });

  console.log('Pulling industries for ' + location_id);

  let companies = await cdb.findAll({
      attributes: ['parents'],
      where: {
        [Op.and]: [{
          type: 'company',
          communities: {
            [Op.like]: '%"' + location_id + '"%'
          }
        }]
      }
    })
    .catch(err => console.warn("WARNING: ", err));

  // create array of items
  let top = [];
  companies.forEach(r => {
    const items = Array.isArray(r.parents) ? r.parents : JSON.parse(r.parents);
    if (items) items.forEach(i => { if (i != 'all') top = top.concat(i) });
  });

  top = _.countBy(top);

  var sortedTop = sortcounts(top, true);

  return res.status(200).send(sortedTop);

}

async function handleGetCommunity(req, res) {
  let param = req.params.community || req.query.community;
  if (!param && res) return res.status(404).send({ message: 'Please specify a community!' });

  if (!Array.isArray(param)) param = [param];

  param.forEach(p => p.replace(/\s+/g, '-')); // replace spaces with dashes if needed

  console.log('Pulling community for ' + param);

  const fetchCommunities = comm => cdb.findAll({
      where: {
        id: {
          [Op.in]: comm
        }
      }
    })
    .catch(err => console.warn("WARNING: ", err));

  let community = await fetchCommunities(param);

  if (community.length == 1) {
    community = community[0].toJSON();
    if (community.communities && community.communities.length) {
      // todo this could be replaced with a sequelize 'include' above
      const communities = await fetchCommunities(community.communities);
      if (communities) {
        community.relatives = {};
        communities.forEach(c => community.relatives[c.id] = c);
      }
    }
    community = [community];
  }

  if (!res) return community;
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
              { id: param }
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

  let comm = req.params.community;
  let loc = req.query.location;
  if (!comm || !loc) return res.status(404).send([]);

  comm = comm.replace(/\s+/g, '-');

  console.log('Pulling team for ' + comm + ' in ' + loc);

  sequelize
    .query(
      'SELECT * FROM communities WHERE JSON_CONTAINS(roles->>\'$.*."' + comm + '"\', \'["' + loc + '"]\')', { model: cdb }
    ).then(team => res.status(200).send(addkeys(team))).catch(err => console.warn("WARNING: ", err));
}

async function handleGetResources(req, res) {

  var location_id = req.body.location_id,
    resources = req.body.resources,
    clusters = req.body.clusters;

  var selector = {};

  if (resources && resources.length) {
    selector.id = {
      [Op.in]: resources
    };
  }
  else selector.communities = {
    [Op.like]: '%"' + location_id + '"%'
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

  cdb.findAll({
    where: selector,
    order: sequelize.random()
  }).then(result => {
    var newresponse = {};
    if (result) {
      result.forEach(r => {
        newresponse[r.id] = r;
      });
    }

    return res.status(200).send(newresponse);
  }).catch(err => console.warn("WARNING: ", err));

}

function getMore(selector, bookmark, callback) {
  //todo this is likely broken because bookmark may not be a thing?
  return cdb.findAll({
    where: {
      selector: selector,
      limit: 1000,
      bookmark: bookmark
    }
  }).then(results => callback).catch(err => console.warn("WARNING: ", err));
}

async function handleGetCompanies(req, res) {
  const search = buildSearch(req.params.community_id, req.params.location_id);
  const cluster_id = req.query.cluster_id || req.params.cluster_id;
  const industry_ids = req.query.industry_ids || req.params.industry_ids;
  const cluster_search = buildClusterSearch(cluster_id, industry_ids);
  const resources = req.query.resources || req.params.resources;
  //if (req.query.cluster_id) community_id = '*'; // may need this
  //if (req.params.location_id == req.query.cluster_id) search = '';

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

  try {
    var result = await cdb.findAll({
        where: selector,
        order: sequelize.random()
      })
      .then(result => {
        if (!res) return addkeys(result);
        return res.status(200).send(addkeys(result));
      })
      .catch(err => console.warn("WARNING: ", err));
  }
  catch (e) {
    console.log('WARNING: CAUGHT SELECTOR: ', selector);
  }
}

async function handleGetPeople(req, res) {
  console.log('PARAMS: ', req.params, 'QUERY: ', req.query);

  const search = buildSearch(req.params.community_id, req.params.location_id);
  const cluster_id = req.query.cluster_id || req.params.cluster_id;
  const industry_ids = req.query.industry_ids || req.params.industry_ids;
  const cluster_search = buildClusterSearch(cluster_id, industry_ids);

  //if (req.query.cluster_id) community_id = '*'; // may need this
  //if (req.params.location_id == req.query.cluster_id) search = '';

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

  const result = await cdb.findAll({
    where: selector,
    limit: 1000,
    order: sequelize.random()
  }).catch(err => console.warn("WARNING: ", err));

  if (!res) return addkeys(result);
  return res.status(200).send(addkeys(result));
}

function handleSetCommunity(req, res) {

  // always use ensureAuth before this (to acquire req.user)

  var settings = req.body.params;

  console.log('Updating settings for ' + settings.location_id + ' / ' + settings.community_id);

  cdb.findById(req.user).then(response => {
    if (response) {
      var user = response.toJSON();

      // validate user has leader role within the location/community

      if (user.roles && user.roles.leader && user.roles.leader[settings.community_id] && user.roles.leader[settings.community_id].indexOf(settings.location_id) > -1) {

        // update the community

        cdb.findById(settings.community_id).then(response => {
          if (response) {
            response = response.toJSON();
            if (response.type !== 'location') { // use community_profiles
              if (response.community_profiles === undefined) { // create community_profiles
                response.community_profiles = {};
              }
              if (response.community_profiles[settings.location_id] === undefined) { // create this location
                response.community_profiles[settings.location_id] = {
                  "name": response.name,
                  "icon": response.icon,
                  "logo": response.logo,
                  "embed": settings.embed
                };
              }
              else {
                response.community_profiles[settings.location_id]["embed"] = settings.embed;
              }
            }
            else response.embed = settings.embed;

            cdb.update(response, { where: { id: settings.community_id } }).then(finalres => {
              if (finalres) {
                return res.status(201).send({ message: 'Community settings updated.' });
              }
              else {
                console.warn('WARNING: community466 ');
                return res.status(202).send({ message: "Something went wrong." });
              }
            }).catch(err => {
              if (err.code == 'ER_EMPTY_QUERY') console.log('No changes to update..');
            });
          }
          else {
            console.warn('WARNING: community472 ');
            return res.status(202).send({ message: "Something went wrong." });
          }
        });
      }
      else {
        console.warn("User is not a leader in location: " + settings.location_id + " and community: " + settings.community_id + "!");
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

  console.log('Editing community: ' + settings.community.name + ' in ' + settings.location_id);

  cdb.findById(req.user).then(response => {
    if (response) {
      var user = response.toJSON(),
        leader = false;

      // validate user is a member in the location
      if (user.communities.indexOf(settings.location_id) > -1) {

        var pathname = settings.community.url || settings.community.name.toLowerCase().replace(/\s+/g, '-');

        // check to see if user is a leader of the community

        if (user.roles && user.roles.leader && user.roles.leader[pathname] && user.roles.leader[pathname].indexOf(settings.location_id) > -1) {
          leader = true;
          console.log('confirmed leader');
        }

        // check to see if the community exists

        cdb.findById(pathname).then(response => {
          if (response) {
            response = response.toJSON();
            // go to .catch if community doesn't exist (on .get rather than .search)
            // if community already exists and it's the same type as what's being created, we're good to add the community profile here

            if (response.type && (response.type == "cluster" || response.resource) && response.type == settings.community.type) {

              // create community_profiles (leadership not required if this is a new community)

              if (!response.community_profiles) response.community_profiles = {};

              if (!response.community_profiles[settings.location_id]) {

                // create this location
                console.log('creating location profile');

                response.community_profiles[settings.location_id] = {
                  "name": settings.community.name,
                  "headline": settings.community.headline,
                  "home": settings.community.home,
                  "icon": response.icon,
                  "parents": settings.community.parents,
                  "industries": settings.community.industries,
                  "embed": settings.community.embed || []
                };

                // add community

                if (!response.communities) {
                  response["communities"] = [];
                }

                if (response.communities.indexOf(settings.location_id) < 0) {
                  response.communities.push(settings.location_id);
                }

                cdb.update(response, { where: { id: pathname } }).then(finalres => {
                  if (finalres) {
                    update_user(req.user, 'leader', pathname, settings.location_id, function(good) {
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
                }).catch(err => {
                  if (err.code == 'ER_EMPTY_QUERY') console.log('No changes to update..');
                });

              }
              else {

                if (leader) {

                  response.community_profiles[settings.location_id] = {
                    "name": settings.community.name,
                    "headline": settings.community.headline,
                    "icon": response.icon,
                    "parents": settings.community.parents,
                    "industries": settings.community.industries,
                    "embed": settings.community.embed || []
                  };

                  // add community

                  if (!response.communities) response.communities = {};

                  if (response.communities.indexOf(settings.location_id) < 0) {
                    response.communities.push(settings.location_id);
                  }

                  response.id = pathname;

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

            var profile = schema.community(settings.community, settings.location_id);

            profile.id = pathname;

            cdb.create(profile).then(finalres => {
              if (finalres) {
                update_user(req.user, 'leader', pathname, settings.location_id, function(good) {
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
        console.warn("User is not a member of community: " + settings.community.id + " and location: " + settings.location_id + "!");
        return res.status(202).send({ message: 'You must be a member of this community to add to it.' });
      }
    }
    else {
      console.warn("WARNING: community611");
    }
  }).catch(err => console.warn("WARNING: ", err))
}

async function handleSetCommunityStats(req, res) {
  var { location_id, community_id } = req.body.params;
  if (!location_id && !community_id) return res.status(400);

  console.log('Setting community stats for location: ' + location_id + ' and community: ' + community_id);
  req.params = req.body.params; // for sending to other 'GET' services

  // get companies and industries
  const companies = await handleGetCompanies(req);

  var industries = [];
  var companyParents = [];
  var defaultObj = { count: 0, entries: [] };
  var top_results = {
    people: defaultObj,
    skills: defaultObj,
    people_parents: defaultObj,
    companies: defaultObj,
    industries: defaultObj,
    company_parents: defaultObj,
    resources: defaultObj
  };

  if (companies && companies.length) {
    // create array of items
    companies.forEach(r => {
      if (r.industries) industries = industries.concat(r.industries);
      if (r.parents) companyParents = companyParents.concat(r.parents);
    });

    industries = _.countBy(industries);
    companyParents = _.countBy(companyParents);

    var sortedIndustries = sortcounts(industries, true);
    var sortedParents = sortcounts(companyParents);

    top_results.industries = {
      count: Object.keys(industries).length ? Object.values(industries).reduce(function(total, val) {
        return total + val;
      }) : [],
      entries: sortedIndustries.slice(0, 5)
    };

    top_results.company_parents = {
      count: Object.keys(companyParents).length ? Object.values(companyParents).reduce(function(total, val) {
        return total + val;
      }) : [],
      entries: sortedParents
    };

    top_results.companies = {
      count: companies.length,
      entries: companies.slice(0, 5)
    };
  }

  // get people & skills
  const people = await handleGetPeople(req);

  var skills = [];
  var peopleParents = [];

  if (people && people.length) {
    people.forEach(r => {
      if (r.skills) skills = skills.concat(r.skills);
      if (r.parents) peopleParents = peopleParents.concat(r.parents);
    });

    skills = _.countBy(skills);
    peopleParents = _.countBy(peopleParents);

    var sortedSkills = sortcounts(skills, true);
    var sortedPeopleParents = sortcounts(peopleParents);

    top_results.skills = {
      count: Object.keys(skills).length ? Object.values(skills).reduce(function(total, val) {
        return total + val;
      }) : [],
      entries: sortedSkills.slice(0, 5)
    };

    top_results.people_parents = {
      count: Object.keys(peopleParents).length ? Object.values(peopleParents).reduce(function(total, val) {
        return total + val;
      }) : [],
      entries: sortedPeopleParents
    };

    top_results.people = {
      count: people.length,
      entries: people.slice(0, 5)
    };
  }

  // get resources
  req.body.params.resources = true;
  const resources = await handleGetCompanies(req);

  if (resources && resources.length) {
    top_results.resources = {
      count: resources.length,
      entries: resources
    };
  }

  // BEGIN PARENTS (this is mostly to avoid another api call that includes both companies and users)

  var c_labels = [],
    c_numbers = [],
    p_labels = [],
    p_numbers = [];

  for (var c in top_results.company_parents.entries) {
    c_labels.push(c);
    c_numbers.push(top_results.company_parents.entries[c]);
  }

  for (var p in top_results.people_parents.entries) {
    p_labels.push(p);
    p_numbers.push(top_results.people_parents.entries[p]);
  }

  top_results['parents'] = {
    labels: _.union(c_labels, p_labels),
    values: []
  };

  for (var l in top_results.parents.labels) {
    var r = 0;
    if (c_numbers[c_labels.indexOf(top_results.parents.labels[l])]) {
      r += c_numbers[c_labels.indexOf(top_results.parents.labels[l])];
    }
    if (p_numbers[p_labels.indexOf(top_results.parents.labels[l])]) {
      r += p_numbers[p_labels.indexOf(top_results.parents.labels[l])];
    }
    top_results.parents.values.push(r);
  }
  var temp = [];
  for (var a in top_results.parents.labels) {
    if (top_results.parents.labels[a] != 'all') {
      temp.push({
        label: top_results.parents.labels[a],
        value: top_results.parents.values[a]
      });
    }
  }

  if (!_.isEmpty(temp)) {
    top_results.parents = _.orderBy(temp, 'value', 'desc');
  }
  else delete top_results.parents;

  delete top_results.people_parents;
  delete top_results.company_parents;

  // this is for dashboard view

  top_results.max = 0;
  if (top_results.parents) {
    for (var val in top_results.parents) {
      top_results.max += top_results.parents[val].value;
    }
  }

  // END PARENTS

  top_results.id = community_id;

  // todo if more results, get more
  /*
  getMore(selector, result.bookmark, function(more) {
          var newresult = {};
          newresult = result.concat(more);
          finish(newresult);
        });
  */
  // todo may need to put stats in community.community_profiles[location_id]
  // TEST TECH IN PORTLAND to see if it has same stats as bend
  await cdb.update({ stats: top_results }, { where: { id: top_results.id } });
  return res.status(200).send(top_results);
}

function handleDeleteCommunity(req, res) {

  // always use ensureAuth before this (to acquire req.user)
  var settings = req.body.params;

  console.log('Deleting community: ' + settings.community.name + ' in ' + settings.location_id);

  cdb.findById(req.user).then(response => {
    if (response) {
      var user = response.toJSON();

      // validate user is a leader of the community in this location

      if (user.roles && user.roles.leader && user.roles.leader[settings.community.id].indexOf(settings.location_id) > -1) {

        // get the community

        cdb.findById(settings.community.id).then(response => {
          if (response) {
            response = response.toJSON();
            // remove the location profile

            if (response.type && (response.type == "cluster" || response.resource) && response.type == settings.community.type) {

              // community already exists, we're good to remove the community profile here

              if (response.community_profiles !== undefined && response.community_profiles[settings.location_id]) {
                delete response.community_profiles[settings.location_id];
              }

              // remove from community
              if (response.communities.indexOf(settings.location_id) > -1) {
                var index = response.communities.indexOf(settings.location_id);
                response.communities.splice(index, 1);
              }

              var wrapup = function() {
                if (settings.new_community_id) {

                  // this is a rename operation

                  rename_community(settings.community.id, settings.location_id, settings.new_community_id);

                }
                else {

                  update_user(req.user, 'delete', settings.community.id, settings.location_id, function(good) {
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

                cdb.destroy({ where: { id: settings.community.id } }).then(finalres => {
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

                response.id = settings.community.id;

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
        console.warn("User is not a member of community: " + settings.community.id + " and location: " + settings.location_id + "!");
        return res.status(202).send({ message: 'You must be a leader of this community to delete it.' });
      }
    }
    else {
      console.warn("WARNING: community699");
    }
  }).catch(err => console.warn("WARNING: ", err))
}

var update_user = function(user_id, role, community_id, location_id, callback) {

  cdb.findById(user_id).then(response => {
    if (response) {
      // add role
      response = response.toJSON();
      if (!response.roles) response.roles = {};

      if (role == 'delete') {

        try {
          if (response.roles.leader[community_id].indexOf(location_id) > -1) {
            response.roles.leader[community_id].splice(response.roles.leader[community_id].indexOf(location_id), 1);
          }
          if (response.roles.leader[community_id].length == 0) {
            delete response.roles.leader[community_id]
          }
          if (response.communities.indexOf(community_id) > -1) {
            response.communities.splice(response.communities.indexOf(community_id), 1);
          }
        }
        catch (e) {}

      }
      else {

        if (!response.roles[role]) {
          response.roles[role] = {};
          response.roles[role][community_id] = [location_id];
        }
        else if (!response.roles[role][community_id]) {
          response.roles[role][community_id] = [location_id];
        }
        else if (response.roles[role][community_id].indexOf(location_id) < 0) {
          response.roles[role][community_id].push(location_id);
        } // else the damn thing is already there

        // add community

        if (!response.communities) response.communities = [];

        if (response.communities.indexOf(community_id) < 0) {
          response.communities.push(community_id);
        }
      }

      response.id = user_id;

      cdb.update(response, { where: { id: user_id } }).then(result => {
        if (result) {
          console.log('User ' + user_id + ' updated with community role.');
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

var rename_community = function(old_community_id, location_id, new_community_id) {
  var startKey = 0;
  /*
   console.log('Renaming ' + old_community_id + ' to ' + new_community_id);

   var getUsers = function (startKey) {

   db.newSearchBuilder()
   .collection(process.env.DB_COMMUNITIES)
   .limit(50)
   .offset(startKey)
   .query('communities: "' + old_community_id + '" OR roles.*.' + old_community_id + ': "' + location_id + '" OR invite_communities: "' + old_community_id + '"')
   .then(function (data) {
   var item;

   for (item in data.body.results) {
   var key = data.body.results[item].id,
   newdata = data.body.results[item].doc.value; // get current record

   if (newdata.type == "invite") {

   // Rename community
   if (newdata.invite_communities.indexOf(old_community_id) > -1) {

   // only add the new community if the old one existed

   if (newdata.invite_communities.indexOf(new_community_id) < 0) newdata.invite_communities.push(new_community_id);

   newdata.invite_communities.splice(newdata.invite_communities.indexOf(old_community_id), 1);
   }

   } else {

   // Rename community
   if (newdata.communities.indexOf(old_community_id) > -1) {

   // only add the new community if the old one existed

   if (newdata.communities.indexOf(new_community_id) < 0) newdata.communities.push(new_community_id);

   newdata.communities.splice(newdata.communities.indexOf(old_community_id), 1);
   }

   for (role in newdata.roles) {
   for (community in newdata.roles[role]) {
   if (community == old_community_id) {
   if (!newdata.roles[role][new_community_id]) newdata.roles[role][new_community_id] = [];
   if (newdata.roles[role][new_community_id].indexOf(location_id) < 0) newdata.roles[role][new_community_id].push(location_id);
   delete newdata.roles[role][old_community_id];
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
    cdb.findById(req.params.id).then(result => {
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
