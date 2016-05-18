angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController() {
    
    angular.element(document).ready(function () {
        setTimeout(function() {
            $('#dash-tour').tooltip();
            $('#dash-tour').off('.tooltip'); // to avoid tooltip everywhere on dash
        }, 2000);
    });
}

