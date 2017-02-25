var memjs = require('memjs'),
  mc = memjs.Client.create(),
  path = require('path'),
  request = require('request'),
  _ = require(path.join(__dirname, '../scripts/lodash40.js')),
  Cloudant = require('cloudant'),
  cloudant = Cloudant({
    account: '2001b05d-38e3-44f7-b569-b13a66a81b70-bluemix',
    key: 'itsartnerevishedifestimm',
    password: 'ee4e2b18fb1d4fd5e34c802239a5a3bc8224cc73',
    plugin: 'promises'
  }),
  cdb = cloudant.db.use(process.env.DB_COMMUNITIES),
  db = require('orchestrate')(process.env.DB_KEY);

//var util = require('util'); //for util.inspect on request

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function () {
  this.getCommunity = handleGetCommunity;
  this.getResources = handleGetResources;
  this.setCommunity = handleSetCommunity;
  this.editCommunity = handleEditCommunity;
  this.deleteCommunity = handleDeleteCommunity;
  this.getKey = handleGetKey;
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
      "parents": community.profile.parents,
      "name": community.profile.name,
      "icon": "fa-circle-o",
      "headline": community.profile.headline,
      "industries": community.profile.industries,
      "embed": community.profile.embed || []
    };

    return {
      "type": community.type,
      "profile": {
        "name": community.profile.name,
        "icon": "fa-circle-o",
        "headline": community.profile.headline
      },
      "communities": [location_key],
      "community_profiles": community_profiles
    };
  }
};

function formatSearchResults(items) {
  for (i in items.rows) {
    items.rows[i].doc = {
      path: { key: items.rows[i].id },
      value: item.rows[i].doc
    };
  }
  return items;
}

