var bcrypt = require('bcryptjs'),
    Q = require('q'),
    request = require('request'),
    url = require('url'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db),
    mcapi = require('mailchimp-api/mailchimp'),
    mc = new mcapi.Mailchimp(config.mailchimp);

require('request-debug')(request); // Very useful for debugging oauth and api req/res

var UserApi = function() {
  this.ensureAuthenticated = handleEnsureAuthenticated;
  this.userSearch = handleUserSearch;
  this.subscribeUser = handleSubscribeUser;
  this.createToken = handleCreateToken;  
  this.addMentor = handleAddMentor;
  this.linkedin = handleLinkedin;
  this.getProfile = handleGetProfile;
  this.setRole = handleSetRole;
  this.removeProfile = handleRemoveProfile;
  this.unlink = handleUnlink;
  this.signup = handleSignup;
  this.login = handleLogin;
};
  

/*
 |--------------------------------------------------------------------------
 | Internal functions
 |--------------------------------------------------------------------------
 */

var schema = {
  linkedin: function(profile, email) {
    return {
      name: profile.firstName + ' ' + profile.lastName,
      email: email || profile.emailAddress,
      cities: {
        "Bend, OR": {
          admin: false,
          clusters: {}
        }
      },
      linkedin: profile,
      avatar: profile.pictureUrl || ''        
    };
  },
  signupform: function(formdata) {
    var hash = bcrypt.hashSync(formdata.password, 8);
    return {  
      "name": formdata.name,
      "email": formdata.email,
      "password": hash,    
      "cities": {
        "Bend, OR": {}
      },
      "avatar": ''
    };
  } 
};

var convert_state = function(name, to) {
    name = name.toUpperCase();
    var states = new Array(                         {'name':'Alabama', 'abbrev':'AL'},          {'name':'Alaska', 'abbrev':'AK'},
        {'name':'Arizona', 'abbrev':'AZ'},          {'name':'Arkansas', 'abbrev':'AR'},         {'name':'California', 'abbrev':'CA'},
        {'name':'Colorado', 'abbrev':'CO'},         {'name':'Connecticut', 'abbrev':'CT'},      {'name':'Delaware', 'abbrev':'DE'},
        {'name':'Florida', 'abbrev':'FL'},          {'name':'Georgia', 'abbrev':'GA'},          {'name':'Hawaii', 'abbrev':'HI'},
        {'name':'Idaho', 'abbrev':'ID'},            {'name':'Illinois', 'abbrev':'IL'},         {'name':'Indiana', 'abbrev':'IN'},
        {'name':'Iowa', 'abbrev':'IA'},             {'name':'Kansas', 'abbrev':'KS'},           {'name':'Kentucky', 'abbrev':'KY'},
        {'name':'Louisiana', 'abbrev':'LA'},        {'name':'Maine', 'abbrev':'ME'},            {'name':'Maryland', 'abbrev':'MD'},
        {'name':'Massachusetts', 'abbrev':'MA'},    {'name':'Michigan', 'abbrev':'MI'},         {'name':'Minnesota', 'abbrev':'MN'},
        {'name':'Mississippi', 'abbrev':'MS'},      {'name':'Missouri', 'abbrev':'MO'},         {'name':'Montana', 'abbrev':'MT'},
        {'name':'Nebraska', 'abbrev':'NE'},         {'name':'Nevada', 'abbrev':'NV'},           {'name':'New Hampshire', 'abbrev':'NH'},
        {'name':'New Jersey', 'abbrev':'NJ'},       {'name':'New Mexico', 'abbrev':'NM'},       {'name':'New York', 'abbrev':'NY'},
        {'name':'North Carolina', 'abbrev':'NC'},   {'name':'North Dakota', 'abbrev':'ND'},     {'name':'Ohio', 'abbrev':'OH'},
        {'name':'Oklahoma', 'abbrev':'OK'},         {'name':'Oregon', 'abbrev':'OR'},           {'name':'Pennsylvania', 'abbrev':'PA'},
        {'name':'Rhode Island', 'abbrev':'RI'},     {'name':'South Carolina', 'abbrev':'SC'},   {'name':'South Dakota', 'abbrev':'SD'},
        {'name':'Tennessee', 'abbrev':'TN'},        {'name':'Texas', 'abbrev':'TX'},            {'name':'Utah', 'abbrev':'UT'},
        {'name':'Vermont', 'abbrev':'VT'},          {'name':'Virginia', 'abbrev':'VA'},         {'name':'Washington', 'abbrev':'WA'},
        {'name':'West Virginia', 'abbrev':'WV'},    {'name':'Wisconsin', 'abbrev':'WI'},        {'name':'Wyoming', 'abbrev':'WY'}
        );
    var returnthis = false;
    for (var i=0; i < states.length; i++) {       
        if (to == 'name') {
            if (states[i].abbrev == name){
                returnthis = states[i].name;
                break;
            }
        } else if (to == 'abbrev') {
            if (states[i].name.toUpperCase() == name){
                returnthis = states[i].abbrev;
                break;
            }
        }
    }
    return returnthis;
};

