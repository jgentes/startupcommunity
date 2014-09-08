//===============DEPENDENCIES=================

var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    logger = require('morgan'),
    request = require('request'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    LinkedInStrategy = require('passport-linkedin-oauth2').Strategy,
    mcapi = require('mailchimp-api/mailchimp');

var config = require('./config.json')[process.env.NODE_ENV || 'development'],
    users = require('./server/users.js');

var app = express();

var mc = new mcapi.Mailchimp(config.mailchimp);

//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("deserializing " + obj.username);  
  done(null, obj);
});

// Use the LocalStrategy within Passport to login users.
passport.use('local-signin', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    users.localAuth(username, password)
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
    users.localReg(username, password)
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
          avatar: profile._json.pictureUrl || ''          
        };
    
    
    var getlinkedinprofile = function(url, email) {
      request.get(
        'https://api.linkedin.com/v1/people/url=' + querystring.escape(url) + ':(id,first-name,last-name,picture-url;secure=true,headline,summary,public-profile-url)' + '?oauth2_access_token=' + accessToken + '&format=json',
        function(error, response, body) {
          var newbody = JSON.parse(body);
          if (newbody.id !== undefined) {
            var linkedinuser = {
              name: newbody.firstName + ' ' + newbody.lastName,
              email: email,
              username: email,
              linkedin: newbody,
              avatar: newbody.pictureUrl || ''
            };
            console.log('LINKEDIN USER:');
            console.log(linkedinuser);
            users.linkedinPull(linkedinuser)
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
    // QUERY STATE IS SETUP ONLY TO TRIGGER PULL FOR LINKEDIN PROFILES
    console.log('Query State: ' + req.query.state);
    if (req.query.state !== 'none') { 
      
      var userlist = [{ url: 'http://www.linkedin.com/pub/paul-abbott/2/3a5/4b1', email: 'Paulabbott9@hotmail.com' },{ url: 'http://www.linkedin.com/in/scottallan', email: 'scott@hydroflask.com' },{ url: 'http://www.linkedin.com/in/dianegallen', email: '' },{ url: 'http://www.linkedin.com/in/jeffarker', email: 'jeff@globaltradingpartners.com' },{ url: 'http://www.linkedin.com/pub/david-asson/86/540/5b9', email: 'dasson@ci.sisters.or.us' },{ url: 'http://www.linkedin.com/pub/john-barberich/64/582/994', email: 'barberichj@aol.com' },{ url: 'http://www.linkedin.com/pub/mark-beardsley/21/8a4/bb5', email: 'mark.beardsley@wellsfargo.com' },{ url: 'http://www.linkedin.com/pub/jay-bennett/8/1a9/9b8', email: '' },{ url: 'http://www.linkedin.com/pub/james-boeddeker/19/106/100', email: 'jimbo@bendbroadband.com' },{ url: 'http://www.linkedin.com/pub/brian-bouma/90/451/641', email: 'bbouma@me.com' },{ url: 'http://www.linkedin.com/pub/john-bradshaw/12/a2a/4b3', email: 'john.bradshaw@focusbankers.com' },{ url: 'http://www.linkedin.com/pub/jim-brennan/12/730/879', email: 'jbrennan353@gmail.com' },{ url: 'https://www.linkedin.com/pub/yvonne-burgess/b/70/1ba', email: 'yvonne@yburgess.com' },{ url: 'http://www.linkedin.com/in/patrickjburns', email: 'pburns@neoconassoc.com' },{ url: 'http://www.linkedin.com/pub/moe-carrick/2/88a/aa6', email: 'mcarrick@moementum.com' },{ url: 'http://www.linkedin.com/pub/bob-chamberlain/1/a31/439', email: 'bobchamberlain40@icloud.com' },{ url: 'http://www.linkedin.com/in/drewchild', email: 'drew.child@gmail.com' },{ url: 'http://www.linkedin.com/in/brucechurchill', email: '' },{ url: 'http://www.linkedin.com/pub/jim-coonan/3a/4b5/995', email: 'jcoonan@audiosource.net' },{ url: 'https://www.linkedin.com/in/stevecurley', email: 'steve@bluespacemarkets.com' },{ url: 'http://www.linkedin.com/in/evandickens', email: 'edickens@jrcpa.com' },{ url: 'http://www.linkedin.com/pub/sonja-donohue/a/222/582', email: 'sdonohue@bendbroadband.net' },{ url: 'http://www.linkedin.com/in/jerrydruliner', email: 'jdruliner@highdesertbeverage.com' },{ url: 'http://www.linkedin.com/in/lavoci', email: 'rob@finchamfinancial.com' },{ url: 'http://www.linkedin.com/pub/joe-franzi/0/920/395', email: 'jdfranzi@gmail.com' },{ url: 'http://www.linkedin.com/in/johnfurgurson', email: 'johnf@bnbranding.com' },{ url: 'http://www.linkedin.com/in/frankgoov', email: 'frank.h.goovaerts@gmail.com' },{ url: 'http://www.linkedin.com/pub/sandra-green/9/31/b35', email: 'sgreen@n-link.net' },{ url: 'http://au.linkedin.com/pub/ivan-hamilton/71/bb3/175', email: 'ivan@merisier-hamilton.com' },{ url: 'http://www.linkedin.com/in/samhandelman', email: 'sam@scsbend.com' },{ url: 'http://www.linkedin.com/pub/rita-hansen/5/72a/67', email: 'ritahansen@bendbroadband.com' },{ url: 'http://www.linkedin.com/in/lorieharrishancock', email: 'lorie@harrishancock.com' },{ url: 'http://www.linkedin.com/pub/heather-hepburn-hansen/52/b24/552', email: 'hepburn@bljlawyers.com' },{ url: 'http://www.linkedin.com/in/jherrick', email: 'john@herrickprodev.com' },{ url: 'http://www.linkedin.com/in/sheilinh', email: 'sheilin.herrick@gmail.com' },{ url: 'http://www.linkedin.com/pub/durlin-hickok/3/812/b42', email: 'dhickok@gmail.com' },{ url: 'http://www.linkedin.com/in/tonyhnyp', email: 'tonyh@ztllc.com' },{ url: 'http://www.linkedin.com/pub/steve-hockman/2b/5b0/6aa', email: 'shockman@steele-arch.com' },{ url: 'http://www.linkedin.com/pub/robert-hoffman-aia/26/583/213', email: 'bhoffman@inflectionpointadvisors.net' },{ url: 'http://www.linkedin.com/pub/alan-holzman/0/840/111', email: 'alan.holzman@gmail.com' },{ url: 'http://www.linkedin.com/pub/andrew-hunzicker/17/969/ba8', email: 'ahunzicker@me.com' },{ url: 'http://www.linkedin.com/in/execufeed', email: 'nextstep11@gmail.com' },{ url: 'http://www.linkedin.com/in/erknoc', email: 'erik@branderik.com' },{ url: 'http://www.linkedin.com/pub/simon-johnson/11/b87/980', email: 'smjones30@me.com' },{ url: 'http://www.linkedin.com/pub/sue-jones/38/81/455', email: '' },{ url: 'http://www.linkedin.com/in/brucejuhola', email: 'bruce.juhola@vistagechair.com' },{ url: 'http://www.linkedin.com/pub/karnopp-dennis/4/333/846', email: 'dck@karnopp.com' },{ url: 'http://www.linkedin.com/in/tocara', email: 'carakling@steppingstoneresources.com' },{ url: 'http://www.linkedin.com/pub/craig-ladkin/16/541/ab5', email: 'craig.ladkin@focusbankers.com' },{ url: 'http://www.linkedin.com/pub/greg-lambert/20/250/631', email: 'greg@midoregonpersonnel.com' },{ url: 'http://www.linkedin.com/in/robliv', email: 'robliv@gmail.com' },{ url: 'http://www.linkedin.com/pub/tom-loder/6/171/544', email: 'tloder@lodestartechnical.com' },{ url: 'http://www.linkedin.com/in/rluebke', email: 'rluebke@gmail.com' },{ url: 'http://www.linkedin.com/pub/les-mace/0/681/a53', email: 'les_mace@bendcable.com' },{ url: 'http://www.linkedin.com/pub/frank-maione/16/3b0/775', email: 'fmaione955@gmail.com' },{ url: 'https://www.linkedin.com/pub/mike-maloney/3/82a/a15', email: 'mcmaloney@interox.com' },{ url: 'http://www.linkedin.com/pub/kirk-mansberger/a/467/5b1', email: 'berger@bendbroadband.com' },{ url: 'https://www.linkedin.com/in/chrismaskill', email: 'chrismaskill@gmail.com' },{ url: 'http://www.linkedin.com/pub/susan-mcintosh/17/531/544', email: 'smcintosh@ykwc.net' },{ url: 'http://www.linkedin.com/pub/eric-meade/b/a6a/532', email: 'ericm@epusa.com' },{ url: 'http://www.linkedin.com/in/suemeyer', email: 'suemeyer@bendcable.com' },{ url: 'http://www.linkedin.com/pub/don-miller/33/a56/b72', email: 'jayhawkmiller@sbcglobal.net' },{ url: 'http://www.linkedin.com/pub/glenn-miller/60/284/a74', email: 'miller66@bendcable.com' },{ url: 'http://www.linkedin.com/pub/bill-montgomery/9/744/abb', email: 'williamd41@gmail.com' },{ url: 'http://www.linkedin.com/pub/bill-mooney/76/27a/a92', email: 'Mooney.bill@gmail.com' },{ url: 'http://www.linkedin.com/in/merryannmoore', email: 'merryannmoore@gmail.com' },{ url: 'http://www.linkedin.com/pub/jason-moyer/2/4b2/504', email: 'jason.moyer@cascadiangroup.us' },{ url: 'http://www.linkedin.com/pub/jon-napier/13/267/113', email: 'JJN@karnopp.com' },{ url: 'http://www.linkedin.com/pub/jim-ouchi/12/1a3/521', email: 'jouchi@esourcecoach.com' },{ url: 'http://www.linkedin.com/in/kathyoxborrow', email: 'kathy@oxborrowconsulting.com' },{ url: 'http://www.linkedin.com/pub/debbie-parigian-cpa/8/601/117', email: 'debbie@corporategrowthassoc.com' },{ url: 'http://www.linkedin.com/pub/alistair-paterson/13/946/a0b', email: 'alistair@alistairpaterson.com' },{ url: 'http://www.linkedin.com/in/louispepper', email: '' },{ url: 'https://www.linkedin.com/pub/anya-petersen-frey/9/913/882', email: 'anyafrey@gmail.com' },{ url: 'http://www.linkedin.com/pub/kathrin-platt/1a/252/929', email: 'kplatt@spencercrest.com' },{ url: 'http://www.linkedin.com/pub/jay-riker/5/65a/678', email: 'jariker@attglobal.net' },{ url: 'https://www.linkedin.com/pub/kate-ryan/6/291/b9', email: 'kate.ryanconsultinggroup@gmail.com' },{ url: 'http://www.linkedin.com/pub/jim-schell/10/17/a1b', email: 'smallbiz5@aol.com' },{ url: 'http://www.linkedin.com/pub/scott-schroeder/10/60b/586', email: 'scott@reliancecm.com' },{ url: 'http://www.linkedin.com/pub/andrea-sigetich/0/b0/490', email: 'andrea@sagecoach.com' },{ url: 'http://www.linkedin.com/pub/rick-silver/53/206/295', email: 'Silver4250@yahoo.com' },{ url: 'http://www.linkedin.com/pub/dave-slavensky/b/363/996', email: 'dave@earthcruiserusa.com' },{ url: 'http://www.linkedin.com/pub/caleb-stoddart/5/1b3/bb4', email: 'caleb@bendaccountants.com' },{ url: 'http://www.linkedin.com/pub/michael-story/7/686/955', email: 'story.mike@gmail.com' },{ url: 'http://www.linkedin.com/pub/dave-stowe/0/b61/71b', email: 'dave@ardellgroup.com' },{ url: 'http://www.linkedin.com/pub/david-svendsen/6a/b2/946', email: 'paul@axiavaluation.com' },{ url: 'http://www.linkedin.com/in/mtaus', email: 'michaeltaus@gmail.com' },{ url: 'http://www.linkedin.com/pub/mike-taylor/30/b70/7b2', email: 'miket@knccbend.com' },{ url: 'http://www.linkedin.com/pub/robert-thompson/4/804/887', email: 'robcthompson@live.com' },{ url: 'http://www.linkedin.com/in/jtompkin', email: 'jtompkin@pacbell.net' },{ url: 'https://www.linkedin.com/in/karenturnersrg', email: 'karen.turner@expresspros.com' },{ url: 'http://www.linkedin.com/pub/bill-valenti/1/5b3/38', email: 'valenti@bendbroadband.com' },{ url: 'http://www.linkedin.com/pub/jack-walker/38/2a5/876', email: 'walker@penfund.net' },{ url: 'http://www.linkedin.com/pub/scott-walley/10/2b4/b40', email: 'swalley@cwc-llp.com' },{ url: 'http://www.linkedin.com/pub/steven-webb/6/709/968', email: '' },{ url: 'http://www.linkedin.com/pub/steve-westberg-cpa-mba/11/67b/936', email: 'stevecpa@ymail.com' },{ url: 'http://www.linkedin.com/pub/bruce-willhite/84/729/795', email: 'bruce@unique-wire.com' },{ url: 'http://www.linkedin.com/in/jeffwitwer', email: 'jeffwitwer@yahoo.com' },{ url: 'http://www.linkedin.com/pub/jeff-wolfstone/9/3b4/520', email: 'WolfstoneJ@LanePowell.com' },{ url: 'http://www.linkedin.com/in/kermityensen', email: 'kermit.yensen@gmail.com' },{ url: 'http://www.linkedin.com/pub/jim-bednark/4/a24/99b', email: 'jrbednark@gmail.com' }
];
      for (var i=0; i < userlist.length; i++) {
        getlinkedinprofile(userlist[i].url, userlist[i].email);
      }
      
        //done(null, false);
    } else {
    
      users.linkedinAuth(req, accessToken, refreshToken, userprofile)
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
    users.searchincity(city, state, query)
    .then(function(userlist){
      res.send(userlist);
    })
    .fail(function(err){
      res.send(err);
    });
  } else {
    users.showallusers(city, state)
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
    users.bendupdate()
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
    state: req.query.state || 'none'
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

app.use("/", express.static(__dirname + config.path));
app.use("/public", express.static(__dirname + '/public'));

if (process.env.NODE_ENV !== "production") {  
  app.use("/bower_components", express.static(__dirname + "/bower_components"));
} 

//===============PORT=================
var port = process.env.PORT || 5000;
app.listen(port);
console.log("StartupCommunity.org ready!");