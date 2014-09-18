var bcrypt = require('bcryptjs'),
    Q = require('q'),
    //passport = require('passport'),
    //LocalStrategy = require('passport-local'),
    //LinkedInStrategy = require('passport-linkedin-oauth2').Strategy,
    request = require('request'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db); //config.db holds Orchestrate token

//used in local-signup strategy
var localReg = function (email, name, password) {
  var deferred = Q.defer();
  var hash = bcrypt.hashSync(password, 8);
  var user = {
    "name": name,
    "email": email,
    "password": hash,
    "avatar": "/public/blank_avatar.png"
  };
  //check if email is already assigned in our database
  db.get('users', email)
  .then(function (result){ //case in which user already exists in db
    console.log('User already exists');
    deferred.resolve(false); //username already exists
  })
  .fail(function (result) {//case in which user does not already exist in db
      console.log(result.body);
      if (result.body.message == 'The requested items could not be found.'){
        console.log('Email is free for use');
        db.put('users', email, user)
        .then(function () {
          console.log("USER:");
          console.log(user);
          deferred.resolve(user);
        })
        .fail(function (err) {
          console.log("PUT FAIL:" + err.body);
          deferred.reject(new Error(err.body));
        });
      } else {
        deferred.reject(new Error(result.body));
      }
  });

  return deferred.promise;
};

//check if user exists
    //if user exists check if passwords match (use bcrypt.compareSync(password, hash); // true where 'hash' is password in DB)
      //if password matches take into website
  //if user doesn't exist or password doesn't match tell them it failed
var localAuth = function (email, password) {
  var deferred = Q.defer();

  db.get('users', email)
  .then(function (result){
    console.log("FOUND USER");
    var hash = result.body.password;
    console.log(hash);
    console.log(bcrypt.compareSync(password, hash));
    if (bcrypt.compareSync(password, hash)) {
      deferred.resolve(result.body);
    } else {
      console.log("PASSWORDS DO NOT MATCH");
      deferred.resolve(false);
    }
  }).fail(function (err){
    if (err.body.message == 'The requested items could not be found.'){
          console.log("COULD NOT FIND USER IN DB FOR SIGNIN");
          deferred.resolve(false);
    } else {
      deferred.reject(new Error(err));
    }
  });

  return deferred.promise;
};




var showallusers = function(city, state){
  var deferred = Q.defer();
  //TODO ADD IS.AUTHENTICATED (HERE OR IN THE ROUTE?)
  db.newSearchBuilder()
  .collection('users')
  .limit(100)
  .query('value.cities.' + state.toUpperCase() + ': "' + city + '"')
  .then(function(result){
    for (var i=0; i < result.body.results.length; i++) {
      delete result.body.results[i].path.collection;
      delete result.body.results[i].value.email;
      delete result.body.results[i].value.username;
      delete result.body.results[i].value.password;
      delete result.body.results[i].value.emailAddress;
    }
    deferred.resolve(result.body);
  })
  .fail(function(err){
    deferred.reject(new Error(err.body));
  });
 
  return deferred.promise;
  
};

var searchincity = function(city, state, query){
  var deferred = Q.defer();
  //TODO ADD IS.AUTHENTICATED (HERE OR IN THE ROUTE?)  
  db.newSearchBuilder()
  .collection('users')
  .limit(100)
  .query('value.cities.' + state.toUpperCase() + ': "' + city + '" AND ' + query)
  .then(function(result){
    for (var i=0; i < result.body.results.length; i++) {
      delete result.body.results[i].path.collection;
      delete result.body.results[i].value.email;
      delete result.body.results[i].value.username;
      delete result.body.results[i].value.password;
      delete result.body.results[i].value.emailAddress;
    }
    deferred.resolve(result.body);
  })
  .fail(function(err){
    deferred.reject(new Error(err.body));
  });
 
  return deferred.promise;
  
};
/*
exports.bendupdate = function() {
  var deferred = Q.defer();
  var thiskey = '';
  var thisrecord = '';
  console.log('bendupdate initiated!');
  db.list('users', {limit:100})
  .then(function(result){    
    console.log('entering for loop with: ' + result.body.results.length + ' items.');    
    for (var i=0; i <= result.body.results.length; i++) {      
      thiskey = result.body.results[i].path.key;
      console.log('processing ' + thiskey);
      thisrecord = result.body.results[i].value;
      //thisrecord["cities"] = { "OR": "Bend" };
      
      db.put('users', thisrecord.email, thisrecord)
      .then(function (res) {
        console.log('New record created, deleting old record');
        db.remove('users', thiskey, true)
        .then( function(res) {     
          console.log('completed user update: ' + res.statusCode);
          //deferred.resolve(res.statusCode);          
        });
        //deferred.resolve(res.statusCode);
      })
      .fail(function(err) {
        console.log('something went wrong:' );
        console.log(err);
      });
      /* EXAMPLE OF ADDING A GRAPH RELATIONSHIP    
      db.newGraphBuilder()
      .create()
      .from('cities', 'bend')
      .related('in')
      .to('users', thiskey)
      .then(function (res) {
        deferred.resolve(res.statusCode);
        console.log('completed graph from cities to users: ' + res.statusCode);
      });
      
    }
    deferred.resolve(result.body.results.length);
  });
  
  return deferred.promise;
  
};

*/

