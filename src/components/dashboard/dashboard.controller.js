/*global angular*/
/*global $*/
angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($scope, $stateParams) {

    $scope.global.query = undefined;
    this.path = $stateParams.community_path || $stateParams.location_path;

    angular.element(document).ready(function() {
        setTimeout(function() {
            $('#dash-tour').tooltip();
            $('#dash-tour').off('.tooltip'); // to avoid tooltip everywhere on dash
        }, 2000);
    });
}
