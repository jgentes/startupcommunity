angular
    .module('startupcommunity')
    .controller('AppController', AppController);

function AppController($scope) {

    $scope.global = {};


    var broadcast = function() {
        $scope.$broadcast('sessionReady', true);

    };

    // Get and set user and location data
    $scope.global.sessionReady = function() {

        var setNav = function() {
            // for navigation


            broadcast();
        };

    };

    if ($scope.global.alert) {
        if ($scope.global.alert.msg == 'undefined' || !$scope.global.alert.msg) { $scope.global.alert = undefined }
    }

    $scope.global.sessionReady();

}