//===============PASSPORT=================
/*
// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.email);
  done(null, user.email);
});

passport.deserializeUser(function(email, done) {
  console.log("deserializing " + email);  
  db.get('users', email)
  .then(function(response) {
    done(null, response.body);
  })
  .fail(function(err) {
    console.log('Failed to deserialize user from db!');
    console.log(err);
  });
});

// Use the LocalStrategy within Passport to login users.
passport.use('local-signin', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, email, password, done) {
    localAuth(email, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        done(null, false);
      }
    })
    .fail(function (err){
      console.log(err.body);
      done(err);
    });
  }
));

// Use the LocalStrategy within Passport to Register/"signup" users.
passport.use('local-signup', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, email, username, password, done) {
    localReg(email, username, password)
    .then(function (user) {
      if (user) {
        console.log("REGISTERED: " + user.username);
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT REGISTER");
        done(null, false);
      }
    })
    .fail(function (err){
      console.log(err.body);
      done(err);
    });
  }
));

// ================= LINKEDIN AUTH STRATEGY ======================

exports.linkedin = passport.authenticate('linkedin', {
    state: 'none'
  });
  

passport.use('linkedin', new LinkedInStrategy({
  passReqToCallback: true,
  clientID: config.linkedin.clientID,
  clientSecret: config.linkedin.clientSecret,
  callbackURL: config.linkedin.callbackURL,
  scope: ['r_fullprofile', 'r_emailaddress'],
  profileFields: ['id', 'first-name', 'last-name', 'email-address', 'skills', 'picture-url;secure=true', 'headline', 'summary', 'public-profile-url']
  },
  function(req, accessToken, refreshToken, profile, done) {
    
    var querystring = require('querystring');
    
    var userprofile = {
          name: profile.name.givenName + ' ' + profile.name.familyName,
          email: profile.emails[0].value,
          username: profile.emails[0].value,
          linkedin: profile._json,
          avatar: profile._json.pictureUrl || ''          
        };
      
    var getlinkedinprofile = function(url, email) {
        request.get(
          'https://api.linkedin.com/v1/people/url=' + querystring.escape(url) + ':(id,first-name,last-name,picture-url;secure=true,headline,summary,public-profile-url)' + '?oauth2_access_token=' + accessToken + '&format=json',
          function(error, response, body) {
            var newbody = JSON.parse(body);
            if (newbody.id !== undefined) {
              var linkedinuser = {
                name: newbody.firstName + ' ' + newbody.lastName,
                email: email,
                username: email,
                linkedin: newbody,
                avatar: newbody.pictureUrl || ''
              };
              console.log('LINKEDIN USER:');
              console.log(linkedinuser);
              linkedinPull(linkedinuser, done);            
            }          
          });
      };  
      
  
      // QUERY STATE IS SETUP ONLY TO TRIGGER PULL FOR LINKEDIN PROFILES
      console.log('Query State: ' + req.query.state);
      if (req.query.state !== 'none') { 
        
        var userlist = [];
        for (var i=0; i < userlist.length; i++) {
          getlinkedinprofile(userlist[i].url, userlist[i].email);
        }      
          done(null, false);
      } else {         
        
      }
  }
  
));

var linkedinAuth = function (accessToken, refreshToken, userprofile) {
  var deferred = Q.defer();
  console.log(userprofile);
  
  db.search('users', 'value.linkedin.id: "' + userprofile.linkedin.id + '"')
  .then(function (result){
    console.log('Result of db search:');
    console.log(result.body.results);
    if (result.body.results.length > 0){
      if (result.body.results[0].value.linkedin.id == userprofile.linkedin.id){
        console.log("FOUND USER: " + userprofile.name);
        db.put('users', result.body.results[0].path.key, userprofile)
        .then(function () {
          console.log("PROFILE UPDATED: " + userprofile.username);
          deferred.resolve(userprofile);          
        })
        .fail(function (err) {
          console.log("PUT FAIL:");
          console.log(err.body);
          deferred.reject(new Error(err.body));          
        });
        
      }
    } else { 
      console.log('No existing linkedin user found!');
      db.post('users', userprofile)
        .then(function () {
          console.log("REGISTERED: " + userprofile.username);
          //console.log(user);
          deferred.resolve(userprofile);          
        })
        .fail(function (err) {
          console.log("POST FAIL:");
          console.log(err.body);
          deferred.reject(new Error(err.body));          
        });
    }
  }).fail(function (result) {//case in which user does not already exist in db
      deferred.reject(new Error(result.body));      
  });
  return deferred.promise;
};

var linkedinPull = function (linkedinuser, done) {
  
  console.log('STARTING LINKEDINPULL');
  //console.log(linkedinuser);
  
  db.search('users', 'value.linkedin.publicProfileUrl: "' + linkedinuser.linkedin.publicProfileUrl + '"')
  .then(function (result){
    console.log('Result of db search:');
    console.log(result.body.results);
    if (result.body.results.length > 0){
      if (result.body.results[0].value.linkedin.id == linkedinuser.linkedin.id){
        console.log("FOUND USER: " + linkedinuser.name);
        db.put('users', result.body.results[0].path.key, linkedinuser, result.body.results[0].path.ref)
        .then(function () {
          console.log("PROFILE UPDATED: " + linkedinuser.username);
          return done(linkedinuser);
        })
        .fail(function (err) {
          console.log("PUT FAIL:");
          console.log(err.body);
        return done(new Error(err.body));
        });
        
      }
    } else { 
      console.log('No existing linkedin user found!');
      db.post('users', linkedinuser)
      .then(function () {
        console.log("REGISTERED: " + linkedinuser.username);
        return done(linkedinuser);
      })
      .fail(function (err) {
        console.log("FAIL:" + err.body);
        return done(new Error(err.body));
      });
    }
  })
  .fail(function (result) {
    console.log("SEARCH FAIL: ");
    console.log(result.body);
    return done(new Error(result.body));
  });
  
};

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createToken(req, user) {
  var payload = {
    iss: req.hostname,
    sub: user._id,
    iat: moment().valueOf(),
    exp: moment().add(14, 'days').valueOf()
  };
  return jwt.encode(payload, config.token_secret);
}


/*
 |--------------------------------------------------------------------------
 | Login with LinkedIn
 |--------------------------------------------------------------------------
 */
