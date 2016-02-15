// for debugging
require('debug-trace')({ always: true, colors: { log: '32' } });
console.format = function(c) { return "[" + c.filename + ":" + c.getLineNumber() + "]"; };

var express = require('express'),
    enforce = require('express-sslify'),
    httpProxy = require('http-proxy'),
    blogProxy = httpProxy.createProxyServer(),
    emailProxy = httpProxy.createProxyServer(),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    logger = require('morgan'),
    nodalytics = require('nodalytics'),
    ghost = require('ghost'),
    parentApp = express();

var app = express();

// Some things must come before Body Parser

// Restrict access to dev.startupcommunity.org
if (process.env.NODE_ENV === "development") {
    var wwwhisper = require('connect-wwwhisper');
    app.use(wwwhisper(false));
}

// change all www requests to non-www requests
function wwwRedirect(req, res, next) {
    if (req.headers.host.slice(0, 4) === 'www.') {
        var newHost = req.headers.host.slice(4);
        return res.redirect(301, req.protocol + '://' + newHost + req.originalUrl);
    }
    next();
}

app.set('trust proxy', true); // important for https
app.use(wwwRedirect);

// Proxy for Ghost, which runs on different port
app.all("/blog*", function(req, res){
    blogProxy.web(req, res, { target: 'http://localhost:2368' });
});

// Proxy for Email, which runs on /email
app.all("/email*", function(req, res){
    console.log(req.url);

    emailProxy.web(req, res, { target: 'http://ec2-52-33-123-128.us-west-2.compute.amazonaws.com' });
    //res.redirect('http://ec2-52-33-123-128.us-west-2.compute.amazonaws.com' + req.url)
});

// remove trailing slash
app.use(function(req, res, next) {
    if(req.url.substr(-1) == '/' && req.url.length > 1)
        res.redirect(301, req.url.slice(0, -1));
    else
        next();
});

var root = __dirname.substring(0, __dirname.lastIndexOf('/')) || __dirname.substring(0, __dirname.lastIndexOf('\\')); // returns /app for heroku [should replace with path.join(__dirname, '../../dir')]

// Order really matters here..!
app.disable('x-powered-by');
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static(root + process.env.SC_PATH));
app.use("/public", express.static(root + '/public'));


// Production environment

if (process.env.NODE_ENV === "production") {
    // production-only things go here
    app.use(enforce.HTTPS({ trustProtoHeader: true }));
    app.use(nodalytics('UA-58555092-2'));
} else {
    app.use("/bower_components", express.static(root + "/bower_components"));
    app.use("/build", express.static(root + "/build"));
}

// API ROUTE METHODS

var AuthApi = require(__dirname + '/api/auth.api.js'),
    auth = new AuthApi(),
    UserApi = require(__dirname + '/api/user.api.js'),
    userApis = new UserApi(),
    CompanyApi = require(__dirname + '/api/company.api.js'),
    companyApis = new CompanyApi(),
    CommunityApi = require(__dirname + '/api/community.api.js'),
    communityApis = new CommunityApi(),
    MessagesApi = require(__dirname + '/api/messages.api.js'),
    messagesApis = new MessagesApi(),
    AngelListApi = require(__dirname + '/api/angellist.api.js'),
    angellistApis = new AngelListApi(),
    MaintApi = require(__dirname + '/api/maint.api.js'),
    maint = new MaintApi();

// API

// LEGACY 2.0 (REMOVE AFTER JAN 1, 2016)
app.get('/api/2.0/key/:key', communityApis.getKey);
app.get('/api/2.0/users', userApis.userSearch);
app.get('/api/2.0/search', userApis.directSearch);
app.get('/api/2.0/community', communityApis.getCommunity);
app.get('/api/2.0/community/:community', communityApis.getCommunity);
app.get('/api/2.0/angel/startups', angellistApis.getStartups);
app.get('/api/2.0/angel/startup', angellistApis.getStartup);
app.get('/api/2.0/profile', auth.ensureAuthenticated, userApis.getProfile); // must ensureAuth to send userid to getProfile
app.get('/api/2.0/profile/getkey', auth.ensureAuthenticated, auth.createAPIToken);
app.post('/api/2.0/invite', auth.ensureAuthenticated, auth.inviteUser);
app.post('/api/2.0/feedback', auth.ensureAuthenticated, userApis.feedback);

