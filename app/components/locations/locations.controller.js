angular
    .module('startupcommunity')
    .controller('LocationController', LocationController)
    .controller('ChangeLocationController', ChangeLocationController);

function LocationController($state, $location, users, community) {

    this.community = community.data;
    this.users = users.data.results;
    community["communities"] = community.data;

    if ($state.params.community.key) {
        $location.path('/' + $state.params.community.key)
    }

    $state.charts = {
        people: {},
        startups: {},
        jobs: {}
    };

    $state.charts.people.labels = ["", "", "", ""];
    $state.charts.people.series = ['Monthly Growth'];
    $state.charts.people.data = [[157, 165, 172, 184]];
    $state.charts.people.colors = ["#97BBCD"];

    $state.charts.startups.labels = ["", "", "", ""];
    $state.charts.startups.series = ['Monthly Growth'];
    $state.charts.startups.data = [[77, 78, 78, 79]];
    $state.charts.startups.colors = ["#A1BE85"];

    $state.charts.jobs.labels = ["", "", "", ""];
    $state.charts.jobs.series = ['Monthly Growth'];
    $state.charts.jobs.data = [[294, 290, 320, 325]];
    $state.charts.jobs.colors = ["#FF7D80"];

    $state.charts.options = {
        scaleShowGridLines: false,
        animation: false,
        showScale: false
    };

    $state.leaders = this.users;
}

function ChangeLocationController($state, $modalInstance){
    $state.ok = function () {
        $modalInstance.close();
    };

    $state.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}