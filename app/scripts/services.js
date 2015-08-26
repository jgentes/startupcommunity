angular
    .module('services', [])

    .factory('notify_service', function($http) {
        return {
            contact: function(user_key, formdata, community_key, location_key) {
                return $http.post('/api/2.0/contact?' + jQuery.param({
                        user_key: user_key,
                        formdata: formdata,
                        community_key: community_key,
                        location_key: location_key
                        })
                )
            }
        }
    })

    .factory('user_service', function($http) {
        return {
            search: function(communities, query, roles, limit, alturl) { //alturl is for next/prev retrieval
                var urlString = '/api/2.0/users?' + jQuery.param({
                        communities: communities,
                        roles: roles,
                        limit: limit,
                        query: query
                    });
                return $http.get(alturl || urlString);
            },
            putUser: function(userid, profile, callback) {
                $http.put('/api/2.0/user/' + userid + '?profile=' + profile)
                  .then( function(response) {
                      callback(response);
                  })
            },
            getProfile: function(userid) {
                return $http.get(userid ? '/api/2.0/profile/' + userid : '/api/2.0/profile');
            },
            putProfile: function(profileData) { // addcallback!
                return $http.put('/api/2.0/profile', profileData);
            },
            removeProfile: function(userid, callback) {
                $http.post('/api/2.0/profile/remove/' + userid)
                  .then( function(response) {
                      callback(response);
                  })
            },
            inviteUser: function(linkedin_url, email, location_key, community_key) {
                return $http.post('/api/2.0/invite', {
                    params: {
                        linkedin_url: linkedin_url,
                        email: email,
                        location_key: location_key,
                        community_key: community_key
                    }
                });
            },
            getKey: function() {
                return $http.get('/api/2.0/profile/getkey');
            },
            setRole: function(userkey, communitykey, cluster, role, status, callback) {
                $http.put('/api/2.0/profile/role?userkey=' + userkey + '&communitykey=' + communitykey + '&cluster=' + cluster + '&role=' + role + '&status=' + status)
                  .then( function(data, status) {
                      callback(data, status);
                  })
            },
            feedback: function(data) {
                $http.post('/api/2.0/feedback?data=' + encodeURIComponent(JSON.stringify(data)));
            },
            createTicket: function(email, subject, message) {
                $http.post('');
            }
        };
    })

      .factory('community_service', function($http) {
          return {
              getCommunity: function(community) {
                  var urlString = '/api/2.0/community/' + community;
                  return $http.get(urlString);
              },
              getKey: function(key) {
                  var urlString = '/api/2.0/key/' + key;
                  return $http.get(urlString);
              },
              setSettings: function(embed, location_key, community_key) {
                  return $http.put('/api/2.0/settings', {
                      params: {
                          embed: embed,
                          location_key: location_key,
                          community_key: community_key
                      }
                  });
              }
          };
      })
    .factory('startup_service', function($http) {
        return {
            search: function(communities, query, stages, limit, alturl) { //alturl is for next/prev retrieval
                var urlString = '/api/2.0/startups?' + jQuery.param({
                        communities: communities,
                        stages: stages,
                        limit: limit,
                        query: query
                    });
                return $http.get(alturl || urlString);
            }
        };
    })
    .factory('angellist_service', function($http) {
        return {
            getStartups: function(id) {
                return $http.get('/api/2.0/angel/startups?id=' + id);
            },
            getStartup: function(id) {
                return $http.get('/api/2.0/angel/startup?id=' + id);
            }
        };
    })

    .factory('result_service', function() {
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
    });