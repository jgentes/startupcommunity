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
  this.signup = handleSignup;
  this.login = handleLogin;
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
      delete result.body.results[i].path.key;
      delete result.body.results[i].value.email;
      delete result.body.results[i].value.password;
      delete result.body.results[i].value.linkedin.emailAddress;
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
      delete result.body.results[i].path.key;
      delete result.body.results[i].value.email;
      delete result.body.results[i].value.password;
      delete result.body.results[i].value.linkedin.emailAddress;
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
    searchincity(city, state, query)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
    });
  } else {
    showallusers(city, state)
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
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
function handleSignup(req, res) {
  var hash = bcrypt.hashSync(req.body.password, 8);
  var user = {
    "name": req.body.name,
    "email": req.body.email,
    "password": hash,
    "avatar": "/public/blank_avatar.png"
  };
  //check if email is already assigned in our database
  db.get('users', req.body.email)
  .then(function (result){ //case in which user already exists in db
    console.log('User already exists');
    res.status(401).send('That email address is already registered to a user.'); //username already exists
  })
  .fail(function (result) {//case in which user does not already exist in db
      console.log(result.body);
      if (result.body.message == 'The requested items could not be found.'){
        console.log('Email is free for use');
        db.put('users', req.body.email, user)
        .then(function () {
          console.log("USER:");
          console.log(user);
          res.send({ token: handleCreateToken(req, user) });
        })
        .fail(function (err) {
          console.log("PUT FAIL:" + err.body);
          res.status(401).send('Something went wrong: ' + err);
        });
      } else {
        res.status(401).send('Something went wrong!');
      }
  });    
}


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */

function handleLogin(req, res) {  
 db.get('users', req.body.email)
  .then(function (result){
    console.log("FOUND USER");
    var hash = result.body.password;
    if (bcrypt.compareSync(req.body.password, hash)) {
      res.send({ token: handleCreateToken(req, result.body) });
    } else {
      console.log("PASSWORDS DO NOT MATCH");
      return res.status(401).send({ message: 'Wrong email and/or password' });
    }
  }).fail(function (err){
    if (err.body.message == 'The requested items could not be found.'){
          console.log("COULD NOT FIND USER IN DB FOR SIGNIN");
          return res.status(401).send({ message: 'Wrong email and/or password' });
    } else {
      return res.status(401).send({ message: 'Something went wrong!' });
    }
  });
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

    var uploadcheck = 0;
      
    if (uploadcheck === 0) {
    // Step 2. Retrieve profile information about the current user.
      request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {      
      
      var userprofile = {
        name: profile.firstName + ' ' + profile.lastName,
        email: profile.emailAddress,
        cities: { "OR": "Bend" },
        linkedin: profile,
        avatar: profile.pictureUrl || ''     
      };              
        
        // Step 3a. Link user accounts.
        if (req.headers.authorization) {
          
          db.search('users', 'value.linkedin.id: "' + profile.id + '"')
          .then(function (result){
            console.log('Result of db search:');
            console.log(result.body.results);
            if (result.body.results.length > 0){
              if (result.body.results[0].value.linkedin.id == profile.id){
                console.log("FOUND USER: " + profile.firstName + ' ' + profile.lastName);
                return res.status(200).send({ message: 'Linkedin account found!' });
              }
              console.log("Found a profile, but couldn't match a linkedin id: " + profile.firstName + ' ' + profile.lastName);
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
              console.log('User not found, please logout or clear the local storage in your browser.');
              return res.status(400).send({ message: 'User not found, please logout or clear the local storage in your browser.' });
            });
            
            
          })
          .fail(function(err) {
            console.log('No existing Linkedin user account found.');
            return res.status(404).send({ message: 'No existing Linkedin user account found.'});
          });
          
        
        } else {
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
    } else {  
        
        var querystring = require('querystring');
        
        var linkedinPull = function (linkedinuser) {
  
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
                console.log("PROFILE UPDATED: " + linkedinuser.email);
                return linkedinuser;
              })
              .fail(function (err) {
                console.log("PUT FAIL:");
                console.log(err.body);
              return new Error(err.body);
              });
              
            }
          } else { 
            console.log('No existing linkedin user found!');
            db.put('users', linkedinuser.email, linkedinuser)
            .then(function () {
              console.log("REGISTERED: " + linkedinuser.email);
              return linkedinuser;
            })
            .fail(function (err) {
              console.log("FAIL:" + err.body);
              return new Error(err.body);
            });
          }
        })
        .fail(function (result) {
          console.log("SEARCH FAIL! " + JSON.stringify(linkedinuser));
          console.log(result);
          return new Error(result);
        });
        
      };
        
        var getlinkedinprofile = function(url, email) {              
          
          request.get({ url: 'https://api.linkedin.com/v1/people/url=' + querystring.escape(url) + ':(id,first-name,last-name,picture-url;secure=true,headline,summary,public-profile-url)', qs: params, json: true }, 
          function(error, response, body) {
            if (body.id !== undefined) {
              var linkedinuser = {
                name: body.firstName + ' ' + body.lastName,
                email: email || body.id,
                cities: { 'OR': 'Bend' },
                linkedin: body,
                avatar: body.pictureUrl || ''
              };
              console.log('LINKEDIN USER:');
              console.log(linkedinuser);
              linkedinPull(linkedinuser);            
            }
          });
        };  
                
        
        var userlist = [{ url: 'http://www.linkedin.com/pub/paul-abbott/2/3a5/4b1', email: 'Paulabbott9@hotmail.com' },{ url: 'http://www.linkedin.com/in/scottallan', email: 'scott@hydroflask.com' },{ url: 'http://www.linkedin.com/in/dianegallen', email: '' },{ url: 'http://www.linkedin.com/in/jeffarker', email: 'jeff@globaltradingpartners.com' },{ url: 'http://www.linkedin.com/pub/david-asson/86/540/5b9', email: 'dasson@ci.sisters.or.us' },{ url: 'http://www.linkedin.com/pub/john-barberich/64/582/994', email: 'barberichj@aol.com' },{ url: 'http://www.linkedin.com/pub/mark-beardsley/21/8a4/bb5', email: 'mark.beardsley@wellsfargo.com' },{ url: 'http://www.linkedin.com/pub/jay-bennett/8/1a9/9b8', email: '' },{ url: 'http://www.linkedin.com/pub/james-boeddeker/19/106/100', email: 'jimbo@bendbroadband.com' },{ url: 'http://www.linkedin.com/pub/brian-bouma/90/451/641', email: 'bbouma@me.com' },{ url: 'http://www.linkedin.com/pub/john-bradshaw/12/a2a/4b3', email: 'john.bradshaw@focusbankers.com' },{ url: 'http://www.linkedin.com/pub/jim-brennan/12/730/879', email: 'jbrennan353@gmail.com' },{ url: 'https://www.linkedin.com/pub/yvonne-burgess/b/70/1ba', email: 'yvonne@yburgess.com' },{ url: 'http://www.linkedin.com/in/patrickjburns', email: 'pburns@neoconassoc.com' },{ url: 'http://www.linkedin.com/pub/moe-carrick/2/88a/aa6', email: 'mcarrick@moementum.com' },{ url: 'http://www.linkedin.com/pub/bob-chamberlain/1/a31/439', email: 'bobchamberlain40@icloud.com' },{ url: 'http://www.linkedin.com/in/drewchild', email: 'drew.child@gmail.com' },{ url: 'http://www.linkedin.com/in/brucechurchill', email: '' },{ url: 'http://www.linkedin.com/pub/jim-coonan/3a/4b5/995', email: 'jcoonan@audiosource.net' },{ url: 'https://www.linkedin.com/in/stevecurley', email: 'steve@bluespacemarkets.com' },{ url: 'http://www.linkedin.com/in/evandickens', email: 'edickens@jrcpa.com' },{ url: 'http://www.linkedin.com/pub/sonja-donohue/a/222/582', email: 'sdonohue@bendbroadband.net' },{ url: 'http://www.linkedin.com/in/jerrydruliner', email: 'jdruliner@highdesertbeverage.com' },{ url: 'http://www.linkedin.com/in/lavoci', email: 'rob@finchamfinancial.com' },{ url: 'http://www.linkedin.com/pub/joe-franzi/0/920/395', email: 'jdfranzi@gmail.com' },{ url: 'http://www.linkedin.com/in/johnfurgurson', email: 'johnf@bnbranding.com' },{ url: 'http://www.linkedin.com/in/frankgoov', email: 'frank.h.goovaerts@gmail.com' },{ url: 'http://www.linkedin.com/pub/sandra-green/9/31/b35', email: 'sgreen@n-link.net' },{ url: 'http://au.linkedin.com/pub/ivan-hamilton/71/bb3/175', email: 'ivan@merisier-hamilton.com' },{ url: 'http://www.linkedin.com/in/samhandelman', email: 'sam@scsbend.com' },{ url: 'http://www.linkedin.com/pub/rita-hansen/5/72a/67', email: 'ritahansen@bendbroadband.com' },{ url: 'http://www.linkedin.com/in/lorieharrishancock', email: 'lorie@harrishancock.com' },{ url: 'http://www.linkedin.com/pub/heather-hepburn-hansen/52/b24/552', email: 'hepburn@bljlawyers.com' },{ url: 'http://www.linkedin.com/in/jherrick', email: 'john@herrickprodev.com' },{ url: 'http://www.linkedin.com/in/sheilinh', email: 'sheilin.herrick@gmail.com' },{ url: 'http://www.linkedin.com/pub/durlin-hickok/3/812/b42', email: 'dhickok@gmail.com' },{ url: 'http://www.linkedin.com/in/tonyhnyp', email: 'tonyh@ztllc.com' },{ url: 'http://www.linkedin.com/pub/steve-hockman/2b/5b0/6aa', email: 'shockman@steele-arch.com' },{ url: 'http://www.linkedin.com/pub/robert-hoffman-aia/26/583/213', email: 'bhoffman@inflectionpointadvisors.net' },{ url: 'http://www.linkedin.com/pub/alan-holzman/0/840/111', email: 'alan.holzman@gmail.com' },{ url: 'http://www.linkedin.com/pub/andrew-hunzicker/17/969/ba8', email: 'ahunzicker@me.com' },{ url: 'http://www.linkedin.com/in/execufeed', email: 'nextstep11@gmail.com' },{ url: 'http://www.linkedin.com/in/erknoc', email: 'erik@branderik.com' },{ url: 'http://www.linkedin.com/pub/simon-johnson/11/b87/980', email: 'smjones30@me.com' },{ url: 'http://www.linkedin.com/pub/sue-jones/38/81/455', email: '' },{ url: 'http://www.linkedin.com/in/brucejuhola', email: 'bruce.juhola@vistagechair.com' },{ url: 'http://www.linkedin.com/pub/karnopp-dennis/4/333/846', email: 'dck@karnopp.com' },{ url: 'http://www.linkedin.com/in/tocara', email: 'carakling@steppingstoneresources.com' },{ url: 'http://www.linkedin.com/pub/craig-ladkin/16/541/ab5', email: 'craig.ladkin@focusbankers.com' },{ url: 'http://www.linkedin.com/pub/greg-lambert/20/250/631', email: 'greg@midoregonpersonnel.com' },{ url: 'http://www.linkedin.com/in/robliv', email: 'robliv@gmail.com' },{ url: 'http://www.linkedin.com/pub/tom-loder/6/171/544', email: 'tloder@lodestartechnical.com' },{ url: 'http://www.linkedin.com/in/rluebke', email: 'rluebke@gmail.com' },{ url: 'http://www.linkedin.com/pub/les-mace/0/681/a53', email: 'les_mace@bendcable.com' },{ url: 'http://www.linkedin.com/pub/frank-maione/16/3b0/775', email: 'fmaione955@gmail.com' },{ url: 'https://www.linkedin.com/pub/mike-maloney/3/82a/a15', email: 'mcmaloney@interox.com' },{ url: 'http://www.linkedin.com/pub/kirk-mansberger/a/467/5b1', email: 'berger@bendbroadband.com' },{ url: 'https://www.linkedin.com/in/chrismaskill', email: 'chrismaskill@gmail.com' },{ url: 'http://www.linkedin.com/pub/susan-mcintosh/17/531/544', email: 'smcintosh@ykwc.net' },{ url: 'http://www.linkedin.com/pub/eric-meade/b/a6a/532', email: 'ericm@epusa.com' },{ url: 'http://www.linkedin.com/in/suemeyer', email: 'suemeyer@bendcable.com' },{ url: 'http://www.linkedin.com/pub/don-miller/33/a56/b72', email: 'jayhawkmiller@sbcglobal.net' },{ url: 'http://www.linkedin.com/pub/glenn-miller/60/284/a74', email: 'miller66@bendcable.com' },{ url: 'http://www.linkedin.com/pub/bill-montgomery/9/744/abb', email: 'williamd41@gmail.com' },{ url: 'http://www.linkedin.com/pub/bill-mooney/76/27a/a92', email: 'Mooney.bill@gmail.com' },{ url: 'http://www.linkedin.com/in/merryannmoore', email: 'merryannmoore@gmail.com' },{ url: 'http://www.linkedin.com/pub/jason-moyer/2/4b2/504', email: 'jason.moyer@cascadiangroup.us' },{ url: 'http://www.linkedin.com/pub/jon-napier/13/267/113', email: 'JJN@karnopp.com' },{ url: 'http://www.linkedin.com/pub/jim-ouchi/12/1a3/521', email: 'jouchi@esourcecoach.com' },{ url: 'http://www.linkedin.com/in/kathyoxborrow', email: 'kathy@oxborrowconsulting.com' },{ url: 'http://www.linkedin.com/pub/debbie-parigian-cpa/8/601/117', email: 'debbie@corporategrowthassoc.com' },{ url: 'http://www.linkedin.com/pub/alistair-paterson/13/946/a0b', email: 'alistair@alistairpaterson.com' },{ url: 'http://www.linkedin.com/in/louispepper', email: '' },{ url: 'https://www.linkedin.com/pub/anya-petersen-frey/9/913/882', email: 'anyafrey@gmail.com' },{ url: 'http://www.linkedin.com/pub/kathrin-platt/1a/252/929', email: 'kplatt@spencercrest.com' },{ url: 'http://www.linkedin.com/pub/jay-riker/5/65a/678', email: 'jariker@attglobal.net' },{ url: 'https://www.linkedin.com/pub/kate-ryan/6/291/b9', email: 'kate.ryanconsultinggroup@gmail.com' },{ url: 'http://www.linkedin.com/pub/jim-schell/10/17/a1b', email: 'smallbiz5@aol.com' },{ url: 'http://www.linkedin.com/pub/scott-schroeder/10/60b/586', email: 'scott@reliancecm.com' },{ url: 'http://www.linkedin.com/pub/andrea-sigetich/0/b0/490', email: 'andrea@sagecoach.com' },{ url: 'http://www.linkedin.com/pub/rick-silver/53/206/295', email: 'Silver4250@yahoo.com' },{ url: 'http://www.linkedin.com/pub/dave-slavensky/b/363/996', email: 'dave@earthcruiserusa.com' },{ url: 'http://www.linkedin.com/pub/caleb-stoddart/5/1b3/bb4', email: 'caleb@bendaccountants.com' },{ url: 'http://www.linkedin.com/pub/michael-story/7/686/955', email: 'story.mike@gmail.com' },{ url: 'http://www.linkedin.com/pub/dave-stowe/0/b61/71b', email: 'dave@ardellgroup.com' },{ url: 'http://www.linkedin.com/pub/david-svendsen/6a/b2/946', email: 'paul@axiavaluation.com' },{ url: 'http://www.linkedin.com/in/mtaus', email: 'michaeltaus@gmail.com' },{ url: 'http://www.linkedin.com/pub/mike-taylor/30/b70/7b2', email: 'miket@knccbend.com' },{ url: 'http://www.linkedin.com/pub/robert-thompson/4/804/887', email: 'robcthompson@live.com' },{ url: 'http://www.linkedin.com/in/jtompkin', email: 'jtompkin@pacbell.net' },{ url: 'https://www.linkedin.com/in/karenturnersrg', email: 'karen.turner@expresspros.com' },{ url: 'http://www.linkedin.com/pub/bill-valenti/1/5b3/38', email: 'valenti@bendbroadband.com' },{ url: 'http://www.linkedin.com/pub/jack-walker/38/2a5/876', email: 'walker@penfund.net' },{ url: 'http://www.linkedin.com/pub/scott-walley/10/2b4/b40', email: 'swalley@cwc-llp.com' },{ url: 'http://www.linkedin.com/pub/steven-webb/6/709/968', email: '' },{ url: 'http://www.linkedin.com/pub/steve-westberg-cpa-mba/11/67b/936', email: 'stevecpa@ymail.com' },{ url: 'http://www.linkedin.com/pub/bruce-willhite/84/729/795', email: 'bruce@unique-wire.com' },{ url: 'http://www.linkedin.com/in/jeffwitwer', email: 'jeffwitwer@yahoo.com' },{ url: 'http://www.linkedin.com/pub/jeff-wolfstone/9/3b4/520', email: 'WolfstoneJ@LanePowell.com' },{ url: 'http://www.linkedin.com/in/kermityensen', email: 'kermit.yensen@gmail.com' },{ url: 'http://www.linkedin.com/pub/jim-bednark/4/a24/99b', email: 'jrbednark@gmail.com' }
];
        
        for (var i=0; i < userlist.length; i++) {          
          getlinkedinprofile(userlist[i].url, userlist[i].email);
        }        
          
      }    
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
    console.log('Authenticated user: ' + user.body.name);
    res.send(user.body);
  })
  .fail(function(err) {
    console.log('User not found.');
    return res.status(200).send({ message: 'User not found.' });
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
      console.log('User not found.');
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
      db.put('users', req.user.email, user.body)
        .then(function() {          
          res.status(200).end();
        })
        .fail(function(err) {
          console.log('user update failed');
          res.status(400).send({ message: 'Something went wrong! ' + err });
        });
    })
    .fail(function(err) {
      console.log('User not found.');
      return res.status(400).send({ message: 'User not found' });
    });
}


module.exports = UserHandler;