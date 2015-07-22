angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController);

function NavigationController($scope, $modal, user) {
    // reference 'this' by using 'nav' from 'NavigationController as nav'
    this.user = user.data;
    this.context = {};

    $scope.changeLocation = function() {
        var modalInstance = $modal.open({
            templateUrl: 'views/common/change_location.html',
            controller: ChangeLocationController,
            windowClass: "hmodal-warning"
        });
    };

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