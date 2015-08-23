angular
    .module('startupcommunity')
    .controller('StartupController', StartupController)
    .controller('StartupProfileController', StartupProfileController);

function StartupController($stateParams, startup_service, result_service, $sce, community, communities) {

    this.community = community;
    this.communities = communities.data;
    this.selectedIndustries = [];
    this.selectedNetworks = [];
    this.selectedStage = ['*'];

    var self = this; // for accessing 'this' in child functions

    var communityFilter = [$stateParams.community_path];
    if ($stateParams.industry_key) communityFilter.push($stateParams.industry_key);

    this.searchStartups = function(alturl) {
        self.loadingStartups = true;
        if ($stateParams.query !== '*') {
            self.tag = $stateParams.query;
        } else self.tag = undefined;

        startup_service.search(communityFilter, $stateParams.query, undefined, 20, alturl)
            .then(function (response) {
                self.startups = result_service.setPage(response.data);
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
            if ($stateParams.location_path) {
                self.title += 'in <strong>' + self.communities[$stateParams.location_path].profile.name + '</strong>';
            } else self.title += 'in <strong>' + self.communities[$stateParams.community.key].profile.name + '</strong>';
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

        startup_service.search(communityFilter.concat(self.selectedIndustries).concat(self.selectedNetworks), '*', self.selectedStage, 20, undefined)
            .then(function(response) {
                self.loadingStage = false;
                self.startups = result_service.setPage(response.data);
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

        startup_service.search(communityFilter.concat(self.selectedIndustries).concat(self.selectedNetworks), '*', self.selectedStage, 30, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
                self.loadingNetwork = false;
                self.startups = result_service.setPage(response.data);
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

        startup_service.search(communityFilter.concat(self.selectedIndustries).concat(self.selectedNetworks), '*', self.selectedStage, 20, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
                self.loadingNetwork = false;
                self.startups = result_service.setPage(response.data);
                setTitle();
            });
    };

}

function StartupProfileController($stateParams, $location, $mixpanel, user, user_service, team, community, communities) {

    $mixpanel.track('Viewed Startup');

    if (!jQuery.isEmptyObject($stateParams.profile)) {
        this.startup = $stateParams.profile;
    } else if (community && community.type == "startup") {
        this.startup = community;
    }

    var self = this;
    this.communities = communities.data;
    this.team = {};

    // sort team members

    for (member in team.data.results) {
        for (role in team.data.results[member].value.roles) {
            for (item in team.data.results[member].value.roles[role]) {
                if (item == this.startup.key) {
                    if (!this.team[role]) this.team[role] = {};
                    this.team[role][team.data.results[member].value.key] = team.data.results[member].value;
                }
            }
        }
    }

    this.putProfile = function(userid, profile) {
        user_service.putProfile(userid, profile, function(response) {
            if (response.status !== 200) {
                this.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: " +  response.message);
            } else {
                this.profile = response.data; // may need to tell angular to refresh view
                this.alert = { type: 'success', msg: 'Person updated! ' + response.data.name + ' is good to go.' };
            }
        });
    };

    this.removeProfile = function(userid, name) {
        notify("Are you sure you want to remove " + name + "?", function(result) { //todo fix notify maybe with sweetalert
            if (result) {
                user_service.removeProfile(userid, function(response) {
                    $location.path('/people');
                    this.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    this.updateProfile = function() {
        user_service.updateProfile({
            displayName: user.profile.name,
            email: user.profile.email
        }).then(function() {
            this.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };




}