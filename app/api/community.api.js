var keys = require('../keys.json')[process.env.NODE_ENV || 'development'],
    memjs = require('memjs'),
    mc = memjs.Client.create(),
    _ = require('lodash'),
    db = require('orchestrate')(keys.db.key);

//var util = require('util'); //for util.inspect on request
//request = require('request');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function () {
    this.getCommunity = handleGetCommunity;
    this.setCommunity = handleSetCommunity;
    this.addCommunity = handleAddCommunity;
    this.deleteCommunity = handleDeleteCommunity;
    this.getKey = handleGetKey;
    this.getTop = handleGetTop;
};

var convert_state = function (name, to) {
    name = name.toUpperCase();
    var states = new Array({'name': 'Alabama', 'abbrev': 'AL'}, {'name': 'Alaska', 'abbrev': 'AK'},
        {'name': 'Arizona', 'abbrev': 'AZ'}, {'name': 'Arkansas', 'abbrev': 'AR'}, {
            'name': 'California',
            'abbrev': 'CA'
        },
        {'name': 'Colorado', 'abbrev': 'CO'}, {'name': 'Connecticut', 'abbrev': 'CT'}, {
            'name': 'Delaware',
            'abbrev': 'DE'
        },
        {'name': 'Florida', 'abbrev': 'FL'}, {'name': 'Georgia', 'abbrev': 'GA'}, {'name': 'Hawaii', 'abbrev': 'HI'},
        {'name': 'Idaho', 'abbrev': 'ID'}, {'name': 'Illinois', 'abbrev': 'IL'}, {'name': 'Indiana', 'abbrev': 'IN'},
        {'name': 'Iowa', 'abbrev': 'IA'}, {'name': 'Kansas', 'abbrev': 'KS'}, {'name': 'Kentucky', 'abbrev': 'KY'},
        {'name': 'Louisiana', 'abbrev': 'LA'}, {'name': 'Maine', 'abbrev': 'ME'}, {'name': 'Maryland', 'abbrev': 'MD'},
        {'name': 'Massachusetts', 'abbrev': 'MA'}, {'name': 'Michigan', 'abbrev': 'MI'}, {
            'name': 'Minnesota',
            'abbrev': 'MN'
        },
        {'name': 'Mississippi', 'abbrev': 'MS'}, {'name': 'Missouri', 'abbrev': 'MO'}, {
            'name': 'Montana',
            'abbrev': 'MT'
        },
        {'name': 'Nebraska', 'abbrev': 'NE'}, {'name': 'Nevada', 'abbrev': 'NV'}, {
            'name': 'New Hampshire',
            'abbrev': 'NH'
        },
        {'name': 'New Jersey', 'abbrev': 'NJ'}, {'name': 'New Mexico', 'abbrev': 'NM'}, {
            'name': 'New York',
            'abbrev': 'NY'
        },
        {'name': 'North Carolina', 'abbrev': 'NC'}, {'name': 'North Dakota', 'abbrev': 'ND'}, {
            'name': 'Ohio',
            'abbrev': 'OH'
        },
        {'name': 'Oklahoma', 'abbrev': 'OK'}, {'name': 'Oregon', 'abbrev': 'OR'}, {
            'name': 'Pennsylvania',
            'abbrev': 'PA'
        },
        {'name': 'Rhode Island', 'abbrev': 'RI'}, {'name': 'South Carolina', 'abbrev': 'SC'}, {
            'name': 'South Dakota',
            'abbrev': 'SD'
        },
        {'name': 'Tennessee', 'abbrev': 'TN'}, {'name': 'Texas', 'abbrev': 'TX'}, {'name': 'Utah', 'abbrev': 'UT'},
        {'name': 'Vermont', 'abbrev': 'VT'}, {'name': 'Virginia', 'abbrev': 'VA'}, {
            'name': 'Washington',
            'abbrev': 'WA'
        },
        {'name': 'West Virginia', 'abbrev': 'WV'}, {'name': 'Wisconsin', 'abbrev': 'WI'}, {
            'name': 'Wyoming',
            'abbrev': 'WY'
        }
    );
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
            "name": community.profile.name,
            "icon": "fa-circle-o",
            "headline": community.profile.headline,
            "industries": community.profile.industries
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
    var community = req.params.community;

    var searchString = '@path.key: ' + community; // grab the primary community object, don't use parens here
    searchString += ' OR ((@value.communities: "' + community + '"'; // + grab anything associated with this community in this location
    searchString += ' OR @value.parents: "' + community + '")'; // + grab anything that has this community as a parent
    searchString += ' AND NOT @value.type:("company" OR "user"))'; // exclude companies and users

    var pullCommunity = function(cache) {

        // need to determine what 'this' community is, but to optimize the first query, grab all communities and then figure it out (rather than a 'get' for the first community, then another call for the rest)

        db.newSearchBuilder()
            .collection(keys.db.communities)
            .limit(100)
            .offset(0)
            .query(searchString)
            .then(function (result) {
                var newresponse = {};

                var finalize = function (results) {

                    for (item in results) {
                        newresponse[results[item].path.key] = results[item].value;
                        newresponse[results[item].path.key]["key"] = results[item].path.key;
                    }
                    newresponse["key"] = community;

                    // get messages for users
                    if (newresponse[community].type == 'user') {
                        db.newSearchBuilder()
                            .collection(keys.db.messages)
                            .limit(100)
                            .offset(0)
                            .sort('@value.published', 'asc')
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

                                if (!cache) res.status(200).send(newresponse);

                                mc.set(community, JSON.stringify(newresponse), function(err, val) {
                                    if (err) console.warn('WARNING: Memcache error: ', err)
                                });
                            })
                            .fail(function (err) {
                                console.log("WARNING: community171", err);
                                res.status(200).send(newresponse);
                            });

                    } else {
                        if (!cache) res.status(200).send(newresponse);

                        mc.set(community, JSON.stringify(newresponse), function(err, val) {
                            if (err) console.warn('WARNING: Memcache error: ', err)
                        });
                    }
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

                                db.newSearchBuilder()
                                    .collection(keys.db.communities)
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
                console.log('Pulling community: ' + community);
                pullCommunity(false);
            }
        })

    } else res.status(404).send({message: 'Please specify a community!'});
}

