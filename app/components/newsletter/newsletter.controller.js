angular
    .module('startupcommunity')
    .controller('NewsletterController', NewsletterController)
    .controller('SetupNewsController', SetupNewsController);

function NewsletterController(newsletter_service, $sce, user, errorLogService) {
    var self = this;    

    if (user.newsletter) {        

        newsletter_service.login(user)
            .then(function (response) {
                
                self.frame_content = $sce.trustAsHtml(response.data);
                errorLogService('newsletter login: ', response.data);
                //newsletter_service.syncMembers(user.newsletter.lists, user.newsletter.brand_id, location.key);

            })
            .catch(function(error) {
                errorLogService('newsletter error: ', error);
            })

    } else {
        $state.go('settings');
    }
    
}

function SetupNewsController($uibModalInstance, user, sweet, newsletter_service, location, communities) {
    var self = this;

    if (user.newsletter) {

        // at some point allow editing current newsletter settings here

    }

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
            
            newsletter_service.setupNewsletter(settings, communities, location.key)
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
            self.submitted = true;
            self.working = false;
        }

    };

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}
