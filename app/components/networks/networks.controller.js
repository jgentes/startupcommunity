angular
    .module('startupcommunity')
    .controller('NetworksController', NetworksController)

function NetworksController($stateParams, location, nav_communities) {
    this.networks = this.networks || {};
    this.nav_communities = nav_communities;
    this.location = location;
    this.location_key = this.location.key;

    for (item in this.nav_communities) {
        var currentItem = this.nav_communities[item];
        if (currentItem['type'] === 'network') {
            var community = this.nav_communities[item];
            if (community.community_profiles &&
                community.community_profiles[this.location_key] &&
                community.community_profiles[this.location_key].parents &&
                community.community_profiles[this.location_key].parents[0]) {
                var network_type = community.community_profiles[this.location_key].parents[0];
                if (!this.networks[network_type]) this.networks[network_type] = {};
                this.networks[network_type][item] = this.nav_communities[item];
            }
        }
    }

    console.log(this.networks);
}