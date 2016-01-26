var memjs = require('memjs'),
    mc = memjs.Client.create(),
    path = require('path'),
    _ = require(path.join(__dirname, '../scripts/lodash40.js')),
    db = require('orchestrate')(process.env.DB_KEY);

//var util = require('util'); //for util.inspect on request
//request = require('request');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function () {
    this.getCommunity = handleGetCommunity;
    this.setCommunity = handleSetCommunity;
    this.editCommunity = handleEditCommunity;
    this.deleteCommunity = handleDeleteCommunity;
    this.getKey = handleGetKey;
    this.getTop = handleGetTop;
    this.convert_state = convert_state;
};

var convert_state = function (name, to) {
    name = name.toUpperCase();
    var states = [
        {'name': 'Alabama', 'abbrev': 'AL'}, {'name': 'Alaska', 'abbrev': 'AK'}, {'name': 'Arizona', 'abbrev': 'AZ'}, {'name': 'Arkansas', 'abbrev': 'AR'}, {'name': 'California', 'abbrev': 'CA'},
        {'name': 'Colorado', 'abbrev': 'CO'}, {'name': 'Connecticut', 'abbrev': 'CT'}, {'name': 'Delaware', 'abbrev': 'DE'}, {'name': 'Florida', 'abbrev': 'FL'}, {'name': 'Georgia', 'abbrev': 'GA'},
        {'name': 'Hawaii', 'abbrev': 'HI'}, {'name': 'Idaho', 'abbrev': 'ID'}, {'name': 'Illinois', 'abbrev': 'IL'}, {'name': 'Indiana', 'abbrev': 'IN'}, {'name': 'Iowa', 'abbrev': 'IA'},
        {'name': 'Kansas', 'abbrev': 'KS'}, {'name': 'Kentucky', 'abbrev': 'KY'}, {'name': 'Louisiana', 'abbrev': 'LA'}, {'name': 'Maine', 'abbrev': 'ME'}, {'name': 'Maryland', 'abbrev': 'MD'},
        {'name': 'Massachusetts', 'abbrev': 'MA'}, {'name': 'Michigan', 'abbrev': 'MI'}, {'name': 'Minnesota', 'abbrev': 'MN'}, {'name': 'Mississippi', 'abbrev': 'MS'},  {'name': 'Missouri', 'abbrev': 'MO'},
        {'name': 'Montana', 'abbrev': 'MT'}, {'name': 'Nebraska', 'abbrev': 'NE'}, {'name': 'Nevada', 'abbrev': 'NV'}, {'name': 'New Hampshire', 'abbrev': 'NH'}, {'name': 'New Jersey', 'abbrev': 'NJ'},
        {'name': 'New Mexico', 'abbrev': 'NM'}, {'name': 'New York', 'abbrev': 'NY'}, {'name': 'North Carolina', 'abbrev': 'NC'}, {'name': 'North Dakota', 'abbrev': 'ND'}, {'name': 'Ohio', 'abbrev': 'OH'},
        {'name': 'Oklahoma', 'abbrev': 'OK'}, {'name': 'Oregon', 'abbrev': 'OR'}, {'name': 'Pennsylvania','abbrev': 'PA'}, {'name': 'Rhode Island', 'abbrev': 'RI'}, {'name': 'South Carolina', 'abbrev': 'SC'},
        {'name': 'South Dakota','abbrev': 'SD'}, {'name': 'Tennessee', 'abbrev': 'TN'}, {'name': 'Texas', 'abbrev': 'TX'}, {'name': 'Utah', 'abbrev': 'UT'}, {'name': 'Vermont', 'abbrev': 'VT'},
        {'name': 'Virginia', 'abbrev': 'VA'}, {'name': 'Washington', 'abbrev': 'WA'}, {'name': 'West Virginia', 'abbrev': 'WV'}, {'name': 'Wisconsin', 'abbrev': 'WI'}, {'name': 'Wyoming', 'abbrev': 'WY'}
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
            "embed" : community.profile.embed || []
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

function handleGetCommunity(req, res) {

    var checkcache = function(cache, community, newresponse) {
        if (!cache) res.status(200).send(newresponse);

        mc.set(community, JSON.stringify(newresponse), function(err, val) {
            if (err) console.warn('WARNING: Memcache error: ', err)
        });
    };

    var community = req.params.community;

    var searchString = '@path.key: ' + community; // grab the primary community object, don't use parens here
    searchString += ' OR ((@value.communities: "' + community + '"'; // + grab anything associated with this community in this location
    searchString += ' OR @value.primary: true '; // + pull primary industries (clusters)
    searchString += ' OR @value.parents: "' + community + '")'; // + grab anything that has this community as a parent
    searchString += ' AND NOT @value.type:("company" OR "user"))'; // exclude companies and user

    var pullCommunity = function(cache) {

        // need to determine what 'this' community is, but to optimize the first query, grab all communities and then figure it out (rather than a 'get' for the first community, then another call for the rest)

        db.newSearchBuilder()
            .collection(process.env.DB_COMMUNITIES)
            .limit(100)
            .offset(0)
            .query(searchString)
            .then(function (result) {
                var newresponse = {};

                var finalize = function (results) {

                    for (item in results) {
                        if (results[item].value) {
                            newresponse[results[item].path.key] = results[item].value;
                            newresponse[results[item].path.key]["key"] = results[item].path.key;
                        }
                    }
                    newresponse["key"] = community;

                    // get messages for users
                    if (newresponse[community].type == 'user') {
                        db.newSearchBuilder()
                            .collection(process.env.DB_MESSAGES)
                            .limit(100)
                            .offset(0)
                            .sortBy('@value.published:asc')
                            .query('@value.to: "' + newresponse.key + '"')
                            .then(function (messages) {
                                messages.body.results.sort(function (a, b) {
                                    return a.value.published < b.value.published;
                                });
                                newresponse.messages = {};
                                for (m in messages.body.results) {

                                    messages.body.results[m].value["key"] = messages.body.results[m].path.key;
                                    newresponse.messages[messages.body.results[m].path.key] = messages.body.results[m].value;
                                }

                                checkcache(cache, community, newresponse);

                            })
                            .fail(function (err) {
                                console.log("WARNING: community171", err);
                                res.status(200).send(newresponse);
                            });

                    } else if (newresponse[community].type == 'company') {
                        // get team
                        db.newSearchBuilder()
                            .collection(process.env.DB_COMMUNITIES)
                            .limit(100)
                            .offset(0)
                            .sortRandom()
                            .query('@value.type:"user" AND @value.roles.*.' + newresponse[community].key + ':*')
                            .then(function (team) {

                                newresponse[community]['team'] = {};

                                for (t in team.body.results) {
                                    team.body.results[t].value["key"] = team.body.results[t].path.key;
                                    newresponse[community].team[team.body.results[t].path.key] = team.body.results[t];
                                }

                                checkcache(cache, community, newresponse);

                            })
                            .fail(function (err) {
                                console.log("WARNING: ", err);
                                res.status(200).send(newresponse);
                            });

                    } else checkcache(cache, community, newresponse);
                };

                if (result.body.results.length > 0) {
                    var found = false;
                    for (comm in result.body.results) {
                        var m = result.body.results[comm];

                        if (m.path.key == community) {
                            found = true;

                            console.log('Pulling community for ' + m.value.profile.name);

                            if (m.value.type == "user" ||
                                m.value.type == "company" ||
                                m.value.type == "network") {

                                // pull communities within record
                                var comm_items = m.value.communities;
                                var search = community;
                                if (comm_items) {
                                    search += " OR ";
                                    for (i in comm_items) {
                                        if (i > 0) {
                                            search += ' OR ';
                                        }
                                        search += comm_items[i];
                                    }
                                }
/*

                                // also grab clusters

                                if (!m.value.profile.parents) m.value.profile.parents = [];
                                if (!m.value.profile.industries) m.value.profile.industries = [];
                                if (!m.value.profile.skills) m.value.profile.skills = [];

                                var cluster_items = m.value.profile.parents.concat(m.value.profile.industries, m.value.profile.skills);
                                var clusters = '"';

                                if (cluster_items.length) {
                                    for (c in cluster_items) {
                                        if (c > 0 && c < cluster_items.length) {
                                            clusters += '" OR "';
                                        }
                                        clusters += cluster_items[c];
                                    }
                                    clusters += '"';
                                }

                                var ubersearch = '(@path.key: (' + search + ')) OR (@value.type: "cluster" AND @value.communities: "' + m.value.profile.home + '" AND (@value.profile.industries: (' + clusters + ') OR @value.community_profiles.' + m.value.profile.home + '.industries: (' + clusters + ')))';
*/

                                var ubersearch = '(@path.key: (' + search + '))';

                                console.log(ubersearch) // LEAVE THIS HERE.. NEED TO FIGURE OUT HOW TO NOT PULL ALL THIS SHIT TO IMPROVE PERFORMANCE
                                db.newSearchBuilder()
                                    .collection(process.env.DB_COMMUNITIES)
                                    .limit(100)
                                    .offset(0)
                                    .query(ubersearch)
                                    .then(function (result2) {
                                        finalize(result2.body.results);
                                    })
                                    .fail(function (err) {
                                        console.log("WARNING: community219", err);
                                        finalize(result.body.results);
                                    });

                            } else finalize(result.body.results);

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
            .fail(function (err) {
                console.log("WARNING: community236", err);
                res.status(202).send({message: 'Something went wrong: ' + err});
            });
    };

    if (community) {

        mc.get(community, function(err, value) {
            if (value) {
                res.status(200).send(value);
                pullCommunity(true);
            } else {
                pullCommunity(false);
            }
        })

    } else res.status(404).send({message: 'Please specify a community!'});
}

function handleGetTop(req, res) {

    //console.log(util.inspect(req)); // used for logging circular request
    var community_key = encodeURI(req.params.community_key),
        location_key = encodeURI(req.params.location_key),
        cluster_key = req.query.cluster_key,
        industry_keys = req.query.industry_keys,
        has_location = true,
        top_results = {
            people: {},
            companies: {},
            skills: {},
            people_parents: {},
            company_parents: {}
        },
        cluster_search = "";

    if( typeof industry_keys === 'string' ) {
        industry_keys = [ industry_keys ];
    }

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
    var state_suffix = convert_state(location_key.replace('-',' '), 'abbrev'); // returns false if no match
    var state = state_suffix ? ' OR "*-' + state_suffix.toLowerCase() + '")' : ')';

    // add search based on home suffix (which allows for roll-up to state level)
    var search = state_suffix ?
        '@value.profile.home: ("' + location_key + '"' + state :
        '@value.communities: "' + location_key + '" AND @value.communities: ' + (community_key == '*' ? '*' : '"' + community_key + '"');

    // get companies and industries

    var industrysearch = cluster_search ? '(@value.profile.parents:(' + cluster_search + ') OR @value.profile.industries:(' + cluster_search + ')) AND ' + search : search;

    console.log('Pulling Top Results: ', industrysearch);

    var addkeys = function(data) {
        for (i in data) {
            data[i].value["key"] = data[i].path.key;
        }
        return data;
    };

    // get companies & industries

    var pullTop = function(cache) {

        db.newSearchBuilder()
            .collection(process.env.DB_COMMUNITIES)
            .aggregate('top_values', 'value.profile.industries')
            .aggregate('top_values', 'value.profile.parents')
            .sortRandom()
            .query(industrysearch + ' AND @value.type: "company"')
            .then(function (result) {

                for (a in result.body.aggregates) {
                    if (result.body.aggregates[a].field_name == 'value.profile.industries') {
                        top_results.industries = {
                            count: result.body.aggregates[a].value_count,
                            entries: result.body.aggregates[a].entries
                        };
                    }
                    if (result.body.aggregates[a].field_name == 'value.profile.parents') {
                        top_results.company_parents = {
                            count: result.body.aggregates[a].value_count,
                            entries: result.body.aggregates[a].entries
                        };
                    }
                }

                top_results.companies = {
                    count: result.body.total_count,
                    entries: addkeys(result.body.results).slice(0,5)
                };

                // get people & skills

                var skillsearch = cluster_search ? '(@value.profile.parents:(' + cluster_search + ') OR @value.profile.skills:(' + cluster_search + ')) AND ' + search : search;

                db.newSearchBuilder()
                    .collection(process.env.DB_COMMUNITIES)
                    .aggregate('top_values', 'value.profile.skills')
                    .aggregate('top_values', 'value.profile.parents')
                    .sortRandom()
                    .query(skillsearch + ' AND @value.type: "user"')
                    .then(function (result) {

                        for (b in result.body.aggregates) {
                            if (result.body.aggregates[b].field_name == 'value.profile.skills') {
                                top_results.skills = {
                                    count: result.body.aggregates[b].value_count,
                                    entries: result.body.aggregates[b].entries
                                };
                            }
                            if (result.body.aggregates[b].field_name == 'value.profile.parents') {
                                top_results.people_parents = {
                                    count: result.body.aggregates[b].value_count,
                                    entries: result.body.aggregates[b].entries
                                };
                            }
                        }

                        top_results.people = {
                            count: result.body.total_count,
                            entries: addkeys(result.body.results).slice(0,5)
                        };


                        // get leaders
                        db.newSearchBuilder()
                            .collection(process.env.DB_COMMUNITIES)
                            .sortRandom()
                            .query('@value.roles.leader.' + (cluster_key ? cluster_key : community_key) + ': "' + location_key + '" AND @value.type: "user"')
                            .then(function (result) {

                                top_results.leaders = addkeys(result.body.results).slice(0,5);

                                // BEGIN PARENTS (this is mostly to avoid another api call that includes both companies and users)

                                var c_labels = [],
                                    c_numbers = [],
                                    p_labels = [],
                                    p_numbers = [];

                                for (c in top_results.company_parents.entries) {
                                    if (top_results.company_parents.entries[c].value) {
                                        c_labels.push(top_results.company_parents.entries[c].value);
                                        c_numbers.push(top_results.company_parents.entries[c].count);
                                    }
                                }

                                for (p in top_results.people_parents.entries) {
                                    if (top_results.people_parents.entries[p].value) {
                                        p_labels.push(top_results.people_parents.entries[p].value);
                                        p_numbers.push(top_results.people_parents.entries[p].count);
                                    }
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

                                // END PARENTS

                                if (!cache) res.status(200).send(top_results);

                                mc.set(industrysearch, JSON.stringify(top_results), function(err, val) {
                                    if (err) console.warn('WARNING: Memcache error: ', err)
                                });

                            })
                            .fail(function (err) {
                                console.log("WARNING: community401", err);
                                res.status(202).send({message: 'Something went wrong: ' + err});
                            });
                    })
                    .fail(function (err) {
                        console.log("WARNING: community406", err);
                        res.status(202).send({message: 'Something went wrong: ' + err});
                    });

            })
            .fail(function (err) {
                console.log("WARNING: community412", err);
                res.status(202).send({message: 'Something went wrong: ' + err});
            });
    };

    if (industrysearch) {

        mc.get(industrysearch, function(err, value) {
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

                    var pathname = settings.community.url || encodeURI(settings.community.profile.name.toLowerCase());

                    // check to see if user is a leader of the community

                    if (user.roles && user.roles.leader && user.roles.leader[pathname] && user.roles.leader[pathname].indexOf(settings.location_key) > -1) {
                        leader = true;
                    }

                    // check to see if the community exists

                    db.get(process.env.DB_COMMUNITIES, pathname)
                        .then(function (response) {
                            // go to .fail if community doesn't exist
                            // if community already exists and it's the same type as what's being created, we're good to add the community profile here

                            if (response.body.type && (response.body.type == "cluster" || response.body.type == "network") && response.body.type == settings.community.type) {

                                // create community_profiles

                                if (response.body.community_profiles === undefined) response.body['community_profiles'] = {};

                                if (response.body.community_profiles[settings.location_key] === undefined) {

                                    // create this location

                                    response.body.community_profiles[settings.location_key] = {
                                        "name": settings.community.profile.name,
                                        "headline": settings.community.profile.headline,
                                        "icon": response.body.profile.icon,
                                        "parents": settings.community.parents,
                                        "industries": settings.community.profile.industries,
                                        "embed" : settings.community.profile.embed || []
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

                                            update_user(req.user, 'leader', pathname, settings.location_key)
                                                .then(function() {
                                                res.status(201).send({message: settings.community.type.toUpperCase() + settings.community.type.slice(1) + ' created!'});
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
                                            "embed" : settings.community.profile.embed || []
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
                                                res.status(201).send({message: settings.community.type.toUpperCase() + settings.community.type.slice(1) + ' updated!'});
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

                                        update_user(req.user, 'leader', pathname, settings.location_key)
                                            .then(function() {
                                            res.status(201).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' created!'});
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
                    res.status(202).send({ message: 'You must be a member of this community to add to it.' });
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

                            if (response.body.type && (response.body.type == "cluster" || response.body.type == "network") && response.body.type == settings.community.type) {

                                // community already exists, we're good to remove the community profile here

                                if (response.body.community_profiles !== undefined && response.body.community_profiles[settings.location_key]) {
                                    delete response.body.community_profiles[settings.location_key];
                                }

                                // remove from community

                                if (response.body.communities.indexOf(settings.location_key) > -1) {
                                    var index = response.body.communities.indexOf(settings.location_key);
                                    response.body.communities.splice(index, 1);
                                }

                                if (response.body.communities.length == 0) {

                                    // delete the whole thing

                                    db.remove(process.env.DB_COMMUNITIES, settings.community.key, 'true')
                                        .then(function (finalres) {
                                            res.status(204).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!'});
                                        })
                                        .fail(function (err) {
                                            console.warn('WARNING: community620', err);
                                            res.status(202).send({message: "Something went wrong."});
                                        });

                                } else {

                                    db.put(process.env.DB_COMMUNITIES, settings.community.key, response.body)
                                        .then(function (finalres) {
                                            res.status(204).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!'});
                                        })
                                        .fail(function (err) {
                                            console.warn('WARNING: community629 ', err);
                                            res.status(202).send({message: "Something went wrong."});
                                        });
                                }

                                if (settings.old_community_key) {

                                    // this is a rename operation

                                    rename_community(settings.old_community_key, settings.location_key, settings.community.key);

                                } else {

                                    update_user(req.user, 'delete', settings.community.key, settings.location_key)
                                        .then(function () {
                                            console.log('Community deleted.');
                                        })
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
                    res.status(202).send({ message: 'You must be a leader of this community to delete it.' });
                }

            } else {
                console.warn('WARNING:  User not found.');
            }
        })

        .fail(function (err) {
            console.warn("WARNING: community699", err);
        });

}

var update_user = function(user_key, role, community_key, location_key) {

    return db.get(process.env.DB_COMMUNITIES, user_key)
        .then(function(response){

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
                    catch (e) {}

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
                    .then(function(result) {
                        console.log('User ' + user_key + ' updated with community role.');
                    })
                    .fail(function(err){
                        console.warn("WARNING: community706", err);
                    });

            } else {
                console.warn('WARNING:  User not found.');
            }
        })

        .fail(function(err){
            console.warn("WARNING: community715", err);
        });
};

var rename_community = function(old_community_key, location_key, new_community_key) {
    var startKey = 0;

    console.log('Renaming ' + old_community_key + ' to ' + new_community_key);

    function getUsers(startKey) {

        db.newSearchBuilder()
            .collection(process.env.DB_COMMUNITIES)
            .limit(50)
            .offset(startKey)
            .query('@value.communities: "' + encodeURI(old_community_key) + '" OR @value.roles.*.' + encodeURI(old_community_key) + ': "' + encodeURI(location_key) + '"')
            .then(function (data) {
                var item;

                for (item in data.body.results) {
                    var newdata = data.body.results[item].value; // get current record
                    // Rename community
                    if (data.body.results[item].value.communities.indexOf(old_community_key) > -1) {

                        // only add the new community if the old one existed

                        if (data.body.results[item].value.communities.indexOf(new_community_key) < 0) data.body.results[item].value.communities.push(new_community_key);

                        data.body.results[item].value.communities.splice(data.body.results[item].value.communities.indexOf(old_community_key), 1);
                    }

                    for (role in data.body.results[item].value.roles) {
                        for (community in data.body.results[item].value.roles[role]) {
                            if (community == old_community_key) {
                                if (!data.body.results[item].value.roles[role][new_community_key]) data.body.results[item].value.roles[role][new_community_key] = [];
                                if (data.body.results[item].value.roles[role][new_community_key].indexOf(location_key) < 0) data.body.results[item].value.roles[role][new_community_key].push(location_key);
                                delete data.body.results[item].value.roles[role][old_community_key];
                            }
                        }
                    }

                    console.log('Updated ' + data.body.results[item].path.key);
                }

                if (data.body.next) {
                    startKey = startKey + limit;
                    console.log('Getting next group..' + startKey);
                    getUsers(startKey);
                } else {
                    console.log('Community renamed.')
                }
            })
            .fail(function(err){
                console.warn("WARNING: community715", err);
            });
    }
};

function handleGetKey(req, res) {
    console.log('Pulling key: ' + req.params.key);

    function pullKey() {
        db.get(process.env.DB_COMMUNITIES, encodeURI(req.params.key))
            .then(function (result) {
                if (result.statusCode == 200) {
                    result.body["key"] = encodeURI(req.params.key);
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