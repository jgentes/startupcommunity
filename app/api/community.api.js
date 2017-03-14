var memjs = require('memjs'),
  mc = memjs.Client.create(),
  path = require('path'),
  request = require('request'),
  _ = require(path.join(__dirname, '../scripts/lodash40.js')),
  Cloudant = require('cloudant'),
  cloudant = Cloudant({
    account: process.env.DB_ACCOUNT,
    password: process.env.DB_PASSWORD,
    plugin: 'promises'
  }),
  cdb = cloudant.db.use(process.env.DB_COMMUNITIES),
  cdb_messages = cloudant.db.use(process.env.DB_MESSAGES);

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
  if (items.rows && items.rows.length) {
    for (i in items.rows) {
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

function handleGetCommunity(req, res) {

  var checkcache = function (cache, community, newresponse) {
    if (!cache) res.status(200).send(newresponse);

    mc.set(community, JSON.stringify(newresponse), function (err, val) {
      if (err) console.warn('WARNING: Memcache error: ', err)
    });
  };

  var community = req.params.community ? req.params.community.replace(/\s+/g, '-') : 'bend-or';

  var pullCommunity = function (cache) {

    // need to determine what 'this' community is, but to optimize the first query, grab all communities and then figure it out (rather than a 'get' for the first community, then another call for the rest)

    cdb.find({
      selector: {
        "$or": [
          {"_id": community},
          {
            "$or": [
              {
                "$and": [
                  {
                    "communities": {
                      "$in": [community]
                    }
                  }, {
                    "type": {
                      "$nin": ["user", "company", "invite"]
                    }
                  }
                ]
              },
              {
                "$and": [
                  {
                    "communities": {
                      "$in": [community]
                    }
                  }, {
                    "type": {
                      "$nin": ["user", "company", "invite"]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    })
      .then(function (result) {
        result = formatFindResults(result);

        var newresponse;

        var finalize = function (results) {
          // finalize iterates through results and formats them nicely

          for (item in results) {

            if (results[item].value && results[item].path.key !== community) {

              // sort communities for use in nav and child dashboard pages

              switch (results[item].value.type) {
                case "location":
                  if (!newresponse.locations) newresponse['locations'] = {};
                  newresponse.locations[results[item].path.key] = results[item].value;
                  break;
                case "cluster":
                  if (results[item].value.community_profiles && results[item].value.community_profiles[community] && results[item].value.community_profiles[community].parents && results[item].value.community_profiles[community].parents[0]) {
                    if (!newresponse.clusters) newresponse['clusters'] = {};
                    // i believe this is for navigation
                    var cluster_type = results[item].value.community_profiles[community].parents[0];
                    if (!newresponse.clusters[cluster_type]) newresponse.clusters[cluster_type] = {};
                    newresponse.clusters[cluster_type][results[item].id] = results[item].value;
                  }
                  break;
                case "company":
                  if (results[item].value.resource) {
                    if (!newresponse.resources) newresponse["resources"] = [];
                    newresponse.resources.push(results[item].value);
                  }

                  if (newresponse.type == 'user') {
                    for (role in newresponse.roles) {
                      if (newresponse.roles[role][results[item].path.key]) {

                        if (!newresponse.companies) newresponse['companies'] = {"count": {}};
                        if (!newresponse.companies[role]) newresponse.companies[role] = {};
                        if (!newresponse.companies[role][results[item].id]) newresponse.companies[role][results[item].path.key] = results[item];
                        if (!newresponse.companies.count[role]) newresponse.companies.count[role] = 0;
                        ++newresponse.companies.count[role];
                      }
                    }
                  }
                  break;
              }

              newresponse[results[item].path.key] = results[item].value;

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
            cdb_messages.find({selector: {'to': newresponse.key}, limit: 100})
              .then(function (messages) {
                messages = formatFindResults(messages);

                messages.docs.sort(function (a, b) {
                  return a.value.published < b.value.published;
                });
                newresponse.messages = {};
                for (mes in messages.docs) {

                  messages.docs[mes].value["key"] = messages.docs[mes]._id;
                  newresponse.messages[messages.docs[mes].id] = messages.docs[mes].value;
                }

                checkcache(cache, community, newresponse);

              })
              .catch(function (err) {
                console.log("WARNING: community171", err);
                res.status(200).send(newresponse);
              });


          } else if (newresponse.type == 'company') {
            // get team

            var startkey = 0,
              teamlist = [],
              thiskey = newresponse.key;

            var getTeam = function (startkey, teamlist) {
              var temproles = {};
              var selector = {"$or": []};

              temproles["roles.leader." + thiskey] = {"$exists": true};
              temproles["roles.founder." + thiskey] = {"$exists": true};
              temproles["roles.investor." + thiskey] = {"$exists": true};
              temproles["roles.team." + thiskey] = {"$exists": true};
              temproles["roles.mentor." + thiskey] = {"$exists": true};
              temproles["roles.provider." + thiskey] = {"$exists": true};

              selector["$or"].push(temproles);

              cdb.find({selector: selector})
                .then(function (team) {
                  team = formatFindResults(team);

                  teamlist.push.apply(teamlist, team.docs);

                  var teamresponse = {},
                    count = {};

                  for (member in teamlist) {
                    var t = teamlist[member];

                    // delete sensitive data
                    if (t.value.profile.password) delete t.value.profile.password;
                    if (t.value.profile.email) delete t.value.profile.email;
                    if (t.value.newsletter) delete t.value.newsletter;
                    if (t.value.profile.linkedin) {
                      if (t.value.profile.linkedin.emailAddress) delete t.value.profile.linkedin.emailAddress;
                      if (t.value.profile.linkedin.access_token) delete t.value.profile.linkedin.access_token;
                    }
                    t.value["key"] = t.path.key;

                    // sort roles
                    for (role in t.value.roles) {
                      for (item in t.value.roles[role]) {
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

                })
                .catch(function (err) {
                  console.log("WARNING: ", err);
                  res.status(200).send(newresponse);
                });
            };

            getTeam(startkey, teamlist)

          } else checkcache(cache, community, newresponse);
        };

        if (result.docs.length > 0) {

          var found = false;

          for (comm in result.docs) {
            var m = result.docs[comm];
            if (m.path.key == community) {
              found = true;

              newresponse = m.value;
              newresponse['key'] = community;

              console.log('Pulling community for ' + m.value.profile.name);

              // grab home

              var m_home;

              if (m.value.profile.home) m_home = m.value.profile.home;

              if (!m.value.resource || m.value.type !== "location") {

                // pull communities within record
                var comm_items = m.value.communities || [];

                // grab parent
                if (m.value.profile.parents && m.value.profile.parents[0]) comm_items.push(m.value.profile.parents[0]);

                if (m_home && m.value.communities.indexOf(m_home) < 0) comm_items.push(m_home);

                comm_items.push(community);

                ubersearch = comm_items;

              } else if (m_home) {
                ubersearch = [m_home];
              } else ubersearch = null;

              console.log(ubersearch);

              if (ubersearch) {

                cdb.find({
                  selector: {
                    "_id": {
                      "$in": ubersearch
                    }
                  }
                })
                  .then(function (uber_result) {
                    uber_result = formatFindResults(uber_result);

                    if (m_home || m.value.type == "location") {
                      var both = result.docs.concat(uber_result.docs);
                      finalize(both);
                    } else finalize(uber_result.docs);
                  })
                  .catch(function (err) {
                    console.log("WARNING: ", err);
                    finalize(result.docs);
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

  var selector = {"$and": []};

  if (resources && resources.length) {
    selector["$and"].push({"_id": {"$in": resources}});
  } else selector["$and"].push({"communities": location_key});

  if (clusters) {
    selector["$and"].push(
      {
        "$or": [
          {"resource": true},
          {"type": "cluster"}
        ]
      })
  } else selector["$and"].push({"resource": true});

  if (searchstring) {

    console.log(searchstring);

    cdb.find({selector: selector})
      .then(function (result) {
        result = formatFindResults(result);

        var newresponse = {};

        if (result.docs.length > 0) {

          for (resource in result.docs) {
            var r = result.docs[resource];

            newresponse[r.path.key] = r.value;
            newresponse[r.path.key]["key"] = r.path.key;
          }

          res.status(200).send(newresponse);

        } else {
          console.log('INFO: No Resources found!');
          res.status(400).send({message: 'No resources found!'});
        }
      })
      .catch(function (err) {
        console.log("WARNING: ", err);
        res.status(202).send({message: 'Something went wrong: ' + err});
      });

  } else res.status(404).send({message: 'Please specify a location!'});
}

function getMore(selector, bookmark) {
  return cdb.find({
    selector: selector,
    limit: 1000,
    bookmark: bookmark
  })
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

    if (industry_keys.length) cluster_search = industry_keys;

  } else if (!community_key || community_key == 'undefined') {
    community_key = location_key;
  }

  // determine whether location is a state
  var state_suffix = handleConvert_state(location_key.replace('-', ' '), 'abbrev'); // returns false if no match
  var state = state_suffix ? ' OR *-' + state_suffix.toLowerCase() + ')' : ')';

  // add search based on home suffix (which allows for roll-up to state level)
  var search = state_suffix ? {"profile.home": {"$text": location_key + state}} : {"communities": {"$in": [location_key, community_key == '*' ? '[a* TO z*]' : community_key]}};

  // get companies and industries

  //var industrysearch = cluster_search ? '(profile.parents:(' + cluster_search + ') OR profile.industries:(' + cluster_search + ')) AND ' + search : search;

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
      data[i] = data[i].doc;
    }
    return data;
  };

  var sortcounts = function (counts, newArray) {
    var sorted = _.fromPairs(_.sortBy(_.toPairs(counts), function (a) {
      return a[1]
    }).reverse());
    if (newArray) {
      var countArray = [];
      for (s in sorted) {
        countArray.push({value: s, count: sorted[s]});
      }
      return countArray;
    } else return sorted;
  };

  // get companies & industries

  var selector = {
    "$and": [{
      "type": "company"
    }, {
      "$or": [ {
        "resource": false
    },{
      "resource": {"$exists": false}
    }]
    }]
  };

  if (cluster_search) {
    selector["$or"] = [{"profile.parents": {"$in": cluster_search}}, {"profile.industries": {"$in": cluster_search}}];
    if (search) selector["$and"].push(search);
  } else selector["$and"].push(search);

  console.log('Pulling Top Results: ', selector);

  var pullTop = function (cache) {

    cdb.find({
      selector: selector
    })
      .then(function (result) {
        result = formatFindResults(result);

            if (result.counts && result.counts['profile.industries']) {
              var sortedIndustries = sortcounts(result.counts['profile.industries'], true);

              top_results.industries = {
                count: Object.keys(result.counts['profile.industries']).reduce(function (previous, key) {
                  return previous + result.counts['profile.industries'][key].value;
                }),
                entries: sortedIndustries
              };

            }

            if (result.counts && result.counts['profile.parents']) {
              var sortedParents = sortcounts(result.counts['profile.parents']);

              top_results.company_parents = {
                count: Object.keys(result.counts['profile.parents']).reduce(function (previous, key) {
                  return previous + result.counts['profile.parents'][key].value;
                }),
                entries: sortedParents
              };
            }

            top_results.companies = {
              count: result.total_rows,
              entries: addkeys(result.rows)
            };

            // get resources

        selector = {
          "$and": [{
            "type": "company"
          }, {"resource": true}]
        };

        if (cluster_search) {
          selector["$or"] = [{"profile.parents": {"$in": cluster_search}}, {"profile.industries": {"$in": cluster_search}}];
          if (search) selector["$and"].push(search);
        } else selector["$and"].push(search);

        cdb.find({
          selector: selector
        })
          .then(function (result) {
            result = formatFindResults(result);

            top_results.resources = {
                  count: result.total_rows,
                  entries: addkeys(result.rows)
                };

                // get people & skills

            selector = {
              "$and": [{
                "type": "user"
              }]
            };

            if (cluster_search) {
              selector["$or"] = [{"profile.parents": {"$in": cluster_search}}, {"profile.skills": {"$in": cluster_search}}];
              if (search) selector["$and"].push(search);
            } else selector["$and"].push(search);

            cdb.find({
              selector: selector,
              limit: 1000
            })
              .then(function (result) {
                result = formatFindResults(result);
                console.log(result.docs.length);
                if (result.bookmark) {
                  getMore(selector, result.bookmark)
                    .then(function(more) {
                      more = formatFindResults(more);
                      var newresult = {};
                      newresult["docs"] = result.docs.concat(more.docs);
                      finish(newresult);
                    });
                } else finish(result);

                    var finish = function(result) {

                      if (result.counts && result.counts['profile.skills']) {
                        var sortedSkills = sortcounts(result.counts['profile.skills'], true);

                        top_results.skills = {
                          count: Object.keys(result.counts['profile.skills']).reduce(function (previous, key) {
                            return previous + result.counts['profile.skills'][key].value;
                          }),
                          entries: sortedSkills
                        };
                      }

                      if (result.counts && result.counts['profile.parents']) {
                        var sortedPeopleParents = sortcounts(result.counts['profile.parents']);

                        top_results.people_parents = {
                          count: Object.keys(result.counts['profile.parents']).reduce(function (previous, key) {
                            return previous + result.counts['profile.parents'][key].value;
                          }),
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

                      mc.set(selector.toString(), JSON.stringify(top_results), function (err, val) {
                        if (err) console.warn('WARNING: Memcache error: ', err)
                      });
                    }

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

  mc.get(selector.toString(), function (err, value) {
    if (value) {
      res.status(200).send(value);
      pullTop(true);
    } else {
      pullTop(false);
    }
  })
  }

  function handleSetCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)

    var settings = req.body.params;

    console.log('Updating settings for ' + settings.location_key + ' / ' + settings.community_key);

    cdb.get(req.user)
      .then(function (response) {

        var user = response;

        // validate user has leader role within the location/community

        if (user.roles && user.roles.leader && user.roles.leader[settings.community_key] && user.roles.leader[settings.community_key].indexOf(settings.location_key) > -1) {

          // update the community

          cdb.get(settings.community_key)
            .then(function (response) {
              if (response.type !== 'location') { // use community_profiles
                if (response.community_profiles === undefined) { // create community_profiles
                  response['community_profiles'] = {};
                }
                if (response.community_profiles[settings.location_key] === undefined) { // create this location
                  response.community_profiles[settings.location_key] = {
                    "name": response.profile.name,
                    "icon": response.profile.icon,
                    "logo": response.profile.logo,
                    "embed": settings.embed
                  };
                } else {
                  response.community_profiles[settings.location_key]["embed"] = settings.embed;
                }
              } else response.profile["embed"] = settings.embed;

              db.insert(settings.community_key, response)
                .then(function (finalres) {
                  res.status(201).send({message: 'Community settings updated.'});
                })
                .catch(function (err) {
                  console.warn('WARNING: community466 ', err);
                  res.status(202).send({message: "Something went wrong."});
                });

            })
            .catch(function (err) {
              console.warn('WARNING: community472 ', err);
              res.status(202).send({message: "Something went wrong."});
            });

        } else {
          console.warn("User is not a leader in location: " + settings.location_key + " and community: " + settings.community_key + "!");
          res.status(202).send({message: 'Sorry, you must be a Leader in this community to change these settings.'});
        }
      })

      .catch(function (err) {
        console.warn("WARNING: community493", err);
      });


  }

  function handleEditCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)

    var settings = req.body.params;

    console.log('Editing community: ' + settings.community.profile.name + ' in ' + settings.location_key);

    cdb.get(req.user)
      .then(function (response) {

        var user = response,
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

          cdb.get(pathname)
            .then(function (response) {
              // go to .catch if community doesn't exist (on .get rather than .search)
              // if community already exists and it's the same type as what's being created, we're good to add the community profile here

              if (response.type && (response.type == "cluster" || response.resource) && response.type == settings.community.type) {

                // create community_profiles (leadership not required if this is a new community)

                if (response.community_profiles === undefined) response['community_profiles'] = {};

                if (response.community_profiles[settings.location_key] === undefined) {

                  // create this location
                  console.log('creating location profile');

                  response.community_profiles[settings.location_key] = {
                    "name": settings.community.profile.name,
                    "headline": settings.community.profile.headline,
                    "icon": response.profile.icon,
                    "parents": settings.community.parents,
                    "industries": settings.community.profile.industries,
                    "embed": settings.community.profile.embed || []
                  };

                  // add community

                  if (!response.communities) {
                    response["communities"] = {};
                  }

                  if (response.communities.indexOf(settings.location_key) < 0) {
                    response.communities.push(settings.location_key);
                  }

                  cdb.insert(pathname, response)
                    .then(function (finalres) {

                      update_user(req.user, 'leader', pathname, settings.location_key, function (good) {
                        if (good) {
                          res.status(201).send({message: 'Industry cluster created!'});
                        } else {
                          res.status(202).send({message: "Something went wrong."});
                        }
                      })
                    })
                    .catch(function (err) {
                      console.warn('WARNING: community533 ', err);
                      res.status(202).send({message: "Something went wrong."});
                    });


                } else {

                  if (leader) {

                    response.community_profiles[settings.location_key] = {
                      "name": settings.community.profile.name,
                      "headline": settings.community.profile.headline,
                      "icon": response.profile.icon,
                      "parents": settings.community.profile.parents,
                      "industries": settings.community.profile.industries,
                      "embed": settings.community.profile.embed || []
                    };

                    // add community

                    if (!response.communities) {
                      response["communities"] = {};
                    }

                    if (response.communities.indexOf(settings.location_key) < 0) {
                      response.communities.push(settings.location_key);
                    }

                    cdb.insert(pathname, response.body)
                      .then(function (finalres) {
                        res.status(201).send({message: 'Successfully updated!'});
                      })
                      .catch(function (err) {
                        console.warn('WARNING: ', err);
                        res.status(202).send({message: "Something went wrong."});
                      });

                  } else res.status(202).send({message: settings.community.profile.name + ' already exists in this location. Please change the name or delete the other one first.'});
                }

              } else {
                res.status(202).send({message: 'That name is taken. Try changing the name.'});
              }

            })
            .catch(function (err) {

              if (err.statusCode == '404') {

                // no existing path, go ahead and create

                var profile = schema.community(settings.community, settings.location_key);

                cdb.insert(pathname, profile)
                  .then(function (finalres) {

                    update_user(req.user, 'leader', pathname, settings.location_key, function (good) {
                      if (good) {
                        res.status(201).send({message: 'Industry cluster created!'});
                      } else res.status(202).send({message: "Something went wrong."});

                    })
                  })
                  .catch(function (err) {
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
      })

      .catch(function (err) {
        console.warn("WARNING: community611", err);
      });

  }

  function handleDeleteCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var settings = req.body.params;

    console.log('Deleting community: ' + settings.community.profile.name + ' in ' + settings.location_key);

    cdb.get(req.user)
      .then(function (response) {

        var user = response;

        // validate user is a leader of the community in this location

        if (user.roles && user.roles.leader && user.roles.leader[settings.community.key].indexOf(settings.location_key) > -1) {

          // get the community

          cdb.get(settings.community.key)
            .then(function (response) {

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

                if (response.communities.length == 0) {

                  // delete the whole thing

                  db.remove(process.env.DB_COMMUNITIES, settings.community.key, 'true')
                    .then(function (finalres) {
                      wrapup();
                    })
                    .catch(function (err) {
                      console.warn('WARNING: community620', err);
                      res.status(202).send({message: "Something went wrong."});
                    });

                } else {

                  cdb.insert(settings.community.key, response)
                    .then(function (finalres) {
                      wrapup();
                    })
                    .catch(function (err) {
                      console.warn('WARNING: community629 ', err);
                      res.status(202).send({message: "Something went wrong."});
                    });
                }

              } else {
                console.log('WARNING: Cannot delete community');
                res.status(202).send({message: "You can't delete " + settings.community.profile.name + " for some reason, but we've been notified and will look into it."});
              }

            })
            .catch(function (err) {

              console.warn('WARNING: community644', err);
              res.status(202).send({message: "Something went wrong."});

            });

        } else {
          console.warn("User is not a member of community: " + settings.community.key + " and location: " + settings.location_key + "!");
          res.status(202).send({message: 'You must be a leader of this community to delete it.'});
        }
      })

      .catch(function (err) {
        console.warn("WARNING: community699", err);
      });

  }

  var update_user = function (user_key, role, community_key, location_key, callback) {

    cdb.get(user_key)
      .then(function (response) {

        if (response.code !== "items_not_found") {

          // add role

          if (!response.roles) {
            response["roles"] = {};
          }

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

            if (!response.communities) {
              response["communities"] = {};
            }

            if (response.communities.indexOf(community_key) < 0) {
              response.communities.push(community_key);
            }
          }

          cdb.insert(user_key, response)
            .then(function (result) {
              console.log('User ' + user_key + ' updated with community role.');
              callback(true);
            })
            .catch(function (err) {
              console.warn("WARNING: community706", err);
              callback(false);
            });

        } else {
          console.warn('WARNING:  User not found.');
          callback(false);
        }
      })

      .catch(function (err) {
        console.warn("WARNING: community715", err);
        callback(false);
      });
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
     console.log('User ' + result.headers.location.split('/')[3] + ' updated with new community data.');
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

  function handleGetKey(req, res) {
    console.log('Pulling key: ' + req.params.key);

    function pullKey() {
      cdb.get(req.params.key)
        .then(function (result) {
          if (result.statusCode == 200) {
            result["key"] = req.params.key;
            res.status(200).send(result);
          } else {
            console.warn('WARNING: Key not found!');
            res.status(202).send({message: 'Key not found.'});
          }
        })
        .catch(function (err) {
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