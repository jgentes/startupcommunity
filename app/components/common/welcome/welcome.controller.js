angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($auth, $mixpanel, $stateParams, community, startup_service) {
    var self = this;
    this.community = community.profile.name.split(',')[0];
    this.auth = true; //set to false
    $state.go('welcome.setup'); //remove
    this.roles = {};
    this.working = false;
    var community_path = $stateParams.community_path ? $stateParams.community_path : $stateParams.location_path;
    this.authenticate = function(provider) {
        self.working = true;
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

    this.addStartup = function() {

        this.working = true;

        if (self.founder.form.$valid) {
            var formdata = {
                "angellist_url" : self.founder.form.url_value.split('/').pop()
            };

            startup_service.addStartup(formdata.angellist_url, $stateParams.location_path, community_path)
                .then(function(response) {
                    self.working = false;

                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: 'There was a problem: ' + String(response.data.message) };
                    } else {
                        self.alert = { type: 'success', message: 'Congrats, ' + response.data.profile.name + ' has been added to your profile.' };
                    }
                });

        } else {
            this.working = false;
            self.founder.form.submitted = true;
        }

    };

    this.working = false;

}