// for debugging
require('debug-trace')({ always: true, colors: { log: '32' } });
console.format = function(c) { return "[" + c.filename + ":" + c.getLineNumber() + "]"; };

var express = require('express'),
    enforce = require('express-sslify'),
    httpProxy = require('http-proxy'),
    blogProxy = httpProxy.createProxyServer(),
    config = require('./config.json')[process.env.NODE_ENV || 'local'],
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    logger = require('morgan'),
    nodalytics = require('nodalytics'),
    ghost = require('ghost'),
    parentApp = express();

var app = express();

// Some things must come before Body Parser

// Proxy for Ghost, which runs on different port
app.all("/blog*", function(req, res){
    blogProxy.web(req, res, { target: 'http://localhost:2368' });
});

// Restrict access to dev.startupcommunity.org
if (process.env.NODE_ENV === "development") {
  var wwwhisper = require('connect-wwwhisper');
  //app.use(wwwhisper());
}

// Order really matters here..!
app.disable('x-powered-by');
app.use(logger('dev'));
app.use(methodOverride());
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

// API ROUTE METHODS

var AuthApi = require('./api/auth.api.js'),
    auth = new AuthApi(),
    UserApi = require('./api/user.api.js'),
    userApis = new UserApi(),
    StartupApi = require('./api/startup.api.js'),
    startupApis = new StartupApi(),
    CommunityApi = require('./api/community.api.js'),
    communityApis = new CommunityApi(),
    AngelListApi = require('./api/angellist.api.js'),
    angellistApis = new AngelListApi(),
    MaintApi = require('./api/maint.api.js'),
    maint = new MaintApi();

// API
app.get('/api/1.0/:community/users', userApis.userSearch);
app.get('/api/1.0/city/:community', communityApis.getCommunity);
app.get('/api/1.0/profile', auth.ensureAuthenticated, userApis.getProfile);
app.get('/api/1.0/profile/getkey', auth.ensureAuthenticated, auth.createAPIToken);
app.get('/api/1.0/invitePerson', auth.ensureAuthenticated, userApis.invitePerson);
app.put('/api/1.0/profile/role', auth.ensureAuthenticated, userApis.setRole);
app.post('/api/1.0/profile/remove/:userid', auth.ensureAuthenticated, userApis.removeProfile);
app.post('/api/1.0/feedback', auth.ensureAuthenticated, userApis.feedback);

app.get('/api/1.1/key/:key', communityApis.getKey);
app.get('/api/1.1/users', userApis.userSearch);
app.get('/api/1.1/search', userApis.directSearch);
app.get('/api/1.1/community/:community', communityApis.getCommunity);
app.get('/api/1.1/angel/startups', angellistApis.getStartups);
app.get('/api/1.1/angel/startup', angellistApis.getStartup);
app.get('/api/1.1/profile', auth.ensureAuthenticated, userApis.getProfile); // must ensureAuth to send userid to getProfile
app.get('/api/1.1/profile/getkey', auth.ensureAuthenticated, auth.createAPIToken);
app.get('/api/1.1/invitePerson', auth.ensureAuthenticated, userApis.invitePerson);
app.put('/api/1.1/profile/role', auth.ensureAuthenticated, userApis.setRole);
app.post('/api/1.1/profile/remove/:userid', auth.ensureAuthenticated, userApis.removeProfile);
app.post('/api/1.1/feedback', auth.ensureAuthenticated, userApis.feedback);

app.get('/api/2.0/key/:key', communityApis.getKey);
app.get('/api/2.0/users', userApis.userSearch);
app.get('/api/2.0/search', userApis.directSearch);
app.get('/api/2.0/community/:community', communityApis.getCommunity);
app.get('/api/2.0/angel/startups', angellistApis.getStartups);
app.get('/api/2.0/angel/startup', angellistApis.getStartup);
app.get('/api/2.0/profile', auth.ensureAuthenticated, userApis.getProfile); // must ensureAuth to send userid to getProfile
app.get('/api/2.0/profile/getkey', auth.ensureAuthenticated, auth.createAPIToken);
app.get('/api/2.0/invitePerson', auth.ensureAuthenticated, userApis.invitePerson);
app.put('/api/2.0/profile/role', auth.ensureAuthenticated, userApis.setRole);
app.post('/api/2.0/profile/remove/:userid', auth.ensureAuthenticated, userApis.removeProfile);
app.post('/api/2.0/feedback', auth.ensureAuthenticated, userApis.feedback);
// new for 2.0
app.get('/api/2.0/startups', startupApis.startupSearch);
app.post('/api/2.0/contact', userApis.contactUser);

// Auth
app.get('/auth/unlink/:provider', auth.ensureAuthenticated, auth.unlink);
app.post('/auth/linkedin', auth.linkedin);
app.post('/auth/signup', auth.signup); //not currently used?
app.post('/auth/login', auth.login); //not currently used?

// Maintenance
app.get('/api/1.1/maint', maint.maintenance);

// Client logger
app.post('/api/logger', function (req, res) {
    console.log('CLIENT ERROR:');
    console.log(req.body);
    res.end();
});

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
