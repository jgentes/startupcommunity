/*global angular*/
/*global jQuery*/
angular
    .module('startupcommunity')
    .controller('LoginController', LoginController);

function LoginController($auth, $scope, $state, $stateParams, auth_service, sweet, $window, $location) {

    if (!jQuery.isEmptyObject($stateParams.alert)) this.alert = { type: 'danger', msg: $stateParams.alert };
    var self = this;
    this.working = false;

    var postLogin = function(auth_response) { // from getprofile

        $scope.global.user = auth_response.data;
        if (auth_response.config.data.state !== '/login') {
            $state.reload();
        }
        else $state.go('user.dashboard', { profile: auth_response.data, location_path: auth_response.data.id });

        window.mixpanel.identify(auth_response.data.id);
        window.mixpanel.track('Logged in');
    };

    this.login = function() {
        $auth.login({ email: this.email, password: this.password })
            .then(function(response) {
                postLogin(response.data.user);
            })
            .catch(function(response) {
                if (response.data && response.data.message && response.data.message !== 'undefined') {
                    self.alert = { type: 'danger', msg: String(response.data.message) };
                }
                else self.alert = undefined;
            });
    };
    this.authenticate = function(provider) {
        self.working = true;

        var urlString = 'https://www.linkedin.com/oauth/v2/authorization?' + jQuery.param({
            response_type: 'code',
            client_id: '75bqixdv58z1az',
            redirect_uri: $location.absUrl(),
            scope: 'r_liteprofile'
        });

        return $window.open(urlString, '_blank','height=600,width=600');


        /*$auth.authenticate(provider)
            .then(function(response) {
                postLogin(response);
            })
            .catch(function(response) {
                if (response.data) {
                    window.mixpanel.people.set({
                        '$name': response.data.firstName + ' ' + response.data.lastName,
                        '$email': response.data.emailAddress
                    });
                    window.mixpanel.track('Attempted Login');

                }
                if (response.data && response.data.message && response.data.message !== 'undefined') {
                    self.alert = { type: 'danger', msg: String(response.data.message) };
                    sweet.show({
                        title: 'Woah!',
                        text: String(response.data.message),
                        type: 'error',
                        html: true
                    });
                }
                else if (response.statusText) {
                    self.alert = { type: 'danger', msg: response.statusText + ': We just cleared your browser token, please try again.' };
                    $auth.removeToken();
                }

                self.working = false;
            });*/
    };

    this.clickToTweet = function() {
        var getQuote = document.getElementById('quote').innerHTML;

        window.open('http://twitter.com/intent/tweet?text=' + getQuote + '%20via%20StartupCommunity.org&related=startupyourcity&', 'twitterwindow', 'height=450, width=550, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');

    };
}
