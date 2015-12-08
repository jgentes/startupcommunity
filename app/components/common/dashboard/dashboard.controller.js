angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($stateParams, top) {

    var self = this;
    if (top && top.data) this.top = top.data;

    this.max = this.top.parents[0].value + this.top.parents[1].value + this.top.parents[2].value;

    this.location_path = $stateParams.location_path;

    angular.element(document).ready(function () {
        setTimeout(function() {
            $('#dash-tour').tooltip();
            $('#dash-tour').off('.tooltip'); // to avoid tooltip everywhere on dash
        }, 2000);
    });
}

