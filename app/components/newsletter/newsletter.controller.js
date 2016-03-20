angular
    .module('startupcommunity')
    .controller('NewsletterController', NewsletterController)
    .controller('SetupNewsController', SetupNewsController);

function NewsletterController(newsletter_service, $sce, user) {
    var self = this;
    self.splash = true;

    if (user.newsletter) {        

        newsletter_service.login(user)
            .then(function (response) {
                
                self.splash = false;
                self.frame_content = $sce.trustAsHtml(response.data);
            })

    } else {
        $state.go('settings');
    }
    
}

function SetupNewsController($uibModalInstance, $state, sweet, newsletter_service, location, communities) {
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
            
            newsletter_service.setupNewsletter(settings, communities, location.key)
                .then(function(response) {
                    self.working = false;

                    sweet.show({
                        title: "Newsletter settings saved!",
                        type: "success"
                    }, function(){
                        $uibModalInstance.close();
                        $state.go('newsletter');
                    });
                    
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
