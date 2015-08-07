angular
    .module('startupcommunity')
    .controller('StartupsController', StartupsController)
    .controller('StartupProfileController', StartupProfileController);

function StartupsController($stateParams, startup_api, result_api, $sce, community, communities) {

    this.community = community;
    this.communities = communities.data;
    this.selectedIndustries = [];
    this.selectedNetworks = [];
    this.selectedStage = ['*'];

    var self = this; // for accessing 'this' in child functions

    var communityFilter = [$stateParams.community_key];
    if ($stateParams.industry_key) communityFilter.push($stateParams.industry_key);

    this.searchStartups = function(alturl) {
        self.loadingStartups = true;
        if ($stateParams.query !== '*') {
            self.tag = $stateParams.query;
        } else self.tag = undefined;

        startup_api.search(communityFilter, $stateParams.query, undefined, 20, alturl)
            .then(function (response) {
                self.startups = result_api.setPage(response.data);
                self.tag = undefined;
                self.loadingStartups = false;
                self.lastQuery = $stateParams.query;
            });
    };

    this.searchStartups();

    // Title of list box changes based on context
    var setTitle = function(){
        var item;
        self.stage = '';
        self.industry = '';

        if (self.selectedStage[0] == '*') {
            self.stage = "Startups";
        } else {
            for (item in self.selectedStage) {
                self.stage += self.selectedStage[item][0].toUpperCase() + self.selectedStage[item].slice(1);
                if (item < self.selectedStage.length - 1) {
                    if (item < self.selectedStage.length - 2 ) {
                        self.stage += '</strong>,<strong> ';
                    } else self.stage += ' </strong>&<strong> ';
                }
            }
            self.stage += ' Startups';
        }

        if (self.selectedIndustries.length == 0 && self.selectedNetworks.length == 0) {
            self.selection = self.community.profile.name;
        } else {
            self.selection = "";
            var selectedCommunities = self.selectedIndustries.concat(self.selectedNetworks);
            for (item in selectedCommunities) {
                self.selection += self.communities[selectedCommunities[item]].profile.name;
                if (item < selectedCommunities.length - 1) {
                    if (item < selectedCommunities.length - 2 ) {
                        self.selection += ', ';
                    } else self.selection += ' & ';
                }
            }
        }

        if ($stateParams.query == "*") {
            self.title = '<strong>' + self.stage + '</strong> in ' + self.selection;
        } else {
            self.title = 'Startups matching <strong>"' + $stateParams.query + '"</strong> ';
            if ($stateParams.industry_key) {
                self.title += 'in <strong>' + self.communities[$stateParams.industry_key].profile.name + '</strong>';
            } else self.title += 'in <strong>' + self.communities[$stateParams.community_key].profile.name + '</strong>';
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

        startup_api.search(communityFilter.concat(self.selectedIndustries).concat(self.selectedNetworks), '*', self.selectedStage, 20, undefined)
            .then(function(response) {
                self.loadingStage = false;
                self.startups = result_api.setPage(response.data);
                setTitle();
            });
    };

    this.filterIndustries = function(selection) {
        if (selection == undefined) {
            self.selectedIndustries = [];
        } else {
            if (self.selectedIndustries.indexOf(selection) < 0) {
                self.selectedIndustries.push(selection);
            } else self.selectedIndustries.splice(self.selectedIndustries.indexOf(selection), 1);
            if (self.selectedIndustries.length == 0) self.allIndustries = true;
        }

        startup_api.search(communityFilter.concat(self.selectedIndustries).concat(self.selectedNetworks), '*', self.selectedStage, 30, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
                self.loadingNetwork = false;
                self.startups = result_api.setPage(response.data);
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

        startup_api.search(communityFilter.concat(self.selectedIndustries).concat(self.selectedNetworks), '*', self.selectedStage, 20, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
                self.loadingNetwork = false;
                self.startups = result_api.setPage(response.data);
                setTitle();
            });
    };

}

function StartupProfileController($scope, startup_api, $location, $mixpanel) {

    $mixpanel.track('Viewed Startup');

    $scope.putProfile = function(userid, profile) {
        startup_api.putProfile(userid, profile, function(response) {
            if (response.status !== 200) {
                $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: " +  response.message);
            } else {
                $scope.profile = response.data; // may need to tell angular to refresh view
                $scope.global.alert = { type: 'success', msg: 'Person updated! ' + response.data.name + ' is good to go.' };
            }
        });
    };

    $scope.removeProfile = function(userid, name) {
        notify("Are you sure you want to remove " + name + "?", function(result) { //todo fix notify maybe with sweetalert
            if (result) {
                startup_api.removeProfile(userid, function(response) {
                    $location.path('/startups');
                    $scope.global.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    $scope.updateProfile = function() {
        startup_api.updateProfile({
            displayName: $scope.global.user.profile.name,
            email: $scope.global.user.profile.email
        }).then(function() {
            $scope.global.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };


}