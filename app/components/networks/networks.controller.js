angular
    .module('startupcommunity')
    .controller('NetworksController', NetworksController)

function NetworksController($stateParams) {
    console.log('stateParams', $stateParams);
    this.pageTitle = $stateParams.pageTitle;
}