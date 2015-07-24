angular
    .module('startupcommunity')
    .controller('ContentController', ContentController);

function ContentController(community) {
    this.community = community.data;
}