var config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db.key);

//var util = require('util'); //for util.inspect on request
//request = require('request');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function () {
    this.getCommunity = handleGetCommunity;
    this.setCommunity = handleSetCommunity;
    this.addCommunity = handleAddCommunity;
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

function handleGetCommunity(req, res) {
    var community = req.params.community;

    var searchString = '@path.key: ' + community; // grab the primary community object, don't use parens here
    searchString += ' OR ((value.communities: "' + community + '"'; // + grab anything associated with this community in this location
    searchString += ' OR value.parents: "' + community + '")'; // + grab anything associated with this community as a parent
    searchString += ' AND NOT value.type:("company" OR "user"))'; // exclude companies and users

    function pullCommunity() {

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
                    res.status(200).send(newresponse);
                };

                if (result.body.results.length > 0) {
                    var found = false;
                    for (comm in result.body.results) {
                        if (result.body.results[comm].path.key == community) {
                            found = true;
                            console.log('Pulling community for ' + result.body.results[comm].value.profile.name);
                            if (result.body.results[comm].value.type == "user" || result.body.results[comm].value.type == "company" || result.body.results[comm].value.type == "network") {
                                // pull communities within record
                                var comm_items = result.body.results[comm].value.communities;
                                var search = community + " OR ";
                                for (i in comm_items) {
                                    if (i > 0) {
                                        search += ' OR ';
                                    }
                                    search += comm_items[i];
                                }

                                db.newSearchBuilder()
                                    .collection(config.db.communities)
                                    .limit(100)
                                    .offset(0)
                                    .query("@path.key: (" + search + ")")
                                    .then(function (result) {
                                        finalize(result.body.results);
                                    })

                            } else if (result.body.results[comm].value.type == "cluster") {
                                // pull industries within cluster
                                var industry_items;
                                if (result.body.results[comm].value.community_profiles[community]) {
                                    industry_items = result.body.results[comm].value.community_profiles[community].industries;
                                } else industry_items = result.body.results[comm].value.profile.industries;

                                var search;
                                for (i in industry_items) {
                                    if (i > 0) {
                                        search += ' OR ';
                                    }
                                    search += '"' + industry_items[i] + '"';
                                }

                                db.newSearchBuilder()
                                    .collection(config.db.communities)
                                    .limit(100)
                                    .offset(0)
                                    .query('value.profile.industries: (' + search + ')')
                                    .then(function (result) {
                                        finalize(result.body.results);
                                    })

                            } else finalize(result.body.results);
                        }
                    }
                    if (!found) {
                        console.warn('WARNING: Community not found!');
                        res.status(404).send({message: 'Community not found.'});
                    }
                } else {
                    console.warn('WARNING: Community not found!');
                    res.status(404).send({message: 'Community not found.'});
                }
            })
            .fail(function (err) {
                console.log("WARNING: SEARCH FAIL:");
                console.warn(err);
                res.status(202).send({message: 'Something went wrong: ' + err});
            });
    }

    console.log('Pulling community: ' + community);
    pullCommunity();

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

    if (cluster_key) {

        if (location_key == cluster_key) {
            has_location = false;
            search = '';
        }

        if (location_key !== community_key) {
            community_key = '*';
        }

        for (i in industry_keys) {
            if (i > 0) {
                cluster_search += ' OR ';
            }
            cluster_search += '"' + industry_keys[i] + '"';
        }
    } else if (!community_key || community_key == 'undefined') community_key = location_key;

    var search = 'value.communities:' + location_key + ' AND value.communities:' + community_key + '';

    console.log('Pulling Top Results: ' + location_key + ' / ' + community_key + ' Industry keys: ', industry_keys);

    // get companies and industries

    var industrysearch = cluster_search ? 'value.profile.industries:(' + cluster_search + ') AND ' + search : search;

    function condense(results) {
        var c = [],
            count = 0;

        for (item in results) {
            results[item].value.type = "cache"; // because otherwise a search for value.type: "user" will pickup the cluster record due to recursive search match
            c.push(results[item]);
            count++;
            if (count == 5) break;
        }

        return c;
    }

    // get companies & industries

    db.newSearchBuilder()
        .collection(config.db.communities)
        .aggregate('top_values', 'value.profile.industries', 10)
        .sort('@path.reftime', 'desc')
        .query(industrysearch + ' AND value.type: "company"')
        .then(function (result) {

            top_results.industries = {
                count: result.body.aggregates[0].value_count,
                entries: result.body.aggregates[0].entries
            };

            top_results.companies = {
                count: result.body.total_count,
                entries: condense(result.body.results)
            };

            // get people & skills

            var skillsearch = cluster_search ? 'value.profile.skills:(' + cluster_search + ') AND ' + search : search;

            db.newSearchBuilder()
                .collection(config.db.communities)
                .aggregate('top_values', 'value.profile.skills', 10)
                .sort('@path.reftime', 'desc')
                .query(skillsearch + ' AND value.type: "user"')
                .then(function (result) {

                    top_results.skills = {
                        count: result.body.aggregates[0].value_count,
                        entries: result.body.aggregates[0].entries
                    };

                    top_results.people = {
                        count: result.body.total_count,
                        entries: condense(result.body.results)
                    };


                    // get leaders
                    db.newSearchBuilder()
                        .collection(config.db.communities)
                        .sort('@path.reftime', 'desc')
                        .query('value.roles.leader.' + community_key + ':' + location_key + ' AND value.type: "user"')
                        .then(function (result) {

                            top_results.leaders = condense(result.body.results);

                            var target = cluster_key ? cluster_key : community_key;

                            console.log('Updating ' + target + ' with top results..');

                            //get current record
                            db.get(config.db.communities, target)
                                .then(function (response) {
                                    if (response.body.type == 'cluster' || response.body.type == 'network') { // use community_profiles
                                        if (response.body.community_profiles === undefined) { // create community_profiles
                                            response.body['community_profiles'] = {};
                                        }
                                        if (response.body.community_profiles[location_key] === undefined) { // create this location
                                            response.body.community_profiles[location_key] = {
                                                "name": response.body.profile.name,
                                                "icon": response.body.profile.icon,
                                                "logo": response.body.profile.logo,
                                                "embed": response.body.profile.embed,
                                                "top": top_results
                                            };
                                        } else {
                                            response.body.community_profiles[location_key]["top"] = top_results;
                                        }
                                    } else response.body.profile["top"] = top_results;

                                    // update record with new data

                                    db.put(config.db.communities, target, response.body)
                                        .then(function (finalres) {

                                            // change values back from 'cache'
                                            for (u in top_results.people.entries) {
                                                top_results.people.entries[u].value.type = 'user';
                                            }

                                            for (u in top_results.companies.entries) {
                                                top_results.companies.entries[u].value.type = 'company';
                                            }

                                            res.status(200).send(top_results);
                                        })
                                        .fail(function (err) {
                                            console.warn('WARNING:  Problem with GetTop update: ' + err);
                                            res.status(202).send({message: 'Something went wrong: ' + err});
                                        });

                                })
                                .fail(function (err) {
                                    console.warn('WARNING:  Problem with get: ' + err);
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

        })
        .fail(function (err) {
            console.log("WARNING: SEARCH FAIL:");
            console.warn(err);
            res.status(202).send({message: 'Something went wrong: ' + err});
        });
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

    console.log('Adding community: ' + settings.community.profile.name + ' in ' + settings.location_key + ' / ' + settings.community_key);
    console.log(settings);
//todo complete the rest
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