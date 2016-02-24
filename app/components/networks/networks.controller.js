angular
    .module('startupcommunity')
    .controller('NetworksController', NetworksController)

function NetworksController($stateParams, location, nav_communities, community_service) {
    var self = this;

    this.networkPresentation = {
        accelerators: {
            id: 'accelerators',
            title: 'Accelerators',
            color: 'hnavyblue',
            icon: 'pe-7s-next'
        },
        colleges: {
            id: 'colleges',
            title: 'Colleges',
            color: 'hblue',
            icon: 'pe-7s-next'
        },
        coworking: {
            id: 'coworking',
            title: 'Coworking',
            color: 'hviolet',
            icon: 'pe-7s-plug'
        },
        incubators: {
            id: 'incubators',
            title: 'Incubators',
            color: 'hnavyblue',
            icon: 'pe-7s-light'
        },
        investment: {
            id: 'investment',
            title: 'Investment',
            color: 'hgreen',
            icon: 'pe-7s-gleam'
        },
        meetups: {
            id: 'meetups',
            title: 'Meetups',
            color: 'hviolet',
            icon: 'pe-7s-coffee'
        },
        mentorship: {
            id: 'mentorship',
            title: 'Mentorship',
            color: 'hblue',
            icon: 'pe-7s-study'
        }
    };

    this.network_parents = community_service.network_parents().map(function(item) {
        return self.networkPresentation[item.toLowerCase()];
    });
    this.networks = this.networks || {};
    this.nav_communities = nav_communities;
    this.location = location;
    this.location_key = this.location.key;

    for (item in this.nav_communities) {
        var currentItem = this.nav_communities[item];
        if (currentItem['type'] === 'network') {
            var community = this.nav_communities[item];
            if (community.community_profiles) {
                var communityProfile = community.community_profiles[this.location_key] || false;

                if (communityProfile &&
                    communityProfile.parents &&
                    communityProfile.parents[0]) {
                    var network_type = communityProfile.parents[0];
                    if (!this.networks[network_type]) this.networks[network_type] = {};
                    this.networks[network_type][item] = this.nav_communities[item];
                }
            }
        }
    }

    console.log(this.network_parents);

    console.log(this.networks);
}