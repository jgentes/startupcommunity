angular
    .module('startupcommunity')
    .controller('StartupsController', StartupsController)
    .controller('StartupProfileController', StartupProfileController);

function StartupsController($scope, $location, angellist_api, result_api, $sce) {

    $scope.getStartups = function() {

        angellist_api.getStartups(2300) // need to ask for this going forward or figure out how to resolve it automatically
            .then(function(response) {

                $scope.startups = response.data;
                if ($location.$$path == '/search') {
                    $scope.global.search = response.data;
                } else { $scope.global.search = undefined }
            });
    };

    function getData() {
        if ($location.$$path == '/startups' || $scope.global.search === undefined) {
            $scope.getStartups(); // use defaults
        }
        $scope.global.context.selectedIndustry = ['*'];
        $scope.global.context.selectedStage = ['*'];
        $scope.global.context.selectedNetwork = ['*'];
        setTitle();

        $scope.industries = $scope.global.findKey($scope.global.community.industries, $scope.global.context.location);
        $scope.networks = $scope.global.findKey($scope.global.community.networks, $scope.global.context.location);
    }

    function setTitle() {
        var item,
            stage = '',
            industry = '';
        if ($scope.global.context.selectedStage[0] == '*') {
            stage = "Startups";
        } else {
            for (item in $scope.global.context.selectedStage) {
                stage += ($scope.global.context.selectedStage[item] + 's');
                if (item < $scope.global.context.selectedStage.length - 1) {
                    if (item < $scope.global.context.selectedStage.length - 2 ) {
                        stage += '</strong>,<strong> ';
                    } else stage += ' </strong>&<strong> ';
                }
            }
        }
        if ($scope.global.context.selectedIndustry[0] == '*') {
            industry = $scope.global.community.profile.name;
        } else {
            item = 0;
            for (item in $scope.global.context.selectedIndustry) {
                industry += $scope.global.context.selectedIndustry[item];
                if (item < $scope.global.context.selectedIndustry.length - 1) {
                    if (item < $scope.global.context.selectedIndustry.length - 2 ) {
                        industry += ', ';
                    } else industry += ' & ';
                }
            }
        }
        $scope.title = '<strong>' + stage + '</strong> in ' + industry;

        var pageTitle = $scope.global.community.profile.name;

        if ($scope.global.context.community && $scope.global.context.location) {
            pageTitle += '<br><small>' + $scope.global.community.profile.name + '</small>';
        } else {
            pageTitle += '<br><small>Welcome ' + ($scope.global.user.profile.name).split(' ')[0] + '!</small>';
        }

        $scope.pageTitle = $sce.trustAsHtml(pageTitle);
    }

    $scope.filterIndustry = function(industry) {
        $scope.loadingIndustry = true;
        if (industry == '*') {
            $scope.global.context.selectedIndustry = ['*'];
        } else {
            if ($scope.global.context.selectedIndustry.indexOf('*') >= 0) {
                $scope.global.context.selectedIndustry.splice($scope.global.context.selectedIndustry.indexOf('*'), 1);
            }
            if ($scope.global.context.selectedIndustry.indexOf(industry) < 0) {
                $scope.global.context.selectedIndustry.push(industry);
            } else $scope.global.context.selectedIndustry.splice($scope.global.context.selectedIndustry.indexOf(industry), 1);
            if ($scope.global.context.selectedIndustry.length === 0) {
                $scope.global.context.selectedIndustry = ['*'];
            }
        }

        user_api.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedStage, 30, undefined)
            .then(function(response) {
                $scope.loadingIndustry = false;
                $scope.users = result_api.setPage(response.data);
                setTitle();
            });
    };

    $scope.search = function(query) {
        $scope.global.search.tag = query;
        $scope.global.search.results = undefined;
        user_api.search($scope.global.user.context, query)
            .then(function(response) {
                $scope.global.search = result_api.setPage(response.data);
                $scope.global.search.lastQuery = query;
                $location.path('/search');
            });
    };

    $scope.filterStage = function(stage) {
        $scope.loadingStage = true;
        if (stage == '*') {
            $scope.global.context.selectedStage = ['*'];
        } else {
            if ($scope.global.context.selectedStage.indexOf('*') >= 0) {
                $scope.global.context.selectedStage.splice($scope.global.context.selectedStage.indexOf('*'), 1);
            }
            if ($scope.global.context.selectedStage.indexOf(stage) < 0) {
                $scope.global.context.selectedStage.push(stage);
            } else $scope.global.context.selectedStage.splice($scope.global.context.selectedStage.indexOf(stage), 1);
            if ($scope.global.context.selectedStage.length === 0) {
                $scope.global.context.selectedStage = ['*'];
            }
        }

        user_api.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedStage, 30, undefined)
            .then(function(response) {
                $scope.loadingStage = false;
                $scope.users = result_api.setPage(response.data);
                setTitle();
            });
    };

    if (!$scope.global.user || $scope.global.context === undefined) {
        $scope.$on('sessionReady', function(event, status) {
            getData();
        });
    } else getData();

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

    var getActivity = function() {

        var activities = $scope.global.findKey($state.params.community.communities, "roles", ["leader", "advisor", "investor", "founder"], {}),
            list = Object.keys(activities);

        community_api.getActivity(list)
            .then(function(response) {
                var activity = {};
                for (var j in activities) {
                    for (var k in activities[j]) {
                        activity[activities[j][k]] = activity[activities[j][k]] || {}; // create empty object or fill with existing object
                        activity[activities[j][k]][j] = response.data[j]; // append matched object
                    }
                }
                $state.params.community.profile.activity = activity;
            })
    };


    /**
     * Link third-party provider.
     */
    $scope.link = function(provider) {
        $auth.link(provider)
            .then(function() {
                $scope.global.alert ={ type: 'success', msg: 'Well done. You have successfully linked your ' + provider + ' account'};
            })
            .then(function() {
                $scope.getProfile();
            })
            .catch(function(response) {
                $scope.global.alert ={ type: 'danger', msg: 'Sorry, but we ran into this error: ' + response.data.message};
            });
    };

    /**
     * Unlink third-party provider.
     */
    $scope.unlink = function(provider) {
        $auth.unlink(provider)
            .then(function() {
                $scope.global.alert = { type: 'success', msg: 'Bam. You have successfully unlinked your ' + provider + ' account'};
            })
            .then(function() {
                $scope.getProfile();
            })
            .catch(function(response) {
                $scope.global.alert = { type: 'danger', msg: 'Aww, shucks. We ran into this error while unlinking your ' + provider + ' account: ' + response.data.message};
            });
    };

    // getActivity();

}