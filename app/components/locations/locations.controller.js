angular
    .module('startupcommunity')
    .controller('LocationController', LocationController)
    .controller('ChangeLocationController', ChangeLocationController);

function LocationController($stateParams, $location, leaders) {
/*
    if ($stateParams.community.key) {
        $location.path('/' + $stateParams.community.key, false)
    }
*/
    this.community = $stateParams.community;
    this.leaders = leaders.data.results;

    this.charts = {
        people: {},
        startups: {},
        jobs: {}
    };

    this.charts.people.labels = ["", "", "", ""];
    this.charts.people.series = ['Monthly Growth'];
    this.charts.people.data = [[157, 165, 172, 184]];
    this.charts.people.colors = ["#97BBCD"];

    this.charts.startups.labels = ["", "", "", ""];
    this.charts.startups.series = ['Monthly Growth'];
    this.charts.startups.data = [[77, 78, 78, 79]];
    this.charts.startups.colors = ["#A1BE85"];

    this.charts.jobs.labels = ["", "", "", ""];
    this.charts.jobs.series = ['Monthly Growth'];
    this.charts.jobs.data = [[294, 290, 320, 325]];
    this.charts.jobs.colors = ["#FF7D80"];

    this.charts.options = {
        scaleShowGridLines: false,
        animation: false,
        showScale: false
    };
}

function ChangeLocationController($state, $modalInstance){
    $state.ok = function () {
        $modalInstance.close();
    };

    $state.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}