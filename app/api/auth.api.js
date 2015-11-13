var bcrypt = require('bcryptjs'),
    moment = require('moment'),
    request = require('request'),
    jwt = require('jsonwebtoken'),
    crypto = require('crypto'),
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
    this.helpToken = handleHelpToken;
};

/*
 |--------------------------------------------------------------------------
 | Internal functions
 |--------------------------------------------------------------------------
 */

var schema = {
    invite: function(email, invitor_email, location_key, community_key) {

        var communities = location_key == community_key ?
                [location_key] :
                [location_key, community_key];

        return {
            "type": "invite",
            "profile": {
                "home": location_key,
                "email": email
            },
            "invitor_email" : invitor_email,
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

        if (!req.user || req.user === undefined) {
            req.user = {}; //required step to pursue auth through refresh
        } else {
            console.log('Existing user in request');
        }

        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            req.user = jwt.verify(req.headers.authorization.split(' ')[1], config.token_secret);
        }

        next();
    }
    catch (e) {
        console.warn('WARNING: EnsureAuth failure: ', e);
        return res.status(204).end();
    }
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function handleCreateToken(req, user) {
    return jwt.sign(user.path.key, config.token_secret, { expiresIn: "5h" });
}

function handleHelpToken(req, res) {
    // this is for HelpCrunch live chat support to send over user data

    var hmac = crypto.createHmac('sha256', 'yCVzaQb6BMR7oHxYXpI373lTIg13+CVBtpvyd/dt3Rs=');
    hmac.setEncoding('hex');
    hmac.write(req.user);
    hmac.end();
    response = hmac.read();

    res.status(201).send(response);
}

function handleCreateAPIToken(req, res) {
    // todo needs to be redone if jwt-simple is no longer used
    /*var payload = {
        iss: req.hostname,
        sub: req.user,
        iat: moment().valueOf(),
        exp: moment().add(90, 'days').valueOf()
    };
    res.status(201).send(jwt.encode(payload, config.API_token_secret));*/

    db.get(config.db.communities, req.user)
        .then(function(response){
            if (response.body.code !== "items_not_found") {
                console.log('Matching user found.');
                if (response.body.profile.api_key === undefined) {
                    // todo update next line
                    //response.body.profile["api_key"] = jwt.encode(payload, config.API_token_secret); // get user account and re-upload with api_key
                    db.put(config.db.communities, req.user, response.body)
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
            console.log("WARNING: auth170", err);
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
        .query('@value.profile.email: "' + req.body.profile.email + '"')
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
                            .query('@value.profile.email: "' + req.body.profile.email + '"')
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
                                console.log("WARNING: auth211", err);
                                res.status(202).send({ message: "Something went wrong."});
                            })
                            .fail(function (err) {
                                console.log("WARNING: auth215:", err);
                                res.status(202).send({ message: "Something went wrong."});
                            });
                    });
            }
        })
        .fail(function(err){
            console.warn("WARNING: auth222", err);
            res.status(202).send({ message: "Something went wrong."});
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
        .query('@value.profile.email: "' + req.body.profile.email + '"')
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
            console.warn("WARNING: auth255" + err);
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

    var accept_invite = function(invitee, invitor_email) {
        // update Knowtify with invitation accepted
        var knowtifyClient = new knowtify.Knowtify(config.knowtify, false);

        knowtifyClient.contacts.upsert({
            "event": 'invite_accepted',
            "contacts": [
                {
                    "email": invitor_email,
                    "data": {
                        "invitee_name": invitee.name
                    }
                }
            ]
        });

        knowtifyClient.contacts.upsert({
            "contacts": [
                {
                    "email": invitee.email,
                    "data": {
                        "invite_accepted": true
                    }
                }
            ]
        });

        // add a question for their profile

        var datetime = new Date(); // added as milliseconds since epoch

        var question = {
            "type": 'question',
            "from": {
                "key": 'james',
                "name": 'James Gentes',
                "avatar": 'https://startupcommunity-dev.s3-us-west-2.amazonaws.com/profiles/james_me_wkids_square.png',
                "headline": 'Founder of StartupCommunity.org'
            },
            "to": invite_code,
            "published": datetime.getTime(),
            "content": 'What are you currently working on? Do you need any help?',
            "replies": []
        };

        db.post(config.db.messages, question)
            .then(function () {
                console.log('Question posted to new user account')
            })
            .fail(function (err) {
                console.error("POST FAIL:");
                console.error(err);
            });

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

    var add_knowtify = function(user) {
        // send user info to Knowtify
        console.log('updating Knowtify')
        var knowtifyClient = new knowtify.Knowtify(config.knowtify, false);

        knowtifyClient.contacts.upsert({
            "contacts": [
                {
                    "email": user.profile.email,
                    "data": {
                        "name": user.profile.name,
                        "email": user.profile.email
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
                console.warn("WARNING: auth380");
                console.warn(err);
                return res.status(401).send({message: 'Something went wrong: ' + err});
            } else profile['access_token'] = params.oauth2_access_token;

            // if this is an invitation, pull that invite data first
            if (invite_code) {
                db.newSearchBuilder()
                    .collection(config.db.communities)
                    .limit(1)
                    .query('@value.type: "invite" AND @path.key: ' + invite_code)
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

            function addCommunities(user_profile, invite_profile) {
                // add invite data to existing user record and delete invite
                if (invite_profile && invite_profile.invite_communities) {

                    if (!user_profile.value.communities) user_profile.value["communities"] = [];

                    for (i in invite_profile.invite_communities) {

                        if (user_profile.value.communities && user_profile.value.communities.indexOf(invite_profile.invite_communities[i]) < 0) {
                            user_profile.value.communities.push(invite_profile.invite_communities[i]);
                        }
                    }
                }
                return user_profile;
            }

            function userCheck(invite_profile) {
                // check to see if this linkedin account is already linked to an existing user
                db.newSearchBuilder()
                    .collection(config.db.communities)
                    .limit(1)
                    .query('@value.type: "user" AND @value.profile.linkedin.id: "' + profile.id + '"')
                    .then(function (result) {
                        if (result.body.results.length > 0) {
                            console.log("Found existing user: " + profile.firstName + ' ' + profile.lastName);
                            result.body.results[0].value.profile["linkedin"] = profile;

                            // get user account and update with latest linkedin data
                            if (!result.body.results[0].value.profile.avatar) {
                                result.body.results[0].value.profile.avatar = profile.pictureUrl;
                            }

                            if (!result.body.results[0].value.profile.name) {
                                result.body.results[0].value.profile.name = profile.firstName + ' ' + profile.lastName;
                            }

                            if (!result.body.results[0].value.profile.email) {
                                result.body.results[0].value.profile.email = profile.emailAddress;
                            }

                            result.body.results[0] = addCommunities(result.body.results[0], invite_profile);

                            db.put(config.db.communities, result.body.results[0].path.key, result.body.results[0].value)
                                .then(function () {
                                    console.log("Profile updated: " + result.body.results[0].value.profile.name);
                                    if (invite_profile) {
                                        accept_invite(result.body.results[0].value.profile, invite_profile.invitor_email);
                                        delete_invite();
                                    }
                                    add_knowtify(result.body.results[0].value);
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
                                .query('@value.type: "user" AND @value.profile.email: "' + profile.emailAddress + '"')
                                .then(function (result) {
                                    if (result.body.results.length > 0) {
                                        console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                                        result.body.results[0].value.profile["linkedin"] = profile; // get user account and re-upload with linkedin data

                                        result.body.results[0] = addCommunities(result.body.results[0], invite_profile);

                                        db.put(config.db.communities, result.body.results[0].path.key, result.body.results[0].value)
                                            .then(function () {
                                                console.log("Profile updated: " + profile.emailAddress);
                                                if (invite_profile) {
                                                    accept_invite(invite_profile.profile, invite_profile.invitor_email);
                                                    delete_invite();
                                                }
                                                add_knowtify(result.body.results[0].value);
                                            })
                                            .fail(function (err) {
                                                console.warn("WARNING: auth485");
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
                                            invite_profile["communities"] = invite_profile.invite_communities;
                                            delete invite_profile.invite_communities;
                                            var invitor_email = invite_profile.invitor_email;
                                            delete invite_profile.invitor_email;

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
                                                    add_knowtify(invite_profile);
                                                    accept_invite(invite_profile.profile, invitor_email);
                                                })
                                                .fail(function (err) {
                                                    console.warn("WARNING: auth529", err);
                                                });

                                        } else {
                                            res.status(401).send({
                                                profile: profile,
                                                message: "We couldn't find " + profile.firstName + " " + profile.lastName + " with email address '" + profile.emailAddress + "' in our system. <br/><br/>Please <a href='/' target='_self'>click here to request an invitation</a>."
                                            });
                                        }

                                    }
                                })
                                .fail(function (err) {
                                    console.warn("WARNING: auth543", err);
                                    res.status(202).send({message: "Something went wrong."});
                                });
                        }
                    })
                    .fail(function (err) {
                        console.warn("WARNING: auth549", "Something went wrong.");
                    });
            }

        });
    });
}


/*
 |--------------------------------------------------------------------------
 | Invite Person
 |--------------------------------------------------------------------------
 */

function handleInviteUser(req, res) {
    var inviteUser = req.body.params;

    if (!inviteUser.community_key) inviteUser.community_key = inviteUser.location_key;

    console.log('Inviting ' + inviteUser.email + ' to ' + inviteUser.location_key + ' / ' + inviteUser.community_key);

    var goInvite = function() {
        // validate user has leader role within the location/community, or let them through if they are a member of the location

        db.get(config.db.communities, req.user)
            .then(function(response){

                if (response.body.code !== "items_not_found") {
                    var user = response.body;

                    if (((inviteUser.location_key == inviteUser.community_key) && user.communities.indexOf(inviteUser.location_key) > -1) || (user.roles && user.roles.leader[inviteUser.community_key] && user.roles.leader[inviteUser.community_key].indexOf(inviteUser.location_key) > -1)) {
                        // check to see if the email address already exists within the system
                        db.newSearchBuilder()
                            .collection(config.db.communities)
                            .limit(1)
                            .query('@value.type: "user" AND (@value.profile.linkedin.emailAddress: "' + inviteUser.email + '" OR @value.profile.email: "' + inviteUser.email + '")')
                            .then(function (result) {
                                if (result.body.results.length > 0 && req.user !== 'james') {
                                    console.log("Existing user found!");

                                    var existing = result.body.results[0].value;

                                    if (!existing.communities) existing.communities = [];

                                    if (existing.communities.indexOf(inviteUser.community_key) == -1) {
                                        existing.communities.push(inviteUser.community_key);
                                    }

                                    if (existing.communities.indexOf(inviteUser.location_key) == -1) {
                                        existing.communities.push(inviteUser.location_key);
                                    }

                                    db.put(config.db.communities, result.body.results[0].path.key, existing)
                                        .then(function (response) {
                                            console.log("User updated!");
                                            res.status(200).send({message: 'Nice!  <a target="_blank" href="https://startupcommunity.org/' + result.body.results[0].path.key + '">' + result.body.results[0].value.profile.name + '</a> is a member of the community.'});
                                        })
                                        .fail(function(err) {
                                            console.log('WARNING: auth600');
                                            console.log(err);
                                            res.status(202).send({message: "Something went wrong."});
                                        })

                                } else {
                                    // no existing user, so search for existing invite
                                    db.newSearchBuilder()
                                        .collection(config.db.communities)
                                        .limit(1)
                                        .query('@value.type: "invite" AND @value.profile.email: "' + inviteUser.email + '"')
                                        .then(function (result) {
                                            if (result.body.results.length > 0) {
                                                console.log("Existing invite found!");
                                                res.status(200).send({message: 'An invitation has already been sent to ' + inviteUser.email + '. We will send a reminder.'});
                                                //todo send a reminder
                                            } else {
                                                // create user record with email address and community data
                                                var newUser = schema.invite(inviteUser.email, user.profile.email, inviteUser.location_key, inviteUser.community_key);
                                                console.log('creating user');
                                                var community_url =
                                                    inviteUser.location_key == inviteUser.community_key ?
                                                        inviteUser.location_key :
                                                    inviteUser.location_key + '/' + inviteUser.community_key;

                                                db.post(config.db.communities, newUser)
                                                    .then(function (response) {
                                                        var userkey = response.headers.location.split('/')[3]; // hope their response format doesn't change :-/

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
                                                                        "invitor_name": user.profile.name,
                                                                        "invitor_email": user.profile.email,
                                                                        "invitor_image": user.profile.avatar,
                                                                        "invite_accepted": false
                                                                    }
                                                                }]
                                                            },
                                                            function (success) {
                                                                console.log('Invitation sent to ' + inviteUser.email + ' (' + userkey + ')');
                                                                res.status(200).send({message: "Done! We've sent an invitation to " + inviteUser.email});
                                                            },
                                                            function (error) {
                                                                console.log('WARNING: auth651');
                                                                console.log(error);
                                                                res.status(202).send({message: "Woah! Something went wrong, but we've been notified and will take care of it."});
                                                            });
                                                    });
                                            }
                                        })
                                        .fail(function(err) {
                                            console.log('WARNING: auth659');
                                            console.log(err);
                                            res.status(202).send({message: "Woah! Something went wrong, but we've been notified and will take care of it."});
                                        })
                                }
                            });
                    } else {
                        console.warn("User is not a leader in community: " + inviteUser.community_key + " for location: " + inviteUser.location_key + "!");
                        console.log(user);
                        res.status(202).send({ message: 'You must be a member of this location and/or a leader of this network to invite someone.' });
                    }

                } else {
                    console.warn('WARNING:  User not found.');
                }
            })

            .fail(function(err){
                console.warn("WARNING: auth688", err);
            });
    }

    if (!req.user) {
        db.newSearchBuilder()
            .collection(config.db.communities)
            .limit(1)
            .query('@value.type: "user" AND @value.roles.leader.' + inviteUser.location_key + ': "' + inviteUser.location_key + '"')
            .then(function (result) {
                if (result.body.results.length > 0) {
                    console.log('Found leader to use for invite.');
                    req.user = result.body.results[0].path.key;
                    goInvite();
                } else {
                    console.warn('WARNING: No leader found! Need one for user invitations to be sent.');
                    res.status(202).send({message: "There doesn't appear to be a leader for this community! We've been alerted and will look into it."});
                }
            })
            .fail(function (err) {
                console.warn("WARNING: auth572", err);
                res.status(202).send({message: "Something went wrong."});
            });
    } else goInvite();

}

module.exports = AuthApi;