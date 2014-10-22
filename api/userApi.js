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

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var UserApi = function() {
  this.ensureAuthenticated = handleEnsureAuthenticated;
  this.userSearch = handleUserSearch;
  this.subscribeUser = handleSubscribeUser;
  this.createToken = handleCreateToken;  
  this.addMentor = handleAddMentor;
  this.linkedin = handleLinkedin;
  this.getProfile = handleGetProfile;
  this.putProfile = handlePutProfile;
  this.deleteProfile = handleDeleteProfile;
  this.unlink = handleUnlink;
  this.signup = handleSignup;
  this.login = handleLogin;
};
  

/*
 |--------------------------------------------------------------------------
 | Internal functions
 |--------------------------------------------------------------------------
 */

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
      req.user = {};
    } else {
      console.log('Existing user in request:');
      console.log(req.user);
    }
    
    req.user.email = payload.sub;
    next();
  }
  catch (e) {
    console.log('JWT failure: ');
    console.log(e);
    return res.status(401).send({ message: 'Please logout or clear your local browser storage and try again' });
  }  
}


//function handleRootRoute(req, res) { res.sendFile('index.html', { root: __dirname + config.path }); }
//function handleLoginRoute(req, res){ res.redirect('/login'); }

/*
 |--------------------------------------------------------------------------
 | Search API
 |--------------------------------------------------------------------------
 */

