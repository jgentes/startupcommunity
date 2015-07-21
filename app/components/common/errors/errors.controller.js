angular
    .module('startupcommunity')
    .controller('ErrorPageController', ErrorPageController);

function ErrorPageController($scope, $location, $window, user_api) {

    $scope.formData = {};

    $scope.search = function(query) {
        try {
            user_api.search($scope.global.user.context, query)
                .then(function(results) {
                    $scope.global.search = results.data;
                    $location.path('/search');
                });
        } catch (err) {
            $scope.global.alert = {type: 'danger', msg: 'Whoops, we need you to login first.'};
        }
    };

    $scope.goBack = function() {
        $window.history.back();
    };

}