angular
    .module('startupcommunity')
    .controller('CompanyController', CompanyController)
    .controller('CompanyProfileController', CompanyProfileController)
    .controller('AddCompanyController', AddCompanyController);

function CompanyController($stateParams, company_service, result_service, $sce, community, communities) {

    this.community = community;
    this.communities = communities.data;
    this.selectedClusters = [];
    this.selectedNetworks = [];
    this.selectedStage = ['*'];

    var self = this; // for accessing 'this' in child functions
    var query;
    var communityFilter = [$stateParams.location_path];

    if (this.community.type == 'cluster') {
        if (this.community.community_profiles[$stateParams.location_path]) {
            var clusterFilter = this.community.community_profiles[$stateParams.location_path].industries;
        } else clusterFilter = this.community.profile.industries;
    } else {
        clusterFilter = [];
        if ($stateParams.community_path && $stateParams.community_path !== $stateParams.location_path) communityFilter.push($stateParams.community_path);
    }

    $stateParams.query ? query = $stateParams.query : query = '*';

    this.url = $stateParams.community_path && $stateParams.location_path ?
        "({community_path: val, community: companies.communities[val], query: '*'})" :
        "({location_path: val, community: companies.communities[val], query: '*'})";

    // THIS IS A DUPLICATE OF NAV.EMBEDDED, SHOULD MOVE TO A SERVICE AND INJECT IN NAV AND USER CONTROLLERS
    try {
        this.embedded = window.self !== window.top;
    } catch (e) {
        this.embedded = true;
    }
    this.usercount = this.embedded ? 8 : 16;

    this.searchCompanies = function(alturl) {
        self.loadingUser = true;

        if (query !== '*') {
            self.tag = query;
        } else self.tag = undefined;

        company_service.search(communityFilter, clusterFilter, query, undefined, self.usercount, alturl)
            .then(function (response) {
                self.tag = undefined;
                self.companies = result_service.setPage(response.data);
                self.loadingUser = false;
                self.lastQuery = query;
            });
    };

    this.searchCompanies();

    // Title of list box changes based on context
    var setTitle = function(){
        var item;
        self.stage = '';
        self.cluster = '';

        if (self.selectedStage[0] == '*') {
            self.stage = "Companies";
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

        if (self.selectedClusters.length == 0 && self.selectedNetworks.length == 0) {
            if (self.community.community_profiles && self.community.community_profiles[$stateParams.location_path]) {
                self.selection = self.community.community_profiles[$stateParams.location_path].name;
            } else self.selection = self.community.profile.name;
        } else {
            self.selection = "";
            var selectedCommunities = self.selectedClusters.concat(self.selectedNetworks);
            for (item in selectedCommunities) {
                self.selection += self.communities[selectedCommunities[item]].profile.name;
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
                if (self.community.community_profiles && self.community.community_profiles[$stateParams.location_path]) {
                    self.title += self.community.community_profiles[$stateParams.location_path].name +'</strong>';
                } else self.title += self.community.profile.name +'</strong>';
            } else self.title += self.communities[$stateParams.location_path].profile.name + '</strong>';
        }

        var pageTitle = '<br><small>' + self.community.profile.name + '</small>';
        self.pageTitle = $sce.trustAsHtml(pageTitle);
    };

    setTitle();


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

        company_service.search(communityFilter, clusterFilter, '*', self.selectedStage, 20, undefined)
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

        company_service.search(communityFilter, self.selectedClusters, '*', self.selectedStage, 30, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingNetwork = false;
                self.companies = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.filterNetworks = function(selection) {
        if (selection == undefined) {
            self.selectedNetworks = [];
        } else {
            if (self.selectedNetworks.indexOf(selection) < 0) {
                self.selectedNetworks.push(selection);
            } else self.selectedNetworks.splice(self.selectedNetworks.indexOf(selection), 1);
            if (self.selectedNetworks.length == 0) self.allNetworks = true;
        }

        communityFilter = communityFilter.concat(self.selectedNetworks);

        company_service.search(communityFilter, clusterFilter, '*', self.selectedStage, 20, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingNetwork = false;
                self.companies = result_service.setPage(response.data);
                setTitle();
            });
    };

    $('.splash').css('display', 'none');

}

function CompanyProfileController($stateParams, $location, $mixpanel, user, company_service, community, communities) {

    $mixpanel.track('Viewed Company');

    if (!jQuery.isEmptyObject($stateParams.profile)) {
        this.company = $stateParams.profile;
    } else if (community && community.type == "company") {
        this.company = community;
    }

    var self = this;
    this.communities = communities.data;
    this.team = {};
    /*
    // sort team members

    for (member in team.data.results) {
        for (role in team.data.results[member].value.roles) {
            for (item in team.data.results[member].value.roles[role]) {
                if (item == this.company.key) {
                    if (!this.team[role]) this.team[role] = {};
                    this.team[role][team.data.results[member].value.key] = team.data.results[member].value;
                }
            }
        }
    }
*/

    this.removeProfile = function(userid, name) {
        notify("Are you sure you want to remove " + name + "?", function(result) { //todo fix notify maybe with sweetalert
            if (result) {
                company_service.removeProfile(userid, function(response) {
                    $location.path('/people');
                    this.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    this.updateProfile = function() {
        company_service.updateProfile({
            displayName: user.data.user.value.profile.name,
            email: user.data.user.value.profile.email
        }).then(function() {
            this.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };


    $('.splash').css('display', 'none');

}

function AddCompanyController($mixpanel, $http, company_service, community) {
    var self = this;

    this.addCompany = function() {
        this.working = true;
        var role = self.selectedRole == 'none' ? undefined : self.selectedRole;

        if (community.type == 'cluster') community_path = location.key; // do not allow companies to be added directly to clusters

        company_service.addCompany(self.selectedCompany, role, location.key, community_path)
            .then(function(response) {

                self.working = false;
                if (response.status !== 200) {
                    self.alert = { type: 'danger', message: String(response.data.message) };
                } else {
                    self.selectedCompany = undefined;
                    self.company = undefined;
                    self.updateCompany = false;
                    self.selectedRole = 'none';
                    self.alert = { type: 'success', message: String(response.data.message) };
                }
                $mixpanel.track('Added Company');
            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            })
    };

    self.working = false;

}