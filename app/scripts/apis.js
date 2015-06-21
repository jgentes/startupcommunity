angular
    .module('apis', [])

    .factory('userApis', function($http, $location) {
        return {
            search: function(location, community, query) {
                var urlString = '/api/1.1/users' + jQuery.param({
                        location: location,
                        community: community,
                        search: query
                    });
                return $http.get(urlString);
            },
            getUsers: function(location, community, cluster, role, limit, alturl) { //alturl is for next/prev retrieval
                if (alturl) { return $http.get(alturl) } else {
                    var urlString = '/api/1.1/users?' + jQuery.param({
                            location: location,
                            community: community,
                            cluster: cluster,
                            role: role,
                            limit: limit
                        });
                    return $http.get(urlString);
                }
            },
            putUser: function(userid, profile, callback) {
                $http.put('/api/1.1/user/' + userid + '?profile=' + profile)
                  .success( function(response) {
                      callback(response);
                  })
                  .error( function(response) {
                      callback(response);
                  });
            },
            getProfile: function(userid) {
                return $http.get(userid ? '/api/1.1/profile/' + userid : '/api/1.1/profile');
            },
            putProfile: function(profileData) { // addcallback!
                return $http.put('/api/1.1/profile', profileData);
            },
            removeProfile: function(userid, callback) {
                $http.post('/api/1.1/profile/remove/' + userid)
                  .success( function(response) {
                      callback(response);
                  })
                  .error( function(response) {
                      callback(response);
                  });
            },
            invitePerson: function(url, email, userid, callback) {
                $http.get('/api/1.1/invitePerson?user={"url":"' + url + '","email":"' + email + '","userid":"' + userid + '"}')
                  .success( function(response) {
                      callback(response);
                  })
                  .error( function(response) {
                      callback(response);
                  });
            },
            getKey: function() {
                return $http.get('/api/1.1/profile/getkey');
            },
            setRole: function(userkey, communitykey, cluster, role, status, callback) {
                $http.put('/api/1.1/profile/role?userkey=' + userkey + '&communitykey=' + communitykey + '&cluster=' + cluster + '&role=' + role + '&status=' + status)
                  .success( function(data, status) {
                      callback(data, status);
                  })
                  .error( function(data, status) {
                      callback(data, status);
                  });
            },
            feedback: function(data) {
                $http.post('/api/1.1/feedback?data=' + encodeURIComponent(JSON.stringify(data)));
            },
            createTicket: function(email, subject, message) {
                $http.post('');
            }
        };
    })

      .factory('communityApis', function($http) {
          return {
              getCommunity: function(location, community) {
                  var urlString = '/api/1.1/community/';
                  if (location && community) {
                      urlString += community + '?location=' + location;
                  } else {
                      urlString += (location || community);
                  }
                  return $http.get(urlString);
              },
              getActivity: function(keys) {
                  var urlString = '/api/1.1/community?keys=' + encodeURIComponent(JSON.stringify(keys));
                  return $http.get(urlString);
              },
              getKey: function(key) {
                  var urlString = '/api/1.1/key/' + key;
                  return $http.get(urlString);
              }
          };
      })

      .factory('resultApi', function() {
          // This service will eventually handle a variety of functions for multiple views, such as search, cluster view, people view, startup view, etc
          return {
              setPage: function($scope) {
                  if ($scope !== undefined) {
                      if ($scope.next) {
                          $scope.start = Number($scope.next.match(/offset=([^&]+)/)[1]) - Number($scope.count) + 1;
                          $scope.end = Number($scope.next.match(/offset=([^&]+)/)[1]);
                      } else if ($scope.prev) {
                          $scope.start = Number($scope.total_count) - Number($scope.count);
                          $scope.end = $scope.total_count;
                      } else if ($scope.count === 0 || $scope === undefined) {
                          $scope.start = 0;
                          $scope.end = 0;
                      } else {
                          $scope.start = 1; $scope.end = $scope.total_count;
                      }
                  }
                  return $scope;
              }
          };
      })