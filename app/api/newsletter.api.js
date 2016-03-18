var jwt = require('jsonwebtoken'),
    db = require('orchestrate')(process.env.DB_KEY);

var NewsletterApi = function() {
    this.getPass = handleGetPass;
    this.getMembers = handleGetMembers;
};

function handleGetPass(req, res) {
    // create password
    try {
        var pass = jwt.sign(req.user, 'NewsletterSecretPasswordCryptoKey');
        res.status(201).send(pass);
    }
    catch (e) {
        res.status(202).send({ message: "Something went wrong: " + e});
        console.log('WARNING: ', e);
    }
}

function handleGetMembers(req, res) {
    console.log('setup newsletter');
    var location_key = req.body.location_key,
        network = req.body.network,
        brand_id = req.body.brand_id,
        list_id = req.body.list_id,
        getMembers,
        createCustomField,
        addSubscriberCSV,
        updateProfile;

    // pull user record

    db.get(process.env.DB_COMMUNITIES, req.user)
        .then(function(response) {

            if (response.body.code !== "items_not_found") {                

                getMembers(location_key, network, response.body)

            } else {
                console.warn('WARNING:  User not found.');
                res.status(204).send({ message: 'Your user record was not found.'})
            }

        })
        .fail(function(err){
            res.status(204).send({ message: err});
            console.warn("WARNING: ", err);
        });

    getMembers = function(location_key, network, user) {
        console.log('getting members: ' + location_key + ' / ' + network);

        var search;
        
        // verify user is a member of this network in this location
        var networks = user.roles.leader[network];

        if (!networks || (networks.indexOf(location_key) < 0)) {
            res.status(204).send({ message: 'You are not a leader of ' + network + ' in ' + location_key })
        } else {

            search = function (startKey, csv_data) {

                var searchstring = network + " AND (";
                for (l in networks) {
                    searchstring += '"' + networks[l] + '"';
                    if (l < (networks.length - 1)) {
                        searchstring += ' OR ';
                    } else searchstring += ')';
                }

                db.newSearchBuilder()
                    .collection(process.env.DB_COMMUNITIES)
                    .limit(100)
                    .offset(startKey)
                    .query('@value.communities: (' + searchstring + ') AND @value.type: "user"')
                    .then(function (data) {
                        var profile;
                        for (x in data.body.results) {
                            profile = data.body.results[x].value.profile;
                            if (profile.email) {
                                csv_data.push([profile.name, profile.email, profile.parents.length ? profile.parents.join(',') : null])
                            }
                        }

                        if (data.body.next) {
                            console.log('Getting next group..');
                            startKey = startKey + 100;
                            search(startKey, csv_data);
                        } else {
                            console.log('Job done!');
                            res.status(201).send(csv_data);
                        }

                    });
            };

            search(0, []); // initialize user search

        }
    };
}

module.exports = NewsletterApi;