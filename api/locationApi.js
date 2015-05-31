var config = require('../config.json')[process.env.NODE_ENV || 'development'],
  db = require('orchestrate')(config.db.key);

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var LocationApi = function() {
    this.getLocation = handleGetLocation;
};

var convert_state = function(name, to) {
    name = name.toUpperCase();
    var states = new Array(                         {'name':'Alabama', 'abbrev':'AL'},          {'name':'Alaska', 'abbrev':'AK'},
      {'name':'Arizona', 'abbrev':'AZ'},          {'name':'Arkansas', 'abbrev':'AR'},         {'name':'California', 'abbrev':'CA'},
      {'name':'Colorado', 'abbrev':'CO'},         {'name':'Connecticut', 'abbrev':'CT'},      {'name':'Delaware', 'abbrev':'DE'},
      {'name':'Florida', 'abbrev':'FL'},          {'name':'Georgia', 'abbrev':'GA'},          {'name':'Hawaii', 'abbrev':'HI'},
      {'name':'Idaho', 'abbrev':'ID'},            {'name':'Illinois', 'abbrev':'IL'},         {'name':'Indiana', 'abbrev':'IN'},
      {'name':'Iowa', 'abbrev':'IA'},             {'name':'Kansas', 'abbrev':'KS'},           {'name':'Kentucky', 'abbrev':'KY'},
      {'name':'Louisiana', 'abbrev':'LA'},        {'name':'Maine', 'abbrev':'ME'},            {'name':'Maryland', 'abbrev':'MD'},
      {'name':'Massachusetts', 'abbrev':'MA'},    {'name':'Michigan', 'abbrev':'MI'},         {'name':'Minnesota', 'abbrev':'MN'},
      {'name':'Mississippi', 'abbrev':'MS'},      {'name':'Missouri', 'abbrev':'MO'},         {'name':'Montana', 'abbrev':'MT'},
      {'name':'Nebraska', 'abbrev':'NE'},         {'name':'Nevada', 'abbrev':'NV'},           {'name':'New Hampshire', 'abbrev':'NH'},
      {'name':'New Jersey', 'abbrev':'NJ'},       {'name':'New Mexico', 'abbrev':'NM'},       {'name':'New York', 'abbrev':'NY'},
      {'name':'North Carolina', 'abbrev':'NC'},   {'name':'North Dakota', 'abbrev':'ND'},     {'name':'Ohio', 'abbrev':'OH'},
      {'name':'Oklahoma', 'abbrev':'OK'},         {'name':'Oregon', 'abbrev':'OR'},           {'name':'Pennsylvania', 'abbrev':'PA'},
      {'name':'Rhode Island', 'abbrev':'RI'},     {'name':'South Carolina', 'abbrev':'SC'},   {'name':'South Dakota', 'abbrev':'SD'},
      {'name':'Tennessee', 'abbrev':'TN'},        {'name':'Texas', 'abbrev':'TX'},            {'name':'Utah', 'abbrev':'UT'},
      {'name':'Vermont', 'abbrev':'VT'},          {'name':'Virginia', 'abbrev':'VA'},         {'name':'Washington', 'abbrev':'WA'},
      {'name':'West Virginia', 'abbrev':'WV'},    {'name':'Wisconsin', 'abbrev':'WI'},        {'name':'Wyoming', 'abbrev':'WY'}
    );
    var returnthis = false;
    for (var i=0; i < states.length; i++) {
        if (to == 'name') {
            if (states[i].abbrev == name){
                returnthis = states[i].name;
                break;
            }
        } else if (to == 'abbrev') {
            if (states[i].name.toUpperCase() == name){
                returnthis = states[i].abbrev;
                break;
            }
        }
    }
    return returnthis;
};

function handleGetLocation(req, res) { //TODO IS THIS GETCOMMUNITY?
    var location = req.params.location;
    db.search(config.db.collections.communities, '@path,key: ' + location + ' OR communities.*.' + location + '.*:*')
      .then(function (result){ //TODO ITERATE THROUGH RESULTS TO EXTRACT NETWORKS, INDUSTRIES, ETC, ALLOW FOR PAGING! Also finish global.city find
          console.log('Result of db search: ' + result.body.total_count);
          if (result.body.results.length > 0){
              if (result.body.results[0].value.linkedin.id == linkedinuser.linkedin.id){
                  console.log('Found location: ' + response.body.profile.city + ', ' + response.body.profile.state);
                  var newresponse = {
                      "path": {
                          "key": location
                      },
                      "value": response.body
                  };
                  res.status(200).send(newresponse);
              } else {
                  console.warn('Location not found!');
                  res.status(401).send({ message: 'Location not found.' });
              }
          } else {
              console.log('No existing linkedin user found!');
              db.post(config.db.collections.users, linkedinuser)
                .then(function () {
                    console.log("REGISTERED: " + linkedinuser.email);
                    pullcallback({ "status": 200, "data": linkedinuser });
                })
                .fail(function (err) {
                    console.error("PUT FAIL:");
                    console.error(err);
                });
          }
      })
      .fail(function (result) {
          console.error("SEARCH FAIL! " + JSON.stringify(linkedinuser));
          console.error(result);
      });
}

module.exports = LocationApi;