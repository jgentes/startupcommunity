angular
    .module('startupcommunity')
    .controller('NewsletterController', NewsletterController)
    .controller('SetupNewsController', SetupNewsController);

function NewsletterController(newsletter_service, $sce, $state, user) {
    var self = this;
    self.working = true;

    if (user.newsletter) {

        newsletter_service.login(user)
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

    } else $state.go('settings');

    //todo found solution here: http://shazwazza.com/post/uploading-files-and-json-data-in-the-same-request-with-angular-js/

    this.test = function() {
        var data = [["James Gentes", "james@jgentes.com", "Tech"], ["James G", "jgentes@gmail.com", "Recreation"]];
        var csvContent = "data:text/csv;charset=utf-8,";
        data.forEach(function(infoArray, index){

            dataString = infoArray.join(",");
            csvContent += index < data.length ? dataString+ "\n" : dataString;

        });

        newsletter_service.addSubscriberCSV(csvContent, 23, 39)
            .then(function(response) {
                self.frame_content = $sce.trustAsHtml(response.data);
            })
    }
    
}

function SetupNewsController($uibModalInstance, sweet, newsletter_service, user_service, user, communities) {
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
                                if (communities[network] && communities[network].type == 'network') {

                                    newsletter_service.createList(brand_id, network)
                                        .then(function(response) {
                                            var list_id = response;

                                            // capture the list id and update the user profile

                                            newprofile.newsletter.lists[network] = list_id;

                                            // add subscribers
                                            /*
                                            user_service.search(network, null, null, null, null)
                                                .then(function(response) {
                                                    for (x in response.body) {
                                                        console.log(x);
                                                    }
                                                })
                                                */

                                            newsletter_service.createCustomField('Industry', 'Text', brand_id, list_id)
                                            .then(function(response) {
                                                // create csv

                                                var data = [["James Gentes", "james@jgentes.com", "Tech"], ["James G", "jgentes@gmail.com", "Recreation"]];
                                                var csvContent = "data:text/csv;charset=utf-8,";
                                                data.forEach(function(infoArray, index){

                                                    dataString = infoArray.join(",");
                                                    csvContent += index < data.length ? dataString+ "\n" : dataString;

                                                });

                                                newsletter_service.addSubscriberCSV(csvContent, brand_id, list_id)
                                                    .then(function(response) {
                                                        console.log(response);
                                                    })
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
