/*global angular*/
/*global jQuery*/
angular
    .module('startupcommunity')
    .controller('LoginController', LoginController);

function LoginController($auth, $scope, $state, $stateParams, auth_service, sweet, $window, $location) {

    if (!jQuery.isEmptyObject($stateParams.alert)) this.alert = { type: 'danger', msg: $stateParams.alert };
    var self = this;
    this.working = false;

    this.authenticate = function(provider) {
        self.working = true;

        var urlString = 'https://www.linkedin.com/oauth/v2/authorization' +
          '?scope=r_liteprofile%20r_emailaddress' +
          '&response_type=code' +
          '&client_id=75bqixdv58z1az' +
          '&redirect_uri=' + $location.host();

        return $window.open(urlString, '_blank','height=600,width=600');
    };

    this.login = () => $location.url('/logout');

    this.clickToTweet = function() {
        var getQuote = document.getElementById('quote').innerHTML;

        window.open('http://twitter.com/intent/tweet?text=' + getQuote + '%20via%20StartupCommunity.org&related=startupyourcity&', 'twitterwindow', 'height=450, width=550, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');

    };
}
