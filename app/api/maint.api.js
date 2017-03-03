var Cloudant = require('cloudant'),
  cloudant = Cloudant({
    account: process.env.DB_ACCOUNT,
    password: process.env.DB_PASSWORD,
    plugin: 'promises'
  }),
  cdb = cloudant.db.use(process.env.DB_COMMUNITIES),
  cdb_messages = cloudant.db.use(process.env.DB_MESSAGES),
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
            .query('@value.type: "user"')
            .then(function(data){
                var item;
                for (item in data.body.results) {
                    var change = false;

                    var user = data.body.results[item].value;


                    if (user.profile.linkedin) {
                        if (user.profile.linkedin.summary && !user.profile.summary) {
                            user.profile['summary'] = user.profile.linkedin.summary;
                            change = true;
                        }
                        if (user.profile.linkedin.headline && !user.profile.headline) {
                            user.profile['headline'] = user.profile.linkedin.headline;
                            change = true;
                        }
                        if (user.profile.linkedin.pictureUrl && !user.profile.avatar) {
                            user.profile['avatar'] = user.profile.linkedin.pictureUrl;
                            change = true;
                        }

                    }
                    
                    // IMPORTANT! TEST FIRST BY COMMENTING OUT BELOW..
                    // ALSO BE CAREFUL TO NOT PULL FROM -DEV AND PUT INTO PRODUCTION DB!!
                    if (change) {                        
                        console.log('Updating record..');
                        console.log(data.body.results[item].path.key);
                        //db.put(collection, data.body.results[item].path.key, user);
                    }



                }

                /*console.log('Job done!');
                res.end();*/

                if (data.body.next) {
                    startkey = startkey + limit;
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