function handleUserSearch(req, res){  
  var citystate = req.params.citystate;
  var query = req.query.search;
  var limit = req.query.limit;
  var offset = req.query.offset;
  var city = citystate.substr(0, citystate.length - 3);
  var state = citystate.substr(citystate.length - 2, 2);
  console.log("City, State, Search: " + city + ', ' + state.toUpperCase() + ', ' + query);

  if (query !== undefined){
    searchincity(city, state, query, limit, offset)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
    });
  } else {
    showallusers(city, state, limit, offset)
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
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
function handleSignup(req, res) {
  var hash = bcrypt.hashSync(req.body.password, 8);
  var user = {
    "name": req.body.name,
    "email": req.body.email,
    "password": hash,
    "avatar": ''
  };
  //check if email is already assigned in our database
  
  db.newSearchBuilder()
    .collection('users')
    .limit(1)
    .query('value.email: "' + req.body.email + '"')
    .then(function(result){
      if (result.body.results.length > 0) {
        console.log('User already exists');
        res.status(401).send('That email address is already registered to a user.'); //username already exists
      } else {
        console.log('Email is free for use');
        db.post('users', user)
          .then(function () {
            console.log("USER:");
            console.log(user);
            res.send({ token: handleCreateToken(req, user) });
          })
          .fail(function (err) {
            console.log("POST FAIL:" + err.body);
            res.status(401).send('Something went wrong: ' + err);
          });
      }
    })
    .fail(function(err){
      console.log("SEARCH FAIL:" + err);
      res.status(401).send('Something went wrong: ' + err);
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
          res.send({ token: handleCreateToken(req, result.body.results[0].value) });
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
          res.status(401).send('Something went wrong: ' + err);
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
        var linkedinuser = {
          name: body.firstName + ' ' + body.lastName,
          email: email || body.id,
          cities: { 'Oregon': 'Bend' },
          linkedin: body,
          avatar: body.pictureUrl || ''
        };
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
      
      var userprofile = {
        name: profile.firstName + ' ' + profile.lastName,
        email: profile.emailAddress,
        cities: { "Oregon": "Bend" },
        linkedin: profile,
        avatar: profile.pictureUrl || ''        
      };              
        
        // Step 3a. Link user accounts.
      if (req.headers.authorization) {
          
        db.newSearchBuilder()
          .collection('users')
          .limit(1)
          .query('value.linkedin.id: "' + profile.id + '"')
          .then(function (result){
            console.log('Result of db search: ' + result.body.total_count);              
            if (result.body.results.length > 0){            
              console.log("Found user: " + profile.firstName + ' ' + profile.lastName);                                                                               
              res.status(409).send({ message: "There is already a Linkedin account that belongs to you." });
            
            } else {
            
              console.log('No Linkedin user in the system with that id; ok to add it.');
              var token = req.headers.authorization.split(' ')[1];
              var payload = jwt.decode(token, config.token_secret);
              
              db.newSearchBuilder()
                .collection('users')
                .limit(1)
                .query('value.email: "' + payload.sub + '"')
                .then(function(result){
                  if (result.body.results.length > 0) {
                    console.log('Matching user found.');
                    result.body.results[0].value["linkedin"] = profile; // get user account and re-upload with linkedin data
                    db.put('users', result.body.results[0].path.key, result.body.results[0].value)
                      .then(function () {
                        console.log("Profile updated: " + userprofile.email);                          
                      })
                      .fail(function (err) {
                        console.error("Profile update failed:");
                        console.error(err.body);                          
                      });
                    res.send({ token: handleCreateToken(req, result.body.results[0].value) });
                  } else {
                    res.status(400).send({ message: "Sorry, we couldn't find you in our system. Please try logging out and back in." });                    
                  }
                })
                .fail(function(err){
                  console.log("SEARCH FAIL:" + err);
                  res.status(401).send('Something went wrong: ' + err);
                });
            }
          })
          .fail(function(err){
            console.log("SEARCH FAIL:" + err);
            res.status(401).send('Something went wrong: ' + err);
          });
        
        
        } else {
          
          db.newSearchBuilder()
          .collection('users')
          .limit(1)
          .query('value.linkedin.id: "' + profile.id + '"')
          .then(function (result){
            console.log('Result of db search: ' + result.body.total_count);              
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
              res.send({ token: handleCreateToken(req, result.body.results[0].value) }); 
            } else {
              
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
                  res.status(401).send('Something went wrong: ' + err);
                });                               
            }
          });
        }
      });
    } else {                
                        
        var userlist = [{url: 'http://www.linkedin.com/pub/lee-kissinger/11/478/a1b', email: 'lkissinger@pccstructurals.com' },{ url: 'http://www.linkedin.com/pub/j-corey-schmid-mba/2/b5/65b', email: 'corey@sevenpeaksventures.com' },{ url: 'http://www.linkedin.com/pub/paul-abbott/2/3a5/4b1', email: 'Paulabbott9@hotmail.com' },{ url: 'http://www.linkedin.com/in/scottallan', email: 'scott@hydroflask.com' },{ url: 'http://www.linkedin.com/in/dianegallen', email: '' },{ url: 'http://www.linkedin.com/in/jeffarker', email: 'jeff@globaltradingpartners.com' },{ url: 'http://www.linkedin.com/pub/david-asson/86/540/5b9', email: 'dasson@ci.sisters.or.us' },{ url: 'http://www.linkedin.com/pub/john-barberich/64/582/994', email: 'barberichj@aol.com' },{ url: 'http://www.linkedin.com/pub/mark-beardsley/21/8a4/bb5', email: 'mark.beardsley@wellsfargo.com' },{ url: 'http://www.linkedin.com/pub/jay-bennett/8/1a9/9b8', email: '' },{ url: 'http://www.linkedin.com/pub/james-boeddeker/19/106/100', email: 'jimbo@bendbroadband.com' },{ url: 'http://www.linkedin.com/pub/brian-bouma/90/451/641', email: 'bbouma@me.com' },{ url: 'http://www.linkedin.com/pub/john-bradshaw/12/a2a/4b3', email: 'john.bradshaw@focusbankers.com' },{ url: 'http://www.linkedin.com/pub/jim-brennan/12/730/879', email: 'jbrennan353@gmail.com' },{ url: 'https://www.linkedin.com/pub/yvonne-burgess/b/70/1ba', email: 'yvonne@yburgess.com' },{ url: 'http://www.linkedin.com/in/patrickjburns', email: 'pburns@neoconassoc.com' },{ url: 'http://www.linkedin.com/pub/moe-carrick/2/88a/aa6', email: 'mcarrick@moementum.com' },{ url: 'http://www.linkedin.com/pub/bob-chamberlain/1/a31/439', email: 'bobchamberlain40@icloud.com' },{ url: 'http://www.linkedin.com/in/drewchild', email: 'drew.child@gmail.com' },{ url: 'http://www.linkedin.com/in/brucechurchill', email: '' },{ url: 'http://www.linkedin.com/pub/jim-coonan/3a/4b5/995', email: 'jcoonan@audiosource.net' },{ url: 'https://www.linkedin.com/in/stevecurley', email: 'steve@bluespacemarkets.com' },{ url: 'http://www.linkedin.com/in/evandickens', email: 'edickens@jrcpa.com' },{ url: 'http://www.linkedin.com/pub/sonja-donohue/a/222/582', email: 'sdonohue@bendbroadband.net' },{ url: 'http://www.linkedin.com/in/jerrydruliner', email: 'jdruliner@highdesertbeverage.com' },{ url: 'http://www.linkedin.com/in/lavoci', email: 'rob@finchamfinancial.com' },{ url: 'http://www.linkedin.com/pub/joe-franzi/0/920/395', email: 'jdfranzi@gmail.com' },{ url: 'http://www.linkedin.com/in/johnfurgurson', email: 'johnf@bnbranding.com' },{ url: 'http://www.linkedin.com/in/frankgoov', email: 'frank.h.goovaerts@gmail.com' },{ url: 'http://www.linkedin.com/pub/sandra-green/9/31/b35', email: 'sgreen@n-link.net' },{ url: 'http://au.linkedin.com/pub/ivan-hamilton/71/bb3/175', email: 'ivan@merisier-hamilton.com' },{ url: 'http://www.linkedin.com/in/samhandelman', email: 'sam@scsbend.com' },{ url: 'http://www.linkedin.com/pub/rita-hansen/5/72a/67', email: 'ritahansen@bendbroadband.com' },{ url: 'http://www.linkedin.com/in/lorieharrishancock', email: 'lorie@harrishancock.com' },{ url: 'http://www.linkedin.com/pub/heather-hepburn-hansen/52/b24/552', email: 'hepburn@bljlawyers.com' },{ url: 'http://www.linkedin.com/in/jherrick', email: 'john@herrickprodev.com' },{ url: 'http://www.linkedin.com/in/sheilinh', email: 'sheilin.herrick@gmail.com' },{ url: 'http://www.linkedin.com/pub/durlin-hickok/3/812/b42', email: 'dhickok@gmail.com' },{ url: 'http://www.linkedin.com/in/tonyhnyp', email: 'tonyh@ztllc.com' },{ url: 'http://www.linkedin.com/pub/steve-hockman/2b/5b0/6aa', email: 'shockman@steele-arch.com' },{ url: 'http://www.linkedin.com/pub/robert-hoffman-aia/26/583/213', email: 'bhoffman@inflectionpointadvisors.net' },{ url: 'http://www.linkedin.com/pub/alan-holzman/0/840/111', email: 'alan.holzman@gmail.com' },{ url: 'http://www.linkedin.com/pub/andrew-hunzicker/17/969/ba8', email: 'ahunzicker@me.com' },{ url: 'http://www.linkedin.com/in/execufeed', email: 'nextstep11@gmail.com' },{ url: 'http://www.linkedin.com/in/erknoc', email: 'erik@branderik.com' },{ url: 'http://www.linkedin.com/pub/simon-johnson/11/b87/980', email: 'smjones30@me.com' },{ url: 'http://www.linkedin.com/pub/sue-jones/38/81/455', email: '' },{ url: 'http://www.linkedin.com/in/brucejuhola', email: 'bruce.juhola@vistagechair.com' },{ url: 'http://www.linkedin.com/pub/karnopp-dennis/4/333/846', email: 'dck@karnopp.com' },{ url: 'http://www.linkedin.com/in/tocara', email: 'carakling@steppingstoneresources.com' },{ url: 'http://www.linkedin.com/pub/craig-ladkin/16/541/ab5', email: 'craig.ladkin@focusbankers.com' },{ url: 'http://www.linkedin.com/pub/greg-lambert/20/250/631', email: 'greg@midoregonpersonnel.com' },{ url: 'http://www.linkedin.com/in/robliv', email: 'robliv@gmail.com' },{ url: 'http://www.linkedin.com/pub/tom-loder/6/171/544', email: 'tloder@lodestartechnical.com' },{ url: 'http://www.linkedin.com/in/rluebke', email: 'rluebke@gmail.com' },{ url: 'http://www.linkedin.com/pub/les-mace/0/681/a53', email: 'les_mace@bendcable.com' },{ url: 'http://www.linkedin.com/pub/frank-maione/16/3b0/775', email: 'fmaione955@gmail.com' },{ url: 'https://www.linkedin.com/pub/mike-maloney/3/82a/a15', email: 'mcmaloney@interox.com' },{ url: 'http://www.linkedin.com/pub/kirk-mansberger/a/467/5b1', email: 'berger@bendbroadband.com' },{ url: 'https://www.linkedin.com/in/chrismaskill', email: 'chrismaskill@gmail.com' },{ url: 'http://www.linkedin.com/pub/susan-mcintosh/17/531/544', email: 'smcintosh@ykwc.net' },{ url: 'http://www.linkedin.com/pub/eric-meade/b/a6a/532', email: 'ericm@epusa.com' },{ url: 'http://www.linkedin.com/in/suemeyer', email: 'suemeyer@bendcable.com' },{ url: 'http://www.linkedin.com/pub/don-miller/33/a56/b72', email: 'jayhawkmiller@sbcglobal.net' },{ url: 'http://www.linkedin.com/pub/glenn-miller/60/284/a74', email: 'miller66@bendcable.com' },{ url: 'http://www.linkedin.com/pub/bill-montgomery/9/744/abb', email: 'williamd41@gmail.com' },{ url: 'http://www.linkedin.com/pub/bill-mooney/76/27a/a92', email: 'Mooney.bill@gmail.com' },{ url: 'http://www.linkedin.com/in/merryannmoore', email: 'merryannmoore@gmail.com' },{ url: 'http://www.linkedin.com/pub/jason-moyer/2/4b2/504', email: 'jason.moyer@cascadiangroup.us' },{ url: 'http://www.linkedin.com/pub/jon-napier/13/267/113', email: 'JJN@karnopp.com' },{ url: 'http://www.linkedin.com/pub/jim-ouchi/12/1a3/521', email: 'jouchi@esourcecoach.com' },{ url: 'http://www.linkedin.com/in/kathyoxborrow', email: 'kathy@oxborrowconsulting.com' },{ url: 'http://www.linkedin.com/pub/debbie-parigian-cpa/8/601/117', email: 'debbie@corporategrowthassoc.com' },{ url: 'http://www.linkedin.com/pub/alistair-paterson/13/946/a0b', email: 'alistair@alistairpaterson.com' },{ url: 'http://www.linkedin.com/in/louispepper', email: '' },{ url: 'https://www.linkedin.com/pub/anya-petersen-frey/9/913/882', email: 'anyafrey@gmail.com' },{ url: 'http://www.linkedin.com/pub/kathrin-platt/1a/252/929', email: 'kplatt@spencercrest.com' },{ url: 'http://www.linkedin.com/pub/jay-riker/5/65a/678', email: 'jariker@attglobal.net' },{ url: 'https://www.linkedin.com/pub/kate-ryan/6/291/b9', email: 'kate.ryanconsultinggroup@gmail.com' },{ url: 'http://www.linkedin.com/pub/jim-schell/10/17/a1b', email: 'smallbiz5@aol.com' },{ url: 'http://www.linkedin.com/pub/scott-schroeder/10/60b/586', email: 'scott@reliancecm.com' },{ url: 'http://www.linkedin.com/pub/andrea-sigetich/0/b0/490', email: 'andrea@sagecoach.com' },{ url: 'http://www.linkedin.com/pub/rick-silver/53/206/295', email: 'Silver4250@yahoo.com' },{ url: 'http://www.linkedin.com/pub/dave-slavensky/b/363/996', email: 'dave@earthcruiserusa.com' },{ url: 'http://www.linkedin.com/pub/caleb-stoddart/5/1b3/bb4', email: 'caleb@bendaccountants.com' },{ url: 'http://www.linkedin.com/pub/michael-story/7/686/955', email: 'story.mike@gmail.com' },{ url: 'http://www.linkedin.com/pub/dave-stowe/0/b61/71b', email: 'dave@ardellgroup.com' },{ url: 'http://www.linkedin.com/pub/david-svendsen/6a/b2/946', email: 'paul@axiavaluation.com' },{ url: 'http://www.linkedin.com/in/mtaus', email: 'michaeltaus@gmail.com' },{ url: 'http://www.linkedin.com/pub/mike-taylor/30/b70/7b2', email: 'miket@knccbend.com' },{ url: 'http://www.linkedin.com/pub/robert-thompson/4/804/887', email: 'robcthompson@live.com' },{ url: 'http://www.linkedin.com/in/jtompkin', email: 'jtompkin@pacbell.net' },{ url: 'https://www.linkedin.com/in/karenturnersrg', email: 'karen.turner@expresspros.com' },{ url: 'http://www.linkedin.com/pub/bill-valenti/1/5b3/38', email: 'valenti@bendbroadband.com' },{ url: 'http://www.linkedin.com/pub/jack-walker/38/2a5/876', email: 'walker@penfund.net' },{ url: 'http://www.linkedin.com/pub/scott-walley/10/2b4/b40', email: 'swalley@cwc-llp.com' },{ url: 'http://www.linkedin.com/pub/steven-webb/6/709/968', email: '' },{ url: 'http://www.linkedin.com/pub/steve-westberg-cpa-mba/11/67b/936', email: 'stevecpa@ymail.com' },{ url: 'http://www.linkedin.com/pub/bruce-willhite/84/729/795', email: 'bruce@unique-wire.com' },{ url: 'http://www.linkedin.com/in/jeffwitwer', email: 'jeffwitwer@yahoo.com' },{ url: 'http://www.linkedin.com/pub/jeff-wolfstone/9/3b4/520', email: 'WolfstoneJ@LanePowell.com' },{ url: 'http://www.linkedin.com/in/kermityensen', email: 'kermit.yensen@gmail.com' },{ url: 'http://www.linkedin.com/pub/jim-bednark/4/a24/99b', email: 'jrbednark@gmail.com' }
];
        
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
  var userid = req.param.userid;
  if (!userid) {
  db.newSearchBuilder()
    .collection('users')
    .limit(1)
    .query('value.email: "' + req.user.email + '"')
    .then(function(user){
      if (user.body.results.length > 0) {
        console.log('Authenticated user: ' + user.body.results[0].value.name);
        res.send(user.body.results[0]);
      } else {
        console.log('User not found.');
        return res.status(200).send({ message: 'User not found.' });
      }
    })
    .fail(function(err){
      console.log("SEARCH FAIL:" + err);
      res.status(401).send('Something went wrong: ' + err);
    }); 
  } else {
    console.log('you need to define how to handle userid in /profile GET');
  }
}

