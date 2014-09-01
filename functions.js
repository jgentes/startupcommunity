var bcrypt = require('bcryptjs'),
    Q = require('q'),
    config = require('./config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db); //config.db holds Orchestrate token

//used in local-signup strategy
exports.localReg = function (username, password) {
  var deferred = Q.defer();
  var hash = bcrypt.hashSync(password, 8);
  var user = {
    "username": username,
    "password": hash,
    "avatar": "http://placepuppy.it/images/homepage/Beagle_puppy_6_weeks.JPG"
  };
  //check if username is already assigned in our database
  db.get('users', username)
  .then(function (result){ //case in which user already exists in db
    console.log('username already exists');
    deferred.resolve(false); //username already exists
  })
  .fail(function (result) {//case in which user does not already exist in db
      console.log(result.body);
      if (result.body.message == 'The requested items could not be found.'){
        console.log('Username is free for use');
        db.put('users', username, user)
        .then(function () {
          console.log("USER:");
          console.log(user);
          deferred.resolve(user);
        })
        .fail(function (err) {
          console.log("PUT FAIL:" + err.body);
          deferred.reject(new Error(err.body));
        });
      } else {
        deferred.reject(new Error(result.body));
      }
  });

  return deferred.promise;
};


//check if user exists
    //if user exists check if passwords match (use bcrypt.compareSync(password, hash); // true where 'hash' is password in DB)
      //if password matches take into website
  //if user doesn't exist or password doesn't match tell them it failed
exports.localAuth = function (username, password) {
  var deferred = Q.defer();

  db.get('users', username)
  .then(function (result){
    console.log("FOUND USER");
    var hash = result.body.password;
    console.log(hash);
    console.log(bcrypt.compareSync(password, hash));
    if (bcrypt.compareSync(password, hash)) {
      deferred.resolve(result.body);
    } else {
      console.log("PASSWORDS NOT MATCH");
      deferred.resolve(false);
    }
  }).fail(function (err){
    if (err.body.message == 'The requested items could not be found.'){
          console.log("COULD NOT FIND USER IN DB FOR SIGNIN");
          deferred.resolve(false);
    } else {
      deferred.reject(new Error(err));
    }
  });

  return deferred.promise;
};

exports.linkedinAuth = function (req, accessToken, refreshToken, userprofile) {
  var deferred = Q.defer();
  //console.log(userprofile);
  
  db.search('users', 'value.linkedin.id: "' + userprofile.linkedin.id + '"')
  .then(function (result){
    //console.log('Result of db search:');
    //console.log(result.body.results);
    if (result.body.results.length > 0){
      if (result.body.results[0].value.linkedin.id == userprofile.linkedin.id){
        console.log("FOUND USER: " + userprofile.name);
        db.post('users', result.body.results[0].path.key, userprofile)
        .then(function () {
          console.log("PROFILE UPDATED: " + userprofile.username);
          //console.log(user);
          deferred.resolve(userprofile);
        })
        .fail(function (err) {
          console.log("PUT FAIL:" + err.body);
         deferred.reject(new Error(err.body));
        });
        
      }
    } else { 
      console.log('No existing linkedin user found!');
      db.post('users', userprofile)
        .then(function () {
          console.log("REGISTERED: " + userprofile.username);
          //console.log(user);
          deferred.resolve(userprofile);
        })
        .fail(function (err) {
          console.log("PUT FAIL:" + err.body);
         deferred.reject(new Error(err.body));
        });
    }
  }).fail(function (result) {//case in which user does not already exist in db
      deferred.reject(new Error(result.body));
  });
  
  return deferred.promise;
};

exports.linkedinPull = function (linkedinuser) {
  var deferred = Q.defer();
  
  //console.log('STARTING LINKEDINPULL');
  //console.log(linkedinuser);
  
  db.search('users', 'value.linkedin.publicProfileUrl: "' + linkedinuser.linkedin.publicProfileUrl + '"')
  .then(function (result){
    console.log('Result of db search:');
    console.log(result.body.results);
    if (result.body.results.length > 0){
      if (result.body.results[0].value.linkedin.id == linkedinuser.linkedin.id){
        console.log("FOUND USER: " + linkedinuser.name);
        db.put('users', result.body.results[0].path.key, linkedinuser, result.body.results[0].path.ref)
        .then(function () {
          console.log("PROFILE UPDATED: " + linkedinuser.username);
          deferred.resolve(linkedinuser);
        })
        .fail(function (err) {
          console.log("PUT FAIL:");
          console.log(err.body);
         deferred.reject(new Error(err.body));
        });
        
      }
    } else { 
      console.log('No existing linkedin user found!');
      db.post('users', linkedinuser)
      .then(function () {
        console.log("REGISTERED: " + linkedinuser.username);
        deferred.resolve(linkedinuser);
      })
      .fail(function (err) {
        console.log("FAIL:" + err.body);
       deferred.reject(new Error(err.body));
      });
    }
  })
  .fail(function (result) {
    console.log("SEARCH FAIL: ");
    console.log(result.body);
    deferred.reject(new Error(result.body));
  });
  
  return deferred.promise;
};


exports.showallusers = function(){
  var deferred = Q.defer();
  //TODO ADD IS.AUTHENTICATED (HERE OR IN THE ROUTE?)
  db.list('users', {limit:50})
  .then(function(result){
    for (var i=0; i < result.body.results.length; i++) {
      delete result.body.results[i].path.collection;
      delete result.body.results[i].value.password;
    }
    deferred.resolve(result.body);
  })
  .fail(function(err){
    deferred.reject(new Error(err.body));
  });
 
  return deferred.promise;
  
};

exports.search = function(query){
  var deferred = Q.defer();
  //TODO ADD IS.AUTHENTICATED (HERE OR IN THE ROUTE?)
  db.search('users', query)
  .then(function(result){
    for (var i=0; i < result.body.results.length; i++) {
      delete result.body.results[i].path.collection;
      delete result.body.results[i].value.password;
    }
    deferred.resolve(result.body);
  })
  .fail(function(err){
    deferred.reject(new Error(err.body));
  });
 
  return deferred.promise;
  
};

