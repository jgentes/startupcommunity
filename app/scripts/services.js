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
            getProfileUrl: function(filename) {
                return $http.get('/api/2.1/profile/url?filename=' + filename);
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
            inviteUser: function(email, leader_profile, community_name, location_key, community_key) {
                return $http.post('/api/2.0/invite', {
                    params: {
                        email: email,
                        leader_profile: leader_profile,
                        community_name: community_name,
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
            },
            addStartup: function(angellist_url, location_key, community_key) {
                return $http.post('/api/2.1/startups/add', {
                    params: {
                        angellist_url: angellist_url,
                        location_key: location_key,
                        community_key: community_key
                    }
                });
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
      return {
          setPage: function(results) {

              if (results !== undefined) {
                  if (results.next) {
                      results.start = Number(results.next.match(/offset=([^&]+)/)[1]) - Number(results.count) + 1;
                      results.end = Number(results.next.match(/offset=([^&]+)/)[1]);
                  } else if (results.prev) {
                      results.start = Number(results.total_count) - Number(results.count);
                      results.end = results.total_count;
                  } else if (results.count === 0 || results === undefined) {
                      results.start = 0;
                      results.end = 0;
                  } else {
                      results.start = 1; results.end = results.total_count;
                  }
              }
              return results;
          }
      };
    });