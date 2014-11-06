var config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CityApi = function() {
  this.test = handleTest;
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
    		"Tech",
    		"Bio-Science"
    	]
    };
  }
};



module.exports = CityApi;