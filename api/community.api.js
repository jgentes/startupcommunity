var config = require('../config.json')[process.env.NODE_ENV || 'development'],
  db = require('orchestrate')(config.db.key);
//request = require('request');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var CommunityApi = function() {
    this.getCommunity = handleGetCommunity;
    this.setCommunity = handleSetCommunity;
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

function handleGetCommunity(req, res) {
    var community = req.params.community;

    var searchString = '@path.key: ' + community; // grab the primary community object, don't use parens here
    searchString += ' OR ((communities: "' + community + '"'; // + grab anything associated with this community in this location
    searchString += ' OR parents: "' + community + '")'; // + grab anything associated with this community as a parent
    searchString += ' AND NOT type:("startup" OR "user"))'; // exclude startups and users

    function pullCommunity() {

        db.newSearchBuilder()
          .collection(config.db.communities)
          .limit(100)
          .offset(0)
          .query(searchString)
          .then(function (result) {
                var newresponse = {};

                var finalize = function(results) {
                    for (item in results) {
                        newresponse[results[item].path.key] = results[item].value;
                        newresponse[results[item].path.key]["key"] = results[item].path.key;
                    }
                    newresponse["key"] = community;
                    res.status(200).send(newresponse);
                };

                if (result.body.results.length > 0) {
                    for (comm in result.body.results) {
                        if (result.body.results[comm].path.key == community) {
                            if (result.body.results[comm].value.type == "user" || result.body.results[comm].value.type == "startup" || result.body.results[comm].value.type == "network") { // user contains communities within record
                                console.log('Pulling community for ' + result.body.results[comm].value.profile.name);
                                var comm_items = result.body.results[comm].value.communities;
                                var search = community + " OR ";
                                for (i in comm_items) {
                                    if (i > 0) {
                                        search += ' OR ';
                                    }
                                    search += comm_items[i];
                                }

                                db.newSearchBuilder()
                                    .collection(config.db.communities)
                                    .limit(100)
                                    .offset(0)
                                    .query("@path.key: (" + search + ")")
                                    .then(function (result) {
                                        finalize(result.body.results);
                                    })

                            } else finalize(result.body.results);
                        }
                    }
              } else {
                  console.warn('WARNING: Community not found!');
                  res.status(404).send({message: 'Community not found.'});
              }
          })
          .fail(function(err){
              console.log("SEARCH FAIL:");
                console.warn(err);
              res.status(202).send({ message: 'Something went wrong: ' + err});
          });
    }

    console.log('Pulling community: ' + community);
    pullCommunity();

}

function handleSetCommunity(req, res) {

    // always use ensureAuth before this (to acquire req.user)
    var settings = req.body.params;

    console.log('Updating settings for ' + settings.location_key + ' / ' + settings.community_key);
    console.log(req.user.value.roles.leader);

    // validate user has leader role within the location/community
    if (req.user.value.roles.leader[settings.community_key] && req.user.value.roles.leader[settings.community_key].indexOf(settings.location_key) > -1) {
        // update the community
        db.get(config.db.communities, settings.community_key)
            .then(function (response) {
                if (response.body.type == 'industry') { // use community_profiles
                    if (response.body.community_profiles === undefined) { // create community_profiles
                        response.body['community_profiles'] = {};
                    }
                    if (response.body.community_profiles[settings.location_key] === undefined) { // create this location
                        response.body.community_profiles[settings.location_key] = {
                            "name": response.body.profile.name,
                            "icon": response.body.profile.icon,
                            "logo": response.body.profile.logo,
                            "embed" : settings.embed
                        };
                    } else {
                        response.body.community_profiles[settings.location_key]["embed"] = settings.embed;
                    }
                } else response.body.profile["embed"] = settings.embed;

                db.put(config.db.communities, settings.community_key, response.body)
                    .then(function (finalres) {
                        res.status(201).send({ message: 'Community settings updated.'});
                    })
                    .fail(function (err) {
                        console.warn('WARNING:  Problem with put: ' + err);
                        res.status(202).send({ message: 'Something went wrong: ' + err});
                    });

            })
            .fail(function (err) {
                console.warn('WARNING:  Problem with get: ' + err);
                res.status(202).send({ message: 'Something went wrong: ' + err});
            });

    } else {
        console.warn("User is not a leader in location: " + settings.location_key + " and community: " + settings.community_key + "!");
        res.status(202).send({ message: 'Sorry, you must be a Leader in this community to change these settings.' });
    }
}

function handleGetKey(req, res) {
    console.log('Pulling key: ' + req.params.key);

    function pullKey() {
        db.get(config.db.communities, req.params.key)
            .then(function (result) {
                if (result.statusCode == 200) {
                    result.body["key"] = req.params.key;
                    res.status(200).send(result.body);
                } else {
                    console.warn('WARNING: Key not found!');
                    res.status(202).send({message: 'Key not found.'});
                }
            })
            .fail(function(err){
                if (err.statusCode == 404) {
                    res.status(404).end();
                } else {
                    console.log("SEARCH FAIL:");
                    console.warn(err);
                    res.status(202).send({ message: 'Something went wrong: ' + err});
                }
            });
    }

    pullKey();
}

module.exports = CommunityApi;