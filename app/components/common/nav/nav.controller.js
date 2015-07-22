angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController);

function NavigationController($scope, $modal, $stateParams, user, communities) {
    // reference 'this' by using 'nav' from 'NavigationController as nav'

    this.user = user.data;
    this.community = $stateParams.community;
    communities = communities.data; // not this. because not needed in view


    /* Can't define context here unless I use $stateParams
    this.context = {
        community: community.data.key,
        location: community.data.type == "location" ? community.data.key : undefined
    };
    */

    // Nav menu items related to community
    this.locations = {};
    this.industries = {};
    this.networks = {};

    // First determine what type of community we are in using $stateParams, then build community nav items
    if (this.community.type !== "location") {
        var locations = $scope.global.findValue(communities, "location");
        for (item in locations) {
            if (locations[item].key !== "location") {
               this.locations[locations[item].key] = locations[item];
            }
        }
        this.location = this.locations[this.community.profile.home];
    } else {
        this.locations[this.community.key] = communities[this.community.key];
        this.location = this.community;
        //$scope.global.context.location = community.key;
    }

    if (this.community.type !== "industry") {
        var industries = $scope.global.findValue(communities, "industry");
        for (item in industries) {
            this.industries[industries[item].key] = industries[item];
        }
    } else this.industries[this.community.key] = communities[this.community.key];

    if (this.community.type !== "network") {
        var networks = $scope.global.findValue(communities, "network");
        for (item in networks) {
            this.networks[networks[item].key] = networks[item];
        }
    } else this.networks = {}; // will need to change to support sub-networks

    $scope.maploc = this.location.profile.name || $scope.global.findKey(this.locations, this.location)[0][this.location].profile.name;

    $scope.changeLocation = function() {
        var modalInstance = $modal.open({
            templateUrl: 'views/common/change_location.html',
            controller: ChangeLocationController,
            windowClass: "hmodal-warning"
        });
    };

    // Roles displayed in user profile
    var roles = $scope.global.findKey(this.user.communities, "roles"),
        rolelist = [],
        j,
        k,
        role;

    for (j in roles) {
        for (k in roles[j].roles) {
            role = roles[j].roles[k][0].toUpperCase() + roles[j].roles[k].slice(1);
            if (rolelist.indexOf(role) == -1 && role !== "Roles") {
                rolelist.push(role);
            }
        }
    }

    this.user.profile["roles"] = rolelist;

}