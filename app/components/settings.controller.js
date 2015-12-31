angular
    .module('startupcommunity')
    .controller('SettingsController', SettingsController);

function SettingsController(user) {
    var self = this;

    console.log(user);
}