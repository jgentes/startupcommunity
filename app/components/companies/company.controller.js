angular
    .module('startupcommunity')
    .controller('CompanyController', CompanyController)
    .controller('CompanyProfileController', CompanyProfileController);

function CompanyController($scope, $stateParams, $state, $location, company_service, result_service, $sce) {

    this.selectedClusters = [];
    this.selectedResources = [];
    this.selectedStage = ['*'];
    this.selectedType = ['*'];
    this.communityFilter = [$stateParams.location_path];
    
    var self = this; // for accessing 'this' in child functions

    this.resource_page = $state.includes('resource.list');
    this.resource_types = company_service.resource_types();

    var query = $stateParams.query || '*';

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

        if (query == "*") {
            self.title = '<strong>' + self.stage + '</strong> in ' + self.selection;
        } else {
            self.title = 'Companies matching <strong>"' + query + '"</strong> ';
            self.title += 'in <strong>';
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

        company_service.search(self.communityFilter, self.clusterFilter, '*', null, self.selectedType, 20, self.resource_page, undefined)
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

        company_service.search(self.communityFilter, self.clusterFilter, '*', self.selectedStage, null, 20, self.resource_page, undefined)
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

        company_service.search(self.communityFilter, self.selectedClusters, '*', self.selectedStage, null, 30, self.resource_page, undefined)
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

        company_service.search(self.communityFilter, self.clusterFilter, '*', self.selectedStage, null, 20, self.resource_page, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingResource = false;
                self.companies = result_service.setPage(response.data);
                setTitle();
            });
    };

    var loadCtrl = function() {

        self.searchCompanies = function (resource_page, alturl) {
            self.loadingUser = true;

            // remove random sort
            if (alturl) alturl = alturl.replace(/([&\?]sort=_random*$|sort=_random&|[?&]sort=_random(?=#))/, '');

            if (query !== '*') {
                self.tag = query;
            } else self.tag = undefined;

            var limit = $location.search().limit;

            setTitle();

            company_service.search(self.communityFilter, self.clusterFilter, query, undefined, undefined, limit || self.usercount, self.resource_page, alturl)
                .then(function (response) {
                    self.tag = undefined;
                    self.companies = result_service.setPage(response.data);
                    self.loadingUser = false;
                    self.lastQuery = query;
                });
        };

        if ($scope.global.community.type == 'cluster') {
            if ($scope.global.community.community_profiles[$stateParams.location_path]) {
                self.clusterFilter = $scope.global.community.community_profiles[$stateParams.location_path].industries;
            } else self.clusterFilter = $scope.global.community.profile.industries;
        } else {
            self.clusterFilter = [];
            if ($scope.global.community.key && $scope.global.community.key !== $scope.global.community.key) self.communityFilter.push($scope.global.community.key);
        }

        onLoad(); //de-register the watcher
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
        
        onLoad(); // de-register the watcher
        
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