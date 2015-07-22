angular
    .module('startupcommunity')
    .controller('MainController', MainController);

function MainController($rootScope, $scope, $state, $location, $auth, user_api, community_api, result_api, $mixpanel) {

    $scope.global = { alert: {} };
    window.$scope = $scope; // for console testing to avoid $scope = $('body').scope()

    $scope.global.logout = function(error) {
        $auth.logout()
            .then(function() {
                $scope.global.user = undefined;
                if (error) {
                    (error.msg == 'undefined' || error.msg) ? $scope.global.alert = undefined : $scope.global.alert = error
                }
                $state.go('login');
            });
    };

    $scope.isAuthenticated = function() {
        return $auth.isAuthenticated(); //returns true or false based on browser local storage token
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

    $scope.editProfile = function() {
        $state.go('people.profile', { user: $scope.global.user });
    };

    $scope.closeAlert = function() {
        $scope.global.alert = undefined;
    };

    $scope.global.findKey = function(obj, key_to_find, results, key) {

        if (!obj) { return results; }
        if (!results) { results = []; }

        var keys = Object.keys(obj),
            name = null,
            subkeys = null,
            pushme = {},
            i = 0;

        for (i in keys) {
            name = keys[i];
            subkeys = obj[name];

            if (typeof subkeys === 'object') {
                subkeys["key"] = name;
                if (name === key_to_find) {
                    results.push(obj);
                } else {
                    key = name;
                    $scope.global.findKey(subkeys, key_to_find, results, key);
                }
            }
        }

        return results;
    };

    $scope.global.findValue = function(obj, value_to_find, results, key) {

        if (!obj) { return results; }
        if (!results) { results = []; }

        for (i in obj) {
            if (typeof(obj[i])=="object") {
                obj[i]["key"] = i;
                for (subkey in obj[i]) {
                    if (obj[i][subkey] == value_to_find) {
                        results.push(obj[i]);
                    }
                }
                key = i;
                $scope.global.findValue(obj[i], value_to_find, results);
            }
        }
        return results;
    };

    var broadcast = function() {
        $scope.$broadcast('sessionReady', true);

        if ($scope.global.user.key) {
            $mixpanel.people.set({
                "$name": $scope.global.user.profile.name,
                "$email": $scope.global.user.profile.email
            });
            UserVoice.push(['identify', {
                id: $scope.global.user.key,
                name: $scope.global.user.profile.name,
                email: $scope.global.user.profile.email
            }]);
        }
    };

    // Get and set user and location data
    $scope.global.sessionReady = function() {

        var setNav = function() {
            // for navigation


            broadcast();
        };
        /*
        var newParams = toParams;
        var community = newParams.community;


        // ** NEED TO ADD THIS CONTENT TO NAVIGATION CONTROLLER **

        $scope.global.community = community;
        $scope.global.context.community = community.key || $scope.global.user.context.community || undefined;
        $scope.global.context.location = $scope.global.user.context.location || undefined;

        if (!$scope.global.user) {
            user_api.getProfile()
                .success(function(response) {
                    if (!response.message) {
                        $scope.global.user = response;
                        $scope.global.context = {};

                        getState();

                    } else {
                        $scope.global.logout({ type: 'danger', msg: String(response.message) });
                    }

                })
                .error(function(response) {
                    $scope.global.logout({ type: 'danger', msg: String(response.message) });
                });
        } else {
            getState();
        }
         */
    };

    if ($scope.global.alert) {
        if ($scope.global.alert.msg == 'undefined' || !$scope.global.alert.msg) { $scope.global.alert = undefined }
    }

    $scope.$on('mapInitialized', function(event, map) {
        $scope.global.mapCenter = "Bend, OR";
    });

    $scope.global.sessionReady();

}