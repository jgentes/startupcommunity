angular
    .module('startupcommunity')
    .controller('ErrorPageController', ErrorPageController);

function ErrorPageController($window) {

    this.goBack = function() {
        $window.history.back();
    };

}