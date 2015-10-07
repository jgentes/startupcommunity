angular
    .module('startupcommunity')
    .controller('LocationController', LocationController);

function LocationController(communities, top) {

    this.top = top.data;
    this.communities = communities.data;



    console.log(top.data);
    console.log(communities.data);



    $('.splash').css('display', 'none');
}

