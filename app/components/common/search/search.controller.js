angular
    .module('startupcommunity')
    .controller('SearchController', SearchController);

function SearchController(user_api, $stateParams, result_api) {

    this.search = function(query) {
        this.search.tag = query;
        this.search.results = undefined;
        user_api.search($stateParams.community.key, query)
            .then(function(response) {
                this.search = result_api.setPage(response.data);
                this.search.lastQuery = query;
                $location.path('/search');
            });
    };

}