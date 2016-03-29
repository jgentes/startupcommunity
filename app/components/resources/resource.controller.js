angular
    .module('startupcommunity')
    .controller('ResourceController', ResourceController)
    .controller('AddResourceController', AddResourceController);

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

    var item, currentItem, community, communityProfile;
    
    for (item in this.nav_communities) {
        currentItem = this.nav_communities[item];
        if (currentItem.type === 'network') {
            community = this.nav_communities[item];
            if (community.community_profiles) {
                communityProfile = community.community_profiles[this.location_key] || false;

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

function AddResourceController(community, communities, location, resource) {

    this.addCompany = function(e) {
        if (e) e.preventDefault();

        if (self.selectedRole && (self.selectedRole !== 'not involved')) {
            if (!self.roles[self.selectedRole]) self.roles[self.selectedRole] = true;
        }

        if (self.selectedCompany && self.selectedCompany.parent) {
            // adjust parent industry caps
            self.selectedCompany.parent = self.selectedCompany.parent.toLowerCase();

            if (angular.element('.summary_form a').hasClass('editable-hide')) {
                // they've edited the summary but haven't clicked checkmark to accept changes
                self.alert = { type: 'danger', message: 'You made changes to the summary. Please accept or cancel them before updating.' };
            } else {

                self.working = true;
                var role = self.selectedRole == 'not involved' ? undefined : self.selectedRole;

                if (community.type == 'cluster') community_path = location.key; // do not allow companies to be added directly to clusters
                if (community.type == 'network' && (self.user.roles && self.user.roles.leader && self.user.roles.leader[community.key]) && (self.user.roles.leader[community.key].indexOf(location.key) < 0)) community_path = location.key;

                company_service.addCompany(self.selectedCompany, role, location.key, community_path, self.selectedCompany.key)
                    .then(function(response) {
                        self.working = false;

                        if (response.status !== 200) {
                            sweet.show({
                                title: "Sorry, something went wrong.",
                                text: response.data.message,
                                type: "error"
                            });

                        } else {
                            sweet.show({
                                title: "Success!",
                                text: response.data.message,
                                type: "success"
                            }, function() {
                                if ($uibModalInstance) $uibModalInstance.close();
                                var co_key = response.data.key;

                                // update local profile with company data

                                if (!self.user.roles) {
                                    self.user["roles"] = {};
                                } else {
                                    // search for existing role and delete if found

                                    for (r in self.user.roles) {
                                        for (co in self.user.roles[r]) {
                                            if (co == co_key) {
                                                delete self.user.roles[r][co];
                                            }
                                        }
                                    }
                                }

                                if (self.selectedCompany && self.selectedCompany.key) $http.get('/api/2.1/community/' + self.selectedCompany.key + '?nocache=true');

                                // add new role

                                if (!self.user.roles[role]) {
                                    self.user.roles[role] = {};
                                    self.user.roles[role][co_key] = [location.key];
                                } else if (!self.user.roles[role][co_key]) {
                                    self.user.roles[role][co_key] = [location.key];
                                } else if (self.user.roles[role][co_key].indexOf(location.key) < 0) {
                                    self.user.roles[role][co_key].push(location.key);
                                } // else the damn thing is already there

                                // add community
                                if (!self.user.communities) {
                                    self.user["communities"] = {};
                                }

                                if (self.user.communities.indexOf(co_key) < 0) {
                                    self.user.communities.push(co_key);
                                }

                                self.selectedCompany = undefined;
                                self.company = undefined;
                                self.updateCompany = false;
                                self.selectedRole = 'not involved';
                                self.submitted = false;
                                self.dups = undefined;
                                self.notlisted = false;
                                if (self.update) self.updated = true;
                            })
                        }

                    })
                    .catch(function(error) {
                        self.working = false;
                        self.alert = { type: 'danger', message: String(error.data.message) };
                    })
            }

        } else self.submitted = true;

    };

    this.deleteCompany = function (company_key) {
        self.working = true;

        sweet.show({
            title: "Are you sure?",
            text: "If this company has founders or team members in the system, only they can delete it.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete " + self.selectedCompany.name + "!",
            closeOnConfirm: false
        }, function () {

            company_service.deleteCompany(company_key)
                .then(function(response) {
                    self.working = false;

                    if (response.status !== 204) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: response.data.message,
                            type: "error"
                        });

                    } else {
                        sweet.show({
                            title: "Deleted!",
                            text: self.selectedCompany.name + " is gone.",
                            type: "success"
                        }, function() {
                            $http.get('/api/2.1/community/' + self.user.profile.home); // refresh outdated cache
                            $uibModalInstance.close();
                            $window.location.href = '/' + self.user.profile.home;
                        })
                    }
                });
        });
    };

    
}