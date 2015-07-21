angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController)

function NavigationController($scope, $state, $modal) {

    $scope.changeLocation = function() {
        var modalInstance = $modal.open({
            templateUrl: 'views/common/change_location.html',
            controller: ChangeLocationController,
            windowClass: "hmodal-warning"
        });
    };

    var getRoles = function() {

        var roles = $scope.global.findKey($scope.global.user.communities, "roles"),
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

        $scope.global.user.profile["roles"] = rolelist;

    };

    if (!$scope.global.user || !$scope.global.user.communities) {
        $scope.$on('sessionReady', function (event, status) {
            getRoles();
        });
    } else getRoles();

}