angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($stateParams, communities, top) {

    var networks = [];

    this.top = top.data;
    console.log(this.top);

    for (n in this.top.people.top) {
        if (communities.data[this.top.people.top[n].value] && communities.data[this.top.people.top[n].value].type == 'network') {
            networks.push(this.top.people.top[n]);
            if (networks.length == 3) break;
        }
    }

    this.top.people.top = networks;

    this.communities = communities.data;
    this.location_path = $stateParams.location_path;
    var self = this;



    $('.splash').css('display', 'none');
}

