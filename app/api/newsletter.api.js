var jwt = require('jsonwebtoken'),
    db = require('orchestrate')(process.env.DB_KEY),
    request = require('request'),
    htmlparser = require("htmlparser2"),
    $ = require('jQuery');

//var util = require('util'); //for util.inspect on request

var NewsletterApi = function() {
    this.setupNewsletter = handleSetupNewsletter;
};

function handleSetupNewsletter(req, res) {

    var settings = req.body.settings,
        communities = req.body.communities,
        createBrand,
        createList,
        getMembers,
        createCustomField,
        addSubscriberCSV,
        updateProfile,
        addSubscriber,
        removeSubscriber,
        newprofile;

    // get user record and assign to newprofile
    db.get(process.env.DB_COMMUNITIES, req.user)
        .then(function(response) {
            console.log('pulling user record');

            if (response.body !== "items_not_found") {
                newprofile = response.body;

                // create password
                try {
                    var pass = jwt.sign(req.user, 'NewsletterSecretPasswordCryptoKey');
                }
                catch (e) {
                    res.status(202).send({ message: "Something went wrong: " + e});
                    console.log('WARNING: ', e);
                }

                // create brand

                createBrand(pass, settings);

            } else {
                console.warn('WARNING:  User not found.');
            }

        })
        .fail(function(err){
            console.warn("WARNING: company231", err);
        });

    createBrand = function(pass, settings) {
        console.log('creating brand: ' + settings.brand_name);

        request.post({
            url: 'https://newsletter.startupcommunity.org/includes/app/create.php',            
            form: {
                app_name: settings.brand_name,
                from_name: settings.from_name,
                from_email: settings.from_email,
                reply_to: settings.reply_email,
                allowed_attachments: "jpeg,jpg,gif,png,pdf,zip",
                logo: "",
                uid: "1",
                smtp_host: settings.host,
                smtp_port: settings.port,
                smtp_ssl: settings.ssl,
                smtp_username: settings.username,
                smtp_password: settings.password,
                login_email: newprofile.profile.email,
                language: "en_US",
                pass: pass,
                currency: "USD",
                delivery_fee: "",
                cost_per_recipient: "",
                "choose-limit": "unlimited",
                "monthly-limit": "",
                "reset-on-day": "1"
            }
        }, function(err, response, body) {
            // pull the brand_id from the url by parsing the html of the frame

            var handler = new htmlparser.DomHandler(function (error, dom) {
                if (error)
                    console.log(error);
                else
                var el = dom;

                //var el = document.createElement( 'html' );
                el.innerHTML = body.toString();

                var url = $("a", el).filter(function() {
                    return $(this).text() == settings.brand_name;
                }).attr('href');

                var brand_id = url.split("?")[1].split("=")[1];

                // push settings to user profile

                newprofile['newsletter'] = {
                    brand_id: brand_id,
                    username: newprofile.profile.email,
                    password: pass,
                    lists: {}
                };

                // create lists for networks that the user is a leader of
                for (var network in newprofile.roles.leader) {
                    if (communities[network] && communities[network].type == 'network') {

                        createList(brand_id, network);

                    }
                }

                updateProfile(newprofile);

            });
            var parser = new htmlparser.Parser(handler);
            parser.write(body.toString());
            parser.done();


            
        });
        
    };

    createList = function(brand_id, network) {
        console.log('creating list: ' + network);

        request.post({
            url: 'https://newsletter.startupcommunity.org/includes/subscribers/import-add.php',
            form: {
                list_name: list_name,
                app: brand_id
            }
        }, function(err, response, body) {
            console.log(body);
            // pull the list_id from the url by parsing the html of the frame
            var el = document.createElement( 'html' );
            el.innerHTML = body.toString();
            var url = $("a[href*='&l=']", el);

            // return list_id
            var list_id = url[0].href.split("&")[1].split("=")[1];

            // capture the list id and update the user profile

            newprofile.newsletter.lists[network] = list_id;

            // add subscribers

            var locations = [network].concat(user.roles.leader[network]);

            getMembers(locations, brand_id, list_id);

        });
    };

    getMembers = function(locations, brand_id, list_id) {
        console.log('getting members: ' + locations);

        var csv_data = [];

        var search = function (startKey) {

            var searchstring = "";
            for (l in locations) {
                searchstring += '"' + locations[l] + '"';
                if (l < (locations.length - 1)) {
                    searchstring += ' AND ';
                }
            }

            db.newSearchBuilder()
                .collection(process.env.DB_COMMUNITIES)
                .limit(100)
                .offset(startKey)
                .query('@value.communities: (' + searchstring + ') AND @value.type: "user"')
                .then(function (data) {
                    var profile;
                    console.log(data);
                    for (x in data.body.results) {
                        profile = data.body.results[x].value.profile;
                        if (profile.email) {
                            csv_data.push([profile.name, profile.email, profile.parents.length ? profile.parents.join(',') : null])
                        }
                    }

                    console.log(csv_data);

                    if (data.body.next) {
                        console.log('Getting next group..');
                        startKey = startKey + 100;
                        search(startKey);
                    } else {
                        console.log('Job done!');
                        createCustomField(brand_id, list_id, csv_data);
                    }

                });

            search(0);

        };

        createCustomField = function (brand_id, list_id, csv_data) {
            console.log('creating custom field');

            request.post({
                url: 'https://newsletter.startupcommunity.org/includes/list/add-custom-field.php',
                form: {
                    c_field: 'Industry',
                    c_type: 'Text',
                    id: brand_id,
                    list: list_id
                }

            }, function (err, response, body) {
                console.log(body);
                addSubscriberCSV(csv_data, brand_id, list_id);
            });
        };

        addSubscriberCSV = function (csv_data, brand_id, list_id) {
            console.log('adding subscribers');

            // funky setup here because it needs to send a csv file along with form data

            var fd = new FormData();
            fd.append("app", brand_id);
            fd.append("list_id", list_id);
            fd.append("cron", 1);

            var csv = "";
            csv_data.forEach(function (infoArray, index) {

                dataString = infoArray.join(",");
                csv += index < csv_data.length ? dataString + "\n" : dataString;

            });

            var oBlob = new Blob([csv], {type: "text/csv"});
            fd.append("csv_file", oBlob, 'import.csv');

            request.post({
                url: 'https://newsletter.startupcommunity.org/includes/subscribers/import-update.php',
                form: fd,
                headers: {'Content-Type': undefined}
            }, function (err, response, body) {
                console.log('List complete!');
            });
        };

        addSubscriber = function () {
            http.post({
                url: 'https://newsletter.startupcommunity.org/includes/subscribers/line-update.php',
                form: {
                    line: "James Gentes, jgentes@gmail.com",
                    list_id: list_id,
                    app: brand_id
                }
            }, function (err, response, body) {
                console.log('Addition complete!');
            });
        };

        removeSubscriber = function () {
            request.post({
                url: 'https://newsletter.startupcommunity.org/includes/subscribers/line-delete.php',
                form: {
                    line: "jgentes@gmail.com",
                    list_id: list_id,
                    app: brand_id
                }
            }, function (err, response, body) {
                console.log('Removal complete!');
            });
        };

        updateProfile = function (newprofile) {
            console.log('updating profile');
            console.log(newprofile);
            // ensure profile matches current user
            if (req.user == newprofile.key) {
                delete newprofile.key;
                db.put(process.env.DB_COMMUNITIES, newprofile.key, newprofile)
                    .then(function(response){
                        if (response.body.code !== "items_not_found") {
                            response.body["key"] = req.user;
                            res.status(200).send({ token: jwt.sign(req.user, process.env.SC_TOKEN_SECRET), user: response.body });

                        } else {
                            console.warn('WARNING:  User not found.');
                            res.status(200).send({ message: 'User not found.' });
                        }
                    })

                    .fail(function(err){
                        console.warn("WARNING: user457", err);
                        res.status(202).send({ message: "Something went wrong."});
                    });
            } else {
                res.status(400).send({ message: 'You may only update your own user record.'})
            }

            user_service.updateProfile(newprofile)
                .then(function (response) {



                })
        };
    }

}

module.exports = NewsletterApi;