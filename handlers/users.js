var bcrypt = require('bcryptjs'),
    Q = require('q'),
    request = require('request'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db),
    mcapi = require('mailchimp-api/mailchimp'),
    mc = new mcapi.Mailchimp(config.mailchimp);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var UserHandler = function() {
  this.ensureAuthenticated = handleEnsureAuthenticated;
  this.rootRoute = handleRootRoute;
  this.loginRoute = handleLoginRoute;
  this.userSearch = handleUserSearch;
  this.subscribeUser = handleSubscribeUser;
  this.updateUsers = handleUpdateUsers;
  this.createToken = handleCreateToken;
  this.linkedin = handleLinkedin;
  this.getMe = handleGetme;
  this.putMe = handlePutme;
  this.unlink = handleUnlink;
};
  

/*
 |--------------------------------------------------------------------------
 | Internal functions
 |--------------------------------------------------------------------------
 */

var showallusers = function(city, state){
  var deferred = Q.defer();
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
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function handleEnsureAuthenticated(req, res, next) {
  
  if (!req.headers.authorization) {    
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }

  var token = req.headers.authorization.split(' ')[1];
  var payload = jwt.decode(token, config.token_secret);

  if (payload.exp <= Date.now()) {
    return res.status(401).send({ message: 'Token has expired' });
  }

  req.user.email = payload.sub;
  next();
}


function handleRootRoute(req, res) { res.sendFile('index.html', { root: __dirname + config.path }); }
function handleLoginRoute(req, res){ res.redirect('#/login'); }

/*
 |--------------------------------------------------------------------------
 | Search API
 |--------------------------------------------------------------------------
 */

function handleUserSearch(req, res){  
  var citystate = req.params.citystate;
  var query = req.query.search;
  var city = citystate.substr(0, citystate.length - 3);
  var state = citystate.substr(citystate.length - 2, 2);
  console.log("City, State, Search: " + city + ', ' + state.toUpperCase() + ', ' + query);

  if (query !== undefined){
    this.searchincity(city, state, query)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
    });
  } else {
    this.showallusers(city, state)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
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

function handleUpdateUsers(req, res){
  console.log("update triggered!");
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
              res.send(res.statusCode).end();         
            });
          })
          .fail(function(err) {
            console.log('something went wrong:' );
            console.log(err);
            res.send(err);
          });              
      }    
    })
    .fail(function(err) {
      console.log('something went wrong:' );
      console.log(err);
      res.send(err);
    });      
}
  



/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function handleCreateToken(req, user) {
  var payload = {
    iss: req.hostname,
    sub: user.email,
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
function handleLinkedin(req, res) {
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
    
    if (response.statusCode !== 200) {
      return res.status(response.statusCode).send({ message: body.error_description });
    }
    
    var params = {
      oauth2_access_token: body.access_token,
      format: 'json'
    };

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {      
      
      var userprofile = {
        name: profile.firstName + ' ' + profile.lastName,
        email: profile.emailAddress,
        linkedin: profile,
        avatar: profile.pictureUrl || ''     
      };      
      
      // Step 3a. Link user accounts.
      if (req.headers.authorization) {
        console.log('AUTHORIZATION IN HEADER');
        
        db.search('users', 'value.linkedin.id: "' + profile.id + '"')
        .then(function (result){
          console.log('Result of db search:');
          console.log(result.body.results);
          if (result.body.results.length > 0){
            if (result.body.results[0].value.linkedin.id == profile.id){
              console.log("FOUND USER: " + profile.firstName + ' ' + profile.lastName);
              return res.status(409).send({ message: 'There is already a LinkedIn account that belongs to you' });
            }
            console.log("FOUND a profile, but couldn't match a linkedin id: " + profile.firstName + ' ' + profile.lastName);
            return res.status(409).send({ message: 'There appears to be an existing Linkedin account, but something is wrong.' });
          }
          
          var token = req.headers.authorization.split(' ')[1];
          var payload = jwt.decode(token, config.token_secret);
          
          db.get('users', payload.sub)
          .then(function(result) {
            result.body["linkedin"] = profile;// get user account and re-upload with linkedin data
            db.put('users', payload.sub, result.body)
              .then(function () {
                console.log("PROFILE UPDATED: " + userprofile.email);
                res.send({ token: handleCreateToken(req, result.body) });         
              })
              .fail(function (err) {
                console.log("PUT FAIL:");
                console.log(err.body);
                res.send(err.body);          
              });
          })
          .fail(function(err) {
            return res.status(400).send({ message: 'User not found.' });
          });
          
          
        })
        .fail(function(err) {
          return res.status(404).send({ message: 'No existing Linkedin user account found.'});
        });
        
      
      } else {
        console.log('AUTHORIZATION NOT IN HEADER');
        // Step 3b. Create a new user account or return an existing one.        
        
        db.search('users', 'value.linkedin.id: "' + profile.id + '"')
        .then(function (result){
          console.log('Result of db search:');
          console.log(result.body.results);
          if (result.body.results.length > 0){
            if (result.body.results[0].value.linkedin.id == profile.id){
              console.log("FOUND USER: " + profile.firstName + ' ' + profile.lastName);
              res.send({ token: handleCreateToken(req, result.body.results[0].value) });
            }
          } else {
            
            db.put('users', userprofile.email, userprofile)
            .then(function () {
              console.log("PROFILE CREATED: " + JSON.stringify(userprofile));
              res.send({ token: handleCreateToken(req, userprofile) });          
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
}

/*
 |--------------------------------------------------------------------------
 | Get Me
 |--------------------------------------------------------------------------
 */

function handleGetme(req, res) {
  db.get('users', req.user.email)
  .then(function(user) {
    res.send(user);
  })
  .fail(function(err) {
    return res.status(400).send({ message: 'User not found.' });
  });
}

/*
 |--------------------------------------------------------------------------
 | Put Me
 |--------------------------------------------------------------------------
 */

function handlePutme(req, res) {
  db.get('users', req.user.email)
    .then(function(user) {      
      user.displayName = req.body.displayName || user.displayName;
      user.email = req.body.email || user.email;
      user.save(function(err) {
      res.status(200).end();
    })
    .fail(function(err) {
      return res.status(400).send({ message: 'User not found' });
    });
  });
}

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */

function handleUnlink(req, res) {
  var provider = req.params.provider;  
  db.get('users', req.user.email)
    .then(function(user) {
      user[provider] = undefined;
      db.put('users', req.user.email, user)
        .then(function() {          
          res.status(200).end();
        })
        .fail(function(err) {
          console.log('user update failed');
          res.status(400).send({ message: 'Something went wrong! ' + err });
        });
    })
    .fail(function(err) {
      return res.status(400).send({ message: 'User not found' });
    });
}


module.exports = UserHandler;