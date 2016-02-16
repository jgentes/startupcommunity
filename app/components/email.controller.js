angular
    .module('startupcommunity')
    .controller('EmailController', EmailController);

function EmailController($http, $httpParamSerializer) {
    var self = this;

    this.createBrand = function() {
/*
        $httpParamSerializer({
            'app_name': "push_brand_test",
            'from_name': "James Zibtru",
            'from_email': "james@bendtech.com",
            'reply_to': "james@bendtech.com"
        });
*/
        $http.post('https://email2.startupcommunity.org/includes/app/create.php', {
                params: {
                    app_name: "push_brand_test",
                    from_name: "James Zibtru",
                    from_email: "james@bendtech.com",
                    reply_to: "james@bendtech.com"
                },
                transformRequest: angular.identity,
                headers: {
                    "Content-Type": undefined
                }
            })
            .then(function(response) {
                console.log(response);
            })
    }

    this.login = function() {
        self.working = true;
        /*
         $httpParamSerializer({
         'app_name': "push_brand_test",
         'from_name': "James Zibtru",
         'from_email': "james@bendtech.com",
         'reply_to': "james@bendtech.com"
         });
         */

        $http({
            url: 'https://email2.startupcommunity.org/includes/login/main.php',
            method: 'POST',
            data: $httpParamSerializer({
                email: "jgentes@gmail.com",
                password: "3OreHw2Z",
                redirect: ""
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(function (response) {
            self.working = false;
            document.getElementById('framed_email').src = document.getElementById('framed_email').src;
        })

    }

}
