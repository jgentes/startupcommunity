var config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db),
    jwt = require('jsonwebtoken'),    
    Q = require('q');
var TOKEN_EXPIRATION = 60;
var TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION * 60;

// Middleware for token verification
exports.verifyToken = function (req, res, next) {   
  console.log('verifytoken req.session:');
  console.log(req.session);
	var token = getToken(req.headers);
	console.log("VERIFYING TOKEN: " + token); 
	jwt.verify(token, config.secret, function(err, decoded) {
	  if (!err) {
	    console.log('TOKEN VALID: ' + token);	    
      db.get('tokens', req.user.email)
      .then(function (response) {
  		  if (response.body.token === token) {
  		    console.log('TOKEN VERIFIED');
  			  return res.send(401);
  		  }
  		  else {
  		    console.log('TOKEN MISMATCH');
  			  next();
  		  }
  	  })
  	  .fail(function(err) {
  	    console.log('TOKEN NOT FOUND IN DB!');
  	    console.log(err);
  		  return res.send(500);
  	  });
	  } else { 
	    console.log('TOKEN INVALID!'); 
	    console.log(err);
	    next();
	  }    
  });
};

exports.expireToken = function(headers) {
	var token = getToken(headers);
	
	if (token !== null) {
    	db.get('tokens', token)
        .then(function (result) {
            if (result.body.results.length > 0){
              var dbtoken = result.body.results[0].value;
              if (dbtoken.token == token){
                console.log("FOUND TOKEN: " + dbtoken);
                db.remove('tokens', result.body.results[0].path.key, true)
                .then(function () {
                  console.log("TOKEN REMOVED: " + dbtoken);                                    
                  deferred.resolve(dbtoken);          
                })
                .fail(function (err) {
                  console.log("REMOVE FAIL:");
                  console.log(err.body);
                  deferred.reject(new Error(err.body));          
                });
                
              }
            } else { 
              console.log('No existing token found!');
            }
    	
	    });
    }
};

exports.saveToken = function(key, token) {
	var deferred = Q.defer();
	console.log('SAVING TOKEN for ' + key);
	if (key !== null && token !== null) {
    	
  	db.put('tokens', key, {token: token})
    .then(function () {
      console.log("TOKEN UPDATED for " + key);                                    
      deferred.resolve(token);          
    })
    .fail(function (err) {
      console.log("TOKEN UPDATE FAIL:");
      console.log(err.body);
      deferred.reject(new Error(err.body));          
    });        	
  }    
    
  return deferred.promise;
};

var getToken = function(headers) {
  console.log('GETTING TOKEN FROM HEADERS:');
  console.log(headers);
	if (headers && headers.authorization) {
		var authorization = headers.authorization;
		var part = authorization.split(' ');
    console.log('AUTHORIZATION: ' + part);
		if (part.length == 2) {
			var token = part[1];

			return part[1];
		}
		else {
			return null;
		}
	}
	else {
		return null;
	}
};

exports.TOKEN_EXPIRATION = TOKEN_EXPIRATION;
exports.TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION_SEC;