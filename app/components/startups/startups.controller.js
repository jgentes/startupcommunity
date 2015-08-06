angular
    .module('startupcommunity')
    .controller('StartupsController', StartupsController)
    .controller('StartupProfileController', StartupProfileController);

function StartupsController($location, $stateParams, angellist_api, result_api, $sce, community, communities, user_api, user) {

    this.community = community;
    this.user = user.data;
    this.selectedIndustry = ['*'];
    this.selectedStage = ['*'];
    this.selectedNetwork = ['*'];

    var self = this; // for accessing 'this' in child functions


    var communityFilter = [$stateParams.community_key];
    if ($stateParams.industry_key) communityFilter.push($stateParams.industry_key);

    var getStartups = function() {
        self.loadingStartups = true;
        self.tag = $stateParams.query;
        angellist_api.getStartups(2300)
            .then(function(response) {
                self.tag = undefined;
                self.startups = result_api.setPage(response.data);
                self.loadingPeople = false;
                self.lastQuery = $stateParams.query;
            })
    };

    getStartups();

    // Title of list box changes based on context
    var setTitle = function(){
        var item;
        self.stage = '';
        self.industry = '';

        if (self.selectedStage[0] == '*') {
            self.stage = "Startups";
        } else {
            for (item in self.selectedStage) {
                self.stage += (self.selectedStage[item] + 's');
                if (item < self.selectedStage.length - 1) {
                    if (item < self.selectedStage.length - 2 ) {
                        self.stage += '</strong>,<strong> ';
                    } else self.stage += ' </strong>&<strong> ';
                }
            }
        }
        if (self.selectedIndustry[0] == '*') {
            self.industry = self.community.profile.name;
        } else {
            item = 0;
            for (item in self.selectedIndustry) {
                self.industry += self.selectedIndustry[item];
                if (item < self.selectedIndustry.length - 1) {
                    if (item < self.selectedIndustry.length - 2 ) {
                        self.industry += ', ';
                    } else self.industry += ' & ';
                }
            }
        }
        self.title = '<strong>' + self.stage + '</strong> in ' + self.industry;

        var pageTitle;

        if (self.community) {
            pageTitle = self.community.profile.name;
        } else {
            pageTitle = self.community.profile.name;
        }

        if (self.community && self.location) {
            pageTitle += '<br><small>' + self.community.profile.name + '</small>';
        } else {
            pageTitle += '<br><small>Welcome ' + (self.user.profile.name).split(' ')[0] + '!</small>';
        }

        self.pageTitle = $sce.trustAsHtml(pageTitle);
    };

    setTitle();

    this.filterIndustry = function(industry) {
        self.loadingIndustry = true;
        if (industry == '*') {
            self.selectedIndustry = ['*'];
        } else {
            if (self.selectedIndustry.indexOf('*') >= 0) {
                self.selectedIndustry.splice(self.selectedIndustry.indexOf('*'), 1);
            }
            if (self.selectedIndustry.indexOf(industry) < 0) {
                self.selectedIndustry.push(industry);
            } else self.selectedIndustry.splice(self.selectedIndustry.indexOf(industry), 1);
            if (self.selectedIndustry.length === 0) {
                self.selectedIndustry = ['*'];
            }
        }

        user_api.search(self.community, '*', self.selectedStage, 30, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
                self.users = result_api.setPage(response.data);
                setTitle();
            });
    };

    this.search = function(query) {
        self.search.tag = query;
        self.search.results = undefined;
        user_api.search(self.user.context, query)
            .then(function(response) {
                self.search = result_api.setPage(response.data);
                self.search.lastQuery = query;
                $location.path('/search');
            });
    };

    this.filterStage = function(stage) {
        self.loadingStage = true;
        if (stage == '*') {
            self.selectedStage = ['*'];
        } else {
            if (self.selectedStage.indexOf('*') >= 0) {
                self.selectedStage.splice(self.selectedStage.indexOf('*'), 1);
            }
            if (self.selectedStage.indexOf(stage) < 0) {
                self.selectedStage.push(stage);
            } else self.selectedStage.splice(self.selectedStage.indexOf(stage), 1);
            if (self.selectedStage.length === 0) {
                self.selectedStage = ['*'];
            }
        }

        user_api.search(self.community, '*', self.selectedStage, 30, undefined)
            .then(function(response) {
                self.loadingStage = false;
                self.users = result_api.setPage(response.data);
                setTitle();
            });
    };
  
}

function StartupProfileController($scope, $state, user_api, community_api, $location, $auth, $mixpanel) {

    $mixpanel.track('Viewed Startup');

    $scope.putProfile = function(userid, profile) {
        user_api.putProfile(userid, profile, function(response) {
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
                user_api.removeProfile(userid, function(response) {
                    $location.path('/people');
                    $scope.global.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    $scope.updateProfile = function() {
        user_api.updateProfile({
            displayName: $scope.global.user.profile.name,
            email: $scope.global.user.profile.email
        }).then(function() {
            $scope.global.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };

    $scope.getKey = function() {
        if (!$scope.global.user.profile.api_key) {
            user_apis.getKey()
                .then(function(response) {
                    $scope.global.user.profile.api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
    };



}