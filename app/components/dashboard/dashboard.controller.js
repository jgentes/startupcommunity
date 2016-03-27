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

    var self = this;
    this.max = 0;
    this.top = community_top;
    if (this.top) {
        for (val in this.top.parents) {
            this.max += this.top.parents[val].value;
        }
    }
    this.location_path = $stateParams.location_path;
    this.community_path = community.key == this.location_path ? undefined : community.key;

    angular.element(document).ready(function () {
        setTimeout(function() {
            $('#dash-tour').tooltip();
            $('#dash-tour').off('.tooltip'); // to avoid tooltip everywhere on dash
        }, 2000);
    });
}

