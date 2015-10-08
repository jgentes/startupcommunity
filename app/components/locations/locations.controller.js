angular
    .module('startupcommunity')
    .controller('LocationController', LocationController);

function LocationController($stateParams, communities, top) {

    this.top = top.data;
    this.communities = communities.data;
    this.location_path = $stateParams.location_path;

    console.log(top);
    console.log(communities);




    $('.splash').css('display', 'none');
}