function handleGetCommunity(req, res) {

  var checkcache = function (cache, community, newresponse) {
    if (!cache) res.status(200).send(newresponse);

    mc.set(community, JSON.stringify(newresponse), function (err, val) {
      if (err) console.warn('WARNING: Memcache error: ', err)
    });
  };

  var community = req.params.community ? req.params.community.replace(/\s+/g, '-') : 'bend-or';

  var searchString = 'key: ' + community; // grab the primary community object, don't use parens here
  searchString += ' OR ((communities: "' + community + '"'; // + grab anything associated with this community in this location
  searchString += ' OR parents: "' + community + '")'; // + grab anything that has this community as a parent
  searchString += ' AND NOT type:("company" OR "user"))'; // exclude companies and users, except if key is a company or user

  var pullCommunity = function (cache) {

    // need to determine what 'this' community is, but to optimize the first query, grab all communities and then figure it out (rather than a 'get' for the first community, then another call for the rest)
    console.log('community search: ', searchString);

    cdb.search('communities', 'communitySearch', {q: searchString, include_docs: true})
      .then(function (result) {

        var newresponse;

        var finalize = function (results) {
          console.log(results[0]);
          // finalize iterates through results and formats them nicely

          for (item in results) {

            if (results[item].doc.value && results[item].id !== community) {

              // sort communities for use in nav and child dashboard pages

              switch (results[item].doc.value.type) {
                case "location":
                  if (!newresponse.locations) newresponse['locations'] = {};
                  newresponse.locations[results[item].id] = results[item].doc.value;
                  break;
                case "cluster":
                  if (results[item].doc.value.community_profiles && results[item].doc.value.community_profiles[community] && results[item].doc.value.community_profiles[community].parents && results[item].doc.value.community_profiles[community].parents[0]) {
                    if (!newresponse.clusters) newresponse['clusters'] = {};
                    // i believe this is for navigation
                    var cluster_type = results[item].doc.value.community_profiles[community].parents[0];
                    if (!newresponse.clusters[cluster_type]) newresponse.clusters[cluster_type] = {};
                    newresponse.clusters[cluster_type][results[item].id] = results[item].doc.value;
                  }
                  break;
                case "company":
                  if (results[item].doc.value.resource) {
                    if (!newresponse.resources) newresponse["resources"] = [];
                    newresponse.resources.push(results[item].doc.value);
                  }

                  if (newresponse.type == 'user') {
                    for (role in newresponse.roles) {
                      if (newresponse.roles[role][results[item].id]) {

                        if (!newresponse.companies) newresponse['companies'] = {"count": {}};
                        if (!newresponse.companies[role]) newresponse.companies[role] = {};
                        if (!newresponse.companies[role][results[item].id]) newresponse.companies[role][results[item].id] = results[item];
                        if (!newresponse.companies.count[role]) newresponse.companies.count[role] = 0;
                        ++newresponse.companies.count[role];
                      }
                    }
                  }
                  break;
              }

              newresponse[results[item].id] = results[item].doc.value;

            }
          }

          if (newresponse.resources && newresponse.resources.length) {
            newresponse.resources = newresponse.resources.sort(function (a, b) {
              var x = a.key;
              var y = b.key;
              return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
          }

          // get messages for users
          if (newresponse.type == 'user') {
            db.newSearchBuilder()
              .collection(process.env.DB_MESSAGES)
              .limit(100)
              .offset(0)
              .sortBy('@value.published:asc')
              .query('@value.to: "' + newresponse.key + '"')
              .then(function (messages) {
                messages.body.results.sort(function (a, b) {
                  return a.doc.value.published < b.doc.value.published;
                });
                newresponse.messages = {};
                for (mes in messages.body.results) {

                  messages.body.results[mes].doc.value["key"] = messages.body.results[mes].id;
                  newresponse.messages[messages.body.results[mes].id] = messages.body.results[mes].doc.value;
                }

                checkcache(cache, community, newresponse);

              })
              .fail(function (err) {
                console.log("WARNING: community171", err);
                res.status(200).send(newresponse);
              });

          } else if (newresponse.type == 'company') {
            // get team

            var startkey = 0,
              teamlist = [],
              thiskey = newresponse.key;

            var getTeam = function (startkey, teamlist) {
              db.newSearchBuilder()
                .collection(process.env.DB_COMMUNITIES)
                .limit(100)
                .offset(startkey)
                .query('type:"user" AND @value.roles.*.' + thiskey + ':*')
                .then(function (team) {

                  teamlist.push.apply(teamlist, team.body.results);

                  if (team.body.next) {

                    startkey += 100;
                    console.log('getting more team members.. >' + startkey);
                    getTeam(startkey, teamlist);

                  } else {

                    var teamresponse = {},
                      count = {};

                    for (member in teamlist) {
                      var t = teamlist[member];

                      // delete sensitive data
                      if (t.path.collection) delete t.path.collection;
                      if (t.path.ref) delete t.path.ref;
                      if (t.doc.value.profile.password) delete t.doc.value.profile.password;
                      if (t.doc.value.profile.email) delete t.doc.value.profile.email;
                      if (t.doc.value.newsletter) delete t.doc.value.newsletter;
                      if (t.doc.value.profile.linkedin) {
                        if (t.doc.value.profile.linkedin.emailAddress) delete t.doc.value.profile.linkedin.emailAddress;
                        if (t.doc.value.profile.linkedin.access_token) delete t.doc.value.profile.linkedin.access_token;
                      }
                      t.doc.value["key"] = t.id;

                      // sort roles
                      for (role in t.doc.value.roles) {
                        for (item in t.doc.value.roles[role]) {
                          if (item == thiskey) {
                            if (!teamresponse[role]) teamresponse[role] = [];
                            if (!count[role]) count[role] = 0;
                            teamresponse[role].push(t);
                            ++count[role];
                          }
                        }
                      }
                    }

                    newresponse['team'] = {
                      count: count
                    };

                    for (r in teamresponse) {
                      newresponse.team[r] = teamresponse[r].slice(0, 4); // cut the array down
                    }

                    checkcache(cache, community, newresponse);
                  }

                })
                .fail(function (err) {
                  console.log("WARNING: ", err);
                  res.status(200).send(newresponse);
                });
            };

            getTeam(startkey, teamlist)

          } else checkcache(cache, community, newresponse);
        };

        if (result.rows.length > 0) {
          result = formatSearchResults(result);

          var found = false;
          for (comm in result.rows) {
            var m = result.rows[comm];
            if (m.id == community) {
              found = true;

              newresponse = m.doc.value;

              console.log('Pulling community for ' + m.doc.value.profile.name);

              // grab home
              if (m.doc.value.profile.home) var m_home = m.doc.value.profile.home;

              if (!m.doc.value.resource || m.doc.value.type !== "location") {

                // pull communities within record
                var comm_items = m.doc.value.communities;

                // grab parent
                if (m.doc.value.profile.parents && m.doc.value.profile.parents[0]) comm_items.push(m.doc.value.profile.parents[0]);

                if (m_home && m.doc.value.communities.indexOf(m_home) < 0) comm_items.push(m_home);

                var search = community;

                if (comm_items && comm_items.length) {
                  search += " OR ";
                  for (i in comm_items) {
                    if (i > 0) {
                      search += ' OR ';
                    }
                    search += comm_items[i];
                  }
                }

                var ubersearch = '(key: (' + search + '))';

              } else if (m_home) {
                ubersearch = '(key: ' + m_home + ')';
              } else ubersearch = "";

              console.log(ubersearch);

              if (ubersearch) {

                cdb.search('communities', 'communitySearch', {q: ubersearch, include_docs: true})
                  .then(function (uber_result) {
                    uber_result = formatSearchResults(uber_result);

                    if (m_home || m.doc.value.type == "location") {
                      var both = result.rows.concat(uber_result.rows);
                      finalize(both);
                    } else finalize(uber_result.rows);
                  })
                  .catch(function (err) {
                    console.log("WARNING: ", err);
                    finalize(result.rows);
                  });
              }

              break;
            }
          }
          if (!found) {
            console.log('INFO: Community not found!');
            res.status(404).send({message: 'Community not found.'});
          }
        } else {
          console.log('INFO: Community not found!');
          res.status(404).send({message: 'Community not found.'});
        }
      })
      .catch(function (err) {
        console.log("WARNING: community236", err);
        res.status(202).send({message: 'Something went wrong: ' + err});
      })
  };

  if (community) {

    if (!req.query.nocache) {
      mc.get(community, function (err, value) {

        if (value) {
          res.status(200).send(value);
          pullCommunity(true);
        } else {
          pullCommunity(false);
        }
      })
    } else {
      mc.delete(community);
      pullCommunity(false);
    }

  } else res.status(404).send({message: 'Please specify a community!'});
}

function handleGetResources(req, res) {

  var location_key = req.body.location_key,
    resources = req.body.resources,
    clusters = req.body.clusters,
    searchstring;

  if (resources) {
    searchstring = 'key: (';
    for (r in resources) {
      searchstring += resources[r];
      if (r < resources.length - 1) searchstring += ' OR ';
    }
    searchstring += ')';
  } else searchstring = 'communities: "' + location_key + '"';

  if (clusters) {
    searchstring += ' AND (resource: true OR type: "cluster")';
  } else searchstring += ' AND resource: true';

  if (searchstring) {

    console.log(searchstring);

    db.newSearchBuilder()
      .collection(process.env.DB_COMMUNITIES)
      .limit(100)
      .offset(0)
      .query(searchstring)
      .then(function (result) {

        var newresponse = {};

        if (result.rows.length > 0) {

          for (resource in result.rows) {
            var r = result.rows[resource];

            newresponse[r.id] = r.doc.value;
            newresponse[r.id]["key"] = r.id;
          }

          res.status(200).send(newresponse);

        } else {
          console.log('INFO: No Resources found!');
          res.status(400).send({message: 'No resources found!'});
        }
      })
      .fail(function (err) {
        console.log("WARNING: ", err);
        res.status(202).send({message: 'Something went wrong: ' + err});
      });

  } else res.status(404).send({message: 'Please specify a location!'});
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
    cluster_search = "";

  if (typeof industry_keys === 'string') {
    industry_keys = [industry_keys];
  }

  if (industry_keys.indexOf('all') < 0) industry_keys.push('all');

  if (cluster_key) {

    community_key = '*';

    if (location_key == cluster_key) {
      has_location = false;
      search = '';
    }

    for (i in industry_keys) {
      if (i > 0) {
        cluster_search += ' OR ';
      }
      cluster_search += '"' + industry_keys[i] + '"';
    }

  } else if (!community_key || community_key == 'undefined') {
    community_key = location_key;
  }

  // determine whether location is a state
  var state_suffix = handleConvert_state(location_key.replace('-', ' '), 'abbrev'); // returns false if no match
  var state = state_suffix ? ' OR "*-' + state_suffix.toLowerCase() + '")' : ')';

  // add search based on home suffix (which allows for roll-up to state level)
  var search = state_suffix ?
    'profile.home: ("' + location_key + '"' + state :
    'communities: "' + location_key + '" AND communities: ' + (community_key == '*' ? '*' : '"' + community_key + '"');

  // get companies and industries

  var industrysearch = cluster_search ? '(profile.parents:(' + cluster_search + ') OR profile.industries:(' + cluster_search + ')) AND ' + search : search;

  console.log('Pulling Top Results: ', industrysearch);

  var addkeys = function (data) {
    for (i in data) {
      // delete sensitive data
      if (data[i].doc.value.profile.password) delete data[i].doc.value.profile.password;
      if (data[i].doc.value.profile.email) delete data[i].doc.value.profile.email;
      if (data[i].doc.value.newsletter) delete data[i].doc.value.newsletter;
      if (data[i].doc.value.profile.linkedin) {
        if (data[i].doc.value.profile.linkedin.emailAddress) delete data[i].doc.value.profile.linkedin.emailAddress;
        if (data[i].doc.value.profile.linkedin.access_token) delete data[i].doc.value.profile.linkedin.access_token;
      }
      data[i].doc.value["key"] = data[i].id;
    }
    return data;
  };

  var add = function(a, b) {
    return a + b;
  };

  var sortcounts = function(counts) {
    return _.fromPairs(_.sortBy(_.toPairs(counts), function(a){return a[1]}).reverse());
  };

  // get companies & industries

  var pullTop = function (cache) {

    cdb.search('communities', 'companyTop', {
      q: industrysearch + ' AND type: "company" AND NOT resource: true',
      counts: ['profile.industries', 'profile.parents'],
      include_docs: true
    })
      .then(function (result) {
        result = formatSearchResults(result);

        if (result.counts && result.counts['profile.industries']) {
          var sortedIndustries = sortcounts(result.counts['profile.industries']);

          top_results.industries = {
            count: Object.values(result.counts['profile.industries']).reduce(add, 0),
            entries: sortedIndustries
          };

        }
        if (result.counts && result.counts['profile.parents']) {
          var sortedParents = sortcounts(result.counts['profile.parents']);

          top_results.company_parents = {
            count: Object.values(result.counts['profile.parents']).reduce(add, 0),
            entries: sortedParents
          };
        }

        top_results.companies = {
          count: result.total_rows,
          entries: addkeys(result.rows)
        };

        // get resources

        cdb.search('communities', 'communitySearch', {
          q: industrysearch + ' AND resource: true',
          include_docs: true
        })
          .then(function (result) {
            result = formatSearchResults(result);

            top_results.resources = {
              count: result.total_rows,
              entries: addkeys(result.rows)
            };

            // get people & skills

            var skillsearch = cluster_search ? '(profile.parents:(' + cluster_search + ') OR profile.skills:(' + cluster_search + ')) AND ' + search : search;
            console.log(skillsearch)
            cdb.search('communities', 'peopleTop', {
              q: skillsearch + ' AND type: "user"',
              counts: ['profile.skills', 'profile.parents'],
              include_docs: true
            })
              .then(function (result) {
                result = formatSearchResults(result);

                if (result.counts && result.counts['profile.skills']) {
                  var sortedSkills = sortcounts(result.counts['profile.skills']);

                  top_results.skills = {
                    count: Object.values(result.counts['profile.skills']).reduce(add, 0),
                    entries: sortedSkills
                  };
                }
                if (result.counts && result.counts['profile.parents']) {
                  var sortedPeopleParents = sortcounts(result.counts['profile.parents']);

                  top_results.people_parents = {
                    count: Object.values(result.counts['profile.parents']).reduce(add, 0),
                    entries: sortedPeopleParents
                  };
                }

                top_results.people = {
                  count: result.total_rows,
                  entries: addkeys(result.rows)
                };

                // BEGIN PARENTS (this is mostly to avoid another api call that includes both companies and users)

                var c_labels = [],
                  c_numbers = [],
                  p_labels = [],
                  p_numbers = [];

                for (c in top_results.company_parents.entries) {
                  c_labels.push(c);
                  c_numbers.push(top_results.company_parents.entries[c]);
                }

                for (p in top_results.people_parents.entries) {
                  p_labels.push(p);
                  p_numbers.push(top_results.people_parents.entries[p]);
                }

                top_results['parents'] = {
                  labels: _.union(c_labels, p_labels),
                  values: []
                };

                for (l in top_results.parents.labels) {
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
                for (a in top_results.parents.labels) {
                  temp.push({
                    label: top_results.parents.labels[a],
                    value: top_results.parents.values[a]
                  });
                }

                if (!_.isEmpty(temp)) {
                  top_results.parents = _.orderBy(temp, 'value', 'desc');
                } else delete top_results.parents;

                delete top_results.people_parents;
                delete top_results.company_parents;

                // this is for dashboard view

                top_results.max = 0;
                if (top_results.parents) {
                  for (val in top_results.parents) {
                    top_results.max += top_results.parents[val].value;
                  }
                }

                // END PARENTS

                top_results['key'] = community_key;

                if (!cache) res.status(200).send(top_results);

                mc.set(industrysearch, JSON.stringify(top_results), function (err, val) {
                  if (err) console.warn('WARNING: Memcache error: ', err)
                });


              })
              .catch(function (err) {
                console.log("WARNING: ", err);
                res.status(202).send({message: 'Something went wrong: ' + err});
              });
          })
          .catch(function (err) {
            console.log("WARNING: ", err);
            res.status(202).send({message: 'Something went wrong: ' + err});
          });

      })
      .catch(function (err) {
        console.log("WARNING: ", err);
        res.status(202).send({message: 'Something went wrong: ' + err});
      });
  };

  if (industrysearch) {

    mc.get(industrysearch, function (err, value) {
      if (value) {
        res.status(200).send(value);
        pullTop(true);
      } else {
        pullTop(false);
      }
    })

  } else res.status(404).send({message: 'Please specify a community!'});
}

function handleSetCommunity(req, res) {

  // always use ensureAuth before this (to acquire req.user)

  var settings = req.body.params;

  console.log('Updating settings for ' + settings.location_key + ' / ' + settings.community_key);

  db.get(process.env.DB_COMMUNITIES, req.user)
    .then(function (response) {

      if (response.body.code !== "items_not_found") {
        var user = response.body;

        // validate user has leader role within the location/community

        if (user.roles && user.roles.leader && user.roles.leader[settings.community_key] && user.roles.leader[settings.community_key].indexOf(settings.location_key) > -1) {

          // update the community

          db.get(process.env.DB_COMMUNITIES, settings.community_key)
            .then(function (response) {
              if (response.body.type !== 'location') { // use community_profiles
                if (response.body.community_profiles === undefined) { // create community_profiles
                  response.body['community_profiles'] = {};
                }
                if (response.body.community_profiles[settings.location_key] === undefined) { // create this location
                  response.body.community_profiles[settings.location_key] = {
                    "name": response.body.profile.name,
                    "icon": response.body.profile.icon,
                    "logo": response.body.profile.logo,
                    "embed": settings.embed
                  };
                } else {
                  response.body.community_profiles[settings.location_key]["embed"] = settings.embed;
                }
              } else response.body.profile["embed"] = settings.embed;

              db.put(process.env.DB_COMMUNITIES, settings.community_key, response.body)
                .then(function (finalres) {
                  res.status(201).send({message: 'Community settings updated.'});
                })
                .fail(function (err) {
                  console.warn('WARNING: community466 ', err);
                  res.status(202).send({message: "Something went wrong."});
                });

            })
            .fail(function (err) {
              console.warn('WARNING: community472 ', err);
              res.status(202).send({message: "Something went wrong."});
            });

        } else {
          console.warn("User is not a leader in location: " + settings.location_key + " and community: " + settings.community_key + "!");
          res.status(202).send({message: 'Sorry, you must be a Leader in this community to change these settings.'});
        }

      } else {
        console.warn('WARNING:  User not found.');
      }
    })

    .fail(function (err) {
      console.warn("WARNING: community493", err);
    });


}

function handleEditCommunity(req, res) {

  // always use ensureAuth before this (to acquire req.user)

  var settings = req.body.params;

  console.log('Editing community: ' + settings.community.profile.name + ' in ' + settings.location_key);

  db.get(process.env.DB_COMMUNITIES, req.user)
    .then(function (response) {

      if (response.body.code !== "items_not_found") {
        var user = response.body,
          leader = false;

        // validate user is a member in the location

        if (user.communities.indexOf(settings.location_key) > -1) {

          var pathname = settings.community.url || settings.community.profile.name.toLowerCase().replace(/\s+/g, '-');

          // check to see if user is a leader of the community

          if (user.roles && user.roles.leader && user.roles.leader[pathname] && user.roles.leader[pathname].indexOf(settings.location_key) > -1) {
            leader = true;
            console.log('confirmed leader');
          }

          // check to see if the community exists

          db.get(process.env.DB_COMMUNITIES, pathname)
            .then(function (response) {
              // go to .fail if community doesn't exist (on .get rather than .search)
              // if community already exists and it's the same type as what's being created, we're good to add the community profile here

              if (response.body.type && (response.body.type == "cluster" || response.body.resource) && response.body.type == settings.community.type) {

                // create community_profiles (leadership not required if this is a new community)

                if (response.body.community_profiles === undefined) response.body['community_profiles'] = {};

                if (response.body.community_profiles[settings.location_key] === undefined) {

                  // create this location
                  console.log('creating location profile');

                  response.body.community_profiles[settings.location_key] = {
                    "name": settings.community.profile.name,
                    "headline": settings.community.profile.headline,
                    "icon": response.body.profile.icon,
                    "parents": settings.community.parents,
                    "industries": settings.community.profile.industries,
                    "embed": settings.community.profile.embed || []
                  };

                  // add community

                  if (!response.body.communities) {
                    response.body["communities"] = {};
                  }

                  if (response.body.communities.indexOf(settings.location_key) < 0) {
                    response.body.communities.push(settings.location_key);
                  }

                  db.put(process.env.DB_COMMUNITIES, pathname, response.body)
                    .then(function (finalres) {

                      update_user(req.user, 'leader', pathname, settings.location_key, function (good) {
                        if (good) {
                          res.status(201).send({message: 'Industry cluster created!'});
                        } else {
                          res.status(202).send({message: "Something went wrong."});
                        }
                      })
                    })
                    .fail(function (err) {
                      console.warn('WARNING: community533 ', err);
                      res.status(202).send({message: "Something went wrong."});
                    });


                } else {

                  if (leader) {

                    response.body.community_profiles[settings.location_key] = {
                      "name": settings.community.profile.name,
                      "headline": settings.community.profile.headline,
                      "icon": response.body.profile.icon,
                      "parents": settings.community.profile.parents,
                      "industries": settings.community.profile.industries,
                      "embed": settings.community.profile.embed || []
                    };

                    // add community

                    if (!response.body.communities) {
                      response.body["communities"] = {};
                    }

                    if (response.body.communities.indexOf(settings.location_key) < 0) {
                      response.body.communities.push(settings.location_key);
                    }

                    db.put(process.env.DB_COMMUNITIES, pathname, response.body)
                      .then(function (finalres) {
                        res.status(201).send({message: 'Successfully updated!'});
                      })
                      .fail(function (err) {
                        console.warn('WARNING: ', err);
                        res.status(202).send({message: "Something went wrong."});
                      });

                  } else res.status(202).send({message: settings.community.profile.name + ' already exists in this location. Please change the name or delete the other one first.'});
                }

              } else {
                res.status(202).send({message: 'That name is taken. Try changing the name.'});
              }

            })
            .fail(function (err) {

              if (err.statusCode == '404') {

                // no existing path, go ahead and create

                var profile = schema.community(settings.community, settings.location_key);

                db.put(process.env.DB_COMMUNITIES, pathname, profile)
                  .then(function (finalres) {

                    update_user(req.user, 'leader', pathname, settings.location_key, function (good) {
                      if (good) {
                        res.status(201).send({message: 'Industry cluster created!'});
                      } else res.status(202).send({message: "Something went wrong."});

                    })
                  })
                  .fail(function (err) {
                    console.warn('WARNING: community565 ', err);
                    res.status(202).send({message: "Something went wrong."});
                  });

              } else {
                console.warn('WARNING: community570', err);
                res.status(202).send({message: "Something went wrong."});
              }

            });

        } else {
          console.warn("User is not a member of community: " + settings.community.key + " and location: " + settings.location_key + "!");
          res.status(202).send({message: 'You must be a member of this community to add to it.'});
        }

      } else {
        console.warn('WARNING:  User not found.');
      }
    })

    .fail(function (err) {
      console.warn("WARNING: community611", err);
    });

}

function handleDeleteCommunity(req, res) {

  // always use ensureAuth before this (to acquire req.user)
  var settings = req.body.params;

  console.log('Deleting community: ' + settings.community.profile.name + ' in ' + settings.location_key);

  db.get(process.env.DB_COMMUNITIES, req.user)
    .then(function (response) {

      if (response.body.code !== "items_not_found") {
        var user = response.body;

        // validate user is a leader of the community in this location

        if (user.roles && user.roles.leader && user.roles.leader[settings.community.key].indexOf(settings.location_key) > -1) {

          // get the community

          db.get(process.env.DB_COMMUNITIES, settings.community.key)
            .then(function (response) {

              // remove the location profile

              if (response.body.type && (response.body.type == "cluster" || response.body.resource) && response.body.type == settings.community.type) {

                // community already exists, we're good to remove the community profile here

                if (response.body.community_profiles !== undefined && response.body.community_profiles[settings.location_key]) {
                  delete response.body.community_profiles[settings.location_key];
                }

                // remove from community

                if (response.body.communities.indexOf(settings.location_key) > -1) {
                  var index = response.body.communities.indexOf(settings.location_key);
                  response.body.communities.splice(index, 1);
                }

                var wrapup = function () {
                  if (settings.new_community_key) {

                    // this is a rename operation

                    rename_community(settings.community.key, settings.location_key, settings.new_community_key);

                  } else {

                    update_user(req.user, 'delete', settings.community.key, settings.location_key, function (good) {
                      if (good) {
                        console.log('Community deleted.');
                        res.status(204).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!'});
                      } else {
                        res.status(202).send({message: "Something went wrong."});
                      }
                    })
                  }
                }

                if (response.body.communities.length == 0) {

                  // delete the whole thing

                  db.remove(process.env.DB_COMMUNITIES, settings.community.key, 'true')
                    .then(function (finalres) {
                      wrapup();
                    })
                    .fail(function (err) {
                      console.warn('WARNING: community620', err);
                      res.status(202).send({message: "Something went wrong."});
                    });

                } else {

                  db.put(process.env.DB_COMMUNITIES, settings.community.key, response.body)
                    .then(function (finalres) {
                      wrapup();
                    })
                    .fail(function (err) {
                      console.warn('WARNING: community629 ', err);
                      res.status(202).send({message: "Something went wrong."});
                    });
                }

              } else {
                console.log('WARNING: Cannot delete community');
                res.status(202).send({message: "You can't delete " + settings.community.profile.name + " for some reason, but we've been notified and will look into it."});
              }

            })
            .fail(function (err) {

              console.warn('WARNING: community644', err);
              res.status(202).send({message: "Something went wrong."});

            });

        } else {
          console.warn("User is not a member of community: " + settings.community.key + " and location: " + settings.location_key + "!");
          res.status(202).send({message: 'You must be a leader of this community to delete it.'});
        }

      } else {
        console.warn('WARNING:  User not found.');
      }
    })

    .fail(function (err) {
      console.warn("WARNING: community699", err);
    });

}

var update_user = function (user_key, role, community_key, location_key, callback) {

  db.get(process.env.DB_COMMUNITIES, user_key)
    .then(function (response) {

      if (response.body.code !== "items_not_found") {

        // add role

        if (!response.body.roles) {
          response.body["roles"] = {};
        }

        if (role == 'delete') {

          try {
            if (response.body.roles.leader[community_key].indexOf(location_key) > -1) {
              response.body.roles.leader[community_key].splice(response.body.roles.leader[community_key].indexOf(location_key), 1);
            }
            if (response.body.roles.leader[community_key].length == 0) {
              delete response.body.roles.leader[community_key]
            }
            if (response.body.communities.indexOf(community_key) > -1) {
              response.body.communities.splice(response.body.communities.indexOf(community_key), 1);
            }
          }
          catch (e) {
          }

        } else {

          if (!response.body.roles[role]) {
            response.body.roles[role] = {};
            response.body.roles[role][community_key] = [location_key];
          } else if (!response.body.roles[role][community_key]) {
            response.body.roles[role][community_key] = [location_key];
          } else if (response.body.roles[role][community_key].indexOf(location_key) < 0) {
            response.body.roles[role][community_key].push(location_key);
          } // else the damn thing is already there

          // add community

          if (!response.body.communities) {
            response.body["communities"] = {};
          }

          if (response.body.communities.indexOf(community_key) < 0) {
            response.body.communities.push(community_key);
          }
        }

        db.put(process.env.DB_COMMUNITIES, user_key, response.body)
          .then(function (result) {
            console.log('User ' + user_key + ' updated with community role.');
            callback(true);
          })
          .fail(function (err) {
            console.warn("WARNING: community706", err);
            callback(false);
          });

      } else {
        console.warn('WARNING:  User not found.');
        callback(false);
      }
    })

    .fail(function (err) {
      console.warn("WARNING: community715", err);
      callback(false);
    });
};

var rename_community = function (old_community_key, location_key, new_community_key) {
  var startKey = 0;

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
              console.log('User ' + result.headers.location.split('/')[3] + ' updated with new community data.');
            })
            .fail(function (err) {
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
      .fail(function (err) {
        console.warn("WARNING: community715", err);
      });
  };

  getUsers(startKey);

};

function handleGetKey(req, res) {
  console.log('Pulling key: ' + req.params.key);

  function pullKey() {
    db.get(process.env.DB_COMMUNITIES, req.params.key)
      .then(function (result) {
        if (result.statusCode == 200) {
          result.body["key"] = req.params.key;
          res.status(200).send(result.body);
        } else {
          console.warn('WARNING: Key not found!');
          res.status(202).send({message: 'Key not found.'});
        }
      })
      .fail(function (err) {
        if (err.statusCode == 404) {
          res.status(404).end();
        } else {
          console.log("WARNING: community737:", err);
          res.status(202).send({message: "Something went wrong."});
        }
      });
  }

  pullKey();
}

module.exports = CommunityApi;