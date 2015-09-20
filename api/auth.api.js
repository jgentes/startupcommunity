var bcrypt = require('bcryptjs'),
    moment = require('moment'),
    request = require('request'),
    jwt = require('jwt-simple'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db.key),
    knowtify = require('knowtify-node');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var AuthApi = function() {
    this.ensureAuthenticated = handleEnsureAuthenticated;
    this.createAPIToken = handleCreateAPIToken;
    this.createToken = handleCreateToken;
    this.inviteUser = handleInviteUser;
    this.linkedin = handleLinkedin;
    this.signup = handleSignup;
    this.login = handleLogin;
    this.unlink = handleUnlink;
};

/*
 |--------------------------------------------------------------------------
 | Internal functions
 |--------------------------------------------------------------------------
 */

var schema = {
    invite: function(email, location_key, community_key) {

        var communities = location_key == community_key ?
                [location_key] :
                [location_key, community_key];

        return {
            "type": "invite",
            "profile": {
                "home": location_key,
                "email": email
            },
            "communities": communities
        };
    },
    linkedin: function(profile, email, location_key, community_key) {

        var communities = location_key == community_key ?
                [location_key] :
                [location_key, community_key],
            roles = { "mentor" : {} };

        roles.mentor[location_key] = [location_key];
        roles.mentor[community_key] = [location_key];

        return {
            "type": "user",
            "profile": {
                "home": location_key,
                "name": profile.firstName + " " + profile.lastName,
                "email": profile.emailAddress || email,
                "linkedin": profile,
                "avatar": profile.pictureUrl || ""
            },
            "communities": communities,
            "roles" : roles
        };
    },
    signupform: function(formdata) {
        var hash = bcrypt.hashSync(formdata.password, 8);
        return {
            "type": "user",
            "context": {
                "location": "us",
                "community": ""
            },
            "profile": {
                "name": formdata.name,
                "email": formdata.email,
                "password": hash,
                "avatar": ""
            },
            "communities": {
                "usa": {
                    "oregon": {
                        "deschutes-or": {
                            "bend-or": {
                                "roles": [
                                    "supporter"
                                ]
                            }
                        }
                    }
                }
            }
        };
    }
};

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function handleEnsureAuthenticated(req, res, next) {

    if (!req.headers.authorization) {
        console.log('Session is anonymous.');
        return res.status(204).end();
    }
    try {

        var token = req.headers.authorization.split(' ')[1];
        var payload = jwt.decode(token, config.token_secret);

        if (payload.exp <= Date.now()) {
            console.log('Token has expired');
            return res.status(204).end();
        }

        if (req.user === undefined) {
            req.user = {}; //required step to pursue auth through refresh
        } else {
            console.log('Existing user in request:');
        }

        req.user = payload.sub;
        next();
    }
    catch (e) {
        console.log('EnsureAuth failure: ');
        console.log(e);
        return res.status(204).end();
    }
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function handleCreateToken(req, user) {
    var payload = {
        iss: req.hostname,
        sub: user,
        iat: moment().valueOf(),
        exp: moment().add(14, 'days').valueOf()
    };
    return jwt.encode(payload, config.token_secret);
}

function handleCreateAPIToken(req, res) {
    var payload = {
        iss: req.hostname,
        sub: req.user,
        iat: moment().valueOf(),
        exp: moment().add(90, 'days').valueOf()
    };
    res.status(201).send(jwt.encode(payload, config.API_token_secret));

    db.get(config.db.communities, req.user.value.key || req.user.path.key)
        .then(function(response){
            if (response.body.code !== "items_not_found") {
                console.log('Matching user found.');
                if (response.body.profile.api_key === undefined) {
                    response.body.profile["api_key"] = jwt.encode(payload, config.API_token_secret); // get user account and re-upload with api_key
                    db.put(config.db.communities, req.user.value.key || req.user.path.key, response.body)
                        .then(function () {
                            console.log("Profile updated.");
                        })
                        .fail(function (err) {
                            console.error("Profile update failed:");
                            console.error(err.body);
                        });
                }
            } else {
                console.warn('WARNING:  API Token for a user that does not exist!!');
            }
        })
        .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(202).send({ message: 'Something went wrong: ' + err});
        });

}

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
function handleSignup(req, res) {
    var user = schema.signupform(req.body);

    db.newSearchBuilder()
        .collection(config.db.communities)
        .limit(1)
        .query('profile.email: "' + req.body.profile.email + '"')
        .then(function(result){
            if (result.body.results.length > 0) {
                console.log('User already exists');
                res.status(401).send({ message: 'That email address is already registered to a user.'}); //username already exists
            } else {
                console.log('Email is free for use');
                db.post(config.db.communities, user)
                    .then(function () {
                        db.newSearchBuilder()
                            .collection(config.db.communities)
                            .limit(1)
                            .query('profile.email: "' + req.body.profile.email + '"')
                            .then(function(result){
                                if (result.body.results.length > 0) {
                                    console.log("USER:");
                                    console.log(user);
                                    res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });
                                } else {
                                    console.warn("WARNING: Search couldn't find user after posting new user!");
                                    res.status(401).send({ message: 'Something went wrong!'});
                                }
                            })
                            .fail(function(err){
                                console.log("SEARCH FAIL:" + err);
                                res.status(202).send({ message: 'Something went wrong: ' + err});
                            })
                            .fail(function (err) {
                                console.log("POST FAIL:" + err.body);
                                res.status(202).send({ message: 'Something went wrong: ' + err});
                            });
                    });
            }
        })
        .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(202).send({ message: 'Something went wrong: ' + err});
        });
}


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */

