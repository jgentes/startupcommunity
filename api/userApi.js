var bcrypt = require('bcryptjs'),
    Q = require('q'),
    request = require('request'),
    url = require('url'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db),
    mcapi = require('mailchimp-api/mailchimp'),
    mc = new mcapi.Mailchimp(config.mailchimp),
    mandrill = require('mandrill-api/mandrill'),
    mandrill_client = new mandrill.Mandrill(config.mandrill);

require('request-debug')(request); // Very useful for debugging oauth and api req/res

var UserApi = function() {
  this.ensureAuthenticated = handleEnsureAuthenticated;
  this.userSearch = handleUserSearch;
  this.subscribeUser = handleSubscribeUser;
  this.createToken = handleCreateToken;  
  this.createAPIToken = handleCreateAPIToken;  
  this.addPerson = handleAddPerson;
  this.linkedin = handleLinkedin;
  this.getProfile = handleGetProfile;
  this.setRole = handleSetRole;
  this.removeProfile = handleRemoveProfile;
  this.unlink = handleUnlink;
  this.signup = handleSignup;
  this.login = handleLogin;
  this.maintenance = handleMaintenance;
  this.feedback = handleFeedback;
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
        "bend-or": {
          admin: false
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
        "bend-or": {
          "admin": false
        }
      },
      "avatar": ''
    };
  } 
};

/*
 |--------------------------------------------------------------------------
 | Search API
 |--------------------------------------------------------------------------
 */
 
