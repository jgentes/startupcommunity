//===============DEPENDENCIES=================

var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    logger = require('morgan'),
    favicon = require('serve-favicon'),
    request = require('request'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    LinkedInStrategy = require('passport-linkedin-oauth2').Strategy,
    mcapi = require('mailchimp-api/mailchimp');

var config = require('./config.json')[process.env.NODE_ENV || 'development'],
    funct = require('./functions.js');

var app = express();

var mc = new mcapi.Mailchimp(config.mailchimp);

//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("deserializing:");
  console.log(obj);
  done(null, obj);
});

// Use the LocalStrategy within Passport to login users.
passport.use('local-signin', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    funct.localAuth(username, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        req.session.success = 'You are successfully logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
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
  function(req, username, password, done) {
    funct.localReg(username, password)
    .then(function (user) {
      if (user) {
        console.log("REGISTERED: " + user.username);
        req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT REGISTER");
        req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
        done(null, false);
      }
    })
    .fail(function (err){
      console.log(err.body);
      done(err);
    });
  }
));

// use linkedin strategy
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
          avatar: profile._json.pictureUrl || '',
          provider: 'linkedin'
        };
    
    var getlinkedinprofile = function(url, email) {
      request.get(
        'https://api.linkedin.com/v1/people/url=' + querystring.escape(userlist[i].url) + ':(id,first-name,last-name,picture-url;secure=true,headline,summary,public-profile-url)' + '?oauth2_access_token=' + accessToken + '&format=json',
        function(error, response, body) {
          var newbody = JSON.parse(body);
          if (newbody.id !== undefined) {
            var linkedinuser = {
              name: newbody.firstName + ' ' + newbody.lastName,
              email: email,
              username: email,
              linkedin: newbody,
              avatar: newbody.pictureUrl || '',
              provider: 'linkedin'
            };
            console.log('LINKEDIN USER:');
            console.log(linkedinuser);
            funct.linkedinPull(linkedinuser)
            .then(function(user) {
              console.log ("Database Update Successful");
              //done(null, user);
            })
            .fail(function(err){
              console.log("FAIL");
              console.log(err.body);
              //done(err);
            });
          }
          
        });
    };
    
    if (req.query.state !== 'none') {
      
      var userlist = [];
      for (var i=0; i < userlist.length; i++) {
        getlinkedinprofile(userlist[i].url, userlist[i].email);
      }
      
        //done(null, false);
    } else {
    
      funct.linkedinAuth(req, accessToken, refreshToken, userprofile)
      .then(function(user) {
        if (user) {
          req.session.success = 'You successfully logged in!';
          done(null, user);
        }
        if (!user) {
          console.log("COULD NOT REGISTER");
          req.session.error = 'That Linkedin ID is already in use, please try a different one.'; //inform user could not log them in
          done(null, false);
        }
      })
      .fail(function (err){
        console.log(err.body);
        done(err);
      });
    }
  }
));

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.error = 'Please sign in!';
  res.redirect('/signin');
}

//===============EXPRESS=================
app.use(logger('combined'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(session({secret: 'junglist', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());


//===============ROUTES=================

// load the single view file (angular will handle the page changes on the front-end)
app.get('/', function(req, res) {
    res.sendFile('index.html', { root: config.path + '/' }); 
});

//displays our signup page
app.get('/signin', function(req, res){
  res.render('signin');
});

//display all users
app.get('/api/users', function(req, res){
  var query = req.query.search;
  //TODO ADD IS.AUTHENTICATED
  if (query !== undefined){
    funct.search(query)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
    });
  } else {
    funct.showallusers()
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
    });
  }
});

//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);

// Setting the linkedin oauth routes
app.get('/auth/linkedin', passport.authenticate('linkedin', {
    state: 'none'
  }), function(req, res) {}
);

app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
    failureRedirect: '/signin', // i should be verifying the state here to avoid csrf
    successRedirect: '/'
  }) // ADD LINKEDIN CALLBACK HERE THAT STORES OAUTH CODE, OR PERHAPS SEND A PARAMETER IDENTIFYING THE PROVIDER
); 

// experiment with linkedin authenticated call
app.get('/user/profile', function(req, res){
  passport.authenticate('linkedin', {
    state: req.query.url || 'none'
})(req, res);
});


//sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/login', passport.authenticate('local-signin', { 
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGING OUT " + req.user.username);
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

app.post('/sub', function(req, res){  
  mc.lists.subscribe({id: 'ba6c99c719', email:{email:req.body.email}}, function(data) { 
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
});



// All APP.USE should come after routes (https://github.com/strongloop/express/wiki/Migrating-from-3.x-to-4.x)

// Session-persisted message middleware
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

app.use("/", express.static(config.path));
app.use("/public", express.static('/home/ubuntu/workspace/public'));
app.use(favicon('/home/ubuntu/workspace/public/favicon.png'));

if (process.env.NODE_ENV !== "production") {  
  app.use("/bower_components", express.static("/home/ubuntu/workspace/bower_components"));
}

//===============PORT=================
var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");