var jwt = require('jsonwebtoken'),
    db = require('orchestrate')(process.env.DB_KEY),
    request = require('request');

var NewsletterApi = function() {
    this.setupNewsletter = handleSetupNewsletter;
};

function handleSetupNewsletter(req, res) {
    var settings = req.param.settings,
        communities = req.param.communities;
    var getPass, createBrand, createList, getMembers, createCustomField, addSubscriberCSV, updateProfile, newprofile;

    // get user record and assign to newprofile
    db.get(process.env.DB_COMMUNITIES, req.user)
        .then(function(response) {

            if (response.body.code !== "items_not_found") {
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
                login_email: user.profile.email,
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
            console.log(body);
            // pull the brand_id from the url by parsing the html of the frame
            var el = document.createElement( 'html' );
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
        
    };
    // todo this is next
    createList = function(brand_id, network) {

        newsletter_service.createList(brand_id, network)
            .then(function(response) {
                var list_id = response;

                // capture the list id and update the user profile

                newprofile.newsletter.lists[network] = list_id;

                // add subscribers

                var locations = [network].concat(user.roles.leader[network]);

                getMembers(locations, brand_id, list_id);

            })
    };

    getMembers = function(locations, brand_id, list_id, alt) {
        var csv_data = [];

        var search = function(locations, alt) {

            user_service.search(locations, null, null, null, null, alt)
                .then(function (response) {
                    var profile;
                    console.log(response);
                    for (x in response.data.results) {
                        profile = response.data.results[x].value.profile;
                        if (profile.email) {
                            csv_data.push([profile.name, profile.email, profile.parents.length ? profile.parents.join(',') : null])
                        }
                    }

                    console.log(csv_data);

                    if (response.data.next) {
                        console.log('Getting next group..');
                        // remove random sort
                        var next_url = response.data.next.replace(/([&\?]sort=_random*$|sort=_random&|[?&]sort=_random(?=#))/, '');
                        search(locations, next_url);
                    } else {
                        console.log('Job done!');
                        createCustomField(brand_id, list_id, csv_data);
                    }
                })
        };

        search(locations);

    };

    createCustomField = function(brand_id, list_id, csv_data) {

        newsletter_service.createCustomField('Industry', 'Text', brand_id, list_id)
            .then(function(response) {

                addSubscriberCSV(csv_data, brand_id, list_id);

            })
    };

    addSubscriberCSV = function(csv_data, brand_id, list_id) {

        newsletter_service.addSubscriberCSV(csv_data, brand_id, list_id)
            .then(function(response) {
                console.log('List complete!');
            })
    };

    updateProfile = function(newprofile) {

        user_service.updateProfile(newprofile)
            .then(function(response) {

                self.working = false;

                if (response.status !== 200) {
                    sweet.show({
                        title: "Sorry, something went wrong.",
                        text: response.data.message,
                        type: "error"
                    });

                } else {

                    sweet.show({
                        title: "Settings saved!",
                        type: "success"
                    }, function(){
                        //$http.get('/api/2.1/community/' + location.key + '/' + self.community.key);
                        $uibModalInstance.close();
                    });
                }

            })
    };
}