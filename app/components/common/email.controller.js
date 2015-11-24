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
        $http.post('http://email.startupcommunity.org/includes/app/create.php', {
                params: {
                    'app_name': "push_brand_test",
                    'from_name': "James Zibtru",
                    'from_email': "james@bendtech.com",
                    'reply_to': "james@bendtech.com"
                },
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=utf-8"
                }
            })
            .then(function(response) {
                console.log(response);
            })
    }
}
