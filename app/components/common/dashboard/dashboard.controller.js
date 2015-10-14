angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($stateParams, top) {

    var networks = [];
    var self = this;
    if (top && top.data) this.top = top.data;
    console.log(top);

    this.location_path = $stateParams.location_path;

    $('.splash').css('display', 'none');
}

