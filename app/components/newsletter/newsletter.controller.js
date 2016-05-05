angular
    .module('startupcommunity')
    .controller('NewsletterController', NewsletterController)
    .controller('SetupNewsController', SetupNewsController);

function NewsletterController(newsletter_service, $sce, user, errorLogService) {
    var self = this;
    
    this.user = user;
    this.ie = navigator.userAgent.indexOf('Trident') > 0 || navigator.userAgent.indexOf('MSIE') > 0;

    if (user.newsletter) {        
        
        newsletter_service.login(user)
            .then(function (response) {
                
                self.frame_content = $sce.trustAsHtml(response.data);
                
                //newsletter_service.syncMembers(user.newsletter.lists, user.newsletter.brand_id, location.key);

            })
            .catch(function(error) {
                errorLogService('newsletter error: ', error);
            })

    } else {
        $state.go('settings');
    }

    // logout is not used, just for reference
    this.logout = function() {
        newsletter_service.logout()
            .then(function (response) {
                self.frame_content = $sce.trustAsHtml(response.data);
            })
    }
    
}

function SetupNewsController($uibModalInstance, user, sweet, community_service, newsletter_service, location) {
    var self = this;

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
                ssl : self.setupForm.ssl.toLowerCase(),
                username : self.setupForm.username,
                password : self.setupForm.password
            };

            if (user.newsletter && user.newsletter.brand_id) {
                /// update existing newsletter

                newsletter_service.updateNewsletter(settings, user.profile.email, user.newsletter.brand_id)
                    .then(function(response) {

                        self.working = false;

                        if (response.status == 201) {

                            sweet.show({
                                title: "Newsletter settings saved!",
                                type: "success"
                            }, function(){
                                $uibModalInstance.close();
                            });

                        } else {
                            sweet.show({
                                title: "Sorry, something went wrong.",
                                text: "Here's what we know: " + response.data.message,
                                type: "error"
                            });
                        }
                    })

            } else {

                var leader = [];

                for (l in user.roles.leader) leader.push(l);

                community_service.getResources(undefined, leader)
                    .then(function(response) {
                        var resource_list = response.data;

                        newsletter_service.setupNewsletter(settings, resource_list, location.key)
                            .then(function(response) {

                                self.working = false;

                                if (response.status == 201) {

                                    sweet.show({
                                        title: "Newsletter settings saved!",
                                        type: "success"
                                    }, function(){
                                        $uibModalInstance.close();
                                    });

                                } else {
                                    sweet.show({
                                        title: "Sorry, something went wrong.",
                                        text: "Here's what we know: " + response.data.message,
                                        type: "error"
                                    });
                                }
                            })
                    })

            }

        } else {
            self.submitted = true;
            self.working = false;
        }

    };

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}
