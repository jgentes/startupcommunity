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
            "invite_communities": communities
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
        console.warn('WARNING: EnsureAuth failure: ');
        console.warn(e);
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
            console.warn("WARNING: SEARCH FAIL:" + err);
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
            console.warn("WARNING: SEARCH FAIL:" + err);
            res.status(202).send('Something went wrong: ' + err);
        });
}

/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */

function handleLinkedin(req, res) {
    // this function handles new user invites as well as existing user login
    var invite_code = req.body.invite_code,
        accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken',
        peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url;secure=true,headline,location,specialties,positions,summary,industry,public-profile-url)';

    var params = {
        client_id: config.linkedin.clientID,
        redirect_uri: req.body.redirectUri,
        client_secret: config.linkedin.clientSecret,
        code: req.body.code,
        grant_type: 'authorization_code'
    };

    var delete_invite = function() {
        db.remove(config.db.communities, invite_code, true)
            .then(function (result) {
                console.log('Invitation applied and deleted: ' + invite_code);
            })
            .fail(function (err) {
                console.warn('WARNING: Invitation was used but not deleted: ' + invite_code);
            })
    };

    var add_knowtify = function(id, email) {
        // send user info to Knowtify
        var knowtifyClient = new knowtify.Knowtify(config.knowtify, false);

        knowtifyClient.contacts.upsert({
            "contacts": [
                {
                    "email": email,
                    "data": {
                        "id": id
                    }
                }
            ]
        });
    };

    // Exchange authorization code for access token.
    request.post(accessTokenUrl, {form: params, json: true}, function (err, response, body) {

        if (response.statusCode !== 200) {
            return res.status(response.statusCode).send({message: body.error_description});
        }

        var params = {
            oauth2_access_token: body.access_token,
            format: 'json'
        };

        // Retrieve profile information about the current user.
        request.get({url: peopleApiUrl, qs: params, json: true}, function (err, response, profile) {

            if (err) {
                console.warn("WARNING: Linkedin GET FAIL:");
                console.warn(err);
                return res.status(401).send({message: 'Something went wrong: ' + err});
            } else profile['access_token'] = params.oauth2_access_token;

            // if this is an invitation, pull that invite data first
            if (invite_code) {
                db.newSearchBuilder()
                    .collection(config.db.communities)
                    .limit(1)
                    .query('type: "invite" AND @path.key: ' + invite_code)
                    .then(function (result) {
                        if (result.body.results.length > 0) {
                            console.log('Verified invitation');
                            userCheck(result.body.results[0].value);
                        } else {
                            console.log('WARNING: Invalid invite code: ' + invite_code);
                            return res.status(404).send({message: 'Sorry, this invite code is not valid: ' + invite_code});
                        }
                    })
            } else userCheck();

            function userCheck(invite_profile) {
                // check to see if this linkedin account is already linked to an existing user
                db.newSearchBuilder()
                    .collection(config.db.communities)
                    .limit(1)
                    .query('type: "user" AND profile.linkedin.id: "' + profile.id + '"')
                    .then(function (result) {
                        if (result.body.results.length > 0) {
                            console.log("Found existing user: " + profile.firstName + ' ' + profile.lastName);
                            result.body.results[0].value.profile["linkedin"] = profile;
                            // get user account and update with latest linkedin data

                            if (result.body.results[0].value.profile.avatar === "") {
                                result.body.results[0].value.profile.avatar = profile.pictureUrl;
                            }
                            if (result.body.results[0].value.profile.name !== profile.firstName + ' ' + profile.lastName) {
                                result.body.results[0].value.profile.name = profile.firstName + ' ' + profile.lastName;
                            }
                            if (result.body.results[0].value.profile.email !== profile.emailAddress) {
                                result.body.results[0].value.profile.email = profile.emailAddress;
                            }

                            if (invite_profile && invite_profile.invite_communities) { // add invite data to existing user record and delete invite
                                result.body.results[0].value["invite_communities"] = invite_profile.invite_communities;
                            }

                            db.put(config.db.communities, result.body.results[0].path.key, result.body.results[0].value)
                                .then(function () {
                                    console.log("Profile updated: " + profile.emailAddress);
                                    if (invite_profile) {
                                        delete_invite();
                                    }
                                    add_knowtify(result.body.results[0].path.key, profile.emailAddress);
                                })
                                .fail(function (err) {
                                    console.error("Profile update failed:");
                                    console.error(err);
                                });

                            res.send({
                                token: handleCreateToken(req, result.body.results[0]),
                                user: result.body.results[0]
                            });
                        } else {
                            // search by email
                            db.newSearchBuilder()
                                .collection(config.db.communities)
                                .limit(1)
                                .query('type: "user" AND profile.email: "' + profile.emailAddress + '"')
                                .then(function (result) {
                                    if (result.body.results.length > 0) {
                                        console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                                        result.body.results[0].value.profile["linkedin"] = profile; // get user account and re-upload with linkedin data

                                        if (invite_profile && invite_profile.invite_communities) { // add invite data to existing user record and delete invite
                                            result.body.results[0].value["invite_communities"] = invite_profile.invite_communities;
                                        }

                                        db.put(config.db.communities, result.body.results[0].path.key, result.body.results[0].value)
                                            .then(function () {
                                                console.log("Profile updated: " + profile.emailAddress);
                                                if (invite_profile) {
                                                    delete_invite();
                                                }
                                                add_knowtify(result.body.results[0].path.key, profile.emailAddress);
                                            })
                                            .fail(function (err) {
                                                console.warn("WARNING: Profile update failed:");
                                                console.warn(err);
                                            });
                                        res.send({
                                            token: handleCreateToken(req, result.body.results[0]),
                                            user: result.body.results[0]
                                        });

                                    } else {
                                        console.log('No existing user found!');

                                        if (invite_profile) {
                                            // note that we don't validate the invite email matches the linkedin email, so anyone can use the invite once.

                                            // update the invite record with user details
                                            invite_profile.type = "user";
                                            invite_profile.profile.linkedin = profile;
                                            invite_profile.profile.avatar = profile.pictureUrl;
                                            invite_profile.profile.name = profile.firstName + ' ' + profile.lastName;
                                            invite_profile.profile.email = profile.emailAddress;

                                            // need to add path for res.send
                                            var new_profile = {
                                                path: {
                                                    key: invite_code
                                                },
                                                value: invite_profile
                                            };

                                            db.put(config.db.communities, invite_code, invite_profile)
                                                .then(function () {
                                                    console.log("Profile created: " + JSON.stringify(new_profile));
                                                    res.send({
                                                        token: handleCreateToken(req, new_profile),
                                                        user: new_profile
                                                    });
                                                    add_knowtify(invite_code, profile.emailAddress);
                                                })
                                                .fail(function (err) {
                                                    console.error("POST fail:");
                                                    console.error(err.body);
                                                });

                                        } else {
                                            res.status(401).send({
                                                profile: profile,
                                                message: "Sorry, we couldn't find " + profile.firstName + " " + profile.lastName + " with email address '" + profile.emailAddress + "' in our system. <br/><br/>Please <a href='/' target='_self'>click here to request an invitation</a>."
                                            });
                                        }

                                    }
                                })
                                .fail(function (err) {
                                    console.warn("WARNING: SEARCH FAIL:" + err);
                                    res.status(202).send({message: 'Something went wrong: ' + err});
                                });
                        }
                    })
                    .fail(function (err) {
                        console.warn("WARNING: There was a problem:");
                        console.warn(err);
                    });
            };

        });
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
    if (req.user.value.roles && req.user.value.roles.leader[inviteUser.community_key] && req.user.value.roles.leader[inviteUser.community_key].indexOf(inviteUser.location_key) > -1) {
        // check to see if the email address already exists within the system
        db.newSearchBuilder()
            .collection(config.db.communities)
            .limit(1)
            .query('type: "user" AND (profile.linkedin.emailAddress: "' + inviteUser.email + '" OR profile.email: "' + inviteUser.email + '")')
            .then(function (result) {
                if (result.body.results.length > 0) {
                    console.log("Existing user found!");
                    res.status(202).send({message: 'Sorry, a user with that email address already exists in the system! View them here: <a target="_blank" href="https://startupcommunity.org/' + result.body.results[0].path.key + '">https://startupcommunity.org/' + result.body.results[0].path.key});
                } else {
                    // no existing user, so search for existing invite
                    db.newSearchBuilder()
                        .collection(config.db.communities)
                        .limit(1)
                        .query('type: "invite" AND profile.email: "' + inviteUser.email + '"')
                        .then(function (result) {
                            if (result.body.results.length > 0) {
                                console.log("Existing invite found!");
                                res.status(202).send({message: 'An invitation has already been sent to ' + inviteUser.email + '. We will continue to send reminders for 1 week, then you will be notified if they still have not accepted. You may invite them again at that time.'});
                            } else {
                                // create user record with email address and community data
                                var newUser = schema.invite(inviteUser.email, inviteUser.location_key, inviteUser.community_key);
                                console.log('creating user')
                                var community_url =
                                    inviteUser.location_key == inviteUser.community_key ?
                                    inviteUser.location_key :
                                    inviteUser.location_key + '/' + inviteUser.community_key;

                                db.post(config.db.communities, newUser)
                                    .then(function (response) {
                                        var userkey = response.headers.location.split('/')[3]; // hope their response format doesn't change :-/                     console.log(

                                        // send email with knowtify with unique link
                                        var knowtifyClient = new knowtify.Knowtify(config.knowtify, false);

                                        knowtifyClient.contacts.upsert({
                                            "event": "invitation",
                                            "contacts": [{
                                                "email": inviteUser.email,
                                                "data": {
                                                    "invite_community": inviteUser.community_name.split(',')[0],
                                                    "invite_url": community_url,
                                                    "invite_code": userkey,
                                                    "invitor_name": inviteUser.leader_profile.name,
                                                    "invitor_email": inviteUser.leader_profile.email,
                                                    "invitor_image": inviteUser.leader_profile.avatar
                                                }
                                            }]
                                        },
                                        function (success) {
                                            console.log('Invitation sent to ' + inviteUser.email + ' (' + userkey + ')');
                                            res.status(200).end();
                                        },
                                        function (error) {
                                            console.log('WARNING:');
                                            console.log(error);
                                            res.status(500).end();
                                        });
                                    });
                            }
                        })
                }
            });
    } else {
        console.warn("User is not a leader in community: " + inviteUser.community_key + " for location: " + inviteUser.location_key + "!");
        res.status(202).send({ message: 'Sorry, you must be a Leader in this community to invite people to it.' });
    }
}

module.exports = AuthApi;