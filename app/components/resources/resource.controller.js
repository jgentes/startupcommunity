angular
    .module('startupcommunity')
    .controller('ResourceController', ResourceController)
    .controller('EditCompanyController', EditCompanyController);

function ResourceController(location, communities, nav_communities, company_service, top, user, $auth) {
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

    this.types = company_service.resource_types();
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

function EditCompanyController(user, sweet, $state, $q, $window, $http, community, location, user_service, company_service, community_service) {
    var self = this;

    console.log(community);

    this.step = 1;
    this.location = location;
    this.community = community;
    this.user = user;
    this.update = false; // used if company already exists
    this.working = false; // used for waiting indicator
    this.parents = []; // need a placeholder until next call is resolved
    this.parents = community_service.parents();
    this.resource_types = []; // need a placeholder until next call is resolved
    this.resource_types = company_service.resource_types();
    this.industries = []; // need a placeholder until next call is resolved
    this.industries = community_service.industries();
    this.selectedCompany = {
        city: location.profile.city,
        state: location.profile.state
    };

    this.encode = function(uri) {
        return encodeURI(uri);
    };

    this.stages = [ 'Bootstrap', 'Seed', 'Series A', 'Series B', 'Later'];

    this.selectRoles = user_service.roles();

    if (!this.selectedRole) this.selectedRole = 'not involved';
       
    this.is_resource = ($state.current.name == 'resource.add') || (self.community.resource == true);

    this.showCurrent = function () {

        self.selectedCompany = self.community.profile;
        self.selectedCompany['url'] = self.community.key;
        self.selectedCompany['resource_types'] = self.community.resource_types;
        
        if (self.community.profile && self.community.profile.address) {
            self.selectedCompany['street'] = self.community.profile.address.street;
            self.selectedCompany['city'] = self.community.profile.address.city;
            self.selectedCompany['state'] = self.community.profile.address.state;
        }

        if (self.selectedCompany.parents) {
            switch (self.selectedCompany.parents[0]) {
                case 'consumer-goods':
                    self.selectedCompany['parent'] = 'Consumer Goods';
                    break;
                case 'non-profit':
                    self.selectedCompany['parent'] = 'Non-Profit';
                    break;
                default:
                    self.selectedCompany['parent'] = self.selectedCompany.parents[0][0].toUpperCase() + self.selectedCompany.parents[0].slice(1);
            }
        }

        for (role in user.roles) {
            for (co in user.roles[role]) {
                if (co == self.community.key) {
                    self.selectedRole = role;
                    break;
                }
            }
        }

    };

    // check if editing existing record
    if (this.community && this.community.type == 'company' || this.community.type == 'resource') {
        this.update = true;
        this.showCurrent();

    }

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
                        self.selectedCompany.avatar = fileUrl;
                        d_completed.resolve(true);
                    }
                };
                xhr.open('PUT', signedUrl, true);
                xhr.setRequestHeader("Content-Type","application/octet-stream");
                xhr.send(file);
            })
    };

    this.addCompany = function(e) {
        if (e) e.preventDefault();

        self.selectedCompany.resource = self.is_resource;
        self.selectedCompany.url = self.selectedCompany.url || encodeURI(self.selectedCompany.name);

        self.working = true;
        var role = self.selectedRole == 'not involved' ? undefined : self.selectedRole;

        var community_path = location.key; // resources can only be created in locations (for now)
        console.log(self.selectedCompany);

        company_service.addCompany(self.selectedCompany, role, location.key, community_path, self.community.key)
            .then(function(response) {
                self.working = false;
                $http.get('/api/2.1/community/' + response.data.key + '?nocache=true'); //clear cache

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
                        $window.location.href = '/' + response.data.key;
                    });
                }

            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            })

    };

    this.checkUrl = function() {

        if (!self.update) {
            company_service.checkUrl(self.selectedCompany.website)
                .then(function(response) {

                    if (response.status == 202) {
                        self.alert = { type: 'warning', message: 'That website already exists in the system: <a href="/' + String(response.data.message) + '" target="_blank">Click here to view it.</a>' };
                    } else {
                        self.alert = undefined;
                        self.step++;
                    }

                })
                .catch(function(err) {
                    // 404 no existing company
                    self.alert = undefined;
                    self.step++;
                })
        } else self.step++;
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