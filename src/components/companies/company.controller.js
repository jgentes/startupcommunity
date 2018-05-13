/*global angular*/
/*global jQuery*/
angular
    .module('startupcommunity')
    .controller('CompanyController', CompanyController)
    .controller('CompanyProfileController', CompanyProfileController)
    .controller('EditCompanyController', EditCompanyController);

function CompanyController($scope, $stateParams, $state, $location, company_service, $sce) {

    this.selectedClusters = [];
    //this.selectedResources = [];
    this.selectedStage = ['*'];
    this.selectedType = ['*'];
    this.communityFilter = [$stateParams.location_path];

    var self = this; // for accessing 'this' in child functions

    this.resource_page = $state.includes('resource.list');
    this.resource_types = company_service.resource_types();

    this.url = $stateParams.community_path && $stateParams.location_path ?
        '({community_path: val})' :
        '({location_path: val})';

    // Title of list box changes based on context
    var setTitle = function() {
        var item;
        self.stage = '';
        self.cluster = '';

        if (self.selectedStage[0] == '*') {
            self.stage = self.resource_page ? 'Resources' : 'Companies';
        }
        else {
            for (item in self.selectedStage) {
                self.stage += self.selectedStage[item];
                if (item < self.selectedStage.length - 1) {
                    if (item < self.selectedStage.length - 2) {
                        self.stage += '</strong>,<strong> ';
                    }
                    else self.stage += ' </strong>&<strong> ';
                }
            }

            self.stage += ' Companies';
        }

        if (self.selectedClusters.length == 0) {
            if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                self.selection = $scope.global.community.community_profiles[$stateParams.location_path].name;
            }
            else self.selection = $scope.global.community.name;
        }
        else {
            self.selection = '';
            for (item in self.selectedClusters) {
                self.selection += self.selectedClusters[item][0].toUpperCase() + self.selectedClusters[item].slice(1);
                if (item < self.selectedClusters.length - 1) {
                    if (item < self.selectedClusters.length - 2) {
                        self.selection += ', ';
                    }
                    else self.selection += ' & ';
                }
            }
        }

        $scope.global.query = $stateParams.query || undefined;

        if (!$scope.global.query || $scope.global.query == '*') {
            self.title = '<strong>' + self.stage + '</strong> in ' + self.selection;
        }
        else {
            self.title = self.resource_page ? 'Resources' : 'Companies' + ' matching <strong>"' + $scope.global.query + '"</strong> ';
            self.title += ' in <strong>';
            if ($stateParams.community_path && $stateParams.location_path) {
                if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                    self.title += $scope.global.community.community_profiles[$stateParams.location_path].name + '</strong>';
                }
                else self.title += $scope.global.community.name + '</strong>';
            }
            else self.title += $scope.global.community.name + '</strong>';
        }

        var pageTitle = '<br><small>' + $scope.global.community.name + '</small>';
        self.pageTitle = $sce.trustAsHtml(pageTitle);
    };

    this.filterType = function(type) {

        self.loadingType = true;
        if (type == '*') {
            self.selectedType = ['*'];
        }
        else {
            if (self.selectedType.indexOf('*') > -1) {
                self.selectedType.splice(self.selectedType.indexOf('*'), 1);
            }
            if (self.selectedType.indexOf(type) < 0) {
                self.selectedType.push(type);
            }
            else self.selectedType.splice(self.selectedType.indexOf(type), 1);
            if (self.selectedType.length === 0) {
                self.selectedType = ['*'];
            }
        }

        company_service.search(self.communityFilter, self.clusterFilter, undefined, null, self.selectedType, 16, self.resource_page, undefined)
            .then(function(response) {
                self.loadingType = false;
                self.companies = response.data;
                setTitle();
                self.count = response.data[0] ? response.data[0].count : 0;
                self.limit = 16;
            });
    };

    this.filterStage = function(stage) {
        self.loadingStage = true;
        if (stage == '*') {
            self.selectedStage = ['*'];
        }
        else {
            if (self.selectedStage.indexOf('*') > -1) {
                self.selectedStage.splice(self.selectedStage.indexOf('*'), 1);
            }
            if (self.selectedStage.indexOf(stage) < 0) {
                self.selectedStage.push(stage);
            }
            else self.selectedStage.splice(self.selectedStage.indexOf(stage), 1);
            if (self.selectedStage.length === 0) {
                self.selectedStage = ['*'];
            }
        }

        company_service.search(self.communityFilter, self.clusterFilter, undefined, self.selectedStage, null, 16, self.resource_page, undefined)
            .then(function(response) {
                self.loadingStage = false;
                self.companies = response.data;
                setTitle();
                self.count = response.data[0] ? response.data[0].count : 0;
                self.limit = 16;
            });
    };

    this.filterClusters = function(selection) {
        if (selection == undefined) {
            self.selectedClusters = [];
        }
        else {
            if (self.selectedClusters.indexOf(selection) < 0) {
                self.selectedClusters.push(selection);
            }
            else self.selectedClusters.splice(self.selectedClusters.indexOf(selection), 1);
            if (self.selectedClusters.length == 0) self.allClusters = true;
        }

        company_service.search(self.communityFilter, self.selectedClusters, undefined, self.selectedStage, null, 16, self.resource_page, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingResource = false;
                self.companies = response.data;
                setTitle();
                self.count = response.data[0] ? response.data[0].count : 0;
                self.limit = 16;
            });
    };

    /*
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
                self.companies = response.data;
                setTitle();
            });
    };
*/
    var loadCtrl = function() {
        onLoad(); //de-register the watcher

        self.searchCompanies = function(resource_page, offset) {
            self.loadingCompany = true;

            if ($scope.global.query && $scope.global.query !== '*') {
                self.tag = $scope.global.query;
            }
            else self.tag = undefined;

            var limit = $location.search().limit || 16;

            setTitle();

            company_service.search(self.communityFilter, self.clusterFilter, $scope.global.query, undefined, undefined, limit, self.resource_page, offset)
                .then(function(response) {
                    self.tag = undefined;
                    self.companies = response.data;
                    self.loadingCompany = false;
                    self.lastQuery = $scope.global.query;
                    self.offset = (offset || 0) + limit;
                    self.count = response.data[0] ? response.data[0].count : 0;
                    self.limit = limit;
                });
        };

        if ($scope.global.community.type == 'cluster') {
            if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                self.clusterFilter = $scope.global.community.community_profiles[$stateParams.location_path].industries;
            }
            else self.clusterFilter = $scope.global.community.industries;
        }
        else {
            self.clusterFilter = [];
            /* if ($scope.global.community.type == 'user' || $scope.global.community.type == 'company') {
                 $scope.global.community = $scope.global.location;
             } else*/
            if ($scope.global.community.id && $scope.global.community.id !== $scope.global.location.id) self.communityFilter.push($scope.global.community.id);
        }

        self.searchCompanies(self.resource_page);
    };

    var onLoad = $scope.$watch(function() {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
    });
}