function handleLogin(req, res) {
    db.newSearchBuilder()
        .collection(config.db.communities)
        .limit(1)
        .query('profile.email: "' + req.body.profile.email + '"')
        .then(function(result){
            if (result.body.results.length > 0) {
                console.log("FOUND USER");
                var hash = result.body.results[0].value.profile.password;
                if (bcrypt.compareSync(req.body.profile.password, hash)) {
                    res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });
                } else {
                    console.log("PASSWORDS DO NOT MATCH");
                    return res.status(401).send({ message: 'Wrong email and/or password' });
                }
            } else {
                console.log("COULD NOT FIND USER IN DB FOR SIGNIN");
                return res.status(401).send({ message: 'Wrong email and/or password' });
            }
        })
        .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(202).send('Something went wrong: ' + err);
        });
}

/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */

var getLinkedinProfile = function(url, email, access_token, location_key, community_key, profilecallback) {
    var querystring = require('querystring');
    request.get({ url: 'https://api.linkedin.com/v1/people/url=' + querystring.escape(url) + ':(id,first-name,last-name,picture-url;secure=true,headline,location,summary,public-profile-url)', qs: { oauth2_access_token: access_token, format: 'json' }, json: true },
        function(error, response, body) {
            if (!body.status || body.status === 200) {
                if (body.id !== undefined) {
                    var linkedinuser = schema.linkedin(body, email, location_key, community_key);
                    console.log('LINKEDIN USER:');
                    console.log(linkedinuser);
                    linkedinPull(linkedinuser, profilecallback);
                }
            } else {
                console.error('Linkedin profile error: ' + body.message);
                console.log(body);
                profilecallback(body);
            }
        });
};

var linkedinPull = function (linkedinuser, pullcallback) {

    console.log('Looking for existing user based on public Linkedin profile.');

    db.search(config.db.communities, 'profile.linkedin.publicProfileUrl: "' + linkedinuser.profile.linkedin.publicProfileUrl + '"')
        .then(function (result){
            console.log('Result of db search: ' + result.body.total_count);
            if (result.body.results.length > 0){
                if (result.body.results[0].value.profile.linkedin.id == linkedinuser.profile.linkedin.id){
                    console.log("Matched Linkedin user to database user: " + linkedinuser.profile.name);
                    result.body.results[0].value["message"] = "It looks like " + linkedinuser.profile.name + " is already in the system.";
                    pullcallback({ "status": 202, "data": result.body.results[0].value });
                } else {
                    console.warn("WARNING: There's already an existing user with that public Linkedin profile.");
                    result.body.results[0].value["message"] = "It looks like " + linkedinuser.profile.name + " is already in the system.";
                    pullcallback({ "status": 200, "data": result.body.results[0].value });
                }
            } else {
                console.log('No existing linkedin user found!');
                db.post(config.db.communities, linkedinuser)
                    .then(function () {
                        console.log("REGISTERED: " + linkedinuser.profile.email);
                        pullcallback({ "status": 200, "data": linkedinuser });
                    })
                    .fail(function (err) {
                        console.error("PUT FAIL:");
                        console.error(err);
                    });
            }
        })
        .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(202).send({ message: 'Something went wrong: ' + err});
        });

};

