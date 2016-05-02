var db = require('orchestrate')(process.env.DB_KEY),
    path = require('path'),
    _ = require(path.join(__dirname, '../scripts/lodash40.js')),
    knowtify = require('knowtify-node');

var MaintApi = function() {
    this.maintenance = handleMaintenance;
};

/*
 |--------------------------------------------------------------------------
 | Maintenance Tasks
 |--------------------------------------------------------------------------
 */


function handleMaintenance(res, req) {
    var enabled = false,
        startKey = 0,
        limit = 50,
        userlist = [],
        collection = 'communities-dev';

    function getList(startKey, userlist, limit) {
        db.newSearchBuilder()
            .collection(collection)
            .limit(limit)
            .offset(startKey)
            .query('@value.type: "network"')
            .then(function(data){
                var item;
                for (item in data.body.results) {


                    // convert networks to resources '@value.resource:true'

                    var network = data.body.results[item].value;

                    network['resource'] = true;
                    network['resource_types'] = [];
                    network.type = 'company';

                    if (network.parents) {
                        network.profile['parents'] = network.parents;
                        delete network.parents;
                    } else network.profile['parents'] = network.profile.parents || [];

                    if (network.profile.description) {
                        network.profile['headline'] = network.profile.description;
                        delete network.profile.description;
                    } else network.profile['headline'] = network.profile.headline || "";

                    if (network.profile.logo) {
                        network.profile['avatar'] = network.profile.logo;
                        delete network.profile.logo;
                    } else network.profile['avatar'] = network.profile.avatar || "";

                    if (!network.profile.summary) network.profile['summary'] = "";

                    if (!network.profile.website) network.profile['website'] = "";

                    if (!network.profile.address) network.profile['address'] = {
                        street: "",
                        city: "",
                        state: ""
                    };

                    if (network.community_profiles) {
                        for (c in network.community_profiles) {
                            network.community_profiles[c]['parents'] = network.profile.parents || [];

                            if (network.community_profiles[c].description) {
                                network.community_profiles[c]['headline'] = network.community_profiles[c].description;
                                delete network.community_profiles[c].description;
                            } else network.community_profiles[c]['headline'] = network.community_profiles[c].headline || "";

                            if (network.community_profiles[c].logo) {
                                network.community_profiles[c]['avatar'] = network.community_profiles[c].logo;
                                delete network.community_profiles[c].logo;
                            } else network.community_profiles[c]['avatar'] = network.community_profiles[c].avatar || "";

                            if (!network.community_profiles[c].summary) network.community_profiles[c]['summary'] = "";

                            if (!network.community_profiles[c].website) network.community_profiles[c]['website'] = "";

                            if (!network.community_profiles[c].address) network.community_profiles[c]['address'] = {
                                street: "",
                                city: "",
                                state: ""
                            };

                        }
                    }

                    // END network conversion

                    //delete user.roles.founder['bend-or'];
                    //if (_.isEmpty(user.roles.founder)) delete user.roles.founder;

                    /*
                    var newdata = {
                        "type": "user",
                        "profile": {
                            "name": data.body.results[item].value.name,
                            "email": data.body.results[item].value.email,
                            "avatar": data.body.results[item].value.avatar,
                            "linkedin": data.body.results[item].value.linkedin
                        },
                        "communities": {
                            "edco-stable-of-experts": {
                                "mentor": ["bend-or"]
                            }
                        }
                    };



                    //for invites
                   /* if (data.body.results[item].value.invite_communities.indexOf("mentor-connect") > -1) {
                        data.body.results[item].value.invite_communities.splice(data.body.results[item].value.invite_communities.indexOf("mentor-connect"), 1);
                        if (data.body.results[item].value.invite_communities.indexOf("expert-connect") < 0) data.body.results[item].value.invite_communities.push("expert-connect");
                        console.log('replaced network', data.body.results[item].value.invite_communities)
                    }*/

                    // END CHANGE COMMUNITY


                    //newdata.type = "cluster";

                    /*if (newdata.roles && newdata.roles.advisor) {
                        console.log('update!');
                        newdata.roles["mentor"] = newdata.roles.advisor;
                        delete newdata.roles.advisor;
                        console.log(newdata.roles);
                    }*/


                    //newdata.communities = ["bend-or", "oregon", "us", "edco-stable-of-experts"];
                    //newdata.roles = { "mentor" : { "edco-stable-of-experts": ["bend-or"], "bend-or": ["bend-or"]}};
                    //newdata.profile["home"] = "bend-or";



                        console.log('Updating record..');
                        console.log(data.body.results[item].path.key);
                        //console.log(newdata);

                        // IMPORTANT! TEST FIRST BY COMMENTING OUT BELOW..
                        // ALSO BE CAREFUL TO NOT PULL FROM -DEV AND PUT INTO PRODUCTION DB!!
                        db.put(collection, data.body.results[item].path.key, network);


                }

                /*console.log('Job done!');
                res.end();*/

                if (data.body.next) {
                    startKey = startKey + limit;
                    console.log('Getting next group..' + startKey);
                    getList(startKey, userlist, limit);
                } else {
                    console.log('Job done!');
                    res.status(200).end();


                    /*
                     for (var user in userlist) {
                     console.log('Updating ' + userlist[user].value.name);
                     db.put(keys.db.collections.users, userlist[user].path.key, userlist[user].value)
                     .then(function(response) {
                     console.log('Record updated!');
                     });
                     }
                     */
                }


            });
    }

    if (enabled) {
        console.log('Starting maintenance..');
        getList(startKey, userlist, limit);
    }
}

module.exports = MaintApi;