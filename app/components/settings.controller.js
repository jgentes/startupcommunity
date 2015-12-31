angular
    .module('startupcommunity')
    .controller('SettingsController', SettingsController);

function SettingsController(community_service, user) {

    var self = this;
    community_service.getCommunity(user.data.user.key)
        .then(function(response) {
            self.communities = response.data;
        });
}
