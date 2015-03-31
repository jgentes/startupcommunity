// for debugging
require('newrelic');
require('debug-trace')({ always: true, colors: { log: '32' } });
console.format = function(c) { return "[" + c.filename + ":" + c.getLineNumber() + "]"; };

var express = require('express'),
    enforce = require('express-sslify'),
    httpProxy = require('http-proxy'),
    blogProxy = httpProxy.createProxyServer(),
    config = require('./config.json')[process.env.NODE_ENV || 'development'],
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    logger = require('morgan'),
    nodalytics = require('nodalytics'),
    UserApi = require('./api/userApi.js'),
    CityApi = require('./api/cityApi.js'),
    ghost = require('ghost'),
    parentApp = express();

var app = express();

// Order really matters here..!
app.disable('x-powered-by');
app.use(logger('dev'));
app.use(methodOverride());

// Some things must come before Body Parser
app.all("/blog*", function(req, res){
  blogProxy.web(req, res, { target: 'http://localhost:2368' });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static(__dirname + config.path));
app.use("/public", express.static(__dirname + '/public'));

if (process.env.NODE_ENV === "production") {
  // production-only things go here
  app.use(enforce.HTTPS(true));
  app.use(nodalytics('UA-58555092-2'));

} else {
  app.use("/bower_components", express.static(__dirname + "/bower_components"));
}

// Restrict access to dev.startupcommunity.org
if (process.env.NODE_ENV === "test") {
    var wwwhisper = require('connect-wwwhisper');
    app.use(wwwhisper());
}

// ROUTE METHODS
var userApi = new UserApi(),
    cityApi = new CityApi();

// API
app.get('/api/:city/users', userApi.userSearch);
app.get('/api/1.0/:city/users', userApi.userSearch);
app.get('/api/1.0/city/:city', cityApi.getCity);
app.get('/api/1.0/profile', userApi.ensureAuthenticated, userApi.getProfile);
app.get('/api/1.0/profile/getkey', userApi.ensureAuthenticated, userApi.createAPIToken);
app.get('/api/1.0/addPerson', userApi.ensureAuthenticated, userApi.addPerson);
app.put('/api/1.0/profile/role', userApi.ensureAuthenticated, userApi.setRole);
app.post('/api/1.0/profile/remove/:userid', userApi.ensureAuthenticated, userApi.removeProfile);
app.post('/api/1.0/feedback', userApi.ensureAuthenticated, userApi.feedback);

// Auth
app.get('/auth/unlink/:provider', userApi.ensureAuthenticated, userApi.unlink);
app.post('/auth/linkedin', userApi.linkedin);
app.post('/auth/signup', userApi.signup);
app.post('/auth/login', userApi.login);

// Maintenance
app.get('/api/1.0/maint', userApi.maintenance);

// Frontend Homepage & Blog
app.get('/', function (req, res, next) {
  res.sendFile("frontend.html", {root: __dirname + config.path});
});

ghost({
  config: __dirname + '/app/frontend/ghost/config.js'
}).then(function (ghostServer) {
  parentApp.use('/blog', ghostServer.rootApp);

  ghostServer.start(parentApp);
});

// Backend App
app.get('/*', function (req, res, next) {
  res.sendFile("app.html", {root: __dirname + config.path});
});

var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");
