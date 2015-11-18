var Q = require('q'),
    request = require('request'),
    url = require('url'),
    keys = require('../keys.json')[process.env.NODE_ENV || 'development'],
    aws = require('aws-sdk'),
    db = require('orchestrate')(keys.db.key);

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
                "parents": [profile.parent],
                "angellist": profile,
                "headline": profile.high_concept,
                "summary": profile.product_desc,
                "avatar": profile.thumb_url || "",
                "logo": profile.logo_url || "",
                "stage": profile.stage,
                "industries": profile.industries
            },
            "communities": communities
        };
    }
};

function handleCompanySearch(req, res){
        var communities = req.query.communities,
            clusters = req.query.clusters,
            stages = req.query.stages,
            query = req.query.query,
            limit = req.query.limit,
            offset = req.query.offset,
            key = req.query.api_key;

        searchInCommunity(communities, clusters, stages, limit, offset, query, key)
            .then(function(companylist){
                    res.send(companylist);
            })
            .fail(function(err){
                    console.warn(err);
                    res.send({message:err});
            });
}

var searchInCommunity = function(communities, clusters, stages, limit, offset, query, key) {
        var allowed = false;
        var userperms;

        if (key) { //check api key to determine if restricted profile data is included with results
                try {
                        //var payload = jwt.decode(key, keys.API_token_secret);
                        // Assuming key never expires
                        //check perms!
                        console.log('test then remove me')
                        //todo THIS SECTION NEEDS TO BE REWRITTEN
                        db.get(keys.db.communities, payload.sub)
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
                                    console.warn("WARNING: company85", err);
                                    return deferred.reject(new Error(err));
                            });
                } catch (err) {
                        return deferred.reject(new Error(err));
                }
        }

        // create searchstring
        searchstring = '@value.communities:(';
        if (communities) {
            for (c in communities) {
                searchstring += '"' + communities[c] + '"';
                if (c < (communities.length - 1)) { searchstring += ' AND '; }
            }
        } else searchstring += '*';

        searchstring += ') AND @value.type: "company"';

        if (clusters && clusters.length > 0 && clusters[0] !== '*') {
            clusters = clusters.splice(',');
            searchstring += ' AND (';

            for (i in clusters) {
                searchstring += '@value.profile.industries:"' + clusters[i] + '"'; // scope to industries within the cluster
                if (i < (clusters.length - 1)) { searchstring += ' OR '; }
            }
            searchstring += ')';
        }

        if (stages && stages.length > 0 && stages[0] !== '*') {
                stages = stages.splice(',');
                searchstring += ' AND (';

                for (i in stages) {
                        searchstring += '@value.profile.stage:"' + stages[i] + '"'; // scope to stage
                        if (i < (stages.length - 1)) { searchstring += ' OR '; }
                }
                searchstring += ')';
        }

        if (query) { searchstring += ' AND ' + '(' + query + ')'; }

        var deferred = Q.defer();
        db.newSearchBuilder()
            .collection(keys.db.communities)
            .limit(Number(limit) || 18)
            .offset(Number(offset) || 0)
            .sort('@path.reftime', 'desc')
            .query(searchstring)
            .then(function(result){

                    var i;

                    try {
                            for (i=0; i < result.body.results.length; i++) {

                                result.body.results[i].value["key"] = result.body.results[i].path.key;
                            }
                    } catch (error) {
                            console.warn('WARNING: company144 ', error);
                            console.log(result.body.results);
                    }

                    if (result.body.next) {
                            var getnext = url.parse(result.body.next, true);
                            result.body.next = '/api/2.1/search' + getnext.search;
                    }
                    if (result.body.prev) {
                            var getprev = url.parse(result.body.prev, true);
                            result.body.prev = '/api/2.1/search' + getprev.search;
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
        accessKeyId: keys.aws.aws_access_key_id,
        secretAccessKey: keys.aws.aws_secret_access_key,
        signatureVersion: 'v4',
        region: 'us-west-2'
    });

    var s3 = new aws.S3();
    var s3_params = {
        Bucket: keys.aws.bucket,
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
        } else res.status(400).send({ message: "Something went wrong." });

    });
}

