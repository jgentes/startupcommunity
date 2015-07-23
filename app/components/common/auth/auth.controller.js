angular
    .module('startupcommunity')
    .controller('LoginController', LoginController);

function LoginController($scope, $auth, $location, $mixpanel) {

    var postLogin = function(user) {
        user.value["key"] = user.path.key;
        user = user.value;

        $scope.global.user = user;
        $scope.global.context = {};
        $scope.global.alert = undefined;
        $scope.global.sessionReady();
        $location.path('/' + user.profile.home);
        $mixpanel.identify(user.key);
        $mixpanel.track('Logged in');
    };

    $scope.login = function() {
        $auth.login({ email: $scope.email, password: $scope.password })
            .then(function(response) {
                postLogin(response.data.user);
            })
            .catch(function(response) {
                if (response.data.message && response.data.message !== 'undefined') {
                    $scope.global.alert = {type: 'danger', msg: String(response.data.message)};
                } else $scope.global.alert = undefined;
                console.warn("WARNING:");
                console.log(response);
            });
    };
    $scope.authenticate = function(provider) {
        $auth.authenticate(provider)
            .then(function(response) {
                postLogin(response.data.user);
            })
            .catch(function(response) {
                console.warn("WARNING:");
                console.log(response);
                if (response.data.profile) {
                    $mixpanel.people.set({
                        "$name": response.data.profile.firstName + ' ' + response.data.profile.lastName,
                        "$email": response.data.profile.emailAddress
                    });
                    $mixpanel.track('Attempted Login');
                    UserVoice.push(['identify', {
                        name: response.data.profile.firstName + ' ' + response.data.profile.lastName,
                        email: response.data.profile.emailAddress
                    }]);
                }
                if (response.data.message && response.data.message !== 'undefined') {
                    $scope.global.alert = {type: 'danger', msg: String(response.data.message)};
                } else $scope.global.alert = undefined;
            });
    };
}