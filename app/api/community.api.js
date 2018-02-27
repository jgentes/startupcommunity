var memjs = require('memjs'),
  mc = memjs.Client.create(),
  path = require('path'),
  _ = require(path.join(__dirname, '../scripts/lodash40.js')),
  {sequelize, cdb, mdb, Op} = require('../../db');
  
//var util = require('util'); //for util.inspect on request

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function () {
  this.getCommunity = handleGetCommunity;
  this.getResources = handleGetResources;
  this.setCommunity = handleSetCommunity;
  this.editCommunity = handleEditCommunity;
  this.deleteCommunity = handleDeleteCommunity;
  this.getId = handleGetId;
  this.getTop = handleGetTop;
  this.convert_state = handleConvert_state;
};

var handleConvert_state = function (name, to) {
  name = name.toUpperCase();
  var states = [
    {'name': 'Alabama', 'abbrev': 'AL'}, {'name': 'Alaska', 'abbrev': 'AK'}, {
      'name': 'Arizona',
      'abbrev': 'AZ'
    }, {'name': 'Arkansas', 'abbrev': 'AR'}, {'name': 'California', 'abbrev': 'CA'},
    {'name': 'Colorado', 'abbrev': 'CO'}, {'name': 'Connecticut', 'abbrev': 'CT'}, {
      'name': 'Delaware',
      'abbrev': 'DE'
    }, {'name': 'Florida', 'abbrev': 'FL'}, {'name': 'Georgia', 'abbrev': 'GA'},
    {'name': 'Hawaii', 'abbrev': 'HI'}, {'name': 'Idaho', 'abbrev': 'ID'}, {
      'name': 'Illinois',
      'abbrev': 'IL'
    }, {'name': 'Indiana', 'abbrev': 'IN'}, {'name': 'Iowa', 'abbrev': 'IA'},
    {'name': 'Kansas', 'abbrev': 'KS'}, {'name': 'Kentucky', 'abbrev': 'KY'}, {
      'name': 'Louisiana',
      'abbrev': 'LA'
    }, {'name': 'Maine', 'abbrev': 'ME'}, {'name': 'Maryland', 'abbrev': 'MD'},
    {'name': 'Massachusetts', 'abbrev': 'MA'}, {'name': 'Michigan', 'abbrev': 'MI'}, {
      'name': 'Minnesota',
      'abbrev': 'MN'
    }, {'name': 'Mississippi', 'abbrev': 'MS'}, {'name': 'Missouri', 'abbrev': 'MO'},
    {'name': 'Montana', 'abbrev': 'MT'}, {'name': 'Nebraska', 'abbrev': 'NE'}, {
      'name': 'Nevada',
      'abbrev': 'NV'
    }, {'name': 'New Hampshire', 'abbrev': 'NH'}, {'name': 'New Jersey', 'abbrev': 'NJ'},
    {'name': 'New Mexico', 'abbrev': 'NM'}, {'name': 'New York', 'abbrev': 'NY'}, {
      'name': 'North Carolina',
      'abbrev': 'NC'
    }, {'name': 'North Dakota', 'abbrev': 'ND'}, {'name': 'Ohio', 'abbrev': 'OH'},
    {'name': 'Oklahoma', 'abbrev': 'OK'}, {'name': 'Oregon', 'abbrev': 'OR'}, {
      'name': 'Pennsylvania',
      'abbrev': 'PA'
    }, {'name': 'Rhode Island', 'abbrev': 'RI'}, {'name': 'South Carolina', 'abbrev': 'SC'},
    {'name': 'South Dakota', 'abbrev': 'SD'}, {'name': 'Tennessee', 'abbrev': 'TN'}, {
      'name': 'Texas',
      'abbrev': 'TX'
    }, {'name': 'Utah', 'abbrev': 'UT'}, {'name': 'Vermont', 'abbrev': 'VT'},
    {'name': 'Virginia', 'abbrev': 'VA'}, {'name': 'Washington', 'abbrev': 'WA'}, {
      'name': 'West Virginia',
      'abbrev': 'WV'
    }, {'name': 'Wisconsin', 'abbrev': 'WI'}, {'name': 'Wyoming', 'abbrev': 'WY'}
  ];
  var returnthis = false;
  for (var i = 0; i < states.length; i++) {
    if (to == 'name') {
      if (states[i].abbrev == name) {
        returnthis = states[i].name;
        break;
      }
    } else if (to == 'abbrev') {
      if (states[i].name.toUpperCase() == name) {
        returnthis = states[i].abbrev;
        break;
      }
    }
  }
  return returnthis;
};


