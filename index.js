//===============DEPENDENCIES=================

var express = require('express'),
    bodyParser = require('body-parser'),    
    methodOverride = require('method-override'),    
    //session = require('express-session'),
    logger = require('morgan'),    
    //passport = require('passport'),
    request = require('request'),
    jwt = require('jwt-simple'),    
    mcapi = require('mailchimp-api/mailchimp');

var config = require('./config.json')[process.env.NODE_ENV || 'development'];

var app = express();

var mc = new mcapi.Mailchimp(config.mailchimp);

var routes = {};
routes.users = require('./handlers/users.js');


//===============EXPRESS================= // Order really matters here..!
//require('request-debug')(request); // Very useful for debugging oauth and api req/res
//app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//app.use(session({secret: config.token_secret, key: 'user', cookie: { maxAge: 60000, secure: false, httpOnly: false }, resave: true, saveUninitialized: true}));
//app.use(session({secret: config.token_secret, resave: true, saveUninitialized: true}));

app.use("/", express.static(__dirname + config.path));
app.use("/public", express.static(__dirname + '/public'));

if (process.env.NODE_ENV !== "production") {  
  app.use("/bower_components", express.static(__dirname + "/bower_components"));  
  console.log("Development mode active");
} 

//===============ROUTES=================

// load the single view file (angular will handle the page changes on the front-end)
app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname + config.path }); 
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

// experiment with linkedin authenticated call
app.get('/user/profile', function(req, res){
  passport.authenticate('linkedin', {
    state: req.query.state || 'none'
})(req, res);
});
*/
app.get('/login', function(req, res){  
 res.redirect('#/login');  
});

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGING OUT " + req.user.username);
  req.logout();
  res.redirect('/');
  //req.session.notice = "You have successfully been logged out " + name + "!";
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
/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function ensureAuthenticated(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }

  var token = req.headers.authorization.split(' ')[1];
  var payload = jwt.decode(token, config.token_secret);

  if (payload.exp <= Date.now()) {
    return res.status(401).send({ message: 'Token has expired' });
  }

  req.user = payload.sub;
  next();
}


app.post('/auth/linkedin', routes.users.linkedin);


app.get('/auth/unlink/:provider', ensureAuthenticated, routes.users.unlink);

//===============PORT=================
var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");