var showallusers = function(city, state, limit, offset){  
  var deferred = Q.defer();
  var newstate = convert_state(state, 'name');
  db.newSearchBuilder()
  .collection('users')
  .limit(Number(limit) || 100)
  .offset(Number(offset) || 0)
  .query('value.cities.' + newstate + ': "' + city + '"')
  .then(function(result){    
    for (var i=0; i < result.body.results.length; i++) {
      delete result.body.results[i].path.collection;
      delete result.body.results[i].path.ref;
      delete result.body.results[i].value.email;
      delete result.body.results[i].value.password;
      delete result.body.results[i].value.linkedin.emailAddress;
      delete result.body.results[i].value.linkedin.access_token;
    }
    if (result.body.next) {      
      var getnext = url.parse(result.body.next, true);      
      result.body.next = '/api/' + city + '-' + state + '/users?limit=' + getnext.query.limit + '&offset=' + getnext.query.offset;      
    }
    if (result.body.prev) {
      var getprev = url.parse(result.body.prev, true);
      result.body.prev = '/api/' + city + '-' + state + '/users?limit=' + getprev.query.limit + '&offset=' + getprev.query.offset;
    }
    deferred.resolve(result.body);
  })
  .fail(function(err){
    deferred.reject(new Error(err.body));
  });
 
  return deferred.promise;
  
};

var searchincity = function(city, state, query, limit, offset){  
  var deferred = Q.defer();
  var newstate = convert_state(state, 'name');
  db.newSearchBuilder()
  .collection('users')
  .limit(Number(limit) || 100)
  .offset(Number(offset) || 0)
  .query('value.cities.' + newstate + ': "' + city + '" AND ' + query)
  .then(function(result){
    for (var i=0; i < result.body.results.length; i++) {
      delete result.body.results[i].path.collection;
      delete result.body.results[i].path.ref;
      delete result.body.results[i].value.email;
      delete result.body.results[i].value.password;
      delete result.body.results[i].value.linkedin.emailAddress;
      delete result.body.results[i].value.linkedin.access_token;
    }
    if (result.body.next) {      
      var getnext = url.parse(result.body.next, true);      
      result.body.next = '/api/' + city + '-' + state + '/users?limit=' + getnext.query.limit + '&search=' + query + '&offset=' + getnext.query.offset;      
    }
    if (result.body.prev) {
      var getprev = url.parse(result.body.prev, true);
      result.body.prev = '/api/' + city + '-' + state + '/users?limit=' + getprev.query.limit + '&search=' + query + '&offset=' + getprev.query.offset;
    }
    deferred.resolve(result.body);
  })
  .fail(function(err){
    deferred.reject(new Error(err.body));
  });
 
  return deferred.promise;
  
};

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function handleEnsureAuthenticated(req, res, next) {
  
  if (!req.headers.authorization) {   
    console.log('Please make sure your request has an Authorization header');
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }
  try {
    var token = req.headers.authorization.split(' ')[1];
    var payload = jwt.decode(token, config.token_secret);

    if (payload.exp <= Date.now()) {
      console.log('Token has expired');
      return res.status(401).send({ message: 'Token has expired' });
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
    return res.status(401).send({ message: 'Please logout or clear your local browser storage and try again' });
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

/*
 |--------------------------------------------------------------------------
 | Search API
 |--------------------------------------------------------------------------
 */

function handleUserSearch(req, res){  
  var citystate = req.params.citystate,
      query = req.query.search,
      limit = req.query.limit,
      offset = req.query.offset,
      city = citystate.substr(0, citystate.length - 3),
      state = citystate.substr(citystate.length - 2, 2);
      
  console.log("City, State, Search: " + city + ', ' + state.toUpperCase() + ', ' + query);

  if (query !== undefined){
    searchincity(city, state, query, limit, offset)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send({ message: err});
    });
  } else {
    showallusers(city, state, limit, offset)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send({ message: err});
    });
  }
}

