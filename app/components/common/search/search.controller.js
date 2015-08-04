angular
    .module('startupcommunity')
    .controller('SearchController', SearchController);

function SearchController($stateParams, community) {
    console.log($stateParams);
    this.lastQuery = 'marketing'; //used to hide filters in search view
    /*
    this.search = function(query) {
        this.search.tag = query;
        this.search.results = undefined;
        user_api.search('bend-or', query)
            .then(function(response) {
                this.search.results = result_api.setPage(response.data);
                this.search.lastQuery = query;
            });
    };
    */
}