angular
    .module('startupcommunity')
    .controller('NetworkController', NetworkController);

function NetworkController($state, $scope, $location, user_api) {
    /*
    if ($state.params.community.key) {
        $location.path('/' + $state.params.community.key)
    }
    */
    $scope.charts = {
        people: {},
        startups: {},
        jobs: {}
    };

    $scope.charts.people.labels = ["", "", "", ""];
    $scope.charts.people.series = ['Monthly Growth'];
    $scope.charts.people.data = [[157, 165, 172, 184]];
    $scope.charts.people.colors = ["#97BBCD"];

    $scope.charts.startups.labels = ["", "", "", ""];
    $scope.charts.startups.series = ['Monthly Growth'];
    $scope.charts.startups.data = [[77, 78, 78, 79]];
    $scope.charts.startups.colors = ["#A1BE85"];

    $scope.charts.jobs.labels = ["", "", "", ""];
    $scope.charts.jobs.series = ['Monthly Growth'];
    $scope.charts.jobs.data = [[294, 290, 320, 325]];
    $scope.charts.jobs.colors = ["#FF7D80"];

    $scope.charts.options = {
        scaleShowGridLines: false,
        animation: false,
        showScale: false
    };

    var getLeaders = function() {

        user_api.getUsers(undefined, $state.params.community.key, undefined, encodeURIComponent(['Advisor']), 30) //todo change to Leader
            .then( function(result) {
                $scope.leaders = result.data.results;
            })
    };

    getLeaders();

}