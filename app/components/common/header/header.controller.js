angular
    .module('startupcommunity')
    .controller('HeaderController', HeaderController);

function HeaderController($stateParams, community) {

    this.community = community;

    // for embed
    if (this.community.community_profiles && this.community.community_profiles[$stateParams.community_key]) {
        this.searchname = this.community.community_profiles[$stateParams.community_key].name;
    } else this.searchname = this.community.profile.name;

    this.search = function(query) {
        $state.go('embed.dashboard', {query: query});
    }

}