angular
    .module('startupcommunity')
    .controller('EmailController', EmailController);

function EmailController($http, $httpParamSerializer, $sce, user) {
    var self = this;
    console.log(user);

    if (user) {

        $http({
            url: 'https://email.startupcommunity.org/includes/login/main.php',
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

            });

    } else self.frame_content = "<p style='font-size: 24px;'>Please <a href='/login'>log in</a> to access this feature..</p>";


    this.createBrand = function() {
/*
        $httpParamSerializer({
            'app_name': "push_brand_test",
            'from_name': "James Zibtru",
            'from_email': "james@bendtech.com",
            'reply_to': "james@bendtech.com"
        });
*/
        $http.post('https://email.startupcommunity.org/includes/app/create.php', {
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

}
