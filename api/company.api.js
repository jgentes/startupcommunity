var Q = require('q'),
    request = require('request'),
    url = require('url'),
    jwt = require('jwt-simple'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db.key);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CompanyApi = function() {
        this.companySearch = handleCompanySearch;
        this.addCompany = handleAddCompany;
        this.getLogoUrl = handleGetLogoUrl;
};

var schema = {
    angellist: function (profile, location_key, community_key) {

        var communities = location_key == community_key ?
            [location_key] :
            [location_key, community_key];

        return {
            "type": "company",
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

function handleCompanySearch(req, res){
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
        searchstring = 'value.communities:(';

        for (c in communities) {
                searchstring += '"' + communities[c] + '"';
                if (c < (communities.length - 1)) { searchstring += ' AND '; }
        }

        searchstring += ') AND value.type: "company"';

        if (stages && stages.length > 0 && stages[0] !== '*') {
                stages = stages.splice(',');
                searchstring += ' AND (';

                for (i in stages) {
                        searchstring += 'value.profile.stage:"' + stages[i] + '"'; // scope to stage
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

function handleGetLogoUrl(req, res) {
    // req data is guaranteed by ensureauth
    var company_name = req.query.company_name,
        filename = req.query.filename;

    aws.config.update({
        accessKeyId: config.aws.aws_access_key_id,
        secretAccessKey: config.aws.aws_secret_access_key,
        signatureVersion: 'v4',
        region: 'us-west-2'
    });

    var s3 = new aws.S3();
    var s3_params = {
        Bucket: config.aws.bucket,
        Key:  'logos/' + company_name + '_' + filename,
        Expires: 60,
        ACL: 'public-read'
    };
    s3.getSignedUrl('putObject', s3_params, function (err, signedUrl) {
        var parsedUrl = url.parse(signedUrl);
        parsedUrl.search = null;
        var objectUrl = url.format(parsedUrl);

        if (!err) {
            res.send({ put: signedUrl, get: objectUrl });
        } else res.status(204).send({ message: err });

    });
}

function handleAddCompany(req, res) {
    // always use ensureAuth before this (to acquire req.user)
    var addCompany = req.body.params;

    console.log('Adding company w/ AngelList id:' + addCompany.angellist_id + ' to ' + addCompany.location_key + ' / ' + addCompany.community_key);

    // validate user is a member in the location/community
    if (((addCompany.location_key == addCompany.community_key) && req.user.value.communities.indexOf(addCompany.location_key) > -1) || (req.user.value.roles && req.user.value.roles.leader[addCompany.community_key] && req.user.value.roles.leader[addCompany.community_key].indexOf(addCompany.location_key) > -1)) {

        // get the startup profile based on the id
        request.get({ url: 'https://api.angel.co/1/startups/' + addCompany.angellist_id + '?access_token=' + config.angellist.clientToken },
            function(error, response, body) {
                if (!body.status || body.status === 200) {
                    var company = schema.angellist(JSON.parse(body), addCompany.location_key, addCompany.community_key);
                    console.log('AngelList Startup:');
                    console.log(company);
                    companyPull(company, function(result) {
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
        console.warn("User is not a member of community: " + addCompany.community_key + " and location: " + addCompany.location_key + "!");
        res.status(202).send({ message: 'Sorry, you must be a member of this community and/or a leader of this network to add a company to it.' });
    }
}

var companyPull = function (company, callback) {

    console.log('Looking for existing company based on AngelList profile.');

    db.search(config.db.communities, 'value.profile.angellist.id: ' + company.profile.angellist.id) // no quotes due to number not string
        .then(function (result){
            console.log('Result of db search: ' + result.body.total_count);
            if (result.body.results.length > 0){
                if (result.body.results[0].value.profile.angellist.id == company.profile.angellist.id){
                    console.log("Matched AngelList startup to database company: " + company.profile.name);
                    result.body.results[0].value["message"] = "It looks like " + company.profile.name + " is already in the system.";
                    callback({ "status": 202, "data": result.body.results[0].value });
                } else {  // in this case we know a company exists but for some reason the id doesn't match
                    console.warn("WARNING: There's already an existing user with that public Linkedin profile.");
                    result.body.results[0].value["message"] = "It looks like " + company.profile.name + " is already in the system.";
                    callback({ "status": 200, "data": result.body.results[0].value });
                }
            } else {
                console.log('No existing company found!');
                db.post(config.db.communities, company)
                    .then(function () {
                        console.log("REGISTERED: " + company.profile.name);
                        callback({ "status": 200, "data": company });
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

module.exports = CompanyApi;