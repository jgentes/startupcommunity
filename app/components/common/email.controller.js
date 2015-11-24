angular
    .module('startupcommunity')
    .controller('EmailController', EmailController);

function EmailController($auth, $http) {
    var self = this;
    $http.post('http://email.startupcommunity.org/includes/login/main.php', {
        params: {
            email: 'james@startupcommunity.org',
            password: 'O+af0b|Su'
        }
    })
        .then(function(response) {
            console.log(response);
        })
}
