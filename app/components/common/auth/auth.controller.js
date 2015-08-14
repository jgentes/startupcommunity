angular
    .module('startupcommunity')
    .controller('LoginController', LoginController);

function LoginController($auth, $state, $mixpanel) {

    var self = this;

    var postLogin = function(user) {
        user.value["key"] = user.path.key;
        console.log(user.path.key);
        $state.go('people.profile', {profile: user.value});
        $mixpanel.identify(user.path.key);
        $mixpanel.track('Logged in');
    };

    this.login = function() {
        $auth.login({ email: this.email, password: this.password })
            .then(function(response) {
                postLogin(response.data.user);
            })
            .catch(function(response) {
                if (response.data.message && response.data.message !== 'undefined') {
                    self.alert = {type: 'danger', msg: String(response.data.message)};
                } else self.alert = undefined;
            });
    };
    this.authenticate = function(provider) {
        $auth.authenticate(provider)
            .then(function(response) {
                postLogin(response.data.user);
            })
            .catch(function(response) {
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
                    self.alert = {type: 'danger', msg: String(response.data.message)};
                } else self.alert = undefined;
            });
    };
}