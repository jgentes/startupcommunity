angular
    .module('startupcommunity')
    .controller('LoginController', LoginController);

function LoginController($auth, $state, $mixpanel) {

    var self = this;

    var postLogin = function(auth_response) { // was using global scope, but now I use resolve of user, which is getprofile
        auth_response.data.user.value["key"] = auth_response.data.user.path.key;
        if (auth_response.config.data.state !== '/login') {
            $state.go($state.current, {}, {reload: true});
        } else $state.go('people.profile', {profile: auth_response.data.user.value, community_path: auth_response.data.user.value.key});

        $mixpanel.identify(auth_response.data.user.path.key);
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
                postLogin(response);
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