var bcrypt = require('bcryptjs'),
    request = require('request'),
    jwt = require('jsonwebtoken'),
    crypto = require('crypto'),
    db = require('orchestrate')(process.env.DB_KEY),
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
            req.user = jwt.verify(req.headers.authorization.split(' ')[1], process.env.SC_TOKEN_SECRET);
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
    return jwt.sign(user.path.key, process.env.SC_TOKEN_SECRET, { expiresIn: "5h" });
}

function handleHelpToken(req, res) {
    // this is for HelpCrunch live chat support to send over user data

    var hmac = crypto.createHmac('sha256', process.env.HELPCRUNCH);
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
    res.status(201).send(jwt.encode(payload, process.env.API_TOKEN_SECRET));*/

    db.get(process.env.DB_COMMUNITIES, req.user)
        .then(function(response){
            if (response.body.code !== "items_not_found") {
                console.log('Matching user found.');
                if (response.body.profile.api_key === undefined) {
                    // todo update next line
                    //response.body.profile["api_key"] = jwt.encode(payload, process.env.API_TOKEN_SECRET); // get user account and re-upload with api_key
                    db.put(process.env.DB_COMMUNITIES, req.user, response.body)
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
            console.log("WARNING: ", err);
            res.status(202).send({ message: 'Something went wrong: ' + String(err)});
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
        .collection(process.env.DB_COMMUNITIES)
        .limit(1)
        .query('@value.profile.email: "' + req.body.profile.email + '"')
        .then(function(result){
            if (result.body.results.length > 0) {
                console.log('User already exists');
                res.status(401).send({ message: 'That email address is already registered to a user.'}); //username already exists
            } else {
                console.log('Email is free for use');
                db.post(process.env.DB_COMMUNITIES, user)
                    .then(function () {
                        db.newSearchBuilder()
                            .collection(process.env.DB_COMMUNITIES)
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
        .collection(process.env.DB_COMMUNITIES)
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
            console.warn("WARNING: ", err);
            res.status(202).send('Something went wrong: ' + String(err));
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
        client_id: process.env.LINKEDIN_CLIENTID,
        redirect_uri: req.body.redirectUri,
        client_secret: process.env.LINKEDIN_CLIENTSECRET,
        code: req.body.code,
        grant_type: 'authorization_code'
    };

    var accept_invite = function(invitee, invitor_email) {
        // update Knowtify with invitation accepted
        console.log('invite accepted: ', invitee.email);
        var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

        // send 'invite accepted' email to person who sent the invite
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

        // update record of person who accepted the invite (to prevent reminder emails)
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

        db.post(process.env.DB_MESSAGES, question)
            .then(function () {
                console.log('Question posted to new user account')
            })
            .fail(function (err) {
                console.error("POST FAIL:");
                console.error(err);
            });

    };

    var delete_invite = function() {
        db.remove(process.env.DB_COMMUNITIES, invite_code, true)
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
        var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

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
                console.warn("WARNING: ", err);
                return res.status(401).send({message: 'Something went wrong: ' + String(err)});
            } else profile['access_token'] = params.oauth2_access_token;

            // if this is an invitation, pull that invite data first
            if (invite_code) {
                db.newSearchBuilder()
                    .collection(process.env.DB_COMMUNITIES)
                    .limit(1)
                    .query('@value.type: "invite" AND @path.key: ' + invite_code)
                    .then(function (result) {
                        if (result.body.results.length > 0) {
                            console.log('Verified invitation');
                            userCheck(result.body.results[0].value);
                        } else {
                            console.log('Invalid invite code: ' + invite_code);
                            userCheck();
                            //return res.status(404).send({message: 'Sorry, this invite code is not valid: ' + invite_code});
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
                    .collection(process.env.DB_COMMUNITIES)
                    .limit(1)
                    .query('@value.type: "user" AND @value.profile.linkedin.id: "' + profile.id + '"')
                    .then(function (result) {
                        if (result.body.results.length > 0) {
                            // yes, there is an existing user in the system that matched the linkedin id
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

                            db.put(process.env.DB_COMMUNITIES, result.body.results[0].path.key, result.body.results[0].value)
                                .then(function () {
                                    console.log("Profile updated: " + result.body.results[0].value.profile.name);
                                    if (invite_profile) {
                                        accept_invite(invite_profile.profile, invite_profile.invitor_email);
                                        delete_invite();
                                    }
                                    add_knowtify(result.body.results[0].value);
                                })
                                .fail(function (err) {
                                    console.error("Profile update failed: ", err);
                                });


                            res.send({
                                token: handleCreateToken(req, result.body.results[0]),
                                user: result.body.results[0]
                            });
                        } else {
                            // search by email
                            db.newSearchBuilder()
                                .collection(process.env.DB_COMMUNITIES)
                                .limit(1)
                                .query('@value.type: "user" AND @value.profile.email: "' + profile.emailAddress + '"')
                                .then(function (result) {
                                    if (result.body.results.length > 0) {
                                        // yes, an existing user that matched email address of invitee.email
                                        console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                                        result.body.results[0].value.profile["linkedin"] = profile; // get user account and re-upload with linkedin data

                                        result.body.results[0] = addCommunities(result.body.results[0], invite_profile);

                                        db.put(process.env.DB_COMMUNITIES, result.body.results[0].path.key, result.body.results[0].value)
                                            .then(function () {
                                                console.log("Profile updated: " + profile.emailAddress);
                                                if (invite_profile) {
                                                    accept_invite(invite_profile.profile, invite_profile.invitor_email);
                                                    delete_invite();
                                                }
                                                add_knowtify(result.body.results[0].value);
                                            })
                                            .fail(function (err) {
                                                console.warn("WARNING: ", err);
                                            });
                                        res.send({
                                            token: handleCreateToken(req, result.body.results[0]),
                                            user: result.body.results[0]
                                        });

                                    } else {
                                        console.log('No existing user found!');

                                        if (invite_profile) {
                                            // note that we don't validate the invite email matches the linkedin email, so anyone can use the invite once.
                                            var new_invite_profile = invite_profile;
                                            // update the invite record with user details
                                            new_invite_profile.type = "user";
                                            new_invite_profile.profile.linkedin = profile;
                                            new_invite_profile.profile.avatar = profile.pictureUrl;
                                            new_invite_profile.profile.name = profile.firstName + ' ' + profile.lastName;
                                            new_invite_profile.profile.email = profile.emailAddress;
                                            new_invite_profile["communities"] = invite_profile.invite_communities;
                                            delete new_invite_profile.invite_communities;
                                            var invitor_email = invite_profile.invitor_email;
                                            delete new_invite_profile.invitor_email;

                                            // need to add path for res.send
                                            var new_profile = {
                                                path: {
                                                    key: invite_code
                                                },
                                                value: new_invite_profile
                                            };

                                            db.put(process.env.DB_COMMUNITIES, invite_code, new_invite_profile)
                                                .then(function () {
                                                    console.log("Profile created: " + JSON.stringify(new_profile));
                                                    res.send({
                                                        token: handleCreateToken(req, new_profile),
                                                        user: new_profile
                                                    });
                                                    add_knowtify(new_invite_profile);
                                                    accept_invite(invite_profile.profile, invitor_email);
                                                })
                                                .fail(function (err) {
                                                    console.warn("WARNING: ", err);
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
                                    console.warn("WARNING:", err);
                                    res.status(202).send({message: "Something went wrong."});
                                });
                        }
                    })
                    .fail(function (err) {
                        console.warn("WARNING:", "Something went wrong. " + String(err));
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

    console.log('Inviting ' + inviteUser.email + ' to ' + inviteUser.location_key + ' / ' + inviteUser.community_key);

    var goInvite = function() {
        // validate user has leader role within the location/community, or let them through if they are a member of the location

        db.get(process.env.DB_COMMUNITIES, req.user)
            .then(function(response){

                if (response.body.code !== "items_not_found") {
                    var user = response.body;

                    if (!inviteUser.location_key) inviteUser.location_key == inviteUser.community_key;

                    if (user.communities.indexOf(inviteUser.location_key) < 0) {
                        res.status(202).send({ message: 'You must be a member of this community to invite someone.' });
                    } else if (!inviteUser.community_key || (user.roles && user.roles.leader && user.roles.leader[inviteUser.community_key] && user.roles.leader[inviteUser.community_key].indexOf(inviteUser.location_key) < 0)) {
                        console.warn("No community specified, or user is not a leader in community: " + inviteUser.community_key + " for location: " + inviteUser.location_key + "!");
                        inviteUser.community_key = inviteUser.location_key;
                    }

                    //if (((inviteUser.location_key == inviteUser.community_key) && user.communities.indexOf(inviteUser.location_key) > -1) || (user.roles && user.roles.leader && user.roles.leader[inviteUser.community_key] && user.roles.leader[inviteUser.community_key].indexOf(inviteUser.location_key) > -1)) {
                        // check to see if the email address already exists within the system
                        db.newSearchBuilder()
                            .collection(process.env.DB_COMMUNITIES)
                            .limit(1)
                            .query('@value.type: "user" AND (@value.profile.linkedin.emailAddress: "' + inviteUser.email + '" OR @value.profile.email: "' + inviteUser.email + '")')
                            .then(function (result) {
                                if (result.body.results.length > 0) {
                                    console.log("Existing user found!");

                                    var existing = result.body.results[0].value;

                                    if (!existing.communities) existing.communities = [];

                                    if (existing.communities.indexOf(inviteUser.community_key) == -1) {
                                        existing.communities.push(inviteUser.community_key);
                                    }

                                    if (existing.communities.indexOf(inviteUser.location_key) == -1) {
                                        existing.communities.push(inviteUser.location_key);
                                    }

                                    db.put(process.env.DB_COMMUNITIES, result.body.results[0].path.key, existing)
                                        .then(function (response) {
                                            console.log("User updated!");
                                            res.status(200).send({message: 'Nice!  <a target="_blank" href="https://startupcommunity.org/' + result.body.results[0].path.key + '">' + result.body.results[0].value.profile.name + '</a> is a member of the community.'});
                                        })
                                        .fail(function(err) {
                                            console.log('WARNING: ', err);
                                            res.status(202).send({message: "Something went wrong."});
                                        })

                                } else {
                                    // no existing user, so search for existing invite
                                    db.newSearchBuilder()
                                        .collection(process.env.DB_COMMUNITIES)
                                        .limit(1)
                                        .query('@value.type: "invite" AND @value.profile.email: "' + inviteUser.email + '"')
                                        .then(function (result) {
                                            if (result.body.results.length > 0) {
                                                console.log("Existing invite found!");
                                                res.status(200).send({message: 'An invitation has already been sent to ' + inviteUser.email + '. We will send a reminder.'});

                                                var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

                                                // update client with id of discovered invite

                                                knowtifyClient.contacts.upsert({
                                                        "contacts": [
                                                            {
                                                                "email": inviteUser.email,
                                                                "data": {
                                                                    "invite_code": result.body.results[0].path.key
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    function (success) {
                                                        console.log('Record updated');
                                                        knowtifyClient.contacts.upsert({
                                                                "event": "reminder",
                                                                "contacts": [{
                                                                    "email": inviteUser.email
                                                                }]
                                                            },
                                                            function (success) {
                                                                console.log('Invitation reminder sent to ' + inviteUser.email);
                                                            },
                                                            function (error) {
                                                                console.log('WARNING:', error);
                                                            });
                                                    },
                                                    function (error) {
                                                        console.log('WARNING:', error);
                                                    });



                                            } else {
                                                // create user record with email address and community data
                                                var newUser = schema.invite(inviteUser.email, user.profile.email, inviteUser.location_key, inviteUser.community_key);
                                                console.log('creating user');
                                                var community_url =
                                                    inviteUser.location_key == inviteUser.community_key ?
                                                        inviteUser.location_key :
                                                    inviteUser.location_key + '/' + inviteUser.community_key;

                                                db.post(process.env.DB_COMMUNITIES, newUser)
                                                    .then(function (response) {
                                                        var userkey = response.headers.location.split('/')[3]; // hope their response format doesn't change :-/

                                                        // send email with knowtify with unique link
                                                        var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

                                                        knowtifyClient.contacts.upsert({
                                                                "event": "invitation",
                                                                "contacts": [{
                                                                    "email": inviteUser.email,
                                                                    "data": {
                                                                        "invite_community": inviteUser.community_name.split(',')[0],
                                                                        "invite_url": community_url,
                                                                        "invite_code": userkey,
                                                                        "invite_message": inviteUser.message,
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
                                                                console.log('WARNING: ', error);
                                                                res.status(202).send({message: "Woah! Something went wrong. We're looking into it, but also try waiting a few minutes and give it another shot."});

                                                                // rollback invitation
                                                                db.delete(process.env.DB_COMMUNITIES, userkey, true)
                                                            });
                                                    })
                                                    .fail(function(err) {
                                                        console.log('WARNING: ', err);
                                                        res.status(202).send({message: "Woah! Something went wrong.  We're looking into it, but also try waiting a few minutes and give it another shot."});
                                                    })
                                            }
                                        })
                                        .fail(function(err) {
                                            console.log('WARNING: ', err);
                                            res.status(202).send({message: "Woah! Something went wrong. We're looking into it, but also try waiting a few minutes and give it another shot."});
                                        })
                                }
                            });
                    /*
                    } else {
                        console.warn("User is not a leader in community: " + inviteUser.community_key + " for location: " + inviteUser.location_key + "!");
                        console.log(user);
                        res.status(202).send({ message: 'You must be a member of this location and/or a leader of this network to invite someone.' });
                    }
                    */

                } else {
                    console.warn('WARNING:  User not found.');
                }
            })

            .fail(function(err){
                console.warn("WARNING:", err);
            });
    }

    if (!req.user) {
        db.newSearchBuilder()
            .collection(process.env.DB_COMMUNITIES)
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
                console.warn("WARNING: ", err);
                res.status(202).send({message: "Something went wrong."});
            });
    } else goInvite();

}

module.exports = AuthApi;