// new for 2.0
app.get('/api/2.0/companies', companyApis.companySearch);
app.put('/api/2.0/settings', auth.ensureAuthenticated, communityApis.setCommunity);
app.post('/api/2.0/contact', userApis.contactUser);

app.get('/api/2.1/key/:key', communityApis.getKey);
app.get('/api/2.1/users', userApis.userSearch);
app.get('/api/2.1/search', userApis.directSearch);
app.get('/api/2.1/community', communityApis.getCommunity);
app.get('/api/2.1/community/:community', communityApis.getCommunity);
app.get('/api/2.1/angel/startups', angellistApis.getStartups);
app.get('/api/2.1/angel/startup', angellistApis.getStartup);
app.get('/api/2.1/profile', auth.ensureAuthenticated, userApis.getProfile); // must ensureAuth to send userid to getProfile
app.get('/api/2.1/profile/getkey', auth.ensureAuthenticated, auth.createAPIToken);
app.post('/api/2.1/invite', auth.ensureAuthenticated, auth.inviteUser);
app.post('/api/2.1/join', auth.inviteUser);
app.post('/api/2.1/feedback', auth.ensureAuthenticated, userApis.feedback);

// new for 2.0
app.get('/api/2.1/companies', companyApis.companySearch);
app.put('/api/2.1/settings', auth.ensureAuthenticated, communityApis.setCommunity);
app.post('/api/2.1/contact', userApis.contactUser);

// new for 2.1
app.post('/api/2.1/companies/add', auth.ensureAuthenticated, companyApis.addCompany);
app.post('/api/2.1/profile', auth.ensureAuthenticated, userApis.updateProfile);
app.get('/api/2.1/profile/url', auth.ensureAuthenticated, userApis.getProfileUrl);
app.get('/api/2.1/companies/url', auth.ensureAuthenticated, companyApis.getLogoUrl);
app.get('/api/2.1/angel/startups/search', angellistApis.searchStartups);
app.get('/api/2.1/community/:location_key/top', communityApis.getTop);
app.get('/api/2.1/community/:location_key/:community_key/top', communityApis.getTop);
app.post('/api/2.1/community/edit', auth.ensureAuthenticated, communityApis.editCommunity);
app.post('/api/2.1/community/delete', auth.ensureAuthenticated, communityApis.deleteCommunity);
app.post('/api/2.1/messages/add', auth.ensureAuthenticated, messagesApis.addMessage);

// new for 2.2
app.post('/api/2.1/remove', auth.ensureAuthenticated, userApis.removeCommunity);
app.post('/api/2.2/companies/delete', auth.ensureAuthenticated, companyApis.deleteCompany);

// Auth
app.post('/auth/linkedin', auth.linkedin);
app.get('/auth/helpToken', auth.ensureAuthenticated, auth.helpToken);
//app.post('/auth/signup', auth.signup); //not currently used?
//app.post('/auth/login', auth.login); //not currently used?

// Maintenance
app.get('/api/maint', maint.maintenance);

// Client logger
app.post('/api/logger', function (req, res) {
    console.warn('WARNING: Angular Error:', req.body);
    //opbeat.captureError(new Error('WARNING: Angular Error:', req.body));
    res.end();
});

// Frontend Homepage & Blog
app.get('/', function (req, res, next) {
  res.sendFile("frontend.html", {root: root + process.env.SC_PATH});
});

ghost({
  config: __dirname + '/frontend/ghost/config.js'
}).then(function (ghostServer) {
  parentApp.use('/blog', ghostServer.rootApp);

  ghostServer.start(parentApp);
});

// Backend App

app.get('/*', function (req, res, next) {
  res.sendFile("app.html", {root: root + process.env.SC_PATH});
});

var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");
