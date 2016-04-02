angular
    .module('startupcommunity')
    .controller('ResourceController', ResourceController)
    .controller('EditResourceController', EditResourceController);

function ResourceController($stateParams, location, communities, nav_communities, community_service, top, user, $auth) {
    var self = this;

    var resourcePresentation = {
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
            icon: 'pe-7s-culture'
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
        return resourcePresentation[item.toLowerCase()];
    });
    this.top = top || {}; // this is passed in to avoid re-pulling top on nav click if possible
    this.networks = this.networks || {};
    this.communities = communities;
    this.user = $auth.isAuthenticated() ? user : {};
    this.nav_communities = nav_communities;

    this.location = location;
    this.location_key = this.location.key;
    this.nav_jump = (this.location && this.location.type === 'location') ||
                    ((this.community.type === 'user' || this.community.type === 'company') &&
                    (this.location && this.location.type === 'location')) ?
        "({community_path: item.key, community: item, query: '*', location_path: networks.location.key, top: networks.top, communities: networks.communities, user: networks.user })" :
        "({community_path: item.key, community: item, query: '*', location_path: networks.user.profile.home, top: networks.top, communities: networks.communities, user: networks.user })";

    for (var item in this.nav_communities) {
        var currentItem = this.nav_communities[item];
        if (currentItem.type === 'network') {
            var community = this.nav_communities[item];
            if (community.community_profiles) {
                var communityProfile = community.community_profiles[this.location_key] || false;

                if (communityProfile &&
                    communityProfile.parents) {
                    communityProfile.parents.map(function(network_type) {
                        self.networks[network_type] = self.networks[network_type] || [];
                        self.networks[network_type].push(community);
                    });
                }
            }
        }
    }
}

function EditResourceController(user, community, location, communities, user_service, company_service, company) {
    var self = this;
    
    this.working = false; // used for waiting indicator
    this.updateCompany= false; // used if company already exists

    this.selectRoles = user_service.roles();

    if (!this.selectedRole) this.selectedRole = 'not involved';

    // for startup logo upload to S3
    this.uploadLogo = function (file) {
        // get the secure S3 url
        company_service.getLogoUrl(file, self.selectedCompany.name)
            .then(function(response) {
                console.log(response);

                self.selectedCompany.thumb_url = response;

            })

    };
}