function handleGetTop(req, res) {
    // GetTop updates a db record that is used as cache for subsequent reads by client.. 4 calls is too expensive to call directly from the client
    //console.log(util.inspect(req)); // used for logging circular request
    var community_key = req.params.community_key,
        location_key = req.params.location_key,
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

    } else if (!community_key || community_key == 'undefined') community_key = location_key;

    var search = '@value.communities: "' + location_key + '" AND @value.communities: ' + (community_key == '*' ? '*' : '"' + community_key + '"');

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
            .collection(keys.db.communities)
            .aggregate('top_values', 'value.profile.industries')
            .aggregate('top_values', 'value.profile.parents')
            .sort('@path.reftime', 'desc')
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
                    .collection(keys.db.communities)
                    .aggregate('top_values', 'value.profile.skills')
                    .aggregate('top_values', 'value.profile.parents')
                    .sort('@path.reftime', 'desc')
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
                            .collection(keys.db.communities)
                            .sort('@path.reftime', 'desc')
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
                                    labels: _.union(c_labels, p_labels).slice(0,3),
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

                                top_results.parents = temp;

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
                console.log('Pulling top: ' + industrysearch);
                pullTop(false);
            }
        })

    } else res.status(404).send({message: 'Please specify a community!'});
}

function handleSetCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var settings = req.body.params;

    console.log('Updating settings for ' + settings.location_key + ' / ' + settings.community_key);
    console.log(settings);

    db.get(keys.db.communities, req.user)
        .then(function (response) {

            if (response.body.code !== "items_not_found") {
                var user = response.body;

                // validate user has leader role within the location/community
                if (user.roles && user.roles.leader && user.roles.leader[settings.community_key] && user.roles.leader[settings.community_key].indexOf(settings.location_key) > -1) {
                    // update the community
                    db.get(keys.db.communities, settings.community_key)
                        .then(function (response) {
                            if (response.body.type == 'cluster') { // use community_profiles
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

                            db.put(keys.db.communities, settings.community_key, response.body)
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

function handleAddCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var settings = req.body.params;

    console.log('Adding community: ' + settings.community.profile.name + ' in ' + settings.location_key);

    db.get(keys.db.communities, req.user)
        .then(function (response) {

            if (response.body.code !== "items_not_found") {
                var user = response.body;

                // validate user is a member in the location
                if (user.communities.indexOf(settings.location_key) > -1) {

                    var pathname = settings.community.url || encodeURI(settings.community.profile.name.toLowerCase());

                    // check to see if the community exists
                    db.get(keys.db.communities, pathname)
                        .then(function (response) {

                            if (response.body.type && (response.body.type == "cluster" || response.body.type == "network") && response.body.type == settings.community.type) {
                                // community already exists, we're good to add the community profile here
                                if (response.body.community_profiles === undefined) {
                                    // create community_profiles
                                    response.body['community_profiles'] = {};
                                }
                                if (response.body.community_profiles[settings.location_key] === undefined) {
                                    // create this location
                                    response.body.community_profiles[settings.location_key] = {
                                        "name": settings.community.profile.name,
                                        "headline": settings.community.profile.headline,
                                        "icon": response.body.profile.icon,
                                        "parents": settings.community.parents,
                                        "industries": settings.community.profile.industries
                                    };

                                    // add community
                                    if (!response.body.communities) {
                                        response.body["communities"] = {};
                                    }

                                    if (response.body.communities.indexOf(settings.location_key) < 0) {
                                        response.body.communities.push(settings.location_key);
                                    }

                                    db.put(keys.db.communities, pathname, response.body)
                                        .then(function (finalres) {

                                            update_user(req.user, 'leader', pathname, settings.location_key)
                                                .then(function(response) {
                                                    console.log(response);
                                                    res.status(201).send({message: settings.community.type.toUpperCase() + settings.community.type.slice(1) + ' created!'});
                                                })
                                        })
                                        .fail(function (err) {
                                            console.warn('WARNING: community533 ', err);
                                            res.status(202).send({message: "Something went wrong."});
                                        });


                                } else {
                                    res.status(202).send({message: settings.community.profile.name + ' already exists in this location. Please change the name or delete the other one first.'});
                                }

                            } else {
                                res.status(202).send({message: 'That name is taken. Try changing the name.'});
                            }



                        })
                        .fail(function (err) {

                            if (err.statusCode == '404') {
                                // no existing path, go ahead and create

                                var profile = schema.community(settings.community, settings.location_key);

                                db.put(keys.db.communities, pathname, profile)
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

    db.get(keys.db.communities, req.user)
        .then(function (response) {

            if (response.body.code !== "items_not_found") {
                var user = response.body;

                // validate user is a leader of the community in this location
                if (user.roles && user.roles.leader && user.roles.leader[settings.community.key].indexOf(settings.location_key) > -1) {

                    // get the community
                    db.get(keys.db.communities, settings.community.key)
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
                                    db.remove(keys.db.communities, settings.community.key, 'true')
                                        .then(function (finalres) {
                                            res.status(204).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!'});
                                        })
                                        .fail(function (err) {
                                            console.warn('WARNING: community620', err);
                                            res.status(202).send({message: "Something went wrong."});
                                        });
                                } else {
                                    db.put(keys.db.communities, settings.community.key, response.body)
                                        .then(function (finalres) {
                                            res.status(204).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!'});
                                        })
                                        .fail(function (err) {
                                            console.warn('WARNING: community629 ', err);
                                            res.status(202).send({message: "Something went wrong."});
                                        });
                                }

                                update_user(req.user, 'delete', settings.community.key, settings.location_key);

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

var update_user = function(user_key, role, cluster_key, location_key) {

    return db.get(keys.db.communities, user_key)
        .then(function(response){

            if (response.body.code !== "items_not_found") {
                // add role
                if (!response.body.roles) {
                    response.body["roles"] = {};
                }

                if (role == 'delete') {

                    try {
                        if (response.body.roles.leader[cluster_key].indexOf(location_key) > -1) {
                            var index = response.body.roles.leader[cluster_key].indexOf(location_key);
                            response.body.roles.leader[cluster_key].splice(index, 1);
                        }
                        if (response.body.roles.leader[cluster_key].length == 0) {
                            delete response.body.roles.leader[cluster_key]
                        }
                    }
                    catch (e) {}

                } else {

                    if (!response.body.roles[role]) {
                        response.body.roles[role] = {};
                        response.body.roles[role][cluster_key] = [location_key];
                    } else if (!response.body.roles[role][cluster_key]) {
                        response.body.roles[role][cluster_key] = [location_key];
                    } else if (response.body.roles[role][cluster_key].indexOf(location_key) < 0) {
                        response.body.roles[role][cluster_key].push(location_key);
                    } // else the damn thing is already there

                    // add community
                    if (!response.body.communities) {
                        response.body["communities"] = {};
                    }

                    if (response.body.communities.indexOf(cluster_key) < 0) {
                        response.body.communities.push(cluster_key);
                    }
                }

                db.put(keys.db.communities, user_key, response.body)
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

function handleGetKey(req, res) {
    console.log('Pulling key: ' + req.params.key);

    function pullKey() {
        db.get(keys.db.communities, req.params.key)
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