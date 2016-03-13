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

function SetupNewsController($uibModalInstance, sweet, newsletter_service, user_service, user, communities) {
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
                ssl : self.setupForm.ssl,
                username : self.setupForm.username,
                password : self.setupForm.password
            };

            user_service.setupNewsletter(settings, communities);

        } else {
            self.submitted = true;
        }

    };

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}
