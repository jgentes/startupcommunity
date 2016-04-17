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
       
    this.is_resource = $state.current.name == 'resource.add';

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
    this.resource_types = []; // need a placeholder until next call is resolved
    this.resource_types = company_service.resource_types();
    this.selectedCompany = {
        city: location.profile.city,
        state: location.profile.state
    };    

    this.stages = [ 'Bootstrap', 'Seed', 'Series A', 'Series B', 'Later'];

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

    this.addCompany = function(e) {
        if (e) e.preventDefault();

        self.selectedCompany.resource = self.is_resource;
        self.selectedCompany.url = self.selectedCompany.url || encodeURI(self.selectedCompany.name);

        self.working = true;
        var role = self.selectedRole == 'not involved' ? undefined : self.selectedRole;

        var community_path = location.key; // resources can only be created in locations (for now)

        company_service.addCompany(self.selectedCompany, role, location.key, community_path, self.selectedCompany.key)
            .then(function(response) {
                self.working = false;
                //$http.get('/api/2.1/community/' + location.key + '?nocache=true'); // clear cache

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

                    $http.get('/' + response.data.key); // this runs before sweet modal is acknowledged

                }

            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            })

    };

    this.checkUrl = function() {

        company_service.checkUrl(self.selectedCompany.website)
            .then(function(response) {                

                if (response.status == 202) {
                    self.alert = { type: 'warning', message: 'There is already a company with that website in the system: <a href="/' + String(response.data.message) + '">View Company</a>' };
                } else self.step++;

            })
            .catch(function(err) {
                // 404 no existing company
                self.step++;
            })
    };
/*

    if (company) {
        // if company is passed in, probably editing existing company profile
        this.showCurrent(company);
        this.update = true;
        this.alert = undefined;
    }


    this.showCurrent = function(profile) {
        self.updateCompany = true;
        self.notlisted = false;
        var oldco = profile;
        self.company = oldco.profile.name;
        if (!self.selectedCompany) self.selectedCompany = {};
        if (oldco.profile.angellist) self.selectedCompany = oldco.profile;
        self.selectedCompany['name'] = oldco.profile.name;
        self.selectedCompany['key'] = oldco.key;
        if (oldco.profile.industries) self.selectedCompany['industries'] = oldco.profile.industries;
        if (oldco.profile.stage) self.selectedCompany['stage'] = oldco.profile.stage;
        if (oldco.profile.headline) self.selectedCompany['high_concept'] = oldco.profile.headline;
        if (oldco.profile.summary) self.selectedCompany['product_desc'] = oldco.profile.summary;
        if (oldco.profile.avatar) self.selectedCompany['avatar'] = oldco.profile.avatar;

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
        self.alert = { type: 'warning', message: self.selectedCompany.name + ' is already in the system, but you may update it.'};
    };
 */
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