var jwt = require('jsonwebtoken'),
    request = require('request'),
    jsdom = require('jsdom'),
    db = require('orchestrate')(process.env.DB_KEY);

request = request.defaults({jar: true, followAllRedirects: true}); // required to maintain session

var NewsletterApi = function() {
    this.setupNewsletter = handleSetupNewsletter;
    this.addSubscriber = addSubscriber;
    this.removeSubscriber = removeSubscriber;
};

function handleSetupNewsletter(req,res) {
    console.log('setup newsletter');

    var settings = req.body.settings,
        communities = req.body.communities,
        location_key = req.body.location_key,
        getMembers,
        createCustomField,
        addSubscriber,
        login,
        getUser,
        createBrand,
        createList,
        newprofile,
        updateProfile;

    login = function(callback) {
        console.log('logging in with primary account');

        try {
            request.post({
                url: 'https://newsletter.startupcommunity.org/includes/login/main.php',
                form: {
                    email: 'james@jgentes.com',
                    password: 'O+af0b|Su',
                    redirect: ""
                }
            }, function (error, response, body) {
                callback();
            })
        }
        catch (e) {
            console.log('WARNING: ', e);
            res.status(204).send({ message: 'Something went wrong.'})
        }
    };

    getUser = function(callback) {

        db.get(process.env.DB_COMMUNITIES, req.user)
            .then(function(response) {

                if (response.body.code !== "items_not_found") {

                    callback(response.body);

                } else {
                    console.warn('WARNING:  User not found.');
                    res.status(204).send({ message: 'Your user record was not found.'})
                }

            })
            .fail(function(err){
                res.status(204).send({ message: err});
                console.warn("WARNING: ", err);
            });
    };

    createBrand = function(settings, newprofile, callback) {

        request.post({
            url: 'https://newsletter.startupcommunity.org/includes/app/create.php',
            form: {
                app_name: settings.brand_name,
                from_name: settings.from_name,
                from_email: settings.from_email,
                reply_to: settings.reply_email,
                allowed_attachments: "jpeg,jpg,gif,png,pdf,zip",
                logo: "",
                uid: 1,
                smtp_host: settings.host,
                smtp_port: settings.port,
                smtp_ssl: settings.ssl.toLowerCase(),
                smtp_username: settings.username,
                smtp_password: settings.password,
                login_email: newprofile.profile.email,
                language: "en_US",
                pass: settings.pass,
                currency: "USD",
                delivery_fee: "",
                cost_per_recipient: "",
                "choose-limit": "unlimited",
                "monthly-limit": "",
                "reset-on-day": 1
            }
        }, function (error, response, body) {

            if (error) {
                console.log('WARNING: ', error);
                res.status(204).send({ message: error });
            } else {

                try {
                    jsdom.env(body, ["http://code.jquery.com/jquery.js"],
                        function(err, window) {
                            // pull brand_id from html
                            var $ = window.$;
                            var url = $("a").filter(function() {
                                return $(this).text() == settings.brand_name;
                            }).attr('href');
                            // return brand_id

                            callback(url.split("?")[1].split("=")[1]);
                        })
                }
                catch (e) {
                    console.log('WARNING: ', e);
                    console.log(body);
                    res.status(204).send({ message: e })
                }

            }
        })
    };

    createList = function(brand_id, list_name, callback) {
        request.post({
            url: 'https://newsletter.startupcommunity.org/includes/subscribers/import-add.php',
            form: {
                list_name: list_name,
                app: brand_id
            }
        }, function (error, response, body) {

            if (error) {
                console.log('WARNING: ', error);
                res.status(204).send({ message: error });
            } else {

                try {
                    jsdom.env(body, ["http://code.jquery.com/jquery.js"],
                        function (err, window) {
                            // pull the list_id from the url by parsing the html
                            var $ = window.$;
                            var url = $("a[href*='&l=']");

                            // return list_id
                            callback(url[0].href.split("&")[1].split("=")[1], list_name);
                        })
                }
                catch (e) {
                    console.log('WARNING: ', e);
                    console.log(body);
                    res.status(204).send({ message: e })
                }
            }
        })
    };

    createCustomField = function(field_name, field_type, app_id, list_id, callback) {
        request.post({
            url: 'https://newsletter.startupcommunity.org/includes/list/add-custom-field.php',
            form: {
                c_field: field_name,
                c_type: field_type,
                id: app_id,
                list: list_id
            }
        }, function (error, response, body) {
            if (error) {
                console.log('WARNING: ', error);
                res.status(204).send({ message: error });
            } else callback();
        })
    };

    getMembers = function(location_key, network, newprofile, brand_id, list_id) {
        console.log('getting members: ' + location_key + ' / ' + network);

        var search;

        // verify user is a member of this network in this location
        var networks = newprofile.roles.leader[network];

        if (!networks || (networks.indexOf(location_key) < 0)) {
            res.status(204).send({ message: 'You are not a leader of ' + network + ' in ' + location_key })
        } else {

            search = function (startKey) {

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
                                addSubscriber(brand_id, list_id, profile.name + ',' + profile.email)
                            }
                        }

                        if (data.body.next) {
                            console.log('Getting next group..');
                            startKey = startKey + 100;
                            search(startKey);
                        } else {
                            console.log(network + ' done!');
                        }

                    });
            };

            search(0, ""); // initialize user search

        }
    };
