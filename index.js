var express = require('express'),
    config = require('./config.json')[process.env.NODE_ENV || 'development'],
    routes = require('./routes'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    logger = require('morgan'),
    UserHandler = require('./handlers/users.js');

var app = express();

// Order really matters here..!
app.disable('x-powered-by');
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static(__dirname + config.path));
app.use("/public", express.static(__dirname + '/public'));
/*
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
    if ('OPTIONS' == req.method) {
    	res.send(200);
    }
    else {
    	next();
    }
}; 
*/
if (process.env.NODE_ENV !== "production") {  
  app.use("/bower_components", express.static(__dirname + "/bower_components"));
  app.use(function(req, res, next) { // Force HTTPS
    var protocol = req.get('x-forwarded-proto');
    protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
  });
} 

var handlers = {
	users: new UserHandler()
};

routes.setup(app,handlers);

var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");