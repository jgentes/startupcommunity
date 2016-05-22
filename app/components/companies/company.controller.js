angular
    .module('startupcommunity')
    .controller('CompanyController', CompanyController)
    .controller('CompanyProfileController', CompanyProfileController)
    .controller('EditCompanyController', EditCompanyController);

function CompanyController($scope, $stateParams, $state, $location, company_service, result_service, $sce) {

    this.selectedClusters = [];
    this.selectedResources = [];
    this.selectedStage = ['*'];
    this.selectedType = ['*'];
    this.communityFilter = [$stateParams.location_path];
    
    var self = this; // for accessing 'this' in child functions

    this.resource_page = $state.includes('resource.list');
    this.resource_types = company_service.resource_types();

    this.url = $stateParams.community_path && $stateParams.location_path ?
        "({community_path: val})" :
        "({location_path: val})";
    
    this.usercount = 16;

    // Title of list box changes based on context
    var setTitle = function(){
        var item;
        self.stage = '';
        self.cluster = '';

        if (self.selectedStage[0] == '*') {
            self.stage = self.resource_page ? "Resources" : "Companies";
        } else {
            for (item in self.selectedStage) {
                self.stage += self.selectedStage[item];
                if (item < self.selectedStage.length - 1) {
                    if (item < self.selectedStage.length - 2 ) {
                        self.stage += '</strong>,<strong> ';
                    } else self.stage += ' </strong>&<strong> ';
                }
            }

            self.stage += " Companies";
        }

        if (self.selectedClusters.length == 0 && self.selectedResources.length == 0) {
            if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                self.selection = $scope.global.community.community_profiles[$stateParams.location_path].name;
            } else self.selection = $scope.global.community.profile.name;
        } else {
            self.selection = "";
            var selectedCommunities = self.selectedClusters.concat(self.selectedResources);
            for (item in selectedCommunities) {
                self.selection += $scope.global.community[selectedCommunities[item]].profile.name;
                if (item < selectedCommunities.length - 1) {
                    if (item < selectedCommunities.length - 2 ) {
                        self.selection += ', ';
                    } else self.selection += ' & ';
                }
            }
        }
        
        $scope.global.query = $stateParams.query || undefined;

        if (!$scope.global.query || $scope.global.query == "*") {
            self.title = '<strong>' + self.stage + '</strong> in ' + self.selection;
        } else {
            self.title = self.resource_page ? 'Resources' : 'Companies' + ' matching <strong>"' + $scope.global.query + '"</strong> ';
            self.title += ' in <strong>';
            if ($stateParams.community_path && $stateParams.location_path) {
                if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                    self.title += $scope.global.community.community_profiles[$stateParams.location_path].name +'</strong>';
                } else self.title += $scope.global.community.profile.name +'</strong>';
            } else self.title += $scope.global.community.profile.name + '</strong>';
        }

        var pageTitle = '<br><small>' + $scope.global.community.profile.name + '</small>';
        self.pageTitle = $sce.trustAsHtml(pageTitle);
    };

    this.filterType = function(type) {
        console.log(type);
        self.loadingType = true;
        if (type == '*') {
            self.selectedType = ['*'];
        } else {
            if (self.selectedType.indexOf('*') > -1) {
                self.selectedType.splice(self.selectedType.indexOf('*'), 1);
            }
            if (self.selectedType.indexOf(type) < 0) {
                self.selectedType.push(type);
            } else self.selectedType.splice(self.selectedType.indexOf(type), 1);
            if (self.selectedType.length === 0) {
                self.selectedType = ['*'];
            }
        }

        company_service.search(self.communityFilter, self.clusterFilter, undefined, null, self.selectedType, 20, self.resource_page, undefined)
            .then(function(response) {
                self.loadingType = false;
                self.companies = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.filterStage = function(stage) {
        self.loadingStage = true;
        if (stage == '*') {
            self.selectedStage = ['*'];
        } else {
            if (self.selectedStage.indexOf('*') > -1) {
                self.selectedStage.splice(self.selectedStage.indexOf('*'), 1);
            }
            if (self.selectedStage.indexOf(stage) < 0) {
                self.selectedStage.push(stage);
            } else self.selectedStage.splice(self.selectedStage.indexOf(stage), 1);
            if (self.selectedStage.length === 0) {
                self.selectedStage = ['*'];
            }
        }

        company_service.search(self.communityFilter, self.clusterFilter, undefined, self.selectedStage, null, 20, self.resource_page, undefined)
            .then(function(response) {
                self.loadingStage = false;
                self.companies = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.filterClusters = function(selection) {
        if (selection == undefined) {
            self.selectedClusters = [];
        } else {
            if (self.selectedClusters.indexOf(selection) < 0) {
                self.selectedClusters.push(selection);
            } else self.selectedClusters.splice(self.selectedClusters.indexOf(selection), 1);
            if (self.selectedClusters.length == 0) self.allClusters = true;
        }

        company_service.search(self.communityFilter, self.selectedClusters, undefined, self.selectedStage, null, 30, self.resource_page, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingResource = false;
                self.companies = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.filterResources = function(selection) {
        if (selection == undefined) {
            self.selectedResources = [];
        } else {
            if (self.selectedResources.indexOf(selection) < 0) {
                self.selectedResources.push(selection);
            } else self.selectedResources.splice(self.selectedResources.indexOf(selection), 1);
            if (self.selectedResources.length == 0) self.allResources = true;
        }

        self.communityFilter = self.communityFilter.concat(self.selectedResources);

        company_service.search(self.communityFilter, self.clusterFilter, undefined, self.selectedStage, null, 20, self.resource_page, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingResource = false;
                self.companies = result_service.setPage(response.data);
                setTitle();
            });
    };

    var loadCtrl = function() {
        onLoad(); //de-register the watcher

        self.searchCompanies = function (resource_page, alturl) {
            self.loadingCompany = true;

            // remove random sort
            if (alturl) alturl = alturl.replace(/([&\?]sort=_random*$|sort=_random&|[?&]sort=_random(?=#))/, '');

            if ($scope.global.query && $scope.global.query !== '*') {
                self.tag = $scope.global.query;
            } else self.tag = undefined;

            var limit = $location.search().limit;

            setTitle();

            company_service.search(self.communityFilter, self.clusterFilter, $scope.global.query, undefined, undefined, limit || self.usercount, self.resource_page, alturl)
                .then(function (response) {
                    self.tag = undefined;
                    self.companies = result_service.setPage(response.data);
                    self.loadingCompany = false;
                    self.lastQuery = $scope.global.query;
                });
        };

        if ($scope.global.community.type == 'cluster') {
            if ($scope.global.community.community_profiles[$stateParams.location_path]) {
                self.clusterFilter = $scope.global.community.community_profiles[$stateParams.location_path].industries;
            } else self.clusterFilter = $scope.global.community.profile.industries;
        } else {
            self.clusterFilter = [];
            if ($scope.global.community.type == 'user' || $scope.global.community.type == 'company') {
                $scope.global.community = $scope.global.location;
            } else if ($scope.global.community.key && $scope.global.community.key !== $scope.global.location.key) self.communityFilter.push($scope.global.community.key);
        }

        self.searchCompanies(self.resource_page);
    };

    var onLoad = $scope.$watch(function () {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
    });
}

function CompanyProfileController($scope, $stateParams, $mixpanel, user_service, community_service, result_service, $location, sweet, $window, $http) {

    $mixpanel.track('Viewed Company');

    if (!jQuery.isEmptyObject($stateParams.profile)) this.company = $stateParams.profile; // set basic profile details while pulling the rest

    var self = this;
    this.team_panels = user_service.team_panels();

    var loadCtrl = function() {
        onLoad(); // de-register the watcher
        
        if ($scope.global.community && $scope.global.community.type == "company" && $scope.global.community.team) {
            // if directly accessed via url
            self.company = $scope.global.community;
        } else {
            var companykey = (self.company && self.company.key) ?
                self.company.key :
                $stateParams.community_path ?
                    $stateParams.community_path :
                    $stateParams.location_path;

            community_service.getCommunity(companykey)
                .then(function (response) {
                    self.company = response.data;
                });
        }
        
    };

    var onLoad = $scope.$watch(function () {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
    });

    this.remove = function(role) {
        
        user_service.removeRole(role, self.company.key)
            .then(function(response) {
                $http.get('/api/2.1/community/' + self.company.key + '?nocache=true'); //clear cache

                if (response.status !== 201) {
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
                    }, function () {
                        $window.location.href = '/' + self.company.key;
                    });
                }
            })
    };

    this.getResource = function(alturl) {
        self.loadingUser = true;

        // remove random sort
        if (alturl) alturl = alturl.replace(/([&\?]sort=_random*$|sort=_random&|[?&]sort=_random(?=#))/, '');

        var limit = $location.search().limit;

        user_service.search([$scope.global.location.key, self.company.key], [], '*', undefined, limit, alturl)
            .then(function (response) {
                self.users = result_service.setPage(response.data);
                self.loadingUser = false;                
            });
    };

}

function EditCompanyController($scope, $state, $stateParams, sweet, $q, $window, $http, user_service, company_service, community_service) {
    var self = this;

    this.step = 1;
    this.update = false; // used if company already exists
    this.working = false; // used for waiting indicator
    this.parents = []; // need a placeholder until next call is resolved
    this.parents = community_service.parents();
    this.resource_types = []; // need a placeholder until next call is resolved
    this.resource_types = company_service.resource_types();
    this.industries = []; // need a placeholder until next call is resolved
    this.industries = community_service.industries();

    this.stages = [ 'Bootstrap', 'Seed', 'Series A', 'Series B', 'Later'];

    this.selectRoles = user_service.roles();

    if (!this.selectedRole) this.selectedRole = 'not involved';

    // for startup logo upload to S3
    this.uploadLogo = function (file) {
        // get the secure S3 url
        company_service.getLogoUrl(file.name, $scope.global.user.key)
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

        self.working = true;
        var role = self.selectedRole == 'not involved' ? undefined : self.selectedRole;

        var community_path = $scope.global.location.key; // resources can only be created in locations (for now)

        self.selectedCompany.url = self.selectedCompany.url || self.selectedCompany.name.toLowerCase().replace(/\s+/g, '-'); // in case they changed it

        company_service.addCompany(self.selectedCompany, role, $scope.global.location.key, community_path, self.update ? $scope.global.community.key : undefined)
            .then(function(response) {
                self.working = false;

                var wrap = function() {
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
                            $state.go('company.dashboard', {location_path: $scope.global.community.key, community_path: null, profile: $scope.global.community, tail_path: '' });
                        });
                    }
                };

                $http.get('/api/2.1/community/' + response.data.key + '?nocache=true')
                    .then(function() {
                        $scope.global.community = response.data;
                        wrap();
                    }); //clear cache

            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            })

    };

    this.checkUrl = function() {

        self.selectedCompany.url = self.selectedCompany.url || self.selectedCompany.name.toLowerCase().replace(/\s+/g, '-');

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
        self.del_working = true;

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
                    self.del_working = false;

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
                            $http.get('/api/2.1/community/' + $scope.global.user.profile.home); // refresh outdated cache
                            $window.location.href = '/' + $scope.global.user.profile.home;
                        })
                    }
                });
        });
    };

    var loadCtrl = function() {
        onLoad(); //de-register the watcher

        var next = function() {

            self.selectedCompany = {
                city: $scope.global.location.profile.city,
                state: $scope.global.location.profile.state
            };

            self.is_resource = $scope.global.community && $scope.global.community.resource;

            self.showCurrent = function () {

                self.selectedCompany = $scope.global.community.profile;
                self.selectedCompany['url'] = $scope.global.community.key;
                self.selectedCompany['resource_types'] = $scope.global.community.resource_types;

                if ($scope.global.community.profile && $scope.global.community.profile.address) {
                    self.selectedCompany['street'] = $scope.global.community.profile.address.street;
                    self.selectedCompany['city'] = $scope.global.community.profile.address.city;
                    self.selectedCompany['state'] = $scope.global.community.profile.address.state;
                }

                if (self.selectedCompany.parents && self.selectedCompany.parents.length) {
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

                for (role in $scope.global.user.roles) {
                    for (co in $scope.global.user.roles[role]) {
                        if (co == $scope.global.community.key) {
                            self.selectedRole = role;
                            break;
                        }
                    }
                }

            };

            // check if editing existing record
            if ($scope.global.community && ($scope.global.community.type == 'company' || $scope.global.community.resource)) {
                self.update = true;
                self.showCurrent();
            }

        };

        if ($stateParams.community_path !== $scope.global.community.key) {
            if ($stateParams.community_path !== $scope.global.location.key) {
                community_service.getCommunity($stateParams.community_path)
                    .then(function (response) {
                        $scope.global.community = response.data;
                        next();
                    })
            } else {
                $scope.global.community = $scope.global.location;
                next();
            }
        } else next();

    };

    var onLoad = $scope.$watch(function () {
        if ($scope.global.community && $scope.global.community.type) {
           loadCtrl();
        }
    });
}