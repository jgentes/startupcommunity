angular
    .module('startupcommunity')
    .controller('ContentController', ContentController);

function ContentController($stateParams, community) {
    $stateParams.community ? this.community = $stateParams.community : this.community = community;
}