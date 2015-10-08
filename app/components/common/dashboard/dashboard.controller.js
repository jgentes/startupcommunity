angular
    .module('startupcommunity')
    .controller('DashboardController', DashboardController);

function DashboardController($stateParams, communities, top) {

    var industries = [],
        networks = [];

    this.top = top.data;

    for (c in this.top.companies.top) {
        if (communities.data[this.top.companies.top[c].value] && communities.data[this.top.companies.top[c].value].type == 'industry') {
            industries.push(this.top.companies.top[c]);
            if (industries.length == 3) break;
        }
    }

    for (n in this.top.people.top) {
        if (communities.data[this.top.people.top[n].value] && communities.data[this.top.people.top[n].value].type == 'network') {
            networks.push(this.top.people.top[n]);
            if (networks.length == 3) break;
        }
    }

    this.top.companies.top = industries;
    this.top.people.top = networks;

    this.communities = communities.data;
    this.location_path = $stateParams.location_path;
    var self = this;



    $('.splash').css('display', 'none');
}

