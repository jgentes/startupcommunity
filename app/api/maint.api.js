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
        startkey = 0,
        limit = 50,
        userlist = [],
        collection = 'communities';

    function getList(startkey, userlist, limit) {
        db.newSearchBuilder()
            .collection(collection)
            .limit(limit)
            .offset(startkey)
            .query('(@value.roles.*.*%20*: *) OR (@value.communities: *%20*)')
            .then(function(data){
                var item;
                for (item in data.body.results) {

                    var user = data.body.results[item].value,
                        change = false;

                    if (user.communities) {
                        for (c in user.communities) {
                            user.communities[c] = user.communities[c].replace('%20', '-');
                            change = true;
                        }
                    }

                    if (user.roles) {
                        for (r in user.roles) {
                            for (h in user.roles[r]) {
                                user.roles[r][h.replace('%20', '-')] = user.roles[r][h];
                                delete user.roles[r][h];
                                change = true;
                            }
                        }
                    }

                    if (change) {
                        console.log('Updating record..');
                        console.log(data.body.results[item].path.key);
                        //console.log(newdata);

                        // IMPORTANT! TEST FIRST BY COMMENTING OUT BELOW..
                        // ALSO BE CAREFUL TO NOT PULL FROM -DEV AND PUT INTO PRODUCTION DB!!
                        db.put(collection, data.body.results[item].path.key, user);
                    }



                }

                /*console.log('Job done!');
                res.end();*/

                if (data.body.next) {
                    startKey = startkey + limit;
                    console.log('Getting next group..' + startkey);
                    getList(startkey, userlist, limit);
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
        getList(startkey, userlist, limit);
    }
}

module.exports = MaintApi;