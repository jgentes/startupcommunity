angular
    .module('startupcommunity')
    .controller('NetworkController', NetworkController);

function NetworkController($scope) {

    $scope.charts = {
        people: {},
        companies: {},
        jobs: {}
    };

    $scope.charts.people.labels = ["", "", "", ""];
    $scope.charts.people.series = ['Monthly Growth'];
    $scope.charts.people.data = [[157, 165, 172, 184]];
    $scope.charts.people.colors = ["#97BBCD"];

    $scope.charts.companies.labels = ["", "", "", ""];
    $scope.charts.companies.series = ['Monthly Growth'];
    $scope.charts.companies.data = [[77, 78, 78, 79]];
    $scope.charts.companies.colors = ["#A1BE85"];

    $scope.charts.jobs.labels = ["", "", "", ""];
    $scope.charts.jobs.series = ['Monthly Growth'];
    $scope.charts.jobs.data = [[294, 290, 320, 325]];
    $scope.charts.jobs.colors = ["#FF7D80"];

    $scope.charts.options = {
        scaleShowGridLines: false,
        animation: false,
        showScale: false
    };

    $('.splash').css('display', 'none');

}