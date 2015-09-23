angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($auth, $mixpanel, $stateParams, community, startup_service) {
    var self = this;
    this.community = community.profile.name.split(',')[0];
    //this.auth = true; //set to false
    //$state.go('welcome.setup'); //remove
    this.roles = {};
    this.working = false;
    var community_path = $stateParams.community_path ? $stateParams.community_path : $stateParams.location_path;
    this.authenticate = function() {
        self.working = true;
        $auth.authenticate('linkedin', {invite_code: $stateParams.invite_code})
            .then(function(response) {

                if (response.status !== 200) {
                    self.alert = { type: 'danger', message: 'There was a problem: ' + String(response.data.message) };
                } else {
                    self.auth = true;
                    self.user = response.data.user.value;
                    $state.go('welcome.setup');
                    // need to update user record with linkedin data now

                    $mixpanel.identify(response.data.user.path.key);
                    $mixpanel.track('Accepted Invite');

                    //self.alert = { type: 'success', message: 'Congrats, something has happened!' };
                }

            })
            .catch(function(response) {
                console.log(response);
                if (response.error || response.data) {
                    self.alert = {type: 'danger', message: String(response.error || response.data.message)};
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

}