var schema = {
  community: function (community, location_key) {

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

async function handleGetCommunity(req, res) {
  console.log('handleGetCommunity PARAMS: ', req.params)
  
  // sorting function for results
  const sortCommunities = items => {
    items.forEach(item => {
      if (item) {
      console.log('ITEM: ', item.slug, item.type);
        // sort communities for use in nav and child dashboard pages
        
        switch (item.type) {
          case "location":
            if (!community.locations) community.locations = {};
            community.locations[item.id] = item;
            break;
          case "cluster":
            if (item.community_profiles && item.community_profiles[community_slug] && item.community_profiles[community_slug].parents) {
              if (!community.clusters) community.clusters = {};
              // this is for navigation
              var cluster_type;
              if (item.community_profiles[community_slug].parents.length) cluster_type = item.community_profiles[community_slug].parents[0];
              if (!community.clusters[cluster_type]) community.clusters[cluster_type] = {};
              community.clusters[cluster_type][item.id] = item;
            }
            break;
          case "company":
            if (item.resource) {
              if (!community.resources) community.resources = [];
              community.resources.push(item);
            }

            if (community.type == 'user') {
              for (var role in community.roles) {
                if (community.roles[role][item.id]) {

                  if (!community.companies) community.companies = {"count": {}};
                  if (!community.companies[role]) community.companies[role] = {};
                  if (!community.companies[role][item.id]) community.companies[role][item.id] = item;
                  if (!community.companies.count[role]) community.companies.count[role] = 0;
                  ++community.companies.count[role];
                }
              }
            }
            break;
        }
        community[item.id] = item;
      }
    });
  };
  
  var sendResponse = community => res.status(200).send(community);

  var community_slug = req.params.community && req.params.community.replace(/\s+/g, '-');
  
  if (!community_slug) return res.status(404).send({message: 'Please specify a community!'});
  
  let community = await cdb.findOne({where: {"slug": community_slug}, raw: true}).catch(err => console.warn("WARNING: ", err));
  
  if (!community) {
    console.log('INFO: Community not found!');
    return res.status(404).send({message: 'Community not found.'});
  } else {
    console.log('Pulling community for ' + community.name);
    
    let ubersearch = null;
    
    if (!community.resource || community.type !== "location") {

      // pull communities within record
      var comm_items = community.communities || [];

      // grab parents
      if (community.parents && community.parents.length) comm_items.push(community.parents[0]);
      if (community.home && community.communities && community.communities.indexOf(community.home) < 0) comm_items.push(community.home);
      comm_items.push(community_slug);

      ubersearch = comm_items;

    } else if (community.home) ubersearch = [community.home];

    console.log('Ubersearch: ', ubersearch);

    if (ubersearch) {
      await cdb.findAll({
        where: {
          slug: {
            [Op.in]: ubersearch
          }
        }, 
        raw: true
      })
      .then(sortCommunities)
      .catch(err => console.warn("WARNING: ", err));
    }
    
    await cdb.findAll({
      where: {
        [Op.and]: [{
          [Op.not]: {
            [Op.or]: [
              {type: 'user'},
              {type: 'company'},
              {slug: community_slug}
            ]
          }
        },{
          [Op.or]: [
            {communities: {[Op.like]: '%"'+community_slug+'"%'}},
            {parents: {[Op.like]: '%"'+community_slug+'"%'}},  
          ]
        }]
      }, 
      raw: true
    })
    .then(sortCommunities)
    .catch(err => console.warn("WARNING: ", err));
    
    if (community.resources && community.resources.length) {
      community.resources = community.resources.sort(function (a, b) {
        var x = a.slug;
        var y = b.slug;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      });
    }

    // get messages for users
    if (community.type == 'user') {
      mdb.findAll({where: {'to': community.id}, limit: 100, raw: true}).then(messages => {
        if (messages.length) {

          messages.sort(function (a, b) {
            return a.value.published < b.value.published;
          });
          community.messages = {};
          for (var mes in messages) {
            community.messages[mes.id] = mes;
          }

          
        }
        sendResponse(community);
      }).catch(err => console.warn("WARNING: ", err));

    } else if (community.type == 'company') {
      // get team

      var startkey = 0,
        teamlist = [],
        thiskey = community.id;

      var getTeam = function (startkey, teamlist) {
        
        sequelize
        .query(
          'SELECT * FROM communities WHERE JSON_CONTAINS(roles->>\'$.*.' + thiskey + '\', \'[' + thiskey + ']\')',
          { model: cdb}
        ).then(team => {
          if (team.length) {

            teamlist.push.apply(teamlist, team);

            var teamresponse = {},
              count = {};

            for (var member in teamlist) {
              var t = teamlist[member];

              // delete sensitive data
              if (t.password) delete t.password;
              if (t.email) delete t.email;
              if (t.newsletter) delete t.newsletter;
              if (t.linkedin) {
                if (t.linkedin.emailAddress) delete t.linkedin.emailAddress;
                if (t.linkedin.access_token) delete t.linkedin.access_token;
              }

              // sort roles
              for (var role in t.roles) {
                for (var item in t.roles[role]) {
                  if (item == thiskey) {
                    if (!teamresponse[role]) teamresponse[role] = [];
                    if (!count[role]) count[role] = 0;
                    teamresponse[role].push(t);
                    ++count[role];
                  }
                }
              }
            }

            community['team'] = {
              count: count
            };

            for (var r in teamresponse) {
              community.team[r] = teamresponse[r].slice(0, 4); // cut the array down
            }

            sendResponse(community);
          } else {
            console.log("WARNING: ");
            sendResponse(community);
          }
        }).catch(err => console.warn("WARNING: ", err));
      };

      getTeam(startkey, teamlist);

    } else sendResponse(community);
  }
}

function handleGetResources(req, res) {

  var location_key = req.body.location_key,
    resources = req.body.resources,
    clusters = req.body.clusters,
    searchstring;

  var selector = {};

  if (resources && resources.length) {
    selector.id = {[Op.in]: resources};
  } else selector.communities = {[Op.like]: '%"' + location_key + '"%'};

  if (clusters) {
    selector[Op.or] = [
      {resource: {[Op.not]: false}},
      {type: "cluster"}
    ];
  } else selector.resource = true;

  if (searchstring) {

    console.log(searchstring);

    cdb.findAll({where: selector, raw: true}).then(result => {
      if (result.length) {

        var newresponse = {};

        result.forEach(r => {
          newresponse[r.id] = r;
        });

        return res.status(200).send(newresponse);
          
      } else {
        console.log('INFO: No Resources found!');
        return res.status(400).send({message: 'No resources found!'});
       }
    }).catch(err => console.warn("WARNING: ", err));
  } else return res.status(404).send({message: 'Please specify a location!'});
}

function getMore(selector, bookmark, callback) {
  //todo this is likely broken because bookmark may not be a thing?
  return cdb.findAll({where: {
    selector: selector,
    limit: 1000,
    bookmark: bookmark
  }, raw: true}).then(results => callback).catch(err => console.warn("WARNING: ", err));
}

function handleGetTop(req, res) {

  //console.log(util.inspect(req)); // used for logging circular request
  var community_key = req.params.community_key,
    location_key = req.params.location_key,
    cluster_key = req.query.cluster_key,
    industry_keys = req.query.industry_keys || [],
    has_location = true,
    top_results = {
      people: {},
      companies: {},
      skills: {},
      people_parents: {},
      company_parents: {}
    },
    cluster_search = [];
    console.log('PARAMS: ', req.params, 'QUERY: ', req.query);
  
  if (industry_keys.length && industry_keys.indexOf('all') < 0) industry_keys.push('all');

  if (cluster_key) {

    community_key = '*';

    if (location_key == cluster_key) {
      has_location = false;
      search = '';
    }

    if (industry_keys.length) {
      industry_keys.forEach(i => {
        cluster_search.push({[Op.like]: '%"' + i + '"%'});
      });
    } else cluster_search.push({[Op.like]: '%"' + cluster_key + '"%'});

  } else if (!community_key || community_key == 'undefined') {
    community_key = location_key;
  }

  // determine whether location is a state
  var state_suffix = handleConvert_state(location_key.replace('-', ' '), 'abbrev'); // returns false if no match
  var state = state_suffix ? '%-' + state_suffix.toLowerCase() : ')';
  
  // add search based on home suffix (which allows for roll-up to state level)
  var search = state_suffix ? {
    [Op.or]: [
      {home: location_key},
      {home: {[Op.like]: state}}
      ]
    }
    : 
    {
      communities: {
        [Op.or]: [
          {[Op.like]: '%"' + location_key + '"%'}
        ]
      }
    };
    
  if (community_key != '*' && !state_suffix && community_key != location_key) search.communities[Op.or].push({[Op.like]: '%"' + community_key + '"%'});
  
  // get companies and industries

  //var industrysearch = cluster_search ? '(profile.parents:(' + cluster_search + ') OR profile.industries:(' + cluster_search + ')) AND ' + search : search;

  var addkeys = function (data) {
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

  var sortcounts = function (counts, newArray) {
    var sorted = _.fromPairs(_.sortBy(_.toPairs(counts), function (a) {
      return a[1]
    }).reverse());
    if (newArray) {
      var countArray = [];
      for (var s in sorted) {
        countArray.push({value: s, count: sorted[s]});
      }
      return countArray;
    } else return sorted;
  };

  // get companies & industries

  var selector = {
    [Op.and]: [
      {type: "company"},
      {resource: {[Op.not]: true}}
    ]
  };

  if (cluster_search.length) {
    selector[Op.or] = [
      {parents: {[Op.or]: cluster_search}},
      {industries: {[Op.or]: cluster_search}}
    ];
    if (search) selector[Op.and].push(search);
  } else selector[Op.and].push(search);

  console.log('Pulling Top Results: ', selector);

  var pullTop = function (cache) {

    cdb.findAll({
      where: selector,
      raw: true
    }).then(result => {
      if (result.length) {
        
        var industries = [];
        var parents = [];

        // create array of items
        result.forEach(r => {
          if (r.industries) industries = industries.concat(r.industries);
          if (r.parents) parents = parents.concat(r.parents);
        });

        industries = _.countBy(industries);
        parents = _.countBy(parents);

        var sortedIndustries = sortcounts(industries, true);
        var sortedParents = sortcounts(parents);
        
        top_results.industries = {
          count: Object.keys(industries).length ? Object.values(industries).reduce(function (total, val) {
            return total+val;
          }) : [],
          entries: sortedIndustries.slice(0,5)
        };

        top_results.company_parents = {
          count: Object.keys(parents).length ? Object.values(parents).reduce(function (total, val) {
            return total+val;
          }) : [],
          entries: sortedParents
        };
        
        var companyResults = addkeys(result);

        top_results.companies = {
          count: result.length,
          entries: companyResults.slice(0,5)
        };

        // get resources

        selector = {
          [Op.and]: [
            {type: "company"}, 
            {resource: {[Op.not]: false}}
          ]
        };

        if (cluster_search.length) {
          selector[Op.or] = [
            {parents: {[Op.or]: cluster_search}}, 
            {industries: {[Op.or]: cluster_search}}
          ];
        }
        
        if (search) selector[Op.and].push(search);
        
        cdb.findAll({
          where: selector,
          raw: true
        }).then(result => {
          top_results.resources = {
              count: result.length,
              entries: addkeys(result)
            };

            // get people & skills

            selector = {
              [Op.and]: [
                {type: "user"}
              ]
            };

            if (cluster_search.length) {
              selector[Op.or] = [
                {parents: {[Op.or]: cluster_search}}, 
                {skills: {[Op.or]: cluster_search}}
              ];
            }
            
            if (search) selector[Op.and].push(search);
            
            var finish = function(result) {

              var skills = [];
              var parents = [];
              
              result.forEach(r => {
                if (r.skills) skills = skills.concat(r.skills);
                if (r.parents) parents = parents.concat(r.parents);
              });

              skills = _.countBy(skills);
              parents = _.countBy(parents);
              
              var sortedSkills = sortcounts(skills, true);
              var sortedPeopleParents = sortcounts(parents);
              
              top_results.skills = {
                count: Object.keys(skills).length ? Object.values(skills).reduce(function (total, val) {
                  return total+val;
                }) : [],
                entries: sortedSkills.slice(0,5)
              };
              
              top_results.people_parents = {
                count: Object.keys(parents).length ? Object.values(parents).reduce(function (total, val) {
                  return total+val;
                }) : [],
                entries: sortedPeopleParents
              };
              
              var peopleResults = addkeys(result);

              top_results.people = {
                count: result.length,
                entries: peopleResults.slice(0,5)
              };

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
              } else delete top_results.parents;

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

              top_results.id = community_key;

              if (!cache) return res.status(200).send(top_results);

             /* mc.set(selector.toString(), JSON.stringify(top_results), function (err, val) {
                if (err) console.warn('WARNING: Memcache error: ', err)
              });*/
            }

            cdb.findAll({
              where: selector,
              limit: 1000,
              raw: true
            }).then(result => {
              if (result.length) {
                //todo bookmark is not a thing in mysql
                if (result.bookmark) {
                  getMore(selector, result.bookmark, function(more) {
                    var newresult = {};
                    newresult = result.concat(more);
                    finish(newresult);
                  });
                } else finish(result);

              } else {
                console.log("WARNING: ");
                return res.status(202).send({message: 'Something went wrong: '});
              }
            }).catch(err => console.warn("WARNING: ", err))
        }).catch(err => console.warn("WARNING: ", err))
      } else {
        console.log("WARNING: ");
        return res.status(202).send({message: 'Something went wrong: '});
      }
    }).catch(err => console.warn("WARNING: ", err))

  };
  pullTop(false);
  /*mc.get(selector.toString(), function (err, value) {
    if (value) {
      return res.status(200).send(value);
      pullTop(true);
    } else {
      pullTop(false);
    }
  })*/
  }

  function handleSetCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)

    var settings = req.body.params;

    console.log('Updating settings for ' + settings.location_key + ' / ' + settings.community_key);

    cdb.findById(req.user, {raw: true}).then(response => {
      if (response) {
        var user = response;

        // validate user has leader role within the location/community

        if (user.roles && user.roles.leader && user.roles.leader[settings.community_key] && user.roles.leader[settings.community_key].indexOf(settings.location_key) > -1) {

          // update the community

          cdb.findOne({where: {slug: settings.community_key}, raw: true}).then(response => {
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
                } else {
                  response.community_profiles[settings.location_key]["embed"] = settings.embed;
                }
              } else response.embed = settings.embed;

              cdb.update(response, {where: {slug: settings.community_key}}).then(finalres => {
                if (finalres) {
                  return res.status(201).send({message: 'Community settings updated.'});
                } else {
                  console.warn('WARNING: community466 ');
                  return res.status(202).send({message: "Something went wrong."});
                }
              });
            } else {
              console.warn('WARNING: community472 ');
              return res.status(202).send({message: "Something went wrong."});
            }
          });
        } else {
          console.warn("User is not a leader in location: " + settings.location_key + " and community: " + settings.community_key + "!");
          return res.status(202).send({message: 'Sorry, you must be a Leader in this community to change these settings.'});
        }
      } else {
        console.warn("WARNING: community493");
      }
    }).catch(err => console.warn("WARNING: ", err))
  }

  function handleEditCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)

    var settings = req.body.params;

    console.log('Editing community: ' + settings.community.name + ' in ' + settings.location_key);

    cdb.findById(req.user, {raw: true}).then(response => {
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

          cdb.findOne({where: {slug: pathname}, raw: true}).then(response => {
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

                  cdb.update(response, {where: {slug: pathname}}).then(finalres => {
                    if (finalres) {
                      update_user(req.user, 'leader', pathname, settings.location_key, function (good) {
                        if (good) {
                          return res.status(201).send({message: 'Industry cluster created!'});
                        } else {
                          return res.status(202).send({message: "Something went wrong."});
                        }
                      })
                    } else {
                      console.warn('WARNING: community533 ');
                      return res.status(202).send({message: "Something went wrong."});
                    }
                  })

                } else {

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
                        return res.status(201).send({message: 'Successfully updated!'});
                      } else {
                        console.warn('WARNING: ');
                        return res.status(202).send({message: "Something went wrong."});
                      }
                    })

                  } else return res.status(202).send({message: settings.community.name + ' already exists in this location. Please change the name or delete the other one first.'});
                }

              } else {
                return res.status(202).send({message: 'That name is taken. Try changing the name.'});
              }
            } else {
              // no existing path, go ahead and create

              var profile = schema.community(settings.community, settings.location_key);
              
              profile.slug = pathname;

              cdb.create(profile).then(finalres => {
                if (finalres) {
                  update_user(req.user, 'leader', pathname, settings.location_key, function (good) {
                    if (good) {
                      return res.status(201).send({message: 'Industry cluster created!'});
                    } else return res.status(202).send({message: "Something went wrong."});

                  })
                } else {
                  console.warn('WARNING: community565 ');
                  return res.status(202).send({message: "Something went wrong."});
                }
              })
            }
          })

        } else {
          console.warn("User is not a member of community: " + settings.community.slug + " and location: " + settings.location_key + "!");
          return res.status(202).send({message: 'You must be a member of this community to add to it.'});
        }
      } else {
        console.warn("WARNING: community611");
      }
    }).catch(err => console.warn("WARNING: ", err))
  }

  function handleDeleteCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var settings = req.body.params;

    console.log('Deleting community: ' + settings.community.name + ' in ' + settings.location_key);

    cdb.findById(req.user, {raw: true}).then(response => {
      if (response) {
        var user = response;

        // validate user is a leader of the community in this location

        if (user.roles && user.roles.leader && user.roles.leader[settings.community.slug].indexOf(settings.location_key) > -1) {

          // get the community

          cdb.findOne({where: {slug: settings.community.slug}, raw: true}).then(response => {
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

                var wrapup = function () {
                  if (settings.new_community_key) {

                    // this is a rename operation

                    rename_community(settings.community.slug, settings.location_key, settings.new_community_key);

                  } else {

                    update_user(req.user, 'delete', settings.community.slug, settings.location_key, function (good) {
                      if (good) {
                        console.log('Community deleted.');
                        return res.status(204).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!'});
                      } else {
                        return res.status(202).send({message: "Something went wrong."});
                      }
                    })
                  }
                };

                if (response.communities.length == 0) {

                  // delete the whole thing

                  cdb.destroy({where: {id: settings.community.slug}}).then(finalres => {
                    if (finalres) {
                      wrapup();
                    } else {
                      console.warn('WARNING: community620');
                      return res.status(202).send({message: "Something went wrong."});
                    }
                  })

                } else {
                  
                  response.slug = settings.community.slug;

                  cdb.create(response).then(finalres => {
                    if (finalres) {
                      wrapup();
                    } else {
                      console.warn('WARNING: community629 ');
                      return res.status(202).send({message: "Something went wrong."});
                    }
                  })
                }

              } else {
                console.log('WARNING: Cannot delete community');
                return res.status(202).send({message: "You can't delete " + settings.community.name + " for some reason, but we've been notified and will look into it."});
              }
            } else {
              console.warn('WARNING: community644');
              return res.status(202).send({message: "Something went wrong."});
            }
          })

        } else {
          console.warn("User is not a member of community: " + settings.community.slug + " and location: " + settings.location_key + "!");
          return res.status(202).send({message: 'You must be a leader of this community to delete it.'});
        }
      } else {
        console.warn("WARNING: community699");
      }
    }).catch(err => console.warn("WARNING: ", err))
  }

  var update_user = function (user_key, role, community_key, location_key, callback) {

    cdb.findById(user_key, {raw: true}).then(response => {
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
          catch (e) {
          }

        } else {

          if (!response.roles[role]) {
            response.roles[role] = {};
            response.roles[role][community_key] = [location_key];
          } else if (!response.roles[role][community_key]) {
            response.roles[role][community_key] = [location_key];
          } else if (response.roles[role][community_key].indexOf(location_key) < 0) {
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
          } else {
            console.warn("WARNING: community706");
            callback(false);
          }
        });
      } else {
        console.warn("WARNING: community715");
        callback(false);
      }
    }).catch(err => console.warn("WARNING: ", err));
  };

  var rename_community = function (old_community_key, location_key, new_community_key) {
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
      cdb.findById(req.params.id, {raw: true}).then(result => {
        if (result) {
          return res.status(200).send(result);
        } else {
          console.warn('WARNING: Id not found!');
          return res.status(202).send({message: 'Id not found.'});
        }
      }).catch(err => console.warn("WARNING: ", err));
    }

    pullId();
  }

  module.exports = CommunityApi;