/*
    addSubscriberCSV = function(array_for_csv, app_id, list_id) {
        // funky setup here because it needs to send a csv file along with form data

        var fd = new FormData();
        fd.append("app", app_id);
        fd.append("list_id", list_id);
        fd.append("cron", 1);

        var csv = "";
        array_for_csv.forEach(function(infoArray, index){

            dataString = infoArray.join(",");
            csv += index < array_for_csv.length ? dataString+ "\n" : dataString;

        });

        var oBlob = new Buffer(new Uint8Array([csv]), { type: "text/csv"});
        fd.append("csv_file", oBlob,'import.csv');

        request.post({
            url: 'https://newsletter.startupcommunity.org/includes/subscribers/import-update.php',
            form: fd,
            headers: {'Content-Type': undefined}
        }, function (error, response, body) {
            console.log(body);
            if (error) {
                console.log('WARNING: ', error);
                res.status(204).send({ message: error });
            }
        })
    };*/

    addSubscriber = function(brand_id, list_id, lines) {

        request.post({
            url: 'https://newsletter.startupcommunity.org/includes/subscribers/line-update.php',
            form: {
                line: lines,
                list_id: list_id,
                app: brand_id
            }
        }, function (error, response, body) {
            if (error) {
                console.log('WARNING: ', error);
                res.status(204).send({ message: error });
            }
        })
    };


    updateProfile = function(brand_id, lists) {

        db.merge(process.env.DB_COMMUNITIES, req.user, {
            newsletter: {
                username: newprofile.profile.email,
                password: settings.pass,
                brand_id: brand_id,
                lists: lists
            }
        })            
        .then(function () {
            console.log('profile updated', lists);
        })
        .fail(function (err) {
            console.log('WARNING: ', err);
        });
    };

    // login with primary account

    login(function() {

        // pull user record

        getUser(function(user_profile) {

            // create brand

            settings['pass'] = jwt.sign(req.user, 'NewsletterSecretPasswordCryptoKey');

            newprofile = user_profile;

            createBrand(settings, newprofile, function(brand_id) {

                // push settings to user profile
                
                updateProfile(brand_id, {});

                // create lists for networks that the user is a leader of

                for (network in newprofile.roles.leader) {

                    if (newprofile.roles.leader.hasOwnProperty(network)) {

                        if (communities[network] && communities[network].type == 'network') {

                            createList(brand_id, network, function(list_id, list_name) {

                                // update the user profile with list id and create custom field

                                var lists = {};

                                lists[list_name] = list_id;

                                updateProfile(brand_id, lists);

                                createCustomField('Industry', 'Text', brand_id, list_id, function() {

                                    // get subscribers and add them to the list

                                    getMembers(location_key, list_name, newprofile, brand_id, list_id);
                                });
                            });
                        }

                    }


                }
                
                res.status(201).end();
                
            });
        })
    });


}

function addSubscriber(req,res) {
    var line = req.body.line,
        list_id = req.body.list_id,
        app_id = req.body.app_id;
    
    request.post({
        url: 'https://newsletter.startupcommunity.org/includes/subscribers/line-update.php',        
        form: {
            line: "James Gentes, jgentes@gmail.com",
            list_id: list_id,
            app: app_id
        }
    }, function (error, response, body) {
        if (error) {
            console.log('WARNING: ', error);
            res.status(204).send({ message: error });
        } else res.status(201).end();
    })
}

function removeSubscriber(req,res) {
    var line = req.body.line,
        list_id = req.body.list_id,
        app_id = req.body.app_id;

    request.post({
        url: 'https://newsletter.startupcommunity.org/includes/subscribers/line-delete.php',
        form: {
            line: "James Gentes, jgentes@gmail.com",
            list_id: list_id,
            app: app_id
        }
    }, function (error, response, body) {
        if (error) {
            console.log('WARNING: ', error);
            res.status(204).send({ message: error });
        } else res.status(201).end();
    })
}

module.exports = NewsletterApi;