var express = require('express'),
    enforce = require('express-sslify'),
    config = require('./config.json')[process.env.NODE_ENV || 'development'],
    api = require('./api/routes'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    logger = require('morgan'),
    nodalytics = require('nodalytics'),
    UserApi = require('./api/userApi.js'),
    CityApi = require('./api/cityApi.js');

var app = express();

// for debugging
require('debug-trace')({ always: true, colors: { log: '32' } });
console.format = function(c) { return "[" + c.filename + ":" + c.getLineNumber() + "]"; };

// Order really matters here..!
app.disable('x-powered-by');
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static(__dirname + config.path));
app.use("/public", express.static(__dirname + '/public'));

if (process.env.NODE_ENV == "production") {
    // production-only things go here
    app.use(enforce.HTTPS(true));
    app.use(nodalytics('UA-58555092-2'));

    app.get('/*', function(req, res, next){
        res.sendFile("frontend.html", { root: __dirname + config.path });
    });

} else { 
    app.use("/bower_components", express.static(__dirname + "/bower_components"));



    var basicAuth = require('basic-auth');

    var auth = function (req, res, next) {
        function unauthorized(res) {
            res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
            return res.send(401);
        };

        var user = basicAuth(req);

        if (!user || !user.name || !user.pass) {
            return unauthorized(res);
        };

        if (user.name === 'james' && user.pass === 'Doctor64') {
            return next();
        } else {
            return unauthorized(res);
        };
    };

   app.get('/*', auth, function(req, res, next){
    res.sendFile("frontend.html", { root: __dirname + config.path });
   });

}

var routes = {
	userApi: new UserApi(),
	cityApi: new CityApi()
};

api.setup(app,routes);

var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");