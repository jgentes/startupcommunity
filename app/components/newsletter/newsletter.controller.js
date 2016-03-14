angular
    .module('startupcommunity')
    .controller('NewsletterController', NewsletterController)
    .controller('SetupNewsController', SetupNewsController);

function NewsletterController(newsletter_service, $sce, $state, user) {
    var self = this;
    self.splash = true;

    if (user.newsletter) {

        newsletter_service.login(user)
            .then(function (response) {
                self.splash = false;

                self.frame_content = $sce.trustAsHtml(response.data);
            })

    } else $state.go('settings');
    
}

function SetupNewsController($uibModalInstance, sweet, newsletter_service, user_service, user, location, communities) {
    var self = this, createBrand, createList, getMembers, createCustomField, addSubscriberCSV, updateProfile,
        newprofile = user;
    var pass = newsletter_service.getPass();
    
    this.setup = function() {
        self.working = true;


        if (self.form.$valid) {

            var settings = {
                brand_name : self.setupForm.brand_name,
                from_name : self.setupForm.from_name,
                from_email : self.setupForm.from_email,
                reply_email : self.setupForm.reply_email,
                host : self.setupForm.host,
                port : self.setupForm.port,
                ssl : self.setupForm.ssl,
                pass : pass,
                username : self.setupForm.username,
                password : self.setupForm.password
            };

            createBrand(settings);

        } else {
            self.submitted = true;
        }

    };

    createBrand = function(settings) {

        newsletter_service.createBrand(user.profile.email, settings)
            .then(function(brand_id) {

                // push settings to user profile

                newprofile['newsletter'] = {
                    brand_id: brand_id,
                    username: newprofile.profile.email,
                    password: pass,
                    lists: {}
                };

                // create lists for networks that the user is a leader of
                for (network in user.roles.leader) {
                    console.log(network);
                    if (communities[network] && communities[network].type == 'network') {
                        console.log('moving forward')

                        createList(brand_id, network);
                    }
                }

                updateProfile(newprofile);

            });
    };

    createList = function(brand_id, list_name) {

        newsletter_service.createList(brand_id, list_name)
            .then(function(list_id) {                

                // capture the list id and update the user profile

                newprofile.newsletter.lists[list_name] = list_id;

                createCustomField(brand_id, list_id, list_name);

            })
    };

    createCustomField = function(brand_id, list_id, list_name) {

        newsletter_service.createCustomField('Industry', 'Text', brand_id, list_id)
            .then(function(response) {

                // get subscribers

                getMembers(location.key, list_name, brand_id, list_id);

            })
    };

    getMembers = function(location_key, list_name, brand_id, list_id) {
        
        newsletter_service.getMembers(location_key, list_name, brand_id, list_id)
            .then(function(csv_data) {                
                addSubscriberCSV(csv_data.data, brand_id, list_id);
            });
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

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}
