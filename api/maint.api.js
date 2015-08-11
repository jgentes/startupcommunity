var config = require('../config.json')[process.env.NODE_ENV || 'development'],
    db = require('orchestrate')(config.db.key);

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
        userlist = [];

    function getList(startKey, userlist, limit) {
        db.newSearchBuilder()
            .collection(config.db.collections.users)
            .limit(limit)
            .offset(startKey)
            .query('type: "user"')
            .then(function(data){
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
                     "advisor": ["bend-or"]
                     }
                     }
                     };

                     if (data.body.results[item].value.cities) delete data.body.results[item].value.cities;
                     if (data.body.results[item].value.beta) delete data.body.results[item].value.beta;
                     if (data.body.results[item].value.name) delete data.body.results[item].value.name;
                     if (data.body.results[item].value.email) delete data.body.results[item].value.email;
                     if (data.body.results[item].value.avatar) delete data.body.results[item].value.avatar;
                     if (data.body.results[item].value.linkedin) delete data.body.results[item].value.linkedin;
                     */

                    var newdata = data.body.results[item].value; // get current record

                    //newdata.communities = ["bend-or", "oregon", "us", "edco-stable-of-experts"];
                    //newdata.roles = { "advisor" : { "edco-stable-of-experts": ["bend-or"], "bend-or": []}};
                    newdata.profile["home"] = "bend-or";

                    console.log('Updating record..');
                    console.log(data.body.results[item].path.key);
                    console.log(newdata);
                    db.put('communities-dev', data.body.results[item].path.key, newdata);
                }

                if (data.body.next) {
                    startKey = startKey + limit;
                    console.log('Getting next group..' + startKey);
                    getList(startKey, userlist, limit);
                } else {
                    console.log('Job done!' + userlist.length);
                    res.end();
                    /*
                     for (var user in userlist) {
                     console.log('Updating ' + userlist[user].value.name);
                     db.put(config.db.collections.users, userlist[user].path.key, userlist[user].value)
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