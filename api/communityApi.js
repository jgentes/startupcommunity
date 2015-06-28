var config = require('../config.json')[process.env.NODE_ENV || 'development'],
  db = require('orchestrate')(config.db.key);
//request = require('request');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function() {
    this.getCommunity = handleGetCommunity;
    this.getActivity = handleGetActivity;
    this.getKey = handleGetKey;
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

function handleGetActivity(req, res) {
    var keys = req.query.keys;
    var searchString = '@path.key: (';

    for (var i in keys) {

        if (i > 0) {
            searchString += ' OR ';
        }
        searchString += keys[i];
    }

    searchString += ') AND NOT type:user';

    function pullActivity() {
        var startKey = 0;

        db.newSearchBuilder()
            .collection(config.db.collections.communities)
            .limit(100)
            .offset(startKey)
            .query(searchString)
            .then(function (result) {
                var newresponse = {};

                if (result.body.results.length > 0) {
                    for (var item in result.body.results) {
                        newresponse[result.body.results[item].path.key] = result.body.results[item].value;
                        result.body.results[item].value["key"] = result.body.results[item].path.key;
                    }
                    res.status(200).send(newresponse);
                } else {
                    console.warn('No keys found!');
                    res.status(400).send({message: 'Keys not found.'});
                }
            })
            .fail(function(err){
                console.log("SEARCH FAIL:");
                console.log(err);
                res.status(400).send({ message: 'Something went wrong: ' + err});
            });
    }

    console.log('Pulling Activity: ' + keys);
    pullActivity();
}

function handleGetCommunity(req, res) {
    var community = req.params.community,
        location = req.query.location;

    var searchString = '@path.key: ' + (community || location); // grab the primary community object

    if (location && community)
    {
        searchString += ' OR (communities.*' + location + '.' + community + '.*:*)'; // grab anything associated with this community in this location
    } else {
        searchString += ' OR (communities.*' + community + '.*:*)'; // grab anything in this location
    }

    searchString += ' AND NOT (type:startup OR type:user)'

    function pullCommunity() {
        var startKey = 0;

        db.newSearchBuilder()
          .collection(config.db.collections.communities)
          .limit(100)
          .offset(startKey)
          .query(searchString)
          .then(function (result) {
                var newresponse = {};
              if (result.body.results.length > 0) {
                  for (item in result.body.results) {
                      newresponse[result.body.results[item].path.key] = result.body.results[item].value;
                  }
                  res.status(200).send(newresponse);
              } else {
                  console.warn('Community not found!');
                  res.status(400).send({message: 'Community not found.'});
              }
          })
          .fail(function(err){
              console.log("SEARCH FAIL:");
                console.warn(err);
              res.status(400).send({ message: 'Something went wrong: ' + err});
          });
    }

    console.log('Pulling ' + community);
    pullCommunity();

}

function handleGetKey(req, res) {
    console.log('pulling ' + req.params.key);

    function pullKey() {
        db.get(config.db.collections.communities, req.params.key)
            .then(function (result) {
                if (result.statusCode == 200) {
                    result.body["key"] = req.params.key;
                    res.status(200).send(result.body);
                } else {
                    console.warn('Key not found!');
                    res.status(400).send({message: 'Key not found.'});
                }
            })
            .fail(function(err){ //todo SEND TO 404 SCREEN DUE TO NO ROUTE
                console.log("SEARCH FAIL:");
                console.warn(err);
                res.status(400).send({ message: 'Something went wrong: ' + err});
            });
    }

    pullKey();
}

module.exports = CommunityApi;