/*
 |--------------------------------------------------------------------------
 | Put Profile
 |--------------------------------------------------------------------------
 */

function handlePutProfile(req, res) {
  db.newSearchBuilder()
    .collection('users')
    .limit(1)
    .query('value.email: "' + req.user.email + '"')
    .then(function(user){
      if (user.body.results.length > 0) {
       //NOTHING HERE! NEED PUT STATEMENT
      } else {
        console.log('User not found.');
        return res.status(400).send({ message: 'User not found' });
      }
    })
    .fail(function(err){
      console.log("SEARCH FAIL:" + err);
      res.status(401).send('Something went wrong: ' + err);
    }); 
}

/*
 |--------------------------------------------------------------------------
 | Delete Profile
 |--------------------------------------------------------------------------
 */

function handleDeleteProfile(req, res) {
  db.newSearchBuilder()
    .collection('users')
    .limit(1)
    .query('value.email: "' + req.user.email + '"')
    .then(function(user){
      if (user.body.results.length > 0) {
       //NOTHING HERE! NEED PUT STATEMENT
      } else {
        console.log('User not found.');
        return res.status(400).send({ message: 'User not found' });
      }
    })
    .fail(function(err){
      console.log("SEARCH FAIL:" + err);
      res.status(401).send('Something went wrong: ' + err);
    }); 
}

/*
 |--------------------------------------------------------------------------
 | Unlink Provider
 |--------------------------------------------------------------------------
 */

function handleUnlink(req, res) {
  var provider = req.params.provider;  
  db.newSearchBuilder()
    .collection('users')
    .limit(1)
    .query('value.email: "' + req.user.email + '"')
    .then(function(user){
      if (user.body.results.length > 0) {
        user[provider] = undefined;
        db.put('users', user.body.results[0].path.key, user.body.results[0].value)
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
      res.status(401).send('Something went wrong: ' + err);
    });         
}


module.exports = UserApi;