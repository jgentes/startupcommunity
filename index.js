//===============DEPENDENCIES=================

var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    logger = require('morgan'),    
    passport = require('passport'),    
    mcapi = require('mailchimp-api/mailchimp');

var config = require('./config.json')[process.env.NODE_ENV || 'development'];

var app = express();

var mc = new mcapi.Mailchimp(config.mailchimp);

var routes = {};
routes.users = require('./handlers/users.js');
/*
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if ('OPTIONS' == req.method){
        return res.send(200);
    }
    next();
});

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { console.log('Authentication validated!'); return next(res); }
  console.log('Not authenticated!');
  req.session.error = 'Please sign in!';
  res.redirect('/signin');
}
*/
//===============EXPRESS=================
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(session({secret: 'junglist', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

//===============ROUTES=================

// load the single view file (angular will handle the page changes on the front-end)
app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname + config.path }); 
});

//displays our signup page
app.get('/signin', function(req, res){
  res.render('signin');
});

//display all users
app.get('/api/:citystate/users', function(req, res){  
  var citystate = req.params.citystate;
  var query = req.query.search;
  var city = citystate.substr(0, citystate.length - 3);
  var state = citystate.substr(citystate.length - 2, 2);
  console.log("City, State, Search: " + city + ', ' + state.toUpperCase() + ', ' + query);
  
  //TODO ADD IS.AUTHENTICATED
  if (query !== undefined){
    routes.users.searchincity(city, state, query)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
    });
  } else {
    routes.users.showallusers(city, state)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
    });
  }
});
/*
app.get('/api/update', function(req, res){
  console.log("update triggered!");
    routes.users.bendupdate()
    .then(function(response){
      res.send(response).end();
    })
    .fail(function(err){
      res.send(err);
    });
});
*/
//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/local-reg', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);

// Setting the linkedin oauth routes
app.get('/auth/linkedin', routes.users.linkedin);

app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {// i should be verifying the state here to avoid csrf
    successRedirect: '/authsuccess',
    failureRedirect: '/authfail'
})); 

app.get('/authsuccess', function(req, res) {  
    res.sendFile('authsuccess.html', { root: __dirname + config.path + '/views/' });    
});

app.get('/authfail', function(req, res) {    
    res.sendFile('authfail.html', { root: __dirname + config.path + '/views/' });    
});

// experiment with linkedin authenticated call
app.get('/user/profile', function(req, res){
  passport.authenticate('linkedin', {
    state: req.query.state || 'none'
})(req, res);
});


//sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/login', passport.authenticate('local-signin', { 
  successRedirect: '/',
  failureRedirect: '/signin'
  })
);

app.get('/login', function(req, res){  
  res.redirect('#/login');  
});

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGING OUT " + req.user.username);
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

app.post('/sub', function(req, res){  
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
});

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

app.use("/", express.static(__dirname + config.path));
app.use("/public", express.static(__dirname + '/public'));

if (process.env.NODE_ENV !== "production") {  
  app.use("/bower_components", express.static(__dirname + "/bower_components"));  
  console.log("Development mode active");
} 

//===============PORT=================
var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");