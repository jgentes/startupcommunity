angular
    .module('startupcommunity')
    .controller('ResourceController', ResourceController);

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
    this.top = top || {};
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

function addResourceController(user, location, user_service, community, communities, resource) {
    this.selectRoles = user_service.roles;

    if (!this.selectedRole) this.selectedRole = 'not involved';

    this.showCurrent = function(profile) {
        self.updateCompany = true;
        self.notlisted = false;
        var oldco = profile;
        self.company = oldco.profile.name;
        if (!self.selectedCompany) self.selectedCompany = {};
        if (oldco.profile.angellist) self.selectedCompany = oldco.profile.angellist;
        self.selectedCompany['name'] = oldco.profile.name;
        self.selectedCompany['key'] = oldco.key;
        if (oldco.profile.industries) self.selectedCompany['industries'] = oldco.profile.industries;
        if (oldco.profile.stage) self.selectedCompany['stage'] = oldco.profile.stage;
        if (oldco.profile.headline) self.selectedCompany['high_concept'] = oldco.profile.headline;
        if (oldco.profile.summary) self.selectedCompany['product_desc'] = oldco.profile.summary;
        if (oldco.profile.avatar) self.selectedCompany['thumb_url'] = oldco.profile.avatar;

        if (oldco.profile.parents) {
            switch(oldco.profile.parents[0]) {
                case 'consumer-goods':
                    self.selectedCompany['parent'] = 'Consumer Goods';
                    break;
                case 'non-profit':
                    self.selectedCompany['parent'] = 'Non-Profit';
                    break;
                default:
                    self.selectedCompany['parent'] = oldco.profile.parents[0][0].toUpperCase() + oldco.profile.parents[0].slice(1);
            }
        }

        for (role in self.user.roles) {
            for (co in self.user.roles[role]) {
                if (co == oldco.key) {
                    self.selectedRole = role;
                    break;
                }
            }
        }
        self.alert = { type: 'warning', message: self.selectedCompany.name + ' is already in the system, but you may update the company record.'};
    };

    if (resource) {
        // if resource is passed in, probably editing existing resource profile
        this.showCurrent(resource);
        this.update = true;
        this.alert = undefined;
    }
}
