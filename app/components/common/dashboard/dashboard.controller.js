angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($stateParams, top) {

    var self = this;
    if (top && top.data) this.top = top.data;

    this.location_path = $stateParams.location_path;
}

