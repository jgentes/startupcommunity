angular
    .module('startupcommunity')
    .controller('ResourceController', ResourceController)
    .controller('EditResourceController', EditResourceController);

function ResourceController(location, communities, nav_communities, community_service, top, user, $auth) {
    var self = this;

    this.top = top || {}; // this is passed in to avoid re-pulling top on nav click if possible
    this.networks = this.networks || {};
    this.communities = communities;
    this.user = $auth.isAuthenticated() ? user : {};

    this.location = location;
    this.location_key = this.location.key;
    this.nav_jump = (this.location && this.location.type === 'location') ||
                    ((this.community.type === 'user' || this.community.type === 'company') &&
                    (this.location && this.location.type === 'location')) ?
        "({community_path: item.key, community: item, query: '*', location_path: networks.location.key, top: networks.top, communities: networks.communities, user: networks.user })" :
        "({community_path: item.key, community: item, query: '*', location_path: networks.user.profile.home, top: networks.top, communities: networks.communities, user: networks.user })";

    this.types = community_service.resource_types();
    var resources = nav_communities;

    for (item in resources.resources) {
        var currentItem = resources.resources[item];
        if (resources[currentItem].resource_types && resources[currentItem].resource_types.length) {
            for (type in resources[currentItem].resource_types) {
                self.networks[resources[currentItem].resource_types[type]] = self.networks[resources[currentItem].resource_types[type]] || [];
                self.networks[resources[currentItem].resource_types[type]].push(resources[currentItem]);
            }
        }
    }
   
    
    
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
        company_service.getLogoUrl(file.name, self.user.key)
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

        self.selectedCompany.resource = resource_if_true || false;
        self.selectedCompany.url = self.selectedCompany.url || encodeURI(self.selectedCompany.name);

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
                    });
/*
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
                    */
                }

            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            })

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