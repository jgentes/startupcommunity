var Q = require('q'),
    request = require('request'),
    url = require('url'),
    jwt = require('jwt-simple'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db.key);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var StartupApi = function() {
        this.startupSearch = handleStartupSearch;
};


/*
 |--------------------------------------------------------------------------
 | Search API
 |--------------------------------------------------------------------------
 */


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
                        db.get(config.db.collections.users, payload.sub)
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
            .collection(config.db.collections.communities)
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
                            result.body.next = '/api/1.1/search' + getnext.search;
                    }
                    if (result.body.prev) {
                            var getprev = url.parse(result.body.prev, true);
                            result.body.prev = '/api/1.1/search' + getprev.search;
                    }
                    deferred.resolve(result.body);
            })
            .fail(function(err){
                    console.log(err.body.message);
                    deferred.reject(err.body.message);
            });

        return deferred.promise;

};

module.exports = StartupApi;