var searchincity = function(city, cluster, role, limit, offset, query, key) {
  var allowed = false;
  var userdata;  
  
  if (key) {
    try {    
      var payload = jwt.decode(key, config.API_token_secret);  
      // Assuming key never expires
      //check perms!

      db.get("users", payload.sub)
      .then(function (response) {
        userdata = response.body;
        if (userdata.cities[city].admin === true) { allowed=true; }
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
  var searchstring = 'cities.' + city + '.admin: *'; // first argument to scope to city
  if (cluster && cluster[0] !== '*') {
    cluster = cluster.split(',');
    searchstring += ' && (';
    for (var i in cluster) {
      searchstring += 'cities.' + city + '.clusters.' + cluster[i] + '.roles: *'; // scope to cluster
      if (i < (cluster.length - 1)) { searchstring += ' || '; }
    }
    searchstring += ')';
  }  

  if (role && role[0] !== '*') {
    role = role.split(',');
    searchstring += ' && (';
    if (role.indexOf('Advisors') >= 0) { 
      searchstring += 'cities.' + city + '.cityAdvisor: true || ';
    }
    for (var i in role) {
      searchstring += 'cities.' + city + '.clusters.*.roles: ' + role[i]; // scope to role
      if (i < (role.length - 1)) { searchstring += ' || '; }
    } 
    searchstring += ')';
  }
  
  if (query) { searchstring += ' && ' + query; }

  var deferred = Q.defer();  
  db.newSearchBuilder()
  .collection('users')
  .limit(Number(limit) || 32)
  .offset(Number(offset) || 0)
  .query(searchstring)  //must include admin:* for city search
  .then(function(result){        
    var i;
    var item_cluster;
    
    try {
      for (i=0; i < result.body.results.length; i++) {
        delete result.body.results[i].path.collection;
        delete result.body.results[i].path.ref;
        delete result.body.results[i].value.password;
        
        if (!allowed && userdata) {          
          for (item_cluster in result.body.results[i].value.cities[city].clusters) {            
            if (userdata.cities[city].clusters[item_cluster].roles.indexOf("Leader") >= 0) {
              allowed = true;
            }
          }
        }
        
        if (!allowed) {
          delete result.body.results[i].value.email;
        }
          
        if (result.body.results[i].value.linkedin) {
          delete result.body.results[i].value.linkedin.emailAddress;
          delete result.body.results[i].value.linkedin.access_token;
        }
      }
    } catch (error) {
      console.warn('WARNING:  Possible database entry corrupted: ');
      console.log(result.body.results);
    }
    
    if (result.body.next) {      
      var getnext = url.parse(result.body.next, true);   
      result.body.next = '/api/1.0/' + city + '/users?limit=' + getnext.query.limit + '&offset=' + getnext.query.offset + (role ? '&role=' + role : '') + (query ? '&search=' + query : '');
    }
    if (result.body.prev) {
      var getprev = url.parse(result.body.prev, true);
      result.body.prev = '/api/1.0/' + city + '/users?limit=' + getprev.query.limit + '&offset=' + getprev.query.offset + (role ? '&role=' + role : '') + (query ? '&search=' + query : '');
    }
    deferred.resolve(result.body);
  })
  .fail(function(err){
    console.log(err.body.message);
    deferred.reject(err.body.message);
  });
 
  return deferred.promise;
  
};


function handleUserSearch(req, res){  
  var city = req.params.city,
      cluster = req.query.cluster,
      role = req.query.role,
      query = req.query.search,
      limit = req.query.limit,
      offset = req.query.offset,
      key = req.query.api_key;      

  searchincity(city, cluster, role, limit, offset, query, key)
  .then(function(userlist){
    res.send(userlist);
  })
  .fail(function(err){
    console.warn(err);
    res.send({message:err});
  });
}

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function handleEnsureAuthenticated(req, res, next) {
  
  if (!req.headers.authorization) {   
    console.log('Please make sure your request has an Authorization header');
    return res.status(401).send({ message: 'Your session is no longer valid. Sorry, but could you login again?' });
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

function handleCreateAPIToken(req, res) {
  var payload = {
    iss: req.hostname,
    sub: req.user,
    iat: moment().valueOf(),
    exp: moment().add(90, 'days').valueOf()
  };
  res.status(201).send(jwt.encode(payload, config.API_token_secret));
  
  db.get("users", req.user)
  .then(function(response){
    if (response.body.code !== "items_not_found") {
      console.log('Matching user found.');
      if (response.body.api_key === undefined) {
        response.body["api_key"] = jwt.encode(payload, config.API_token_secret); // get user account and re-upload with api_key
        db.put('users', req.user, response.body)
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
  });
  
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
            console.warn("WARNING: Search couldn't find user after posting new user!");
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
 | Add Person
 |--------------------------------------------------------------------------
 */

function handleAddPerson(req, res) {  
    
  var addPerson= JSON.parse(req.query.user);
  if (addPerson) {
    var gettoken = function(addPerson, callback) {          
      db.newSearchBuilder()
        .collection('users')
        .limit(1)
        .query('value.linkedin.id: "' + addPerson.userid + '"')
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
    
    gettoken(addPerson, function(access_token) {    
            
      getlinkedinprofile(addPerson.url, addPerson.email, access_token, function(result) {                
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
        console.warn("WARNING: There's already an existing user with that public Linkedin profile.");
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
  var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,phone-numbers,skills,picture-url;secure=true,headline,summary,public-profile-url)';    
  
  var params = {
    client_id: config.linkedin.clientID,
    redirect_uri: req.body.redirectUri,
    client_secret: config.linkedin.clientSecret,
    code: req.body.code,
    grant_type: 'authorization_code',
    scope: ['r_fullprofile r_emailaddress, r_contactinfo']
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
              res.send({ token: req.headers.authorization.split(' ')[1], user: result.body.results[0] });
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
              if (result.body.results[0].value.avatar === "") {
                result.body.results[0].value.avatar = result.body.results[0].value.linkedin.pictureUrl;
              }
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
      console.warn('WARNING:  User not found.');
      return res.status(200).send({ message: 'User not found.' });
    }
  })
  
  .fail(function(err){
    console.warn("WARNING: SEARCH FAIL:");
    console.warn(err);
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
      citykey = req.query.citykey,
      cluster = req.query.cluster,
      role = req.query.role,
      status = (req.query.status == 'true'), // will convert string to bool
      allowed = false;
      
  function checkperms(allowed, callback) {
    if (!allowed) {
      db.get("users", req.user)
      .then(function (response) {                
        if (cluster) {
          if (response.body.cities[citykey].clusters) {
            if (response.body.cities[citykey].clusters[cluster]) {
              allowed = (response.body.cities[citykey].clusters[cluster].roles.indexOf("Leader") >= 0);    
            }
          }         
        }
        if (response.body.cities[citykey].admin === true) { allowed = true; }
        callback(allowed);        
      })
      .fail(function(err){
        console.warn("WARNING: SEARCH FAIL:" + err);
        res.status(401).send({ message: 'Something went wrong: ' + err});
      });
    } else callback(allowed);
  }
      
  //check perms!
  if (userkey == req.user) { allowed = true; }
  checkperms(allowed, function (allowed) {
    if (allowed) {
      db.get("users", userkey)
      .then(function (response) {
        if (role == "cityAdvisor") {
          if (response.body.cities[citykey].cityAdvisor === undefined) { //need to create key
            response.body.cities[citykey]['cityAdvisor'] = false;
          }          
          response.body.cities[citykey].cityAdvisor = status;
          
        } else {
          if (response.body.cities[citykey].clusters === undefined) { //need to create clusters key
            response.body.cities[citykey]['clusters'] = {};
          }
          if (response.body.cities[citykey].clusters[cluster] === undefined) { //need to create the cluster in user profile      
            console.log('Adding user to cluster: ' + cluster);
            response.body.cities[citykey].clusters[cluster] = { "roles": [] };        
          }
          var thiscluster = response.body.cities[citykey].clusters[cluster];
          
          if (status === true) {
            if (thiscluster.roles.indexOf(role) < 0) {
              thiscluster.roles.push(role);
            } // else they already have the role, no action needed
          } else if (status === false) {        
            if (thiscluster.roles.indexOf(role) >= 0) {          
              thiscluster.roles.splice(thiscluster.roles.indexOf(role), 1);          
            } // else they do not have the role, no action needed
          }
          response.body.cities[citykey].clusters[cluster] = thiscluster;
        }
        
        db.put('users', userkey, response.body)
        .then(function (finalres) {
          res.status(201).send({ message: 'Profile updated.'});
        })
        .fail(function (err) {
          console.warn('WARNING:  Problem with put: ' + err);
          res.status(400).send({ message: 'Something went wrong: ' + err});
        });
        
      })
      .fail(function (err) {
        console.warn('WARNING:  Problem with get: ' + err);
        res.status(400).send({ message: 'Something went wrong: ' + err});
      });
    } else { 
      res.status(401).send({ message: 'You do not have permission to change this role.'}); 
    }
  });
}

function handleFeedback(req, res) {
  var userkey = req.user,
      data = JSON.parse(decodeURIComponent(req.query.data));  
      
  db.get("users", userkey)
    .then(function (response) {
      response.body['beta'] = data;
      
      db.put('users', userkey, response.body)
      .then(function (finalres) {
        res.status(201).send({ message: 'Profile updated.'});
      })
      .fail(function (err) {
        console.warn('WARNING:  Problem with put: ' + err);
        res.status(400).send({ message: 'Something went wrong: ' + err});
      });
      
    })
    .fail(function (err) {
      console.warn('WARNING:  Problem with get: ' + err);
      res.status(400).send({ message: 'Something went wrong: ' + err});
    }); 
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

/*
 |--------------------------------------------------------------------------
 | Maintenance Tasks
 |--------------------------------------------------------------------------
 */


function handleMaintenance(req, res) {
  var enabled = false;
  var startKey = '';
  var userlist = [];
  
  function getList(startKey, userlist) {    
    db.list('users', {limit: 50, startKey: startKey})
    .then( function(data) {
      for (var item in data.body.results) {
        // be careful to retreive existing values from target key then append!
        data.body.results[item].value.cities = { "bend-or": { "admin": false, "cityAdvisor": true } };
        userlist.push(data.body.results[item]);                    
      }                
      if (data.body.next) {
        var nextkey = url.parse(data.body.next).query;        
        startKey = nextkey.substr(18, nextkey.length - 18);   
        console.log('Getting next group..' + startKey);        
        getList(startKey, userlist);
      } else {
        console.log('Get done, moving to Put..' + userlist.length);         
        for (var user in userlist) {
          console.log('Updating ' + userlist[user].value.name);
          db.put('users', userlist[user].path.key, userlist[user].value)
          .then(function(response) {            
            console.log('Record updated!');
          });
        }
      }
    });
  }
    
  if (enabled) {
    console.log('Starting maintenance..');
    getList(startKey, userlist);           
  }
}

module.exports = UserApi;