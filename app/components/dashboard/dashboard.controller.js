angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($stateParams, community, $state, community_top) {

    // redirect if a user or company
    if (community.type == 'user') {
        $state.go('user.dashboard');
    } else if (community.type == 'company') {
        $state.go('company.dashboard');
    }

    if ($state.current.name == 'user.list') $state.go('user.list');
    if ($state.current.name == 'company.list') $state.go('company.list');

    var self = this;
    this.top = community_top.data;
    this.location_path = $stateParams.location_path;
    this.community_path = community.key == this.location_path ? undefined : community.key;

    angular.element(document).ready(function () {
        setTimeout(function() {
            $('#dash-tour').tooltip();
            $('#dash-tour').off('.tooltip'); // to avoid tooltip everywhere on dash
        }, 2000);
    });
}

