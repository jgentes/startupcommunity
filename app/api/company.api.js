var Q = require('q'),
    request = require('request'),
    url = require('url'),
    CommunityApi = require(__dirname + '/community.api.js'),
    communityApis = new CommunityApi(),
    aws = require('aws-sdk'),
    db = require('orchestrate')(process.env.DB_KEY);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CompanyApi = function() {
        this.companySearch = handleCompanySearch;
        this.addCompany = handleAddCompany;
        this.deleteCompany = handleDeleteCompany;
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
                "parents": [profile.parent.toLowerCase()],
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
                        //var payload = jwt.decode(key, process.env.API_TOKEN_SECRET);
                        // Assuming key never expires
                        //check perms!
                        console.log('test then remove me')
                        //todo THIS SECTION NEEDS TO BE REWRITTEN
                        db.get(process.env.DB_COMMUNITIES, payload.sub)
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
        var state = "";

        if (communities) {
            for (c in communities) {

                // determine whether one of the communities is a state
                var state_suffix = communityApis.convert_state(communities[c].replace('-',' '), 'abbrev'); // returns false if no match

                if (state_suffix) {
                    var state = ' AND @value.profile.home: ("' + communities[c] + '" OR "*-' + state_suffix.toLowerCase() + '")';
                    var remove = communities.indexOf(communities[c]);
                    if (remove > -1) communities.splice(remove, 1); // to avoid issues with length check
                    if (communities.length == 0) searchstring += "*";
                } else {
                    searchstring += '"' + communities[c] + '"';
                    if (c < (communities.length - 1)) { searchstring += ' AND '; }
                }
            }
        } else searchstring += '*';

        searchstring += ') AND @value.type: "company"' + state;

        if (clusters && clusters.length > 0 && clusters[0] !== '*') {
            clusters = clusters.splice(',');
            searchstring += ' AND (';

            for (i in clusters) {
                searchstring += '@value.profile.industries:"' + clusters[i] + '" OR @value.profile.parents:"' + clusters[i] + '"'; // scope to industries within the cluster
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
            .collection(process.env.DB_COMMUNITIES)
            .limit(Number(limit) || 18)
            .offset(Number(offset) || 0)
            .sortRandom()
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
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        signatureVersion: 'v4',
        region: 'us-west-2'
    });

    var s3 = new aws.S3();
    var s3_params = {
        Bucket: process.env.AWS_BUCKET,
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
        db.get(process.env.DB_COMMUNITIES, req.user)
            .then(function(response){

                if (response.body.code !== "items_not_found") {
                    var user = response.body;

                    if (!addCompany.location_key) addCompany.location_key == addCompany.community_key;

                    if (user.communities.indexOf(addCompany.location_key) < 0) {
                        res.status(202).send({ message: 'You must be a member of this community to add a company.' });
                    } else if (!addCompany.community_key || (user.roles && user.roles.leader && user.roles.leader[addCompany.community_key] && user.roles.leader[addCompany.community_key].indexOf(addCompany.location_key) < 0)) {
                        console.warn("No community specified, or user is not a leader in community: " + addCompany.community_key + " for location: " + addCompany.location_key + "!");
                        addCompany.community_key = addCompany.location_key;
                    }

                    var company = schema.angellist(addCompany.al_profile, addCompany.location_key, addCompany.community_key);
                    if (company.profile.angellist.industries) delete company.profile.angellist.industries;

                    //search for company and add if not there..
                    companyPull(company, addCompany.role, addCompany.location_key, req.user, addCompany.key, function(result) {
                        res.status(result.status).send(result.data);
                    });
/*
                    } else {
                        console.warn("User is not a member of community: " + addCompany.community_key + " and location: " + addCompany.location_key + "!");
                        res.status(400).send({ message: 'You must be a member of this community and/or a leader of this network to add a company to it.' });
                    }
                    */
                } else {
                    console.warn('WARNING:  User not found.');
                }
            })

            .fail(function(err){
                console.warn("WARNING: company231", err);
            });
    }
}

function handleDeleteCompany(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var params = req.body.params;

    var delete_it = function() {
        db.remove(process.env.DB_COMMUNITIES, params.company_key, 'true')
            .then(function () {

                // company has been deleted, now delete references in user records

                db.newSearchBuilder()
                    .collection(process.env.DB_COMMUNITIES)
                    .limit(100)
                    .offset(0)
                    .sortRandom()
                    .query('@value.type:"user" AND @value.roles.*.' + params.company_key + ':*')
                    .then(function (flush) {
                        for (r in flush.body.results) {
                            for (i in flush.body.results[r].value.roles) {
                                for (c in flush.body.results[r].value.roles[i]) {
                                    if (c == params.company_key) delete flush.body.results[r].value.roles[i][c];
                                    console.log('Deleted ' + i + ' from ' + flush.body.results[r].path.key);
                                }
                            }
                        }
                        res.status(204).send({message: 'Company deleted!'});
                    })
                    .fail(function (err) {
                        console.log("WARNING: ", err);
                        res.status(202).send({message: "The company has been deleted, but something else went wrong."});
                    });
            })
            .fail(function (err) {
                console.warn('WARNING: community620', err);
                res.status(202).send({message: "Something went wrong."});
            });
    };

    try {
        console.log('Deleting company: ' + params.company_key);

        // first determine if the company has founders or team members. Pull from DB to prevent tampering.

        db.newSearchBuilder()
            .collection(process.env.DB_COMMUNITIES)
            .limit(100)
            .offset(0)
            .sortRandom()
            .query('@value.type:"user" AND (@value.roles.founder.' + params.company_key + ':* OR @value.roles.team.' + params.company_key + ':*)')
            .then(function (team) {

                if (team.body && (team.body.count == 0)) {

                    // no founders or team members, so it can be deleted by anyone

                    delete_it();

                } else {

                    // need to validate whether the current user is one of the founders or team members

                    var del = false;
                    for (t in team.body.results) {

                        if (team.body.results[t].path.key == req.user) {
                            del = true;
                            delete_it();
                            break;
                        }
                    }

                    if (!del) res.status(202).send({message: "Only a founder or team member of this company may delete it."});
                }
            })
            .fail(function (err) {
                console.log("WARNING: ", err);
                res.status(202).send({message: err});
            });
    }
    catch(err) {
        console.warn("WARNING: ", err);
        res.status(202).send({message: err});
    }
}

var addRole = function(company_key, role, location_key, user_key) {

    db.get(process.env.DB_COMMUNITIES, user_key)
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

                db.put(process.env.DB_COMMUNITIES, user_key, response.body)
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

var companyPull = function (company, role, location_key, user, key, callback) {

    console.log('Looking for existing company based on key or AngelList profile.');

    db.search(process.env.DB_COMMUNITIES, '@path.key:' + key + ' OR @value.profile.angellist.id: ' + company.profile.angellist.id) // no quotes due to number not string
        .then(function (result){

            console.log('Result of db search: ' + result.body.total_count);

            if (result.body.results.length > 0){

                console.log("Matched startup to database company: " + company.profile.name);

                db.put(process.env.DB_COMMUNITIES, result.body.results[0].path.key, company)
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

                db.post(process.env.DB_COMMUNITIES, company)
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