function CompanyProfileController($scope, $stateParams, user_service, community_service, $location, sweet) {

    window.mixpanel.track('Viewed Company');

    if (!jQuery.isEmptyObject($stateParams.profile)) $scope.global['profile'] = $stateParams.profile; // set basic profile details while pulling the rest

    var self = this;
    this.team_panels = user_service.team_panels();

    var loadCtrl = function() {
        onLoad(); // de-register the watcher

        var companyId = ($scope.global.profile && $scope.global.profile.id) ?
            $scope.global.profile.id :
            $stateParams.community_path ?
                $stateParams.community_path :
                $stateParams.location_path;

        if (!$stateParams.noreload && companyId) {
            community_service.getCommunity(companyId)
                .then(function(response) {
                    $scope.global['profile'] = response;

                });
        }
        else $scope.global['profile'] = $scope.global.community;

        user_service.getProfile()
            .then(function(response) {
                $scope.global.user = response.data;
            });

    };

    var onLoad = $scope.$watch(function() {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
    });

    this.remove = function(role) {

        user_service.removeRole(role, $scope.global.profile.id)
            .then(function(response) {

                community_service.getCommunity($scope.global.profile.id)
                    .then(function(response) {
                        $scope.global.profile = response;

                        user_service.getProfile()
                            .then(function(response2) {
                                $scope.global.user = response2.data;
                            });
                    });

                if (response.status !== 201) {
                    sweet.show({
                        title: 'Sorry, something went wrong.',
                        text: response.data.message,
                        type: 'error'
                    });

                }
                else {
                    sweet.show({
                        title: 'Success!',
                        text: response.data.message,
                        type: 'success'
                    });
                }
            });
    };

    this.getResource = function(alturl) {
        self.loadingUser = true;

        // remove random sort
        if (alturl) alturl = alturl.replace(/([&\?]sort=_random*$|sort=_random&|[?&]sort=_random(?=#))/, ''); //eslint-ignore no-useless-escape

        var limit = $location.search().limit || 16;

        user_service.search([$scope.global.location.id, $scope.global.profile.id], [], '*', undefined, limit, alturl)
            .then(function(response) {
                self.users = response.data;
                self.loadingUser = false;
                self.count = response.data[0] ? response.data[0].count : 0;
                self.limit = limit;
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

    this.stages = ['Bootstrap', 'Seed', 'Series A', 'Series B', 'Later'];

    this.selectRoles = user_service.roles();

    if (!this.selectedRole) this.selectedRole = 'not involved';

    // for startup logo upload to S3
    this.uploadLogo = function(file) {
        // get the secure S3 url
        company_service.getLogoUrl(file.name, $scope.global.user.id)
            .then(function(response) {
                var signedUrl = response.data.put,
                    fileUrl = response.data.get;

                var d_completed = $q.defer();
                var xhr = new XMLHttpRequest();
                xhr.file = file;

                xhr.onreadystatechange = function(e) {
                    if (e) console.log(e);
                    if (4 == this.readyState) {
                        self.selectedCompany.avatar = fileUrl;
                        d_completed.resolve(true);
                    }
                };
                xhr.open('PUT', signedUrl, true);
                xhr.setRequestHeader('Content-Type', 'application/octet-stream');
                xhr.send(file);
            });
    };

    this.addCompany = function(e) {
        if (e) e.preventDefault();

        self.selectedCompany.resource = self.is_resource;

        self.working = true;
        var role = self.selectedRole == 'not involved' ? undefined : self.selectedRole;

        var community_path = $scope.global.location.id; // resources can only be created in locations (for now)

        self.selectedCompany.url = self.selectedCompany.url || self.selectedCompany.name.toLowerCase().replace(/\s+/g, '-'); // url is rquired!

        company_service.addCompany(self.selectedCompany, role, $scope.global.location.id, community_path, self.update ? $scope.global.community.id : undefined)
            .then(function(response) {
                self.working = false;

                var wrap = function() {
                    if (response.status !== 200) {
                        sweet.show({
                            title: 'Sorry, something went wrong.',
                            text: response.data.message,
                            type: 'error'
                        });

                    }
                    else {
                        sweet.show({
                            title: 'Success!',
                            text: response.data.message,
                            type: 'success'
                        }, function() {
                            $window.location.href = '/' + $scope.global.profile.id;
                        });
                    }
                };

                $scope.global.profile = response.data;
                wrap();

            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            });

    };

    this.checkUrl = function() {

        self.selectedCompany.url = self.selectedCompany.url || self.selectedCompany.name.toLowerCase().replace(/\s+/g, '-');

        if (!self.update) {
            company_service.checkUrl(self.selectedCompany.website)
                .then(function(response) {

                    if (response.status == 202) {
                        self.alert = { type: 'warning', message: 'That website already exists in the system: <a href="/' + String(response.data.message) + '" target="_blank">Click here to view it.</a>' };
                    }
                    else {
                        self.alert = undefined;
                        self.step++;
                    }

                })
                .catch(function(err) {
                    if (err) console.log(err);
                    // 404 no existing company
                    self.alert = undefined;
                    self.step++;
                });
        }
        else self.step++;
    };

    this.deleteCompany = function(company_id) {
        self.del_working = true;

        sweet.show({
            title: 'Are you sure?',
            text: 'If this resource has founders or team members in the system, only they can delete it.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DD6B55',
            confirmButtonText: 'Yes, delete ' + self.selectedCompany.name + '!',
            closeOnConfirm: false
        }, function() {

            company_service.deleteCompany(company_id)
                .then(function(response) {
                    self.del_working = false;

                    if (response.status !== 204) {
                        sweet.show({
                            title: 'Sorry, something went wrong.',
                            text: response.data.message,
                            type: 'error'
                        });

                    }
                    else {
                        sweet.show({
                            title: 'Deleted!',
                            text: self.selectedCompany.name + ' is gone.',
                            type: 'success'
                        }, function() {
                            $window.location.href = '/' + $scope.global.user.home;
                        });
                    }
                });
        });
    };

    var loadCtrl = function() {
        onLoad(); //de-register the watcher

        var next = function() {

            self.selectedCompany = {
                city: $scope.global.location.city,
                state: $scope.global.location.state
            };

            self.is_resource = ($scope.global.community && $scope.global.community.resource) || $state.current.name == 'resource.add';

            self.showCurrent = function() {

                self.selectedCompany = $scope.global.community;
                self.selectedCompany['url'] = $scope.global.community.id;
                self.selectedCompany['resource_types'] = $scope.global.community.resource_types;

                if ($scope.global.community.address) {
                    self.selectedCompany['street'] = $scope.global.community.address.street;
                    self.selectedCompany['city'] = $scope.global.community.address.city;
                    self.selectedCompany['state'] = $scope.global.community.address.state;
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

                for (var role in $scope.global.user.roles) {
                    for (var co in $scope.global.user.roles[role]) {
                        if (co == $scope.global.community.id) {
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

        if ($stateParams.community_path !== $scope.global.community.id && $stateParams.location_path !== $scope.global.community.id) {
            if ($stateParams.community_path !== $scope.global.location.id && $scope.global.lastitems.indexOf($stateParams.community_path) < 0) {
                community_service.getCommunity($stateParams.community_path)
                    .then(function(response) {
                        $scope.global.community = response;
                        next();
                    });
            }
            else {
                $scope.global.community = $scope.global.location;
                next();
            }
        }
        else next();

    };

    var onLoad = $scope.$watch(function() {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
    });
}
