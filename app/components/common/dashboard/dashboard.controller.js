angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($stateParams, communities, top) {

    var networks = [];
    var self = this;
    console.log(top.data);

    if (top && top.data && top.data.people.top) {
        this.top = top.data;

        for (n in this.top.people.top) {
            if (communities.data[this.top.people.top[n].value] && communities.data[this.top.people.top[n].value].type == 'network') {
                networks.push(this.top.people.top[n]);
                if (networks.length == 3) break;
            }
        }

        this.top.people.top = networks;
    }

    this.communities = communities.data;
    this.location_path = $stateParams.location_path;

    $('.splash').css('display', 'none');
}

