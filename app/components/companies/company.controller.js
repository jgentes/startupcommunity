angular
    .module('startupcommunity')
    .controller('CompanyController', CompanyController)
    .controller('CompanyProfileController', CompanyProfileController)
    .controller('AddCompanyController', AddCompanyController);

function CompanyController($stateParams, company_service, result_service, $sce, community, communities) {

    this.community = community;
    this.communities = communities.data;
    this.selectedIndustries = [];
    this.selectedNetworks = [];
    this.selectedStage = ['*'];

    var self = this; // for accessing 'this' in child functions
    var query;
    var communityFilter = [$stateParams.location_path];
    if ($stateParams.community_path) communityFilter.push($stateParams.community_path);

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

        company_service.search(communityFilter, query, undefined, self.usercount, alturl)
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
        self.industry = '';

        if (self.selectedStage[0] == '*') {
            self.stage = "Companies";
        } else {
            for (item in self.selectedStage) {
                self.stage += (self.selectedStage[item][0].toUpperCase() + self.selectedStage[item].slice(1) + 's');
                if (item < self.selectedStage.length - 1) {
                    if (item < self.selectedStage.length - 2 ) {
                        self.stage += '</strong>,<strong> ';
                    } else self.stage += ' </strong>&<strong> ';
                }
            }
        }

        if (self.selectedIndustries.length == 0 && self.selectedNetworks.length == 0) {
            if (self.community.community_profiles && self.community.community_profiles[$stateParams.location_path]) {
                self.selection = self.community.community_profiles[$stateParams.location_path].name;
            } else self.selection = self.community.profile.name;
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

        company_service.search(communityFilter, '*', self.selectedStage, 20, undefined)
            .then(function(response) {
                self.loadingStage = false;
                self.companies = result_service.setPage(response.data);
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

        company_service.search(communityFilter.concat(self.selectedIndustries), '*', self.selectedStage, 30, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
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

        company_service.search(communityFilter.concat(self.selectedNetworks), '*', self.selectedStage, 20, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
                self.loadingNetwork = false;
                self.companies = result_service.setPage(response.data);
                setTitle();
            });
    };

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
    this.putProfile = function(userid, profile) {
        company_service.putProfile(userid, profile, function(response) {
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




}

function AddCompanyController(company_service, community) {
    var self = this;

    this.addCompany = function(location_key, community_key) {

        this.working = true;

        if (self.form.$valid) {
            var formdata = {
                "angellist_url" : self.form.url_value.split('/').pop()
            };

            company_service.addCompany(formdata.angellist_url, location_key, community_key)
                .then(function(response) {
                    self.working = false;

                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: 'There was a problem: ' + String(response.data.message) };
                    } else {
                        self.alert = { type: 'success', message: 'Congrats, ' + response.data.profile.name + ' has been added to the ' + community.profile.name + ' community.' };
                    }
                });

        } else {
            this.working = false;
            self.form.submitted = true;
        }

    };

    this.working = false;

}