angular
  .module('appControllers', [])
  .controller('MainController', ['$scope','$window', '$global', '$route', '$timeout', '$interval', 'progressLoader', '$location', '$auth', 'userService', 'communityService', '$compile', 'resultService', '$mixpanel', function ($scope, $window, $global, $route, $timeout, $interval, progressLoader, $location, $auth, userService, communityService, $compile, resultService, $mixpanel) {
      $scope.style_fixedHeader = $global.get('fixedHeader');
      $scope.style_headerBarHidden = $global.get('headerBarHidden');
      $scope.style_layoutBoxed = $global.get('layoutBoxed');
      $scope.style_fullscreen = $global.get('fullscreen');
      $scope.style_leftbarCollapsed = $global.get('leftbarCollapsed');
      $scope.style_leftbarShown = $global.get('leftbarShown');
      $scope.style_rightbarCollapsed = $global.get('rightbarCollapsed');
      $scope.style_isSmallScreen = false;
      $scope.style_layoutHorizontal = $global.get('layoutHorizontal');
      $scope.start_hidden = false;
      $scope.global = { alert: undefined, community: {}, context: {} };
      window.$scope = $scope; // for console testing to avoid $scope = $('body').scope()

      $scope.toggleLeftBar = function () {
          if ($scope.style_isSmallScreen) {
              return $global.set('leftbarShown', !$scope.style_leftbarShown);
          }
          $global.set('leftbarCollapsed', !$scope.style_leftbarCollapsed);
      };

      $scope.$on('globalStyles:changed', function (event, newVal) {
          $scope['style_'+newVal.key] = newVal.value;
      });
      $scope.$on('globalStyles:maxWidth767', function (event, newVal) {
          $timeout( function () {
              $scope.style_isSmallScreen = newVal;
              if (!newVal) {
                  $global.set('leftbarShown', false);
              } else {
                  $global.set('leftbarCollapsed', false);
              }
          });
      });

      $scope.$on('$routeChangeStart', function (e) {
          progressLoader.start();
          progressLoader.set(50);
      });

      $scope.$on('$routeChangeSuccess', function (e) {
          progressLoader.end();
      });

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
          userService.search($scope.global.user.context, query)
            .then(function(response) {
                $scope.global.search = resultService.setPage(response.data);
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
              userService.getProfile()
                .success(function(response) {
                    if (!response.message) {
                        $scope.global.user = response;
                        if (!$scope.global.profile) {
                            $scope.global.profile = response;
                        }

                        var community = $scope.global.user.context.community || undefined;
                        var location = $scope.global.user.context.location || undefined;

                        if (!community && !location) { location = $scope.global.user.profile.linkedin.location.country.code || 'us'} //TODO does private/private block location in linkedin api?

                        communityService.getCommunity(location, community)
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

  }])

  .filter('words', function() {
      return function(text, wordnum) {
          if (text) {
              return text.split(" ")[wordnum];
          }
      };
  })

  .controller('PeopleController', ['$scope', '$location', 'userService', 'resultService', '$sce', function ($scope, $location, userService, resultService, $sce) {

      $scope.getUsers = function(alturl) {
          userService.getUsers($scope.global.context.location, $scope.global.context.community, undefined, undefined, 32, alturl)
            .then(function(response) {
                $scope.users = resultService.setPage(response.data);
                if ($location.$$path == '/search') {
                    $scope.global.search = resultService.setPage($scope.users);
                } else { $scope.global.search = undefined }
            });
      };

      $scope.viewUser = function(user) {

          var thisProfile = user.value;
          thisProfile["key"] = user.path.key;
          $scope.global.profile = thisProfile;
          $location.path('/profile');
      };

      function getData() {
          console.log('need to update this variable to account for relative paths: ' + $location.$$path)
          if ($location.$$path == '/people' || $scope.global.search === undefined) {
              $scope.getUsers();
          }
          $scope.global.context.selectedIndustry = ['*'];
          $scope.global.context.selectedRole = ['*'];
          setTitle();
      }

      function setTitle() {
          var item,
            role = '',
            industry = '';
          if ($scope.global.context.selectedRole[0] == '*') {
              role = "People";
          } else {
              for (item in $scope.global.context.selectedRole) {
                  role += ($scope.global.context.selectedRole[item] + 's');
                  if (item < $scope.global.context.selectedRole.length - 1) {
                      if (item < $scope.global.context.selectedRole.length - 2 ) {
                          role += '</strong>,<strong> ';
                      } else role += ' </strong>&<strong> ';
                  }
              }
          }
          if ($scope.global.context.selectedIndustry[0] == '*') {
              industry = $scope.global.community.locations[$scope.global.context.location].profile.name;
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
          $scope.title = '<strong>' + role + '</strong> in ' + industry;

          var pageTitle;

          if ($scope.global.context.community) {
              pageTitle = $scope.global.community.networks[$scope.global.context.community].profile.name;
          } else {
              pageTitle = $scope.global.community.locations[$scope.global.context.location].profile.name;
          }

          if ($scope.global.context.community && $scope.global.context.location) {
              pageTitle += '<br><small>' + $scope.global.community.locations[$scope.global.context.location].profile.name + '</small>';
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

          userService.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedRole, 32, undefined)
            .then(function(response) {
                $scope.loadingIndustry = false;
                $scope.users = resultService.setPage(response.data);
                setTitle();
            });
      };

      $scope.search = function(query) {
          $scope.global.search.tag = query;
          $scope.global.search.results = undefined;
          userService.search($scope.global.user.context, query)
            .then(function(response) {
                $scope.global.search = resultService.setPage(response.data);
                $scope.global.search.lastQuery = query;
                $location.path('/search');
            });
      };

      $scope.filterRole = function(role) {
          $scope.loadingRole = true;
          if (role == '*') {
              $scope.global.context.selectedRole = ['*'];
          } else {
              if ($scope.global.context.selectedRole.indexOf('*') >= 0) {
                  $scope.global.context.selectedRole.splice($scope.global.context.selectedRole.indexOf('*'), 1);
              }
              if ($scope.global.context.selectedRole.indexOf(role) < 0) {
                  $scope.global.context.selectedRole.push(role);
              } else $scope.global.context.selectedRole.splice($scope.global.context.selectedRole.indexOf(role), 1);
              if ($scope.global.context.selectedRole.length === 0) {
                  $scope.global.context.selectedRole = ['*'];
              }
          }

          userService.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedRole, 32, undefined)
            .then(function(response) {
                $scope.loadingRole = false;
                $scope.users = resultService.setPage(response.data);
                setTitle();
            });
      };

      if (!$scope.global.user) {
          $scope.$on('sessionReady', function(event, status) {
              getData();
          });
      } else getData();

  }])

  .controller('ProfileController', ['$scope', 'userService', '$location', '$auth', '$bootbox', '$mixpanel', function ($scope, userService, $location, $auth, $bootbox, $mixpanel) {

      $mixpanel.track('Viewed Profile');

      $scope.putProfile = function(userid, profile) {
          userService.putProfile(userid, profile, function(response) {
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
          $bootbox.confirm("Are you sure you want to remove " + name + "?", function(result) {
              if (result) {
                  userService.removeProfile(userid, function(response) {
                      $location.path('/people');
                      $scope.global.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                  });
              }
          });
      };

      $scope.updateProfile = function() {
          userService.updateProfile({
              displayName: $scope.global.user.profile.name,
              email: $scope.global.user.profile.email
          }).then(function() {
              $scope.global.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
          });
      };

      $scope.getKey = function() {
          if (!$scope.global.user.profile.api_key) {
              userService.getKey()
                .then(function(response) {
                    $scope.global.user.profile.api_key = response.data;
                    $bootbox.alert({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
                });
          } else $bootbox.alert({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
      };

      $scope.isCityAdvisor = function(status) { //todo needs to be reworked
          userService.setCityAdvisor($scope.global.profile.key, $scope.global.user.context, 'cityAdvisor', status, function(response, rescode) {
              var sameuser = false;
              var cluster;
              if (rescode == 201) {
                  if ($scope.global.profile.key == $scope.global.user.key) { sameuser = true; }
                  if ($scope.global.profile.cities[$scope.global.user.context].cityAdvisor === undefined) { //need to create key
                      $scope.global.profile.cities[$scope.global.user.context]['cityAdvisor'] = false;
                  }

                  $scope.global.profile.cities[$scope.global.user.context].cityAdvisor = status;

                  for (cluster in $scope.global.community.location.clusters) {
                      if (status === true) {
                          if ($scope.global.profile.cities[$scope.global.user.context].clusters[cluster]) {
                              $scope.global.profile.cities[$scope.global.user.context].clusters[cluster].advisorStatus = true;
                          }
                      } else {
                          if (!$scope.global.profile.cities[$scope.global.user.context].clusters[cluster].roles || ($scope.global.profile.cities[$scope.global.user.context].clusters[cluster].roles.indexOf("Advisor") < 0)) {
                              $scope.global.profile.cities[$scope.global.user.context].clusters[cluster].advisorStatus = false;
                          } else {
                              $scope.global.profile.cities[$scope.global.user.context].clusters[cluster].advisorStatus = true;
                          }
                      }
                  }

                  if (sameuser) {
                      $scope.global.user.cities[$scope.global.user.context].cityAdvisor = status;
                  }
              } else {
                  $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                  console.warn("WARNING: " +  response.message);
              }
          });
      };

      $scope.setRole = function(cluster, role, status) { //todo needs to be reworked
          userService.setRole($scope.global.profile.key, $scope.global.user.context, cluster, role, status, function(response, rescode) {
              var sameuser = false;
              if (rescode == 201) {
                  if ($scope.global.profile.key == $scope.global.user.key) { sameuser = true; }
                  if ($scope.global.profile.cities[$scope.global.user.context].clusters === undefined) { //need to create clusters key
                      $scope.global.profile.cities[$scope.global.user.context]['clusters'] = {};
                  }
                  if ($scope.global.profile.cities[$scope.global.user.context].clusters[cluster] === undefined) { //need to create the cluster in user profile
                      $scope.global.profile.cities[$scope.global.user.context].clusters[cluster] = { "roles": [] };
                  }
                  if ($scope.global.profile.cities[$scope.global.user.context].clusters[cluster].roles === undefined) { //this can happen due to temp local scope variables
                      $scope.global.profile.cities[$scope.global.user.context].clusters[cluster].roles = [];
                  }
                  var thiscluster = $scope.global.profile.cities[$scope.global.user.context].clusters[cluster];

                  if (status === true) {
                      if (thiscluster.roles.indexOf(role) < 0) {
                          thiscluster.roles.push(role);
                      } // else they already have the role, no action needed
                  } else {
                      if (thiscluster.roles.indexOf(role) >= 0) {
                          thiscluster.roles.splice(thiscluster.roles.indexOf(role), 1);
                      } // else they do not have the role, no action needed
                  }

                  $scope.global.profile.cities[$scope.global.user.context].clusters[cluster] = thiscluster;
                  if (sameuser) { $scope.global.user.cities[$scope.global.user.context].clusters[cluster] = thiscluster; }

              } else {
                  $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                  console.warn("WARNING: " +  response.message);

              }
          });
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

  }])

  .controller('InvitePeopleController', ['$scope', '$auth', 'userService', function ($scope, $auth, userService) {

      $scope.invitePerson = function(url, email, userid) {
          $scope.disabled = true;
          userService.invitePerson(url, email, userid, function(response) {
              $scope.disabled = false;
              if (response.status !== 200) {
                  $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                  console.warn("WARNING: ");
                  console.log(response);
              } else {
                  $scope.global.alert = { type: 'success', msg: 'Person imported! ' + response.data.name + ' is good to go.' };
              }
          });
      };

      $scope.disabled = false;

  }])

  .controller('LoginCtrl', ['$scope', '$auth', '$global', '$location', '$route', '$mixpanel', function($scope, $auth, $global, $location, $route, $mixpanel) {
      $global.set('fullscreen', true);
      $scope.$on('$destroy', function () {
          $global.set('fullscreen', false);
      });
      $scope.isAuthenticated = function() {
          return $auth.isAuthenticated();
      };
      if ($scope.global.alert) {
          if ($scope.global.alert.msg == 'undefined' || !$scope.global.alert.msg) { $scope.global.alert = undefined }
      }

      $scope.login = function() {
          $auth.login({ email: $scope.email, password: $scope.password })
            .then(function(response) {
                $scope.global.user = response.data.user;
                $scope.global.alert = undefined;
                $scope.global.sessionReady();
                $location.path('/app');
                console.log('Logged in!');
                $mixpanel.identify($scope.global.user.key);
                $mixpanel.track('Logged in');
            })
            .catch(function(response) {
                if (response.data.message && response.data.message !== 'undefined') {
                    $scope.global.alert = {type: 'danger', msg: String(response.data.message)};
                } else $scope.global.alert = undefined;
                console.warn("WARNING:");
                console.log(response);
            });
      };
      $scope.authenticate = function(provider) {
          $auth.authenticate(provider)
            .then(function(response) {
                $scope.global.user = response.data.user;
                $scope.global.alert = undefined;
                $scope.global.sessionReady();
                console.log('Logged in!');
                $mixpanel.identify($scope.global.user.key);
                $mixpanel.track('Logged in');
                $location.path('/app');
                $route.reload();
            })
            .catch(function(response) {
                console.warn("WARNING:");
                console.log(response);
                if (response.data.profile) {
                    $mixpanel.people.set({
                        "$name": response.data.profile.firstName + ' ' + response.data.profile.lastName,
                        "$email": response.data.profile.emailAddress
                    });
                    $mixpanel.track('Attempted Login');
                    UserVoice.push(['identify', {
                        name: response.data.profile.firstName + ' ' + response.data.profile.lastName,
                        email: response.data.profile.emailAddress
                    }]);
                }
                if (response.data.message && response.data.message !== 'undefined') {
                    $scope.global.alert = {type: 'danger', msg: String(response.data.message)};
                } else $scope.global.alert = undefined;
            });
      };
  }])

  .controller('SignupCtrl', ['$scope', '$auth', '$global', '$location', function($scope, $auth, $global, $location) {
      $global.set('fullscreen', true);
      $scope.$on('$destroy', function () {
          $global.set('fullscreen', false);
      });
      $scope.signup = function() {
          $auth.signup({
              name: $scope.name,
              email: $scope.email,
              password: $scope.password
          })
            .then(function() {
                $scope.global.alert = { type: 'success', msg: "You're in! Registration was successful - welcome aboard."};
                $location.path('/login');
            });
      };
  }])


  .controller('RegistrationPageController', ['$scope', '$timeout', function ($scope, $timeout) {
      $scope.checking = false;
      $scope.checked = false;
      $scope.checkAvailability = function () {
          if ($scope.reg_form.username.$dirty===false) return;
          $scope.checking = true;
          $timeout( function () {
              $scope.checking = false;
              $scope.checked = true;
          }, 500);
      };
  }])

  .controller('ErrorPageController', ['$scope', '$global', '$location', '$window', 'userService', function ($scope, $global, $location, $window, userService) {
      $global.set('fullscreen', true);
      $scope.$on('$destroy', function () {
          $global.set('fullscreen', false);
      });
      $scope.formData = {};

      $scope.search = function(query) {
          try {
              userService.search($scope.global.user.context, query)
                .then(function(results) {
                    $scope.global.search = results.data;
                    $location.path('/search');
                });
          } catch (err) {
              $scope.global.alert = {type: 'danger', msg: 'Whoops, we need you to login first.'};
          }
      };

      $scope.goBack = function() {
          $window.history.back();
      };

  }])

  .controller('CalendarController', ['$scope', '$global', function ($scope, $global) {
      var date = new Date();
      var d = date.getDate();
      var m = date.getMonth();
      var y = date.getFullYear();

      $scope.demoEvents = [
          {
              title: 'All Day Event',
              start: new Date(y, m, 8),
              backgroundColor: $global.getBrandColor('warning')
          },
          {
              title: 'Long Event',
              start: new Date(y, m, d-5),
              end: new Date(y, m, d-2),
              backgroundColor: $global.getBrandColor('success')
          },
          {
              id: 999,
              title: 'Repeating Event',
              start: new Date(y, m, d-3, 16, 0),
              allDay: false,
              backgroundColor: $global.getBrandColor('primary')
          },
          {
              id: 999,
              title: 'Repeating Event',
              start: new Date(y, m, d+4, 16, 0),
              allDay: false,
              backgroundColor: $global.getBrandColor('danger')
          },
          {
              title: 'Meeting',
              start: new Date(y, m, d, 10, 30),
              allDay: false,
              backgroundColor: $global.getBrandColor('info')
          },
          {
              title: 'Lunch',
              start: new Date(y, m, d, 12, 0),
              end: new Date(y, m, d, 14, 0),
              allDay: false,
              backgroundColor: $global.getBrandColor('midnightblue')
          },
          {
              title: 'Birthday Party',
              start: new Date(y, m, d+1, 19, 0),
              end: new Date(y, m, d+1, 22, 30),
              allDay: false,
              backgroundColor: $global.getBrandColor('primary')
          },
          {
              title: 'Click for Google',
              start: new Date(y, m, 28),
              end: new Date(y, m, 29),
              url: 'http://google.com/',
              backgroundColor: $global.getBrandColor('warning')
          }
      ];

      $scope.events = [
          {title: 'Demo Event 1'}, {title: 'Demo Event 2'}, {title: 'Demo Event 2'}
      ];
      $scope.addEvent = function () {
          $scope.events.push({ title: $scope.newEvent });
          $scope.newEvent = '';
      };
  }])
  .directive('fullCalendar', function () {
      return {
          restrict: 'A',
          scope: {
              options: '=fullCalendar'
          },
          link: function (scope, element, attr) {
              var defaultOptions = {
                  header: {
                      left: 'prev,next today',
                      center: 'title',
                      right: 'month,agendaWeek,agendaDay'
                  },
                  selectable: true,
                  selectHelper: true,
                  select: function(start, end, allDay) {
                      var title = prompt('Event Title:');
                      if (title) {
                          calendar.fullCalendar('renderEvent',
                            {
                                title: title,
                                start: start,
                                end: end,
                                allDay: allDay
                            },
                            true // make the event "stick"
                          );
                      }
                      calendar.fullCalendar('unselect');
                  },
                  editable: true,
                  events: [],
                  buttonText: {
                      prev: '<i class="fa fa-angle-left"></i>',
                      next: '<i class="fa fa-angle-right"></i>',
                      prevYear: '<i class="fa fa-angle-double-left"></i>',  // <<
                      nextYear: '<i class="fa fa-angle-double-right"></i>',  // >>
                      today:    'Today',
                      month:    'Month',
                      week:     'Week',
                      day:      'Day'
                  }
              };
              $.extend(true, defaultOptions, scope.options);
              if (defaultOptions.droppable == true) {
                  defaultOptions.drop = function(date, allDay) {
                      var originalEventObject = $(this).data('eventObject');
                      var copiedEventObject = $.extend({}, originalEventObject);
                      copiedEventObject.start = date;
                      copiedEventObject.allDay = allDay;
                      calendar.fullCalendar('renderEvent', copiedEventObject, true);
                      if (defaultOptions.removeDroppedEvent == true)
                          $(this).remove();
                  }
              }
              var calendar = $(element).fullCalendar(defaultOptions);
          }
      };
  })
  .directive('draggableEvent', function () {
      return {
          restrict: 'A',
          scope: {
              eventDef: '=draggableEvent'
          },
          link: function (scope, element, attr) {
              $(element).draggable({
                  zIndex: 999,
                  revert: true,
                  revertDuration: 0
              });
              $(element).data('eventObject', scope.eventDef);
          }
      };
  });

