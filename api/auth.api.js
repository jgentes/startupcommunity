var bcrypt = require('bcryptjs'),
    moment = require('moment'),
    request = require('request'),
    jwt = require('jwt-simple'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db.key);

var AuthApi = function() {
    this.ensureAuthenticated = handleEnsureAuthenticated;
    this.createAPIToken = handleCreateAPIToken;
    this.createToken = handleCreateToken;
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
    linkedin: function(profile, email) {
        return {
            "type": "user",
            "context": {
                "location": "us",
                "community": ""
            },
            "profile": {
                "name": profile.firstName + " " + profile.lastName,
                "email": profile.emailAddress || email,
                "linkedin": profile,
                "avatar": profile.pictureUrl || ""
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
            return res.status(401).send({ message: 'Your session has expired. Please log in again.' });
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
        return res.status(401).send({ message: 'Please logout or clear your local browser storage and try again.' });
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
        sub: user.path.key,
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

    db.get(config.db.collections.users, req.user)
        .then(function(response){
            if (response.body.code !== "items_not_found") {
                console.log('Matching user found.');
                if (response.body.profile.api_key === undefined) {
                    response.body.profile["api_key"] = jwt.encode(payload, config.API_token_secret); // get user account and re-upload with api_key
                    db.put(config.db.collections.users, req.user, response.body)
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
            res.status(400).send({ message: 'Something went wrong: ' + err});
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
        .collection(config.db.collections.users)
        .limit(1)
        .query('profile.email: "' + req.body.profile.email + '"')
        .then(function(result){
            if (result.body.results.length > 0) {
                console.log('User already exists');
                res.status(401).send({ message: 'That email address is already registered to a user.'}); //username already exists
            } else {
                console.log('Email is free for use');
                db.post(config.db.collections.users, user)
                    .then(function () {
                        db.newSearchBuilder()
                            .collection(config.db.collections.users)
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
                                res.status(400).send({ message: 'Something went wrong: ' + err});
                            })
                            .fail(function (err) {
                                console.log("POST FAIL:" + err.body);
                                res.status(400).send({ message: 'Something went wrong: ' + err});
                            });
                    });
            }
        })
        .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(400).send({ message: 'Something went wrong: ' + err});
        });
}


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */

function handleLogin(req, res) {
    db.newSearchBuilder()
        .collection(config.db.collections.users)
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
            res.status(400).send('Something went wrong: ' + err);
        });
}

/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */

var getLinkedinProfile = function(url, email, access_token, profilecallback) {
    var querystring = require('querystring');
    request.get({ url: 'https://api.linkedin.com/v1/people/url=' + querystring.escape(url) + ':(id,first-name,last-name,picture-url;secure=true,headline,location,summary,public-profile-url)', qs: { oauth2_access_token: access_token, format: 'json' }, json: true },
        function(error, response, body) {
            if (!body.status || body.status === 200) {
                if (body.id !== undefined) {
                    var linkedinuser = schema.linkedin(body, email);
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

    db.search(config.db.collections.users, 'profile.linkedin.publicProfileUrl: "' + linkedinuser.profile.linkedin.publicProfileUrl + '"')
        .then(function (result){
            console.log('Result of db search: ' + result.body.total_count);
            if (result.body.results.length > 0){
                if (result.body.results[0].value.profile.linkedin.id == linkedinuser.profile.linkedin.id){
                    console.log("Matched Linkedin user to database user: " + linkedinuser.profile.name);
                    pullcallback({ "status": 409, "message": "It looks like " + linkedinuser.profile.name + " is already in the system.", "data": result.body.results[0].value });
                } else {
                    console.warn("WARNING: There's already an existing user with that public Linkedin profile.");
                    pullcallback({ "status": 200, "data": result.body.results[0].value });
                }
            } else {
                console.log('No existing linkedin user found!');
                db.post(config.db.collections.users, linkedinuser)
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
            res.status(400).send({ message: 'Something went wrong: ' + err});
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
                        .collection(config.db.collections.users)
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

                                db.get(config.db.collections.users, payload.sub)
                                    .then(function(response){
                                        if (response.body.code !== "items_not_found") {
                                            console.log('Matching user found.');
                                            response.body.profile["linkedin"] = profile; // get user account and re-upload with linkedin data
                                            db.put(config.db.collections.users, payload.sub, response.body)
                                                .then(function () {
                                                    console.log("Profile updated: " + userprofile.profile.email);
                                                })
                                                .fail(function (err) {
                                                    console.error("Profile update failed:");
                                                    console.error(err.body);
                                                });
                                            res.send({ token: handleCreateToken(req, response.body), user: response.body });
                                        } else {
                                            return res.status(401).send({ message: "Sorry, we couldn't find you in our system. Please <a href='/' target='_self'>click here to request an invitation</a>." });
                                        }
                                    })
                                    .fail(function(err){
                                        console.log("SEARCH FAIL:" + err);
                                        res.status(400).send({ message: 'Something went wrong: ' + err});
                                    });
                            }
                        })
                        .fail(function(err){
                            console.log("SEARCH FAIL:" + err);
                            res.status(400).send({ message: 'Something went wrong: ' + err});
                        });


                } else {

                    db.newSearchBuilder()
                        .collection(config.db.collections.users)
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

                                db.put(config.db.collections.users, result.body.results[0].path.key, result.body.results[0].value)
                                    .then(function () {
                                        console.log("Profile updated: " + userprofile.profile.email);
                                    })
                                    .fail(function (err) {
                                        console.error("Profile update failed:");
                                        console.error(err);
                                    });

                                res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });
                            } else {
                                db.newSearchBuilder()
                                    .collection(config.db.collections.users)
                                    .limit(1)
                                    .query('profile.email: "' + profile.emailAddress + '"')
                                    .then(function(result){
                                        if (result.body.results.length > 0) {
                                            console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                                            result.body.results[0].value.profile["linkedin"] = profile; // get user account and re-upload with linkedin data
                                            db.put(config.db.collections.users, result.body.results[0].path.key, result.body.results[0].value)
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
                                            res.status(401).send({ profile: profile, message: "Sorry, we couldn't find you in our system. Please <a href='/' target='_self'>click here to request an invitation</a>." });
                                        }
                                    })
                                    .fail(function(err){
                                        console.log("SEARCH FAIL:" + err);
                                        res.status(400).send({ message: 'Something went wrong: ' + err});
                                    });

                                /* Do this to create a user account if no user exists
                                 db.newSearchBuilder()
                                 .collection(config.db.collections.users)
                                 .limit(1)
                                 .query('value.email: "' + profile.emailAddress + '"')
                                 .then(function(result){
                                 if (result.body.results.length > 0) {
                                 console.log('Existing user found.');
                                 res.status(409).send({ message: "Sorry, there's already a user with your email address." });

                                 } else {
                                 db.post(config.db.collections.users, userprofile)
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
 | Unlink Provider
 |--------------------------------------------------------------------------
 */

function handleUnlink(req, res) {
    var provider = req.params.provider;
    db.get(config.db.collections.users, req.user)
        .then(function(response){
            if (response.body.code !== "items_not_found") {
                response.body[provider] = undefined;
                db.put(config.db.collections.users, req.user, response.body)
                    .then(function() {
                        console.log('Successfully unlinked provider!');
                        res.status(200).end();
                    })
                    .fail(function(err) {
                        console.log('user update failed');
                        res.status(400).send({ message: 'Something went wrong! ' + err });
                    });
            } else {
                console.log('User not found.');
                return res.status(400).send({ message: 'User not found' });
            }
        })
        .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(400).send({ message: 'Something went wrong: ' + err});
        });
}


module.exports = AuthApi;