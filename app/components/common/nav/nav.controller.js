angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController);

function NavigationController($scope, $state, $location, $modal, $stateParams, user, community, communities) {
    // reference 'this' by using 'nav' from 'NavigationController as nav' - * nav is also usable in child views *
    window.$scope = $scope; // for console testing to avoid $scope = $('body').scope()

    this.user = user.data;

    // sort communities for use in nav and child dashboard pages
    for (item in communities.data) {
        switch(communities.data[item].type) {
            case "location":
                if (!this.locations) this.locations = {};
                this.locations[item] = communities.data[item];
                break;
            case "industry":
                if (!this.industries) this.industries = {};
                this.industries[item] = communities.data[item];
                break;
            case "network":
                if (!this.networks) this.networks = {};
                this.networks[item] = communities.data[item];
                break;
        }
    }

    if (jQuery.isEmptyObject($stateParams.community)) {
        this.community = community;
    } else this.community = $stateParams.community;

    // Roles displayed in user profile
    var rolelist = [],
        j,
        k,
        role;

    for (j in this.user.communities) {
        for (k in this.user.communities[j]) {
            role = k[0].toUpperCase() + k.slice(1);
            if (rolelist.indexOf(role) < 0) {
                rolelist.push(role);
            }
        }
    }

    this.user.profile["roles"] = rolelist;

    this.maploc = this.community.profile.name;

    if (!$scope.global) {
        $scope.global = {
            alert: {},
            search: undefined
        };
    }

    $scope.$on('mapInitialized', function(event, map) {
        $scope.global.mapCenter = "Bend, OR";
    });

    $scope.changeLocation = function() {
        var modalInstance = $modal.open({
            templateUrl: 'components/common/nav/nav.change_location.html',
            controller: ChangeLocationController,
            windowClass: "hmodal-warning"
        });
    };

    this.path = $location.path(); //also used in view
    if (this.path.split('/').length < 3) { //only for root routes
        switch (community.type) {
            case "user":
                $state.go('people.profile');
                break;
            case "location":
                $state.go('location.dashboard');
                break;
            case "network":
                $state.go('network.dashboard');
                break;
            case "industry":
                $state.go('industry.dashboard');
                break;
        }
    }
}