angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($rootScope, $stateParams, $state, community_top) {

    // redirect if a user or company
    if ($rootScope.global.community.type == 'user') {
        $state.go('user.dashboard');
    } else if ($rootScope.global.community.type == 'company') {
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
    $rootScope.global.location_path = $stateParams.location_path;
    $rootScope.global.community_path = $rootScope.global.community.key == $rootScope.global.location_path ? undefined : $rootScope.global.community.key;

    angular.element(document).ready(function () {
        setTimeout(function() {
            $('#dash-tour').tooltip();
            $('#dash-tour').off('.tooltip'); // to avoid tooltip everywhere on dash
        }, 2000);
    });
}

