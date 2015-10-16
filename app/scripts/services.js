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
            updateProfile: function(profile) {
                return $http.post('/api/2.1/profile', {
                    params: {
                        profile: profile
                    }
                });
            },
            getProfile: function(userid) {
                return $http.get(userid ? '/api/2.0/profile/' + userid : '/api/2.0/profile');
            },
            getProfileUrl: function(filename) {
                return $http.get('/api/2.1/profile/url?filename=' + filename);
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
            }
        };
    })

      .factory('community_service', function($http) {
          return {
              getCommunity: function(community) {
                  return $http.get('/api/2.0/community/' + community);
              },
              getKey: function(key) {
                  return $http.get('/api/2.0/key/' + key);
              },
              getTop: function(location_key, community_key, community) {
                  // this service relies on cache first, then calls the api to update the db for next pull

                  if (community && community.type == 'cluster') {
                      if (community.community_profiles && community.community_profiles[location_key] && community.community_profiles[location_key].industries) {
                          var industry_keys = community.community_profiles[location_key].industries;
                      } else if (community.profile.industries) {
                          industry_keys = community.profile.industries;
                      } else industry_keys = ["none"];

                      var cluster_key = community.key;
                  }

                  var top = function() {
                      $http.get('/api/2.1/community/' + location_key + '/' + (community_key ? community_key + '/top' : 'top'), {
                          params: {
                              cluster_key: cluster_key,
                              industry_keys: industry_keys
                          }
                      });
                  };

                  // change values back from 'cache'
                  var clearCache = function(top_results) {
                      for (u in top_results.people.entries) {
                          top_results.people.entries[u].value.type = 'user';
                      }

                      for (u in top_results.companies.entries) {
                          top_results.companies.entries[u].value.type = 'company';
                      }

                      return top_results;
                  };

                  if (community.community_profiles && community.community_profiles[location_key] && community.community_profiles[location_key].top) {
                      top();
                      return { data: clearCache(community.community_profiles[location_key].top) };
                  } else if (community.profile && community.profile.top) {
                      top();
                      return { data: clearCache(community.profile.top) };
                  } else {
                      return $http.get('/api/2.1/community/' + location_key + '/' + (community_key ? community_key + '/top' : 'top'), {
                          params: {
                              cluster_key: cluster_key,
                              industry_keys: industry_keys
                          }
                      });
                  }

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
    .factory('company_service', function($http) {
        return {
            search: function(communities, query, stages, limit, alturl) { //alturl is for next/prev retrieval
                var urlString = '/api/2.0/companies?' + jQuery.param({
                        communities: communities,
                        stages: stages,
                        limit: limit,
                        query: query
                    });
                return $http.get(alturl || urlString);
            },
            addCompany: function(al_profile, role, location_key, community_key) {
                return $http.post('/api/2.1/companies/add', {
                    params: {
                        al_profile: al_profile,
                        role: role,
                        location_key: location_key,
                        community_key: community_key
                    }
                });
            },
            getLogoUrl: function(filename, company_name) {
                return $http.get('/api/2.1/companies/url?filename=' + filename + '&company_name=' + company_name);
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