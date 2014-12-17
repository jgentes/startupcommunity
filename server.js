var express = require('express'),
    config = require('./config.json')[process.env.NODE_ENV || 'development'],
    api = require('./api/routes'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    logger = require('morgan'),
    UserApi = require('./api/userApi.js'),
    CityApi = require('./api/cityApi.js');

var app = express();

// Order really matters here..!
app.disable('x-powered-by');
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static(__dirname + config.path));
app.use("/public", express.static(__dirname + '/public'));
app.use("/assets", express.static(__dirname + config.path + '/assets'));
app.use("/scripts", express.static(__dirname + config.path + '/scripts'));
app.use("/views", express.static(__dirname + config.path + '/views'));

// for console log debugging
require('debug-trace')({ always: true, colors: { log: '32' } });
console.format = function(c) { return "[" + c.filename + ":" + c.getLineNumber() + "]"; };

if (process.env.NODE_ENV == "production" || process.env.NODE_ENV == "test") {    
    // production-only things go here 
} else { 
  app.use("/bower_components", express.static(__dirname + "/bower_components"));
  app.use(function(req, res, next) { // Force HTTPS
    var protocol = req.get('x-forwarded-proto');
    protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
  });
  
}

var routes = {
	userApi: new UserApi(),
	cityApi: new CityApi()
};

api.setup(app,routes);

app.use(function(req, res) {
  return res.redirect(req.protocol + '://' + req.get('Host') + '/#' + req.url);
});
/*
app.get('/[^\.]+$', function(req, res){
    res.sendFile("index.html", { root: __dirname + config.path });
});
*/
var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");