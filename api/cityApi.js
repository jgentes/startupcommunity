var config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CityApi = function() {
  this.getCity = handleGetCity;
};
  

/*
 |--------------------------------------------------------------------------
 | Internal functions
 |--------------------------------------------------------------------------
 */

var schema = {
  city: function() {
    return {
      "citystate": "Bend, OR",
    	"uri": "bend",
    	"clusters": [
    		"Tech"
    	]
    };
  }
};

function handleGetCity(req, res) {
  db.newSearchBuilder()
    .collection('cities')
    .limit(1)
    .query('value.citystate: "' + req.param.citystate + '"')
    .then(function(city){
      if (city.body.results.length > 0) {
        console.log('Found city: ' + city.body.results[0].value.citystate);
        res.send(city.body.results[0]);
      } else {
        console.log('City not found.');
        return res.status(200).send({ message: 'City not found.' });
      }
    })
    .fail(function(err){
      console.log("SEARCH FAIL:" + err);
      res.status(401).send('Something went wrong: ' + err);
    }); 
}

module.exports = CityApi;