function handleSubscribeUser(req, res){  
  mc.lists.subscribe({id: 'ba6c99c719', email:{email:req.body.email}, merge_vars: {'CITY': req.body.city} }, function(data) { 
    console.log(data);
    res.send({ success: "Successfully subscribed " + req.body.email });
    },
    function(error) {
      if (error.error) {
        console.log("Mailchimp API Error" + error.code + ": " + error.error);
      } else {
        console.log('There was an error subscribing ' + req.body.email);
      }      
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
  .collection('users')
  .limit(1)
  .query('value.email: "' + req.body.email + '"')
  .then(function(result){
    if (result.body.results.length > 0) {
      console.log('User already exists');
      res.status(401).send({ message: 'That email address is already registered to a user.'}); //username already exists
    } else {
      console.log('Email is free for use');
      db.post('users', user)
      .then(function () {
        db.newSearchBuilder()
        .collection('users')
        .limit(1)
        .query('value.email: "' + req.body.email + '"')
        .then(function(result){
          if (result.body.results.length > 0) {
            console.log("USER:");
            console.log(user);
            res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });
          } else {
            console.warn("Search couldn't find user after posting new user!");
            res.status(401).send({ message: 'Something went wrong!'});
          }
        })
        .fail(function(err){
          console.log("SEARCH FAIL:" + err);
          res.status(401).send({ message: 'Something went wrong: ' + err});
        })
      .fail(function (err) {
        console.log("POST FAIL:" + err.body);
        res.status(401).send({ message: 'Something went wrong: ' + err});
      });
    });
    }
  })
  .fail(function(err){
    console.log("SEARCH FAIL:" + err);
    res.status(401).send({ message: 'Something went wrong: ' + err});
  });  
}


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */

