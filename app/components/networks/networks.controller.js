angular
    .module('startupcommunity')
    .controller('NetworksController', NetworksController)

function NetworksController($stateParams) {
    this.pageTitle = $stateParams.pageTitle;
}