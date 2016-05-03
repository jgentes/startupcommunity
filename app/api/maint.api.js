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
        collection = 'communities-dev';

    function getList(startkey, userlist, limit) {
        db.newSearchBuilder()
            .collection(collection)
            .limit(limit)
            .offset(startkey)
            .query('@path.key: *%20*')
            .then(function(data){
                var item;
                for (item in data.body.results) {
                    var change = false;

                    var network = data.body.results[item].value;


                    if (data.body.results[item].path.key.indexOf('%20') > -1) {
                        console.log(data.body.results[item].path.key);
                        var key = data.body.results[item].path.key.replace(/%20/g, '-');
                        console.log('Updating record..');

                        change = true;
                    }
                    //db.put(collection, key, network);
                    // IMPORTANT! TEST FIRST BY COMMENTING OUT BELOW..
                    // ALSO BE CAREFUL TO NOT PULL FROM -DEV AND PUT INTO PRODUCTION DB!!



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