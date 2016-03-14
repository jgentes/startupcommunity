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
         
            }, function errorCallback(response) {
                console.log(response);
            });

    } else $state.go('settings');
    
}

function SetupNewsController($uibModalInstance, sweet, newsletter_service, communities) {
    var self = this;
    
    this.setup = function() {
        self.working = true;

        if (self.form.$valid || true) {

            /*var settings = {
                brand_name : self.setupForm.brand_name,
                from_name : self.setupForm.from_name,
                from_email : self.setupForm.from_email,
                reply_email : self.setupForm.reply_email,
                host : self.setupForm.host,
                port : self.setupForm.port,
                ssl : self.setupForm.ssl,
                username : self.setupForm.username,
                password : self.setupForm.password
            };*/

            var settings = {
             brand_name : 'test',
             from_name : 'James G',
             from_email : 'jgentes@gmail.com',
             reply_email : 'jgentes@gmail.com',
             host : 'test.gmail.com',
             port : 343,
             ssl : 'SSL',
             username : 'test',
             password : 'test'
             };
            // pull some of this back from server.. createbrand and createlist
/*
            newsletter_service.getPass()
                .then(function(response) {
                    var pass = response.data;

                    newsletter_service.createBrand(user, pass, self.settings)
                        .then(function(response) {
                            var brand_id = response,
                                newprofile = user;

                            // push settings to user profile

                            newprofile['newsletter'] = {
                                brand_id: brand_id,
                                username: newprofile.profile.email,
                                password: pass,
                                lists: {}
                            };



                            // create lists for networks that the user is a leader of
                            for (network in user.roles.leader) {
                                if (communities[network] && communities[network].type == 'network') {

                                    newsletter_service.createList(brand_id, network)
                                        .then(function(response) {
                                            var list_id = response;

                                            // capture the list id and update the user profile

                                            newprofile.newsletter.lists[network] = list_id;

                                            // add subscribers
                                            /!*
                                             user_service.search(network, null, null, null, null)
                                             .then(function(response) {
                                             for (x in response.body) {
                                             console.log(x);
                                             }
                                             })
                                             *!/

                                            newsletter_service.createCustomField('Industry', 'Text', brand_id, list_id)
                                                .then(function(response) {
                                                    // create csv

                                                    */

            newsletter_service.setup(settings, communities)
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
                        }, function () {
                            //$http.get('/api/2.1/community/' + location.key + '/' + self.community.key);
                            $uibModalInstance.close();
                        });
                    }
            });

        } else {
            self.submitted = true;
        }

    };

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}