exports.linkedin = function(req, res) {
  var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken';
  var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,skills,picture-url;secure=true,headline,summary,public-profile-url)';
  
  var params = {
    client_id: req.body.clientId,
    redirect_uri: req.body.redirectUri,
    client_secret: config.linkedin.clientSecret,
    code: req.body.code,
    grant_type: 'authorization_code',
    scope: ['r_fullprofile r_emailaddress']
  };
    
  // Step 1. Exchange authorization code for access token.
  request.post(accessTokenUrl, { form: params, json: true }, function(err, response, body) {
    console.log('EXCHANGED TOKEN');
    if (response.statusCode !== 200) {
      return res.status(response.statusCode).send({ message: body.error_description });
    }
    
    var params = {
      oauth2_access_token: body.access_token,
      format: 'json'
    };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {
      console.log('GOT PROFILE');
      
      var userprofile = {
        name: profile.firstName + ' ' + profile.lastName,
        email: profile.emailAddress,
        linkedin: profile,
        avatar: profile.pictureUrl || ''     
      };
      
      console.log(req.headers);
      // Step 3a. Link user accounts.
      if (req.headers.authorization) {
        console.log('AUTHORIZATION IN HEADER');
        var token = req.headers.authorization.split(' ')[1];
        var payload = jwt.decode(token, config.token_secret);
        
        console.log('payload');
        console.log(payload);
          /*
        linkedinAuth(profile)
        .then( function(user) {
          var token = req.cookies.user;
          //var token = jwt.sign({id: user.email}, config.secret);
          console.log('TOKEN FOUND: ' + token);
          tokenManager.saveToken(user.email, token)
          .then(function(token) {
            done(null, user);
          })
          .fail(function(err) {
            done(null, err);
          });
        })
        .fail( function(err) {
          console.log ("ERR RETURNED: " + err);
          done(null, err);
        });
        */
        
        var linkedinAuth = function (profile) {
          var deferred = Q.defer();
          console.log(profile);
          
          db.search('users', 'value.linkedin.id: "' + profile.id + '"')
          .then(function (result){
            console.log('Result of db search:');
            console.log(result.body.results);
            if (result.body.results.length > 0){
              if (result.body.results[0].value.linkedin.id == profile.id){
                console.log("FOUND USER: " + profile.firstName + ' ' + profile.lastName);
                return res.status(409).send({ message: 'There is already a LinkedIn account that belongs to you' });
                
                /*
                db.put('users', result.body.results[0].path.key, userprofile)
                .then(function () {
                  console.log("PROFILE UPDATED: " + userprofile.username);
                  deferred.resolve(userprofile);          
                })
                .fail(function (err) {
                  console.log("PUT FAIL:");
                  console.log(err.body);
                  deferred.reject(new Error(err.body));          
                });
                */
              }
            } else { 
              console.log('No existing linkedin user found!');
              
              var token = req.headers.authorization.split(' ')[1];
              var payload = jwt.decode(token, config.token_secret);
              
              console.log('payload');
              console.log(payload);
              
              db.post('users', userprofile)
                .then(function () {
                  console.log("REGISTERED: " + userprofile.username);
                  //console.log(user);
                  deferred.resolve(userprofile);          
                })
                .fail(function (err) {
                  console.log("POST FAIL:");
                  console.log(err.body);
                  deferred.reject(new Error(err.body));          
                });
            }
          }).fail(function (result) {//case in which user does not already exist in db
              deferred.reject(new Error(result.body));      
          });
          return deferred.promise;
        };
        
      
        User.findOne({ linkedin: profile.id }, function(err, existingUser) {         

          User.findById(payload.sub, function(err, user) {
            if (!user) {
              return res.status(400).send({ message: 'User not found' });
            }
            user.linkedin = profile.id;
            user.displayName = user.displayName || profile.firstName + ' ' + profile.lastName;
            user.save(function(err) {
              res.send({ token: createToken(req, user) });
            });
          });
        });
      } else {
        console.log('AUTHORIZATION NOT IN HEADER');
        // Step 3b. Create a new user account or return an existing one.
        
        //var deferred = Q.defer();
        
        db.search('users', 'value.linkedin.id: "' + profile.id + '"')
        .then(function (result){
          console.log('Result of db search:');
          console.log(result.body.results);
          if (result.body.results.length > 0){
            if (result.body.results[0].value.linkedin.id == profile.id){
              console.log("FOUND USER: " + profile.firstName + ' ' + profile.lastName);
              res.send({ token: createToken(req, result.body.results[0].value) });
            }
          } else {
            
            db.put('users', userprofile.email, userprofile)
            .then(function () {
              console.log("PROFILE CREATED: " + userprofile.username);
              res.send({ token: createToken(req, userprofile) });          
            })
            .fail(function (err) {
              console.log("PUT FAIL:");
              console.log(err.body);
              res.send(err.body);          
            });                
          }          
        })
        .fail(function (err){
          console.log('SEARCH FAILED');
          res.send(err.body); 
        });
      }
    });
  });
};

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */

exports.unlink = function(req, res) {
  var provider = req.params.provider;
  User.findById(req.user, function(err, user) {
    if (!user) {
      return res.status(400).send({ message: 'User not found' });
    }

    user[provider] = undefined;
    user.save(function(err) {
      res.status(200).end();
    });
  });
};