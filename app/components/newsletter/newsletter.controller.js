angular
    .module('startupcommunity')
    .controller('NewsletterController', NewsletterController)
    .controller('SetupNewsController', SetupNewsController);

function NewsletterController($http, $httpParamSerializer, $sce, user) {
    var self = this;
    self.working = true;

    if (user) {
        console.log(user.newsletter);

        $http({
            url: 'https://newsletter.startupcommunity.org/includes/login/main.php',
            method: 'POST',
            data: $httpParamSerializer({
                email: user.newsletter.username,
                password: user.newsletter.password,
                redirect: ""
            }),
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function (response) {
                self.working = false;

                self.frame_content = $sce.trustAsHtml(response.data);
                /*
                // pull the app_id (brand) from the url by parsing the html of the frame
                var el = document.createElement( 'html' );
                el.innerHTML = response.data.toString();
                var url = el.getElementsByClassName('brand')[0].href;
                self.app_id = url.split("?")[1].split("=")[1];
                */
            }, function errorCallback(response) {
                console.log(response);
            });

    } else self.frame_content = "<p style='font-size: 24px;'>Please <a href='/login'>log in</a> to access this feature..</p>";
    
}

function SetupNewsController($uibModalInstance, sweet, newsletter_service, user_service, user) {
    var self = this;
    
    this.setup = function() {
        self.working = true;

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
                                if (user.roles.leader[network].type == 'network') {
                                    newsletter_service.createList(brand_id, list_name)
                                        .then(function(response) {
                                            // capture the list id and update the user profile
                                            newprofile.newsletter.lists[list_name] = response;

                                            // add subscribers
                                            user_service.search(network, null, null, null, null)
                                                .then(function(response) {
                                                    for (x in response.body) {
                                                        console.log(x);
                                                    }
                                                })


                                        })
                                }
                            }

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

                        });
                });

            $state.go('newsletter');

        } else {
            self.submitted = true;
        }
    };

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}
