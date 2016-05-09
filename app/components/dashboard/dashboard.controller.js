angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($rootScope, $stateParams, $state, $location) {

    $rootScope.global.community = $stateParams.community && $stateParams.community.key && ($stateParams.community.key !== $stateParams.community_path) && ($stateParams.community.key !== $stateParams.location_path) ?
        $rootScope.global.location :
        $rootScope.global.community;

    $rootScope.global.path = $location.path().replace(/\/$/, "");

    // redirect if a user or company
    if ($rootScope.global.community.type == 'user') {
        $state.go('user.dashboard');
    } else if ($rootScope.global.community.type == 'company') {
        $state.go('company.dashboard');
    }

    var self = this;
    this.max = 0;
    //$rootScope.global.top = community_top;

    if ($rootScope.global.top) {
        for (val in $rootScope.global.top.parents) {
            this.max += $rootScope.global.top.parents[val].value;
        }
    }
    
    //$stateParams.community_path = $rootScope.global.community.key == $stateParams.location_path ? undefined : $rootScope.global.community.key;

    angular.element(document).ready(function () {
        setTimeout(function() {
            $('#dash-tour').tooltip();
            $('#dash-tour').off('.tooltip'); // to avoid tooltip everywhere on dash
        }, 2000);
    });
}

