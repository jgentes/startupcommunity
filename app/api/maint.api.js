var db = require('orchestrate')(process.env.DB_KEY),
    knowtify = require('knowtify-node');

var MaintApi = function() {
    this.maintenance = handleMaintenance;
};

/*
 |--------------------------------------------------------------------------
 | Maintenance Tasks
 |--------------------------------------------------------------------------
 */


function handleMaintenance(res) {
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
            .query('@value.profile.parents: * AND @value.type: "company"')
            .then(function(data){
                var emails = [];
                for (var item in data.body.results) {
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

                    if (data.body.results[item].value.cities) delete data.body.results[item].value.cities;

                     */

                    if (data.body.results[item].value.profile.parents.length) {
                        console.log(data.body.results[item].value.profile.name);

                        /*if (data.body.results[item].value.profile.parents.indexOf('consumer%20goods') > -1) {
                            data.body.results[item].value.profile.parents.push('consumer-goods');
                            data.body.results[item].value.profile.parents.splice(data.body.results[item].value.profile.parents.indexOf('consumer%20goods'), 1);
                        }*/
                        for (p in data.body.results[item].value.profile.parents) {
                            data.body.results[item].value.profile.parents[p] = data.body.results[item].value.profile.parents[p].toLowerCase();

                        }

                        console.log('parent updated');
                    }

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

                    //console.log('Updating record..');
                    //console.log(data.body.results[item].path.key);
                    //console.log(newdata);

                    // IMPORTANT! TEST FIRST BY COMMENTING OUT BELOW..
                    // ALSO BE CAREFUL TO NOT PULL FROM -DEV AND PUT INTO PRODUCTION DB!!
                    //db.put(collection, data.body.results[item].path.key, data.body.results[item].value);
                }

                /*console.log('Job done!');
                res.end();*/

                if (data.body.next) {
                    startKey = startKey + limit;
                    console.log('Getting next group..' + startKey);
                    getList(startKey, userlist, limit);
                } else {
                    console.log('Job done!');
                    res.end();


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