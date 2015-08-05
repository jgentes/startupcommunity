angular
    .module('startupcommunity')
    .controller('SearchController', SearchController);

function SearchController($stateParams, user_api, result_api) {
    this.lastQuery = "*"; // used to hide filters
    console.log($stateParams);

}