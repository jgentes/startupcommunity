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
          userService.search($scope.global.user.value.context, query)
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

      $scope.global.getObject = function(theObject, key) { // a general function to find data in JSON objects & arrays
          var result = null;
          if (theObject instanceof Array) {
              for (var i = 0; i < theObject.length; i++) {
                  result = $scope.global.getObject(theObject[i], key);
              }
          } else {
              for (var prop in theObject) {
                  if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
                      if (prop == key) {
                          result = theObject[key];
                          break;
                      }
                      result = $scope.global.getObject(theObject[prop], key);
                  }
              }
          }
          return result;
      };

      var broadcast = function() {
          $scope.$broadcast('sessionReady', true);
          $location.path('/people');

          if ($scope.global.user.path.key) {
              $mixpanel.people.set({
                  "$name": $scope.global.user.value.profile.name,
                  "$email": $scope.global.user.value.profile.email
              });
              UserVoice.push(['identify', {
                  id: $scope.global.user.path.key,
                  name: $scope.global.user.value.profile.name,
                  email: $scope.global.user.value.profile.email
              }]);
          }
      };

      // Get and set user and location data
      $scope.global.sessionReady = function() {
          if (!$scope.global.user || !$scope.global.community) {
              userService.getProfile()
                .success(function(response) {
                    if (response.path) {
                        $scope.global.user = response;
                        if (!$scope.global.profile) {
                            $scope.global.profile = response;
                        }

                        var community = $scope.global.user.value.context;
                        communityService.getCommunity(community)
                          .success(function(response) {
                              if (response) {
                                  $scope.global.community = response;
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

  .controller('PeopleController', ['$scope', '$location', 'userService', 'resultService', function ($scope, $location, userService, resultService) {

      $scope.getUsers = function(alturl) {
          userService.getUsers($scope.global.user.value.context, undefined, undefined, 32, alturl)
            .then(function(response) {
                $scope.users = resultService.setPage(response.data);
                if ($location.$$path == '/search') {
                    $scope.global.search = resultService.setPage($scope.users);
                } else { $scope.global.search = undefined }
            });
      };

      $scope.viewUser = function(user) {
          $scope.global.profile = user;
          $location.path('/profile');
      };

      function getData() {
          if ($location.$$path == '/people' || $scope.global.search === undefined) {
              $scope.getUsers('/api/1.0/' + $scope.global.user.value.context + '/users?limit=32');
          }
          $scope.global.context.industry = ['*'];
          $scope.global.context.role = ['*'];
          setTitle();
      }

      function setTitle() {
          var item,
            role = '',
            cluster = '';
          if ($scope.global.context.role[0] == '*') {
              role = "People";
          } else {
              for (item in $scope.global.context.role) {
                  role += ($scope.global.context.role[item] + 's');
                  if (item < $scope.global.context.role.length - 1) {
                      if (item < $scope.global.context.role.length - 2 ) {
                          role += '</strong>,<strong> ';
                      } else role += ' </strong>&<strong> ';
                  }
              }
          }
          if ($scope.global.context.industry[0] == '*') {
              cluster = $scope.global.community.location.value.citystate.split(',')[0]; //TODO Define global.context.location - do I need 'path' in global.community.industries, etc so I can lookup the keys properly?
          } else {
              item = 0;
              for (item in $scope.global.context.industry) {
                  cluster += $scope.global.context.industry[item];
                  if (item < $scope.global.context.industry.length - 1) {
                      if (item < $scope.global.context.industry.length - 2 ) {
                          cluster += ', ';
                      } else cluster += ' & ';
                  }
              }
          }
          $scope.title = '<strong>' + role + '</strong> in ' + cluster;
      }

      $scope.filterCluster = function(cluster) {
          $scope.loadingCluster = true;
          if (cluster == '*') {
              $scope.global.context.industry = ['*'];
          } else {
              if ($scope.global.context.industry.indexOf('*') >= 0) {
                  $scope.global.context.industry.splice($scope.global.context.industry.indexOf('*'), 1);
              }
              if ($scope.global.context.industry.indexOf(cluster) < 0) {
                  $scope.global.context.industry.push(cluster);
              } else $scope.global.context.industry.splice($scope.global.context.industry.indexOf(cluster), 1);
              if ($scope.global.context.industry.length === 0) {
                  $scope.global.context.industry = ['*'];
              }
          }

          userService.getUsers($scope.global.user.value.context, $scope.global.context.industry, $scope.global.context.role, 32, undefined)
            .then(function(response) {
                $scope.loadingCluster = false;
                $scope.users = resultService.setPage(response.data);
                setTitle();
            });
      };

      $scope.search = function(query) {
          $scope.global.search.tag = query;
          $scope.global.search.results = undefined;
          userService.search($scope.global.user.value.context, query)
            .then(function(response) {
                $scope.global.search = resultService.setPage(response.data);
                $scope.global.search.lastQuery = query;
                $location.path('/search');
            });
      };

      $scope.filterRole = function(role) {
          $scope.loadingRole = true;
          if (role == '*') {
              $scope.global.context.role = ['*'];
          } else {
              if ($scope.global.context.role.indexOf('*') >= 0) {
                  $scope.global.context.role.splice($scope.global.context.role.indexOf('*'), 1);
              }
              if ($scope.global.context.role.indexOf(role) < 0) {
                  $scope.global.context.role.push(role);
              } else $scope.global.context.role.splice($scope.global.context.role.indexOf(role), 1);
              if ($scope.global.context.role.length === 0) {
                  $scope.global.context.role = ['*'];
              }
          }

          userService.getUsers($scope.global.user.value.context, $scope.global.context.industry, $scope.global.context.role, 32, undefined)
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
              displayName: $scope.global.user.value.displayName,
              email: $scope.global.user.value.email
          }).then(function() {
              $scope.global.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
          });
      };

      $scope.getKey = function() {
          if (!$scope.global.user.value.profile.api_key) {
              userService.getKey()
                .then(function(response) {
                    $scope.global.user.value.profile.api_key = response.data;
                    $bootbox.alert({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.value.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.value.profile.api_key + "</pre>"});
                });
          } else $bootbox.alert({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.value.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.value.profile.api_key + "</pre>"});
      };

      $scope.isCityAdvisor = function(status) {
          userService.setCityAdvisor($scope.global.profile.path.key, $scope.global.user.value.context, 'cityAdvisor', status, function(response, rescode) {
              var sameuser = false;
              var cluster;
              if (rescode == 201) {
                  if ($scope.global.profile.path.key == $scope.global.user.path.key) { sameuser = true; }
                  if ($scope.global.profile.value.cities[$scope.global.user.value.context].cityAdvisor === undefined) { //need to create key
                      $scope.global.profile.value.cities[$scope.global.user.value.context]['cityAdvisor'] = false;
                  }

                  $scope.global.profile.value.cities[$scope.global.user.value.context].cityAdvisor = status;

                  for (cluster in $scope.global.community.location.value.clusters) {
                      if (status === true) {
                          if ($scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster]) {
                              $scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster].advisorStatus = true;
                          }
                      } else {
                          if (!$scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster].roles || ($scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster].roles.indexOf("Advisor") < 0)) {
                              $scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster].advisorStatus = false;
                          } else {
                              $scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster].advisorStatus = true;
                          }
                      }
                  }

                  if (sameuser) {
                      $scope.global.user.value.cities[$scope.global.user.value.context].cityAdvisor = status;
                  }
              } else {
                  $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                  console.warn("WARNING: " +  response.message);
              }
          });
      };

      $scope.setRole = function(cluster, role, status) {
          userService.setRole($scope.global.profile.path.key, $scope.global.user.value.context, cluster, role, status, function(response, rescode) {
              var sameuser = false;
              if (rescode == 201) {
                  if ($scope.global.profile.path.key == $scope.global.user.path.key) { sameuser = true; }
                  if ($scope.global.profile.value.cities[$scope.global.user.value.context].clusters === undefined) { //need to create clusters key
                      $scope.global.profile.value.cities[$scope.global.user.value.context]['clusters'] = {};
                  }
                  if ($scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster] === undefined) { //need to create the cluster in user profile
                      $scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster] = { "roles": [] };
                  }
                  if ($scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster].roles === undefined) { //this can happen due to temp local scope variables
                      $scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster].roles = [];
                  }
                  var thiscluster = $scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster];

                  if (status === true) {
                      if (thiscluster.roles.indexOf(role) < 0) {
                          thiscluster.roles.push(role);
                      } // else they already have the role, no action needed
                  } else {
                      if (thiscluster.roles.indexOf(role) >= 0) {
                          thiscluster.roles.splice(thiscluster.roles.indexOf(role), 1);
                      } // else they do not have the role, no action needed
                  }

                  $scope.global.profile.value.cities[$scope.global.user.value.context].clusters[cluster] = thiscluster;
                  if (sameuser) { $scope.global.user.value.cities[$scope.global.user.value.context].clusters[cluster] = thiscluster; }

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
                $mixpanel.identify($scope.global.user.path.key);
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
                $mixpanel.identify($scope.global.user.path.key);
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
              userService.search($scope.global.user.value.context, query)
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

