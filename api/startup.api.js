var Q = require('q'),
    request = require('request'),
    url = require('url'),
    jwt = require('jwt-simple'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db.key);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var StartupApi = function() {
        this.startupSearch = handleStartupSearch;
        this.addStartup = handleAddStartup;
};

var schema = {
    angellist: function (profile, location_key, community_key) {

        var communities = location_key == community_key ?
            [location_key] :
            [location_key, community_key];

        return {
            "type": "startup",
            "profile": {
                "home": location_key,
                "name": profile.name,
                "angellist": profile,
                "avatar": profile.thumb_url || "",
                "logo": profile.logo_url || ""
            },
            "communities": communities
        };
    }
};

function handleStartupSearch(req, res){
        var communities = req.query.communities,
            stages = req.query.stages,
            query = req.query.query,
            limit = req.query.limit,
            offset = req.query.offset,
            key = req.query.api_key;

        searchInCommunity(communities, stages, limit, offset, query, key)
            .then(function(userlist){
                    res.send(userlist);
            })
            .fail(function(err){
                    console.warn(err);
                    res.send({message:err});
            });
}

var searchInCommunity = function(communities, stages, limit, offset, query, key) {
        var allowed = false;
        var userperms;

        if (key) { //check api key to determine if restricted profile data is included with results
                try {
                        var payload = jwt.decode(key, config.API_token_secret);
                        // Assuming key never expires
                        //check perms!
                        console.log('test then remove me')
                        //todo THIS SECTION NEEDS TO BE REWRITTEN
                        db.get(config.db.communities, payload.sub)
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
                                    console.warn("WARNING: SEARCH FAIL:" + err);
                                    return deferred.reject(new Error(err));
                            });
                } catch (err) {
                        return deferred.reject(new Error(err));
                }
        }

        // create searchstring
        searchstring = 'communities:(';

        for (c in communities) {
                searchstring += '"' + communities[c] + '"';
                if (c < (communities.length - 1)) { searchstring += ' AND '; }
        }

        searchstring += ') AND type: "startup"';

        if (stages && stages.length > 0 && stages[0] !== '*') {
                stages = stages.splice(',');
                searchstring += ' AND (';

                for (i in stages) {
                        searchstring += 'profile.stage:"' + stages[i] + '"'; // scope to stage
                        if (i < (stages.length - 1)) { searchstring += ' OR '; }
                }
                searchstring += ')';
        }

        if (query) { searchstring += ' AND ' + '(' + query + ')'; }

        var deferred = Q.defer();
        db.newSearchBuilder()
            .collection(config.db.communities)
            .limit(Number(limit) || 18)
            .offset(Number(offset) || 0)
            .query(searchstring)
            .then(function(result){

                    var i;

                    try {
                            for (i=0; i < result.body.results.length; i++) {

                                result.body.results[i].value["key"] = result.body.results[i].path.key;
                            }
                    } catch (error) {
                            console.warn('WARNING:  Possible database entry corrupted: ');
                            console.log(result.body.results);
                    }

                    if (result.body.next) {
                            var getnext = url.parse(result.body.next, true);
                            result.body.next = '/api/2.0/search' + getnext.search;
                    }
                    if (result.body.prev) {
                            var getprev = url.parse(result.body.prev, true);
                            result.body.prev = '/api/2.0/search' + getprev.search;
                    }
                    deferred.resolve(result.body);
            })
            .fail(function(err){
                    console.log(err.body.message);
                    deferred.reject(err.body.message);
            });

        return deferred.promise;

};

function handleAddStartup(req, res) {
    // always use ensureAuth before this (to acquire req.user)
    var addStartup = req.body.params;

    console.log('Inviting ' + addStartup.angellist_url + ' to ' + addStartup.location_key + ' / ' + addStartup.community_key);

    // validate user is a member in the location/community
    if (req.user.value.communities[addStartup.community_key] && req.user.value.communities[addStartup.community_key].indexOf(addStartup.location_key) > -1) {
        // use the slug to get the startup id
        request.get({ url: 'https://api.angel.co/1/search/slugs?query=' + addStartup.angellist_url + '&access_token=' + config.angellist.clientToken },
            function(error, response, body) {

                if (!body.status || body.status === 200) {

                    // get the startp profile based on the id
                    request.get({ url: 'https://api.angel.co/1/startups/' + JSON.parse(body).id + '?access_token=' + config.angellist.clientToken },
                        function(error, response, body) {
                            if (!body.status || body.status === 200) {
                                var startup = schema.angellist(JSON.parse(body), addStartup.location_key, addStartup.community_key);
                                console.log('AngelList Startup:');
                                console.log(startup);
                                startupPull(startup, function(result) {
                                    res.status(result.status).send(result.data);
                                });
                            } else {
                                console.error('Error: ' + body.message);
                                console.log(body);
                                res.status(202).send({ message: 'Something went wrong: ' + err});
                            }
                        }
                    );

                } else {
                    console.error('Error: ' + body.message);
                    console.log(body);
                    res.status(202).send({ message: 'Something went wrong: ' + err});
                }
            });

    } else {
        console.warn("User is not a member of community: " + addStartup.community_key + " and location: " + addStartup.location_key + "!");
        res.status(202).send({ message: 'Sorry, you must be a member of this community to add a startup to it.' });
    }
}

var startupPull = function (startup, callback) {

    console.log('Looking for existing startup based on AngelList profile.');

    db.search(config.db.communities, 'profile.angellist.id: ' + startup.profile.angellist.id) // no quotes due to number not string
        .then(function (result){
            console.log('Result of db search: ' + result.body.total_count);
            if (result.body.results.length > 0){
                if (result.body.results[0].value.profile.angellist.id == startup.profile.angellist.id){
                    console.log("Matched AngelList startup to database startup: " + startup.profile.name);
                    result.body.results[0].value["message"] = "It looks like " + startup.profile.name + " is already in the system.";
                    callback({ "status": 202, "data": result.body.results[0].value });
                } else {  // in this case we know a startup exists but for some reason the id doesn't match
                    console.warn("WARNING: There's already an existing user with that public Linkedin profile.");
                    result.body.results[0].value["message"] = "It looks like " + startup.profile.name + " is already in the system.";
                    callback({ "status": 200, "data": result.body.results[0].value });
                }
            } else {
                console.log('No existing startup found!');
                db.post(config.db.communities, startup)
                    .then(function () {
                        console.log("REGISTERED: " + startup.profile.name);
                        callback({ "status": 200, "data": startup });
                    })
                    .fail(function (err) {
                        console.error("POST FAIL:");
                        console.error(err);
                    });
            }
        })
        .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(202).send({ message: 'Something went wrong: ' + err});
        });

};

module.exports = StartupApi;