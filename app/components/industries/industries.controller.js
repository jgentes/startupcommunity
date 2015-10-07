angular
    .module('startupcommunity')
    .controller('IndustryController', IndustryController);

function IndustryController($stateParams, leaders) {

    this.community = $stateParams.community;
    this.leaders = leaders.data.results;

    this.charts = {
        people: {},
        companies: {},
        jobs: {}
    };

    this.charts.people.labels = ["", "", "", ""];
    this.charts.people.series = ['Monthly Growth'];
    this.charts.people.data = [[157, 165, 172, 184]];
    this.charts.people.colors = ["#97BBCD"];

    this.charts.companies.labels = ["", "", "", ""];
    this.charts.companies.series = ['Monthly Growth'];
    this.charts.companies.data = [[77, 78, 78, 79]];
    this.charts.companies.colors = ["#A1BE85"];

    this.charts.jobs.labels = ["", "", "", ""];
    this.charts.jobs.series = ['Monthly Growth'];
    this.charts.jobs.data = [[294, 290, 320, 325]];
    this.charts.jobs.colors = ["#FF7D80"];

    this.charts.options = {
        scaleShowGridLines: false,
        animation: false,
        showScale: false
    };

    $('.splash').css('display', 'none');
}
