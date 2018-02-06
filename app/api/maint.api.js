var path = require('path'),
  {db, cdb, idb, mdb, Sequelize, sequelize, Op} = require('../../db'),
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
/*        cdb.newSearchBuilder()
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
                        console.log(data.body.results[item].path.slug);
                        //db.put(collection, data.body.results[item].path.slug, user);
                    }



                }

                console.log('Job done!');
                res.end();

                if (data.body.next) {
                    startkey = startkey + limit;
                    console.log('Getting next group..' + startkey);
                    getList(startkey, userlist, limit);
                } else {
                    console.log('Job done!');
                    res.status(200).end();


                }


            });
            */
    }
    

    if (enabled) {
        console.log('Starting maintenance..');
        getList(startkey, userlist, limit);
    }
}

module.exports = MaintApi;