function handleAddCompany(req, res) {
    // always use ensureAuth before this (to acquire req.user)
    var addCompany = req.body.params;
    if (!addCompany.al_profile) {
        console.warn("No company specified!");
        res.status(400).send({ message: 'Please select a company first.' });
    } else {
        console.log('Adding company ' + addCompany.al_profile.name + ' to ' + addCompany.location_key + ' / ' + addCompany.community_key);

        // validate user is a member in the location/community
        db.get(keys.db.communities, req.user)
            .then(function(response){

                if (response.body.code !== "items_not_found") {
                    var user = response.body;
                    if (((addCompany.location_key == addCompany.community_key) && user.communities.indexOf(addCompany.location_key) > -1) || (user.roles && user.roles.leader && user.roles.leader[addCompany.community_key] && user.roles.leader[addCompany.community_key].indexOf(addCompany.location_key) > -1)) {

                        var company = schema.angellist(addCompany.al_profile, addCompany.location_key, addCompany.community_key);
                        if (company.profile.angellist.industries) delete company.profile.angellist.industries;

                        //search for company and add if not there..
                        companyPull(company, addCompany.role, addCompany.location_key, req.user, function(result) {
                            res.status(result.status).send(result.data);
                        });

                    } else {
                        console.warn("User is not a member of community: " + addCompany.community_key + " and location: " + addCompany.location_key + "!");
                        res.status(400).send({ message: 'You must be a member of this community and/or a leader of this network to add a company to it.' });
                    }
                } else {
                    console.warn('WARNING:  User not found.');
                }
            })

            .fail(function(err){
                console.warn("WARNING: company231", err);
            });
    }
}

var addRole = function(company_key, role, location_key, user_key) {

    db.get(keys.db.communities, user_key)
        .then(function(response){

            if (response.body.code !== "items_not_found") {

                if (!response.body.roles) {
                    response.body["roles"] = {};
                }

                // search for existing role and delete if found

                for (r in response.body.roles) {
                    for (co in response.body.roles[r]) {
                        if (co == company_key) {
                            delete response.body.roles[r][co];
                        }
                    }
                }

                // add new role

                if (!response.body.roles[role]) {
                    response.body.roles[role] = {};
                    response.body.roles[role][company_key] = [location_key];
                } else if (!response.body.roles[role][company_key]) {
                    response.body.roles[role][company_key] = [location_key];
                } else if (response.body.roles[role][company_key].indexOf(location_key) < 0) {
                    response.body.roles[role][company_key].push(location_key);
                } // else the damn thing is already there

                // add community
                if (!response.body.communities) {
                    response.body["communities"] = {};
                }

                if (response.body.communities.indexOf(company_key) < 0) {
                    response.body.communities.push(company_key);
                }

                db.put(keys.db.communities, user_key, response.body)
                    .then(function(result) {
                        console.log('User ' + user_key + ' updated with company role.');
                    })
                    .fail(function(err){
                        console.warn("WARNING: company259", err);
                    });

            } else {
                console.warn('WARNING:  User not found.');
            }
        })

        .fail(function(err){
            console.warn("WARNING: company268", err);
        });
};

var companyPull = function (company, role, location_key, user, callback) {

    console.log('Looking for existing company based on AngelList profile.');

    db.search(keys.db.communities, '@value.profile.angellist.id: ' + company.profile.angellist.id) // no quotes due to number not string
        .then(function (result){

            console.log('Result of db search: ' + result.body.total_count);

            if (result.body.results.length > 0){

                console.log("Matched AngelList startup to database company: " + company.profile.name);

                db.put(keys.db.communities, result.body.results[0].path.key, company)
                    .then(function (response) {

                        var companykey = response.headers.location.split('/')[3];
                        console.log("UPDATED: " + company.profile.name);

                        if (role) {
                            addRole(result.body.results[0].path.key, role, location_key, user);
                        }

                        result.body.results[0].value["message"] = "Well done! " + company.profile.name + " has been updated.";

                        callback({ "status": 200, "data": result.body.results[0].value });

                    })
                    .fail(function (err) {
                        console.error("PUT FAIL:");
                        console.error(err);
                    });

            } else {

                console.log('No existing company found!');

                db.post(keys.db.communities, company)
                    .then(function (response) {

                        var companykey = response.headers.location.split('/')[3];
                        console.log("REGISTERED: " + company.profile.name);

                        if (role) {
                            addRole(companykey, role, location_key, user);
                        }

                        company["message"] = "Well done! You've added " + company.profile.name + " to the community.";

                        callback({ "status": 200, "data": company });

                    })
                    .fail(function (err) {
                        console.error("POST FAIL:");
                        console.error(err);
                    });
            }
        })
        .fail(function(err){
            console.log("WARNING: company331", err);
            res.status(500).send({ message: "Something went wrong."});
        });

};

module.exports = CompanyApi;