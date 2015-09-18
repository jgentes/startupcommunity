angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($auth, $mixpanel, community) {
    var self = this;
    this.community = community.profile.name.split(',')[0];
    this.auth = true; //set to false
    $state.go('welcome.setup'); //remove
    this.roles = {};

    this.authenticate = function(provider) {
        $auth.authenticate(provider)
            .then(function(response) {
                response.data.user.value["key"] = response.data.user.path.key;
                self.auth = true;
                self.user = response.data.user.value;
                console.log(response.data);
                $state.go('welcome.setup');

                $mixpanel.identify(response.data.user.path.key);
                $mixpanel.track('Accepted Invite');
            })
            .catch(function(response) {
                console.log(response);
                if (response.error || response.data) {
                    self.alert = {type: 'danger', msg: String(response.error || response.data)};
                } else self.alert = undefined;
            });
    };

    this.submitRoles = function() {
        console.log(self.roles);
        $state.go('welcome.skills');
    }

}