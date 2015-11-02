var config = require('../config.json')[process.env.NODE_ENV || 'development'],
    memjs = require('memjs'),
    mc = memjs.Client.create(),
    db = require('orchestrate')(config.db.key);

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
    searchString += ' OR @value.parents: "' + community + '")'; // + grab anything associated with this community as a parent
    searchString += ' AND NOT @value.type:("company" OR "user"))'; // exclude companies and users

    var pullCommunity = function(cache) {

        // need to determine what 'this' community is, but to optimize the first query, grab all communities and then figure it out

        db.newSearchBuilder()
            .collection(config.db.communities)
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
                            .collection(config.db.messages)
                            .limit(100)
                            .offset(0)
                            .sort('@value.published', 'asc')
                            .query('@value.to:' + newresponse.key)
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
                                console.log("WARNING: SEARCH FAIL:");
                                console.warn(err);
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

                        if (result.body.results[comm].path.key == community) {
                            found = true;

                            console.log('Pulling community for ' + result.body.results[comm].value.profile.name);

                            if (result.body.results[comm].value.type == "user" ||
                                result.body.results[comm].value.type == "company" ||
                                result.body.results[comm].value.type == "network") {

                                // pull communities within record
                                var comm_items = result.body.results[comm].value.communities;
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

                                db.newSearchBuilder()
                                    .collection(config.db.communities)
                                    .limit(100)
                                    .offset(0)
                                    .query("@path.key: (" + search + ")")
                                    .then(function (result2) {
                                        finalize(result2.body.results);
                                    })
                                    .fail(function (err) {
                                        console.log("WARNING: SEARCH FAIL:");
                                        console.warn(err);
                                        finalize(result.body.results);
                                    });

                            } else finalize(result.body.results);
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
                console.log("WARNING: SEARCH FAIL:");
                console.warn(err);
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
            skills: {}
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

    var search = '@value.communities:' + location_key + ' AND @value.communities:' + community_key + '';

    console.log('Pulling Top Results: ' + location_key + ' / ' + community_key + ' Industry keys: ', industry_keys);

    // get companies and industries

    var industrysearch = cluster_search ? '(@value.profile.parents:(' + cluster_search + ') OR @value.profile.industries:(' + cluster_search + ')) AND ' + search : search;

    var addkeys = function(data) {
        for (i in data) {
            data[i].value["key"] = data[i].path.key;
        }
        return data;
    };

    // get companies & industries

    var pullTop = function(cache) {

        db.newSearchBuilder()
            .collection(config.db.communities)
            .aggregate('top_values', 'value.profile.industries', 10)
            .sort('@path.reftime', 'desc')
            .query(industrysearch + ' AND @value.type: "company"')
            .then(function (result) {

                top_results.industries = {
                    count: result.body.aggregates[0].value_count,
                    entries: result.body.aggregates[0].entries
                };

                top_results.companies = {
                    count: result.body.total_count,
                    entries: addkeys(result.body.results).slice(0,5)
                };

                // get people & skills

                var skillsearch = cluster_search ? '@value.profile.skills:(' + cluster_search + ') AND ' + search : search;

                db.newSearchBuilder()
                    .collection(config.db.communities)
                    .aggregate('top_values', 'value.profile.skills', 10)
                    .sort('@path.reftime', 'desc')
                    .query(skillsearch + ' AND @value.type: "user"')
                    .then(function (result) {

                        top_results.skills = {
                            count: result.body.aggregates[0].value_count,
                            entries: result.body.aggregates[0].entries
                        };

                        top_results.people = {
                            count: result.body.total_count,
                            entries: addkeys(result.body.results).slice(0,5)
                        };


                        // get leaders
                        db.newSearchBuilder()
                            .collection(config.db.communities)
                            .sort('@path.reftime', 'desc')
                            .query('@value.roles.leader.' + community_key + ':' + location_key + ' AND @value.type: "user"')
                            .then(function (result) {

                                top_results.leaders = addkeys(result.body.results).slice(0,5);

                                if (!cache) res.status(200).send(top_results);

                                mc.set(industrysearch, JSON.stringify(top_results), function(err, val) {
                                    if (err) console.warn('WARNING: Memcache error: ', err)
                                });

                                // removed due to move to memcache
                                /*var target = cluster_key ? cluster_key : community_key;

                                console.log('Updating ' + target + ' with top results..');

                                //get current record
                                db.get(config.db.communities, target)
                                    .then(function (response) {
                                        if (response.body.type == 'cluster' || response.body.type == 'network') { // use community_profiles
                                            if (response.body.community_profiles === undefined) { // create community_profiles
                                                response.body['community_profiles'] = {};
                                            }
                                            if (response.body.community_profiles[location_key]) { // don't create the location if it doesn't exist
                                                response.body.community_profiles[location_key]["top"] = top_results;
                                            }
                                        } else response.body.profile["top"] = top_results;

                                        // update record with new data
                                        db.put(config.db.communities, target, response.body)
                                            .then(function (finalres) {

                                            })
                                            .fail(function (err) {
                                                console.warn('WARNING:  Problem with GetTop update: ' + err);
                                                res.status(202).send({message: 'Something went wrong: ' + err});
                                            });

                                    })
                                    .fail(function (err) {
                                        console.warn('WARNING:  Problem with get: ' + err);
                                        res.status(202).send({message: 'Something went wrong: ' + err});
                                    });*/

                            })
                            .fail(function (err) {
                                console.log("WARNING: SEARCH FAIL:");
                                console.warn(err);
                                res.status(202).send({message: 'Something went wrong: ' + err});
                            });
                    })
                    .fail(function (err) {
                        console.log("WARNING: SEARCH FAIL:");
                        console.warn(err);
                        res.status(202).send({message: 'Something went wrong: ' + err});
                    });

            })
            .fail(function (err) {
                console.log("WARNING: SEARCH FAIL:");
                console.warn(err);
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
    console.log(req.user.value.roles.leader);

    // validate user has leader role within the location/community
    if (req.user.value.roles.leader[settings.community_key] && req.user.value.roles.leader[settings.community_key].indexOf(settings.location_key) > -1) {
        // update the community
        db.get(config.db.communities, settings.community_key)
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

                db.put(config.db.communities, settings.community_key, response.body)
                    .then(function (finalres) {
                        res.status(201).send({message: 'Community settings updated.'});
                    })
                    .fail(function (err) {
                        console.warn('WARNING:  Problem with put: ' + err);
                        res.status(202).send({message: 'Something went wrong: ' + err});
                    });

            })
            .fail(function (err) {
                console.warn('WARNING:  Problem with get: ' + err);
                res.status(202).send({message: 'Something went wrong: ' + err});
            });

    } else {
        console.warn("User is not a leader in location: " + settings.location_key + " and community: " + settings.community_key + "!");
        res.status(202).send({message: 'Sorry, you must be a Leader in this community to change these settings.'});
    }
}

function handleAddCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var settings = req.body.params;

    console.log('Adding community: ' + settings.community.profile.name + ' in ' + settings.location_key);

    // validate user is a member in the location
    if (req.user.value.communities.indexOf(settings.location_key) > -1) {

        var pathname = settings.community.url || encodeURI(settings.community.profile.name.toLowerCase());

        // check to see if the community exists
        db.get(config.db.communities, pathname)
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

                        db.put(config.db.communities, pathname, response.body)
                            .then(function (finalres) {

                                update_user(req.user.value.key, 'leader', pathname, settings.location_key)
                                    .then(function(response) {
                                        console.log(response);
                                        res.status(201).send({message: settings.community.type.toUpperCase() + settings.community.type.slice(1) + ' created!'});
                                    })
                            })
                            .fail(function (err) {
                                console.warn('WARNING:  Problem with put: ' + err);
                                res.status(202).send({message: 'Something went wrong: ' + err});
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

                    db.put(config.db.communities, pathname, profile)
                        .then(function (finalres) {

                            update_user(req.user.value.key, 'leader', pathname, settings.location_key)
                                .then(function() {
                                    res.status(201).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' created!'});
                                })
                        })
                        .fail(function (err) {
                            console.warn('WARNING:  Problem with put: ' + err);
                            res.status(202).send({message: 'Something went wrong: ' + err});
                        });

                } else {
                    console.warn('WARNING:  Problem with get: ', err.body);
                    res.status(202).send({message: 'Something went wrong: ' + err.body});
                }

            });

    } else {
        console.warn("User is not a member of community: " + settings.community.key + " and location: " + settings.location_key + "!");
        res.status(202).send({ message: 'You must be a member of this community to add to it.' });
    }

}

function handleDeleteCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var settings = req.body.params;

    console.log('Deleting community: ' + settings.community.profile.name + ' in ' + settings.location_key);

    // validate user is a leader of the community in this location
    if (req.user.value.roles.leader[settings.community.key].indexOf(settings.location_key) > -1) {

        // get the community
        db.get(config.db.communities, settings.community.key)
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
                        db.remove(config.db.communities, settings.community.key, 'true')
                            .then(function (finalres) {
                                res.status(204).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!'});
                            })
                            .fail(function (err) {
                                console.warn('WARNING:  Problem with put: ' + err);
                                res.status(202).send({message: 'Something went wrong: ' + err});
                            });
                    } else {
                        db.put(config.db.communities, settings.community.key, response.body)
                            .then(function (finalres) {
                                res.status(204).send({message: settings.community.type[0].toUpperCase() + settings.community.type.slice(1) + ' deleted!'});
                            })
                            .fail(function (err) {
                                console.warn('WARNING:  Problem with put: ' + err);
                                res.status(202).send({message: 'Something went wrong: ' + err});
                            });
                    }

                    update_user(req.user.value.key, 'delete', settings.community.key, settings.location_key);

                } else {
                    console.log('WARNING: Cannot delete community');
                    res.status(202).send({message: "You can't delete " + settings.community.profile.name + " for some reason, but we've been notified and will look into it."});
                }

            })
            .fail(function (err) {

                console.warn('WARNING:  Problem with get: ', err.body);
                res.status(202).send({message: 'Something went wrong: ' + err.body});

            });

    } else {
        console.warn("User is not a member of community: " + settings.community.key + " and location: " + settings.location_key + "!");
        res.status(202).send({ message: 'You must be a leader of this community to delete it.' });
    }

}

var update_user = function(user_key, role, cluster_key, location_key) {

    return db.get(config.db.communities, user_key)
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

                db.put(config.db.communities, user_key, response.body)
                    .then(function(result) {
                        console.log('User ' + user_key + ' updated with community role.');
                    })
                    .fail(function(err){
                        console.warn("WARNING: PUT FAIL:");
                        console.warn(err);
                    });

            } else {
                console.warn('WARNING:  User not found.');
            }
        })

        .fail(function(err){
            console.warn("WARNING: SEARCH FAIL:");
            console.warn(err);
        });
};

function handleGetKey(req, res) {
    console.log('Pulling key: ' + req.params.key);

    function pullKey() {
        db.get(config.db.communities, req.params.key)
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
                    console.log("WARNING: SEARCH FAIL:");
                    console.warn(err);
                    res.status(202).send({message: 'Something went wrong: ' + err});
                }
            });
    }

    pullKey();
}

module.exports = CommunityApi;