angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($stateParams, community, $state) {
    // redirect if a user or company
    if (community.type == 'user') {
        $state.go('user.dashboard');
    } else if (community.type == 'company') {
        $state.go('company.dashboard');
    }

    var self = this;

    this.location_path = $stateParams.location_path;

    angular.element(document).ready(function () {
        setTimeout(function() {
            $('#dash-tour').tooltip();
            $('#dash-tour').off('.tooltip'); // to avoid tooltip everywhere on dash
        }, 2000);
    });
}

