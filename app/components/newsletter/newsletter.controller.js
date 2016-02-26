angular
    .module('startupcommunity')
    .controller('NewsletterController', NewsletterController)
    .controller('SetupNewsController', SetupNewsController);

function NewsletterController($http, $httpParamSerializer, $sce, user) {
    var self = this;

    if (user) {

        $http({
            url: 'https://newsletter.startupcommunity.org/includes/login/main.php',
            method: 'POST',
            data: $httpParamSerializer({
                email: "jgentes@gmail.com",
                password: "3OreHw2Z",
                redirect: ""
            }),
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function (response) {
                self.working = false;
                //var cookie = CryptoJS.SHA512("4" + "jgentes@gmail.com" + CryptoJS.SHA512("3OreHw2Z" + "PectGtma").toString() + "PectGtma").toString();
                //$cookies.put('logged_in', cookie);

                self.frame_content = $sce.trustAsHtml(response.data);

                // pull the app_id (brand) from the url by parsing the html of the frame
                var el = document.createElement( 'html' );
                el.innerHTML = response.data.toString();
                var url = el.getElementsByClassName('brand')[0].href;
                self.app_id = url.split("?")[1].split("=")[1];

            });

    } else self.frame_content = "<p style='font-size: 24px;'>Please <a href='/login'>log in</a> to access this feature..</p>";
    
}

function SetupNewsController($uibModalInstance, sweet, newsletter_service) {
    
    this.setup = function() {
        
        if (self.form.$valid) {

            self.settings = {
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

            newsletter_service.createBrand(self.embed, location.key, self.community.key)
                .then(function(response) {

                    if (response.status !== 201) {
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
                });

        } else {
            self.form.submitted = true;
        }
    }
    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}
