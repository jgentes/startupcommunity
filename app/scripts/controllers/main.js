angular
    .module('startupcommunity')
    .controller('mainCtrl', mainCtrl);

function mainCtrl($http, $scope, $location, $auth, userApi, communityApi, resultApi, $mixpanel) {

    $scope.global = { alert: undefined, community: {}, context: {} };
    window.$scope = $scope; // for console testing to avoid $scope = $('body').scope()

    $scope.global.logout = function(error) {
        $auth.logout()
          .then(function() {
              $scope.global.user = undefined;
              error ? $scope.global.alert = error : $scope.global.alert = undefined;
              $location.path('/login');
          });
    };

    $scope.isAuthenticated = function() {
        return $auth.isAuthenticated(); //returns true or false based on browser local storage token
    };

    $scope.search = function(query) {
        $scope.global.search.tag = query;
        $scope.global.search.results = undefined;
        userApi.earch($scope.global.user.context, query)
          .then(function(response) {
              $scope.global.search = resultApi.setPage(response.data);
              $scope.global.search.lastQuery = query;
              $location.path('/search');
          });
    };

    $scope.editProfile = function() {
        $scope.global.profile = $scope.global.user;
        $location.path('/profile');
        $route.reload();
    };

    $scope.closeAlert = function() {
        $scope.global.alert = undefined;
    };

    $scope.global.findKey = function(obj, key, results, value) {
        if (!obj) {
            return results;
        }

        var keys = Object.keys(obj);

        for (var i = 0; (i < keys.length); i++) {
            var name = keys[i];
            var subkeys = obj[name];

            if (typeof subkeys === 'object') {
                if (name === key) {
                    if (value) {
                        if (obj[name] == value) {
                            results.push(subkeys);
                        }
                    } else results.push(subkeys);
                }
                $scope.global.findKey(subkeys, key, results, value);

            } else {
                if (name === key) {
                    if (results.indexOf(subkeys) === -1) {
                        if (value) {
                            if (obj[name] == value) {
                                results.push(obj);
                            }
                        } else results.push(obj);
                    }
                }
            }
        }
        return results;
    };

    var broadcast = function() {
        $scope.$broadcast('sessionReady', true);
        $location.path('/people');

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
        if (!$scope.global.user || !$scope.global.community || !$scope.global.context) {
            userApi.getProfile()
              .success(function(response) {
                  if (!response.message) {
                      $scope.global.user = response;
                      if (!$scope.global.profile) {
                          $scope.global.profile = response;
                      }

                      var community = $scope.global.user.context.community || undefined;
                      var location = $scope.global.user.context.location || undefined;

                      if (!community && !location) { location = $scope.global.user.profile.linkedin.location.country.code || 'us'} //TODO does private/private block location in linkedin api?

                      communityApi.getCommunity(location, community)
                        .success(function(response) {
                            if (response) {
                                $scope.global.community = response;
                                $scope.global.context.community = community;
                                $scope.global.context.location = location;
                                broadcast();
                            } else {
                                $scope.global.logout({ type: 'danger', msg: String(response.message) });
                            }
                        })
                        .error(function(response) {
                            $scope.global.alert = String(response.message);
                        });
                  } else {
                      $scope.global.logout({ type: 'danger', msg: String(response.message) });
                  }
              })
              .error(function(response) {
                  $scope.global.logout({ type: 'danger', msg: String(response.message) });
              });
        } else broadcast();

        $scope.start_hidden = true;
    };

    $scope.global.sessionReady();

}