function handleLinkedin(req, res) {
    var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
    var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url;secure=true,headline,location,specialties,positions,summary,industry,public-profile-url)';

    var params = {
        client_id: config.linkedin.clientID,
        redirect_uri: req.body.redirectUri,
        client_secret: config.linkedin.clientSecret,
        code: req.body.code,
        grant_type: 'authorization_code'
    };
    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, { form: params, json: true }, function(err, response, body) {

        if (response.statusCode !== 200) {
            return res.status(response.statusCode).send({ message: body.error_description });
        }

        var params = {
            oauth2_access_token: body.access_token,
            format: 'json'
        };

        var uploadcheck = 0;

        if (uploadcheck === 0) {
            // Step 2. Retrieve profile information about the current user.
            request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {

                if (err) {
                    console.log("Linkedin GET FAIL:");
                    console.log(err);
                    return res.status(401).send({ message: 'Something went wrong: ' + err});
                } else profile['access_token'] = params.oauth2_access_token;

                var userprofile = schema.linkedin(profile);

                // Step 3a. Link user accounts.
                if (req.headers.authorization) { // isloggedin already? [this use case is for linking a linkedin profile to an existing account

                    db.newSearchBuilder()
                        .collection(config.db.communities)
                        .limit(1)
                        .query('profile.linkedin.id: "' + profile.id + '"')
                        .then(function (result){
                            if (result.body.results.length > 0){
                                console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                                res.send({ token: req.headers.authorization.split(' ')[1], user: result.body.results[0] });
                            } else {

                                console.log('No Linkedin user in the system with that id; ok to add it.');
                                var token = req.headers.authorization.split(' ')[1];
                                var payload = jwt.decode(token, config.token_secret);

                                db.get(config.db.communities, payload.sub)
                                    .then(function(response){
                                        if (response.body.code !== "items_not_found") {
                                            console.log('Matching user found.');
                                            response.body.profile["linkedin"] = profile; // get user account and re-upload with linkedin data
                                            db.put(config.db.communities, payload.sub, response.body)
                                                .then(function () {
                                                    console.log("Profile updated: " + userprofile.profile.email);
                                                })
                                                .fail(function (err) {
                                                    console.error("Profile update failed:");
                                                    console.error(err.body);
                                                });
                                            var newresponse = { "value" : response.body };
                                            res.send({ token: handleCreateToken(req, newresponse), user: newresponse });
                                        } else {
                                            return res.status(401).send({ message: "Sorry, we couldn't find you in our system. Please <a href='/' target='_self'>click here to request an invitation</a>." });
                                        }
                                    })
                                    .fail(function(err){
                                        console.log("SEARCH FAIL:" + err);
                                        res.status(202).send({ message: 'Something went wrong: ' + err});
                                    });
                            }
                        })
                        .fail(function(err){
                            console.log("SEARCH FAIL:" + err);
                            res.status(202).send({ message: 'Something went wrong: ' + err});
                        });


                } else {

                    db.newSearchBuilder()
                        .collection(config.db.communities)
                        .limit(1)
                        .query('profile.linkedin.id: "' + profile.id + '"')
                        .then(function (result){
                            if (result.body.results.length > 0){
                                console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                                result.body.results[0].value.profile["linkedin"] = profile; // get user account and re-upload with linkedin data
                                if (result.body.results[0].value.profile.avatar === "") {
                                    result.body.results[0].value.profile.avatar = result.body.results[0].value.profile.linkedin.pictureUrl;
                                }
                                if (result.body.results[0].value.profile.name !== result.body.results[0].value.profile.linkedin.firstName + ' ' + result.body.results[0].value.profile.linkedin.lastName) {
                                    result.body.results[0].value.profile.name = result.body.results[0].value.profile.linkedin.firstName + ' ' + result.body.results[0].value.profile.linkedin.lastName;
                                }
                                if (result.body.results[0].value.profile.email !== result.body.results[0].value.profile.linkedin.emailAddress) {
                                    result.body.results[0].value.profile.email = result.body.results[0].value.profile.linkedin.emailAddress;
                                }

                                db.put(config.db.communities, result.body.results[0].path.key, result.body.results[0].value)
                                    .then(function () {
                                        console.log("Profile updated: " + userprofile.profile.email);
                                    })
                                    .fail(function (err) {
                                        console.error("Profile update failed:");
                                        console.error(err);
                                    });

                                res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });
                            } else {
                                console.log(profile);
                                db.newSearchBuilder()
                                    .collection(config.db.communities)
                                    .limit(1)
                                    .query('profile.email: "' + profile.emailAddress + '"')
                                    .then(function(result){
                                        if (result.body.results.length > 0) {
                                            console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                                            result.body.results[0].value.profile["linkedin"] = profile; // get user account and re-upload with linkedin data
                                            db.put(config.db.communities, result.body.results[0].path.key, result.body.results[0].value)
                                                .then(function () {
                                                    console.log("Profile updated: " + userprofile.profile.email);
                                                })
                                                .fail(function (err) {
                                                    console.error("Profile update failed:");
                                                    console.error(err);
                                                });
                                            res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });

                                        } else {
                                            console.log('No existing user found!');
                                            res.status(401).send({ profile: profile, message: "Sorry, we couldn't find " + profile.firstName + " " + profile.lastName + " with email address '" + profile.emailAddress + "' in our system. <br/><br/>Please <a href='/' target='_self'>click here to request an invitation</a>." });
                                        }
                                    })
                                    .fail(function(err){
                                        console.log("SEARCH FAIL:" + err);
                                        res.status(202).send({ message: 'Something went wrong: ' + err});
                                    });

                                /* Do this to create a user account if no user exists
                                 db.newSearchBuilder()
                                 .collection(config.db.communities)
                                 .limit(1)
                                 .query('value.email: "' + profile.emailAddress + '"')
                                 .then(function(result){
                                 if (result.body.results.length > 0) {
                                 console.log('Existing user found.');
                                 res.status(409).send({ message: "Sorry, there's already a user with your email address." });

                                 } else {
                                 db.post(config.db.communities, userprofile)
                                 .then(function () {
                                 console.log("Profile created: " + JSON.stringify(userprofile));
                                 res.send({ token: handleCreateToken(req, userprofile) });
                                 })
                                 .fail(function (err) {
                                 console.error("POST fail:");
                                 console.error(err.body);
                                 });
                                 }
                                 })
                                 .fail(function(err){
                                 console.log("SEARCH FAIL:" + err);
                                 res.status(401).send({ message: 'Something went wrong: ' + err});
                                 });
                                 */
                            }
                        });
                }
            });
        } else {

            var userlist = {};

            for (var i=0; i < userlist.length; i++) {
                getLinkedinProfile(userlist[i].url, userlist[i].email, params.oauth2_access_token, function(response) { console.log('User: ' + response.data); });
            }

        }
    });
}

/*
 |--------------------------------------------------------------------------
 | Invite Person
 |--------------------------------------------------------------------------
 */

function handleInviteUser(req, res) {
    // always use ensureAuth before this (to acquire req.user)
    var inviteUser = req.body.params;

    console.log('Inviting ' + inviteUser.email + ' to ' + inviteUser.location_key + ' / ' + inviteUser.community_key);

    // validate user has leader role within the location/community
    if (req.user.value.roles.leader[inviteUser.community_key] && req.user.value.roles.leader[inviteUser.community_key].indexOf(inviteUser.location_key) > -1) {
        // check to see if the email address already exists within the system
        db.newSearchBuilder()
            .collection(config.db.communities)
            .limit(1)
            .query('type: "user" AND (profile.linkedin.emailAddress: "' + inviteUser.email + '" OR profile.email: "' + inviteUser.email + '")')
            .then(function (result) {
                console.log('Result of db search: ' + result.body.total_count);
                if (result.body.results.length > 0) {
                    console.log("Existing user found!");
                    res.status(202).send({message: 'Sorry, a user with that email address already exists in the system! View them here: <a target="_blank" href="https://startupcommunity.org/' + result.body.results[0].path.key + '">https://startupcommunity.org/' + result.body.results[0].path.key});
                } else {
                    // no existing user, so create user record with email address and community data
                    var newUser = schema.invite(inviteUser.email, inviteUser.location_key, inviteUser.community_key);
                    console.log('creating user')
                    db.post(config.db.communities, newUser)
                        .then(function (response) {
                            console.log('done')
                            var userkey = response.headers.location.split('/')[3]; // hope their response format doesn't change :-/

                            // send email with knowtify with unique link
                            var knowtifyClient = new knowtify.Knowtify(config.knowtify, false);

                            knowtifyClient.contacts.upsert({
                                    "event" : "invitation",
                                    "contacts": [{
                                        "email": inviteUser.email,
                                        "invite_community": //todo need formatted community name here
                                        "invite_code": userkey,
                                        "invitor_name": //todo need name here
                                        "invitor_image": //todo need headshot url here
                                    }]
                            }),
                                function(success) {
                                    console.log('Invitation sent to ' + inviteUser.email);
                                    res.status(200).end();
                                };
                        });
                }
            });
    } else {
        console.warn("User is not a leader in community: " + inviteUser.community_key + " for location: " + inviteUser.location_key + "!");
        res.status(202).send({ message: 'Sorry, you must be a Leader in this community to invite people to it.' });
    }
}

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */

function handleUnlink(req, res) {
    var provider = req.params.provider;
    db.get(config.db.communities, req.user.value.key || req.user.path.key)
        .then(function(response){
            if (response.body.code !== "items_not_found") {
                response.body[provider] = undefined;
                db.put(config.db.communities, req.user.value.key ||  req.user.path.key, response.body)
                    .then(function() {
                        console.log('Successfully unlinked provider!');
                        res.status(200).end();
                    })
                    .fail(function(err) {
                        console.log('user update failed');
                        res.status(202).send({ message: 'Something went wrong! ' + err });
                    });
            } else {
                console.log('User not found.');
                return res.status(202).send({ message: 'User not found' });
            }
        })
        .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(202).send({ message: 'Something went wrong: ' + err});
        });
}


module.exports = AuthApi;