function handleLogin(req, res) {
  db.newSearchBuilder()
    .collection('users')
    .limit(1)
    .query('value.email: "' + req.body.email + '"')
    .then(function(result){
      if (result.body.results.length > 0) {
        console.log("FOUND USER");
        var hash = result.body.results[0].value.password;
        if (bcrypt.compareSync(req.body.password, hash)) {
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
      res.status(401).send('Something went wrong: ' + err);
    });
}

/*
 |--------------------------------------------------------------------------
 | Add Mentor
 |--------------------------------------------------------------------------
 */

function handleAddMentor(req, res) {  
    
  var addMentor = JSON.parse(req.query.user);
  if (addMentor) {
    var gettoken = function(addMentor, callback) {          
      db.newSearchBuilder()
        .collection('users')
        .limit(1)
        .query('value.linkedin.id: "' + addMentor.userid + '"')
        .then(function(result){
          if (result.body.results.length > 0) {
            console.log("Found user, pulling access_token");
            if (result.body.results[0].value.linkedin.access_token) {
              var access_token = result.body.results[0].value.linkedin.access_token;
              callback(access_token);
            } else {
              console.log("User does not have Linkedin access_token!");
              return res.status(401).send({ message: 'Sorry, you need to login to StartupCommunity.org with Linkedin first.' });
            }
          } else {
            console.log("COULD NOT FIND USER IN DB");
            return res.status(401).send({ message: 'Something went wrong, please login again.' });
          }
        })
        .fail(function(err){
          console.log("SEARCH FAIL:" + err);
          res.status(401).send({ message: 'Something went wrong: ' + err});
        });
              
          
    };
    
    gettoken(addMentor, function(access_token) {    
            
      getlinkedinprofile(addMentor.url, addMentor.email, access_token, function(result) {                
        res.status(result.status).send(result);
      });
      
    });
  
  }
}
/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */
 
var getlinkedinprofile = function(url, email, access_token, profilecallback) {       
  var querystring = require('querystring');
  request.get({ url: 'https://api.linkedin.com/v1/people/url=' + querystring.escape(url) + ':(id,first-name,last-name,picture-url;secure=true,headline,summary,public-profile-url)', qs: { oauth2_access_token: access_token, format: 'json' }, json: true }, 
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
  
  db.search('users', 'value.linkedin.publicProfileUrl: "' + linkedinuser.linkedin.publicProfileUrl + '"')
  .then(function (result){
    console.log('Result of db search: ' + result.body.total_count);    
    if (result.body.results.length > 0){
      if (result.body.results[0].value.linkedin.id == linkedinuser.linkedin.id){
        console.log("Matched Linkedin user to database user: " + linkedinuser.name);        
        pullcallback({ "status": 409, "message": "It looks like " + linkedinuser.name + " is already in the system.", "data": result.body.results[0].value });  
      } else {
        console.warn("There's already an existing user with that public Linkedin profile.");
        pullcallback({ "status": 200, "data": result.body.results[0].value });
      }
    } else { 
      console.log('No existing linkedin user found!');
      db.post('users', linkedinuser)
      .then(function () {
        console.log("REGISTERED: " + linkedinuser.email);
        pullcallback({ "status": 200, "data": linkedinuser });
      })
      .fail(function (err) {
        console.error("PUT FAIL:");
        console.error(err);        
      });
    }
  })
  .fail(function (result) {
    console.error("SEARCH FAIL! " + JSON.stringify(linkedinuser));
    console.error(result);
  });
  
};

function handleLinkedin(req, res) {
  var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
  var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,skills,picture-url;secure=true,headline,summary,public-profile-url)';    
  
  var params = {
    client_id: config.linkedin.clientID,
    redirect_uri: req.body.redirectUri,
    client_secret: config.linkedin.clientSecret,
    code: req.body.code,
    grant_type: 'authorization_code',
    scope: ['r_fullprofile r_emailaddress']
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
      
      profile['access_token'] = params.oauth2_access_token;
      
      var userprofile = schema.linkedin(profile);              
        
        // Step 3a. Link user accounts.
      if (req.headers.authorization) { // isloggedin already?
          
        db.newSearchBuilder()
          .collection('users')
          .limit(1)
          .query('value.linkedin.id: "' + profile.id + '"')
          .then(function (result){     
            if (result.body.results.length > 0){            
              console.log("Found user: " + profile.firstName + ' ' + profile.lastName);                                                                                             
              return res.status(409).send({ message: 'Your account is already associated with Linkedin.' });
            } else {
            
              console.log('No Linkedin user in the system with that id; ok to add it.');
              var token = req.headers.authorization.split(' ')[1];
              var payload = jwt.decode(token, config.token_secret);
              
              db.get("users", payload.sub)
                .then(function(response){
                  if (response.body.code !== "items_not_found") {
                    console.log('Matching user found.');
                    response.body["linkedin"] = profile; // get user account and re-upload with linkedin data
                    db.put('users', payload.sub, response.body)
                      .then(function () {
                        console.log("Profile updated: " + userprofile.email);                          
                      })
                      .fail(function (err) {
                        console.error("Profile update failed:");
                        console.error(err.body);                          
                      });
                    res.send({ token: handleCreateToken(req, response.body), user: response.body });
                  } else {
                    return res.status(400).send({ message: "Sorry, we couldn't find you in our system." });                    
                  }
                })
                .fail(function(err){
                  console.log("SEARCH FAIL:" + err);
                  res.status(401).send({ message: 'Something went wrong: ' + err});
                });
            }
          })
          .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(401).send({ message: 'Something went wrong: ' + err});
          });
        
        
        } else {
          
          db.newSearchBuilder()
          .collection('users')
          .limit(1)
          .query('value.linkedin.id: "' + profile.id + '"')
          .then(function (result){                    
            if (result.body.results.length > 0){            
              console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
              result.body.results[0].value["linkedin"] = profile; // get user account and re-upload with linkedin data            
              db.put('users', result.body.results[0].path.key, result.body.results[0].value)
                .then(function () {
                  console.log("Profile updated: " + userprofile.email);                    
                })
                .fail(function (err) {
                  console.error("Profile update failed:");
                  console.error(err);
                }); 
              res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] }); 
            } else {
              db.newSearchBuilder()
                .collection('users')
                .limit(1)
                .query('value.email: "' + profile.emailAddress + '"')
                .then(function(result){
                  if (result.body.results.length > 0) {
                    console.log("Found user: " + profile.firstName + ' ' + profile.lastName);
                    result.body.results[0].value["linkedin"] = profile; // get user account and re-upload with linkedin data            
                    db.put('users', result.body.results[0].path.key, result.body.results[0].value)
                      .then(function () {
                        console.log("Profile updated: " + userprofile.email);                    
                      })
                      .fail(function (err) {
                        console.error("Profile update failed:");
                        console.error(err);
                      }); 
                    res.send({ token: handleCreateToken(req, result.body.results[0]), user: result.body.results[0] });     
                    
                  } else {
                    console.log('No existing user found.');
                    res.status(400).send({ message: "Sorry, we couldn't find you in our system." }); 
                  }
                })
                .fail(function(err){
                  console.log("SEARCH FAIL:" + err);
                  res.status(401).send({ message: 'Something went wrong: ' + err});
                });
              
              /* Do this to create a user account if no user exists
              db.newSearchBuilder()
                .collection('users')
                .limit(1)
                .query('value.email: "' + profile.emailAddress + '"')
                .then(function(result){
                  if (result.body.results.length > 0) {
                    console.log('Existing user found.');
                    res.status(409).send({ message: "Sorry, there's already a user with your email address." });
                    
                  } else {
                    db.post('users', userprofile)
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
          getlinkedinprofile(userlist[i].url, userlist[i].email, params.oauth2_access_token, function(response) { console.log('User: ' + response.data); });
        }        
          
      }    
  });
}

/*
 |--------------------------------------------------------------------------
 | Get Profile
 |--------------------------------------------------------------------------
 */

function handleGetProfile(req, res) {
  var userid = req.param.userid || req.user;
  
  db.get("users", userid)
  .then(function(response){
    if (response.body.code !== "items_not_found") {
      console.log('Authenticated user: ' + response.body.name);
      response = {
        "path": {
          "key": userid
        },
        "value": response.body
      };
      res.status(200).send(response);
    } else {
      console.log('User not found.');
      return res.status(200).send({ message: 'User not found.' });
    }
  })
  
  .fail(function(err){
    console.log("SEARCH FAIL:");
    console.log(err);
    res.status(401).send({ message: 'Something went wrong: ' + err});
  }); 

}

/*
 |--------------------------------------------------------------------------
 | Put Profile
 |--------------------------------------------------------------------------
 */

function handleSetRole(req, res) {
  var userkey = req.query.userkey,
      citystate = req.query.citystate,
      cluster = req.query.cluster,
      role = req.query.role,
      status = req.query.status,
      allowed = false;
      
  //check perms!
  if (userkey !== req.user) {
    db.get("users", req.user)
    .then(function (response) {      
      try {
        allowed = (response.body.cities[citystate].clusters[cluster].roles.indexOf("Leader") >= 0);
      } catch (err) {
        console.warn('Lookup of city or cluster failed.. that should not happen: ' + err);        
      }
    })
    .fail(function(err){
      console.warn("SEARCH FAIL:" + err);
      res.status(401).send({ message: 'Something went wrong: ' + err});
    });
  } else allowed = true;
  
  if (allowed) {
    db.get("users", userkey)
    .then(function (response) {
      var thiscluster = response.body.cities[citystate].clusters[cluster];
      if (status === "true") {
        if (thiscluster.roles.indexOf(role) < 0) {
          thiscluster.roles.push(role);
        } // else they already have the role, no action needed
      } else if (status === "false") {        
        if (thiscluster.roles.indexOf(role) >= 0) {          
          thiscluster.roles.splice(thiscluster.roles.indexOf(role), 1);          
        } // else they do not have the role, no action needed
      }
      response.body.cities[citystate].clusters[cluster] = thiscluster;
      db.put('users', userkey, response.body)
      .then(function (finalres) {
        res.status(201).send({ message: 'Profile updated.'});
      })
      .fail(function (err) {
        console.warn('Problem with put: ' + err);
        res.status(400).send({ message: 'Something went wrong: ' + err});
      });
    })
    .fail(function (err) {
      console.warn('Problem with get: ' + err);
      res.status(400).send({ message: 'Something went wrong: ' + err});
    });
  } else { 
    res.status(401).send({ message: 'You do not have permission to change this role.'}); 
  }
}

/*
 |--------------------------------------------------------------------------
 | Delete Profile
 |--------------------------------------------------------------------------
 */

function handleRemoveProfile(req, res) {
  var userid = req.params.userid;
  db.remove('users', userid) // ideally I should store an undo option
    .then(function(result){      
        console.log('User removed.');
        res.status(200).send({ message: 'User removed' });
    })
    .fail(function(err){
      console.log("Remove FAIL:" + err);
      res.status(401).send({ message: 'Something went wrong: ' + err });
    }); 
}

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */

function handleUnlink(req, res) {
  var provider = req.params.provider;  
  db.get("users", req.user)
    .then(function(response){
      if (response.body.code !== "items_not_found") {
        response.body[provider] = undefined;
        db.put('users', req.user, response.body)
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
      res.status(401).send({ message: 'Something went wrong: ' + err});
    });         
}


module.exports = UserApi;