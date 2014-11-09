var config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CityApi = function() {
  this.getCity = handleGetCity;
};
  
function handleGetCity(req, res) {
  var city = req.params.city;
  db.get('cities', city)
  .then(function(response){    
    if (response.body.code !== "items_not_found") {
      console.log('Found city: ' + response.body.citystate);
      var newresponse = {
        "path": {
          "key": city
        },
        "value": response.body
      };
      res.status(200).send(newresponse);
    } else {
      console.warn('City not found!');
      res.status(401).send({ message: 'City not found.' });
    }
  })
  .fail(function(err){
    console.warn("SEARCH FAIL:");
    console.warn(err);
    res.status(401).send('Something went wrong: ' + err);
  }); 
}

module.exports = CityApi;