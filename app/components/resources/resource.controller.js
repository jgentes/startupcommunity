angular
    .module('startupcommunity')
    .controller('ResourceController', ResourceController)
    .controller('EditResourceController', EditResourceController);

function ResourceController($stateParams, location, communities, nav_communities, community_service, top, user, $auth) {
    var self = this;

    var resourcePresentation = {
        accelerators: {
            title: 'Accelerators',
            color: 'hnavyblue',
            icon: 'pe-7s-next'
        },
        colleges: {
            title: 'Colleges',
            color: 'hblue',
            icon: 'pe-7s-culture'
        },
        coworking: {
            title: 'Coworking',
            color: 'hviolet',
            icon: 'pe-7s-plug'
        },
        incubators: {
            title: 'Incubators',
            color: 'hnavyblue',
            icon: 'pe-7s-light'
        },
        investment: {
            title: 'Investment',
            color: 'hgreen',
            icon: 'pe-7s-gleam'
        },
        meetups: {
            title: 'Meetups',
            color: 'hviolet',
            icon: 'pe-7s-coffee'
        },
        mentorship: {
            title: 'Mentorship',
            color: 'hblue',
            icon: 'pe-7s-study'
        }
    };

    this.resource_types = community_service.resource_types().map(function(item) {
        return resourcePresentation[item.toLowerCase()];
    });
    this.top = top || {}; // this is passed in to avoid re-pulling top on nav click if possible
    this.networks = this.networks || {};
    this.communities = communities;
    this.user = $auth.isAuthenticated() ? user : {};
    this.resources = nav_communities.resources;

    this.location = location;
    this.location_key = this.location.key;
    this.nav_jump = (this.location && this.location.type === 'location') ||
                    ((this.community.type === 'user' || this.community.type === 'company') &&
                    (this.location && this.location.type === 'location')) ?
        "({community_path: item.key, community: item, query: '*', location_path: networks.location.key, top: networks.top, communities: networks.communities, user: networks.user })" :
        "({community_path: item.key, community: item, query: '*', location_path: networks.user.profile.home, top: networks.top, communities: networks.communities, user: networks.user })";

    for (item in this.resources) {
        var currentItem = this.resources[item];
        if (currentItem.resource) {
            if (currentItem.resource_types && currentItem.resource_types.length) {
                for (type in currentItem.resource_types) {
                    self.networks[currentItem.resource_types[type]] = self.networks[currentItem.resource_types[type]] || [];
                    self.networks[currentItem.resource_types[type]].push(currentItem);
                }
            }
        }
    }
    // former network view
    /*for (var item in this.resources) {
        var currentItem = this.resources[item];
        if (currentItem.type === 'network') {
            var community = this.resources[item];
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
    }*/
}

function EditResourceController(user, sweet, $state, $q, $window, $http, community, location, communities, user_service, company_service, community_service) {
    var self = this;

    // Initial step
    this.step = 1;

    // Wizard functions
    this.wizard =  {
        show: function(number) {
            self.step = number;
        },
        next: function() {
            self.step++ ;
        },
        prev: function() {
            self.step-- ;
        }
    };

    this.encode = function(uri) {
        return encodeURI(uri);
    };
    
    this.location = location;
    this.community = community;
    this.user = user;
    this.working = false; // used for waiting indicator
    this.updateCompany= false; // used if company already exists
    this.parents = []; // need a placeholder until next call is resolved
    this.parents = community_service.parents();
    this.resource_types = [];
    this.resource_types = community_service.resource_types();
    this.selectedCompany = {
        city: location.profile.city,
        state: location.profile.state
    };

    this.selectRoles = user_service.roles();

    if (!this.selectedRole) this.selectedRole = 'not involved';

    // for startup logo upload to S3
    this.uploadLogo = function (file) {
        // get the secure S3 url
        company_service.getLogoUrl(file.name, self.selectedCompany.name)
            .then(function(response) {
                var signedUrl = response.data.put,
                    fileUrl = response.data.get;

                var d_completed = $q.defer();
                var xhr = new XMLHttpRequest();
                xhr.file = file;

                xhr.onreadystatechange = function(e) {
                    if ( 4 == this.readyState ) {
                        self.selectedCompany.thumb_url = fileUrl;
                        d_completed.resolve(true);
                    }
                };
                xhr.open('PUT', signedUrl, true);
                xhr.setRequestHeader("Content-Type","application/octet-stream");
                xhr.send(file);
            })
    };

    this.addCompany = function(e, resource_if_true) {
        if (e) e.preventDefault();

        if (self.selectedCompany && self.selectedCompany.parent) {

            self.selectedCompany.resource = resource_if_true || false;

            if (angular.element('.summary_form a').hasClass('editable-hide')) {
                // they've edited the summary but haven't clicked checkmark to accept changes
                self.alert = { type: 'danger', message: 'You made changes to the summary. Please accept or cancel them before updating.' };
            } else {

                self.working = true;
                var role = self.selectedRole == 'not involved' ? undefined : self.selectedRole;

                var community_path = location.key; // resources can only be created in locations (for now)
                console.log(self.selectedCompany);

                company_service.addCompany(self.selectedCompany, role, location.key, community_path, self.selectedCompany.key)
                    .then(function(response) {
                        self.working = false;
                        $http.get('/api/2.1/community/' + location.key + '?nocache=true'); // clear cache

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
                                if ($uibModalInstance) $uibModalInstance.close();

                                $state.reload();
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
            text: "If this resource has founders or team members in the system, only they can delete it.",
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