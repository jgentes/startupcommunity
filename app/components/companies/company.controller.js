angular
    .module('startupcommunity')
    .controller('CompanyController', CompanyController)
    .controller('CompanyProfileController', CompanyProfileController)

function CompanyController($stateParams, $location, company_service, result_service, $sce, community, communities) {

    this.community = community;
    this.communities = communities;
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

        // remove random sort
        if (alturl) alturl = alturl.replace(/([&\?]sort=_random*$|sort=_random&|[?&]sort=_random(?=#))/, '');

        if (query !== '*') {
            self.tag = query;
        } else self.tag = undefined;

        var limit = $location.search().limit;

        company_service.search(communityFilter, clusterFilter, query, undefined, limit || self.usercount, alturl)
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
}

function CompanyProfileController($stateParams, $location, $mixpanel, user, company_service, community, communities) {

    $mixpanel.track('Viewed Company');

    /*if (!jQuery.isEmptyObject($stateParams.profile)) {
        this.company = $stateParams.profile;
    } else if (community && community.type == "company") {
        this.company = community;
    }*/

    var self = this;
    this.communities = communities;
    this.company = this.communities[this.communities.key];
    this.community = this.company;
    this.team = { "count" : {}};

    this.background_image = 'url(https://s3-us-west-2.amazonaws.com/startupcommunity/backgrounds/background' + Math.floor((Math.random() * 54) + 1) + '.jpg)';

    // sort team members

    for (member in this.communities[this.company.key].team) {
        for (role in this.communities[this.company.key].team[member].value.roles) {
            for (item in this.communities[this.company.key].team[member].value.roles[role]) {
                if (item == this.company.key) {
                    if (!this.team[role]) this.team[role] = {};
                    if (!this.team.count[role]) this.team.count[role] = 0;
                    this.team[role][member] = this.communities[this.company.key].team[member];
                    ++ this.team.count[role];
                }
            }
        }
    }

}