angular
  .module('appControllers', [])
  .controller('MainController', ['$scope','$window', '$global', '$route', '$timeout', '$interval', 'progressLoader', '$location', '$auth', 'userService', 'cityService', '$compile', 'resultService', '$mixpanel', function ($scope, $window, $global, $route, $timeout, $interval, progressLoader, $location, $auth, userService, cityService, $compile, resultService, $mixpanel) {
    $scope.style_fixedHeader = $global.get('fixedHeader');
    $scope.style_headerBarHidden = $global.get('headerBarHidden');
    $scope.style_layoutBoxed = $global.get('layoutBoxed');
    $scope.style_fullscreen = $global.get('fullscreen');
    $scope.style_leftbarCollapsed = $global.get('leftbarCollapsed');
    $scope.style_leftbarShown = $global.get('leftbarShown');
    $scope.style_rightbarCollapsed = $global.get('rightbarCollapsed');
    $scope.style_isSmallScreen = false;
    $scope.style_layoutHorizontal = $global.get('layoutHorizontal');
    $scope.global = { alert: undefined };
    
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
      userService.search($scope.global.city.path.key, query)
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

    // Feedback mechanisms used during Beta

    $scope.global.betaTour = {
      people: {},
      profile: {},
      data: {},
      feedback: function(userdata) {
        userService.feedback(userdata);
      },
      recompile: function() {
        $timeout(function() {
          var popoverEl = $('body').find('.popover');
          $compile(popoverEl)($scope);
        }, 50);
      },
      gotoProfile: function() {
        $location.path('/profile');
        $timeout(function() {
          $scope.global.editProfile = true;
          bootstro.stop();
          bootstro.start('', $scope.global.betaTour.profile);
          }, 1500);
      }
    };

    $scope.global.betaTour.people['items'] = [{
      step: 0,
      selector: ".beta0",
      title: "Welcome to Bend's Startup Community!",
      content: "Before getting started, please take our tour and answer a few questions.",
      placement: "bottom",
      width: "300px",
      finishButton: "<span style='display: none'></span>",
      onStep: $scope.global.betaTour.recompile
    },
    {
      step: 1,
      selector: ".beta1",
      title: "Community = People and Startups",
      content: "The community is organized around People and Startups.<br><br>People have different roles, including founders, advisors, and investors in Startups.<br><br><label>Expect something else? Tell us:<input onkeydown='if (event.keyCode == 13) $(&apos;.bootstro-next-btn&apos;).click()' type='text' ng-model='global.betaTour.data.community' class='form-control'></label>",
      placement: "bottom",
      margin: 150,
      width: "300px",
      finishButton: "<span style='display: none'></span>",
      onStep: $scope.global.betaTour.recompile
    },
    {
      step: 2,
      selector: ".beta2",
      title: "Clusters = Industry Segments",
      content: "Clusters represent an ecosystem focused on a specific industry.<br><br>People and Startups are grouped into Clusters.<br><br><label>Expect something else? Tell us:<input onkeydown='if (event.keyCode == 13) $(&apos;.bootstro-next-btn&apos;).click()' type='text' ng-model='global.betaTour.data.clusters' class='form-control'></label>",
      placement: "right",
      width: "300px",
      finishButton: "<span style='display: none'></span>",
      onStep: $scope.global.betaTour.recompile
    },
    {
      step: 3,
      selector: ".beta3",
      title: "My role in the startup community is:",
      content: "<fieldset style='margin-top: -10px;'><div class='checkbox'><label><input type='checkbox' value='' ng-model='global.betaTour.data.advisor'>Advisor</label></div><div class='checkbox'><label><input type='checkbox' value='' ng-model='global.betaTour.data.leader'>Community Leader</label></div><div class='checkbox'><label><input type='checkbox' value='' ng-model='global.betaTour.data.member'>Community Member</label></div><div class='checkbox'><label><input type='checkbox' value='' ng-model='global.betaTour.data.investor'>Investor</label></div><div class='checkbox'><label><input type='checkbox' value='' ng-model='global.betaTour.data.founder'>Startup Founder</label></div><label>Something else?<input type='text' ng-model='global.betaTour.data.other' class='form-control'></label></fieldset>",
      width: "300px",
      placement: "right",
      finishButton: "<button ng-click='global.betaTour.gotoProfile()' class='btn btn-primary btn-mini bootstro-next-btn' style='margin-top:-34px'>Next »</button>",
      onStep: $scope.global.betaTour.recompile
    }];

  $scope.global.betaTour.profile['items'] = [{
      step: 4,
      selector: ".beta4",
      title: "{{global.user.value.name | words:0}}, this is your profile.",
      content: "Your profile information is pulled from Linkedin.<br><br>If you update your Summary or Contact info on Linkedin, it will update here.",
      placement: "bottom",
      width: "300px",
      finishButton: "<span style='display: none'></span>",
      onStep: $scope.global.betaTour.recompile
    },
    {
      step: 5,
      selector: ".beta5",
      title: "Your Cluster Activity",
      content: "You should indicate whether you are a member or an advisor in each cluster.<br><br>If you advise all clusters, you are considered a 'General Advisor'.<br><br><label><strong>Quick question:</strong> What do you hope this site will help you do?<textarea placeholder='Could be tasks you want to perform, problems you are trying to solve, or needs you are trying to satisfy.' ng-model='global.betaTour.data.jobs' rows='4' class='form-control'></textarea></label>",
      placement: "left",
      width: "300px",
      finishButton: "<button ng-click='global.betaTour.feedback(global.betaTour.data)' class='btn btn-mini btn-success bootstro-finish-btn'><i class='fa fa-check'></i> Ok, let me in!</button>",
      onStep: $scope.global.betaTour.recompile
    }];

    var broadcast = function() {
      $scope.$broadcast('sessionReady', true);
      if ($scope.global.user.value.beta === undefined) {
        $location.path('/people');
        $timeout(function() {
          bootstro.start('', $scope.global.betaTour.people);
          $scope.global.betaTour.recompile();
        }, 3500);
      }
        if ($scope.global.user.path.key) {
            $mixpanel.people.set({
                "$name": $scope.global.user.value.name,
                "$email": $scope.global.user.value.email
            });
            UserVoice.push(['identify', {
                id: $scope.global.user.path.key,
                name: $scope.global.user.value.name,
                email: $scope.global.user.value.email
            }]);
        }
    };

    // Get and set user and city data
    $scope.global.sessionReady = function() {
      if (!$scope.global.user || !$scope.global.city) {
        userService.getProfile()
        .success(function(response) {
          if (response.path) {
            $scope.global.user = response;
            if (!$scope.global.profile) {
              $scope.global.profile = response;
            }
            for (var citystate in $scope.global.user.value.cities) break; // grab first city
            cityService.getCity(citystate)
            .success(function(response) {
              if (response) {
                $scope.global.city = response;
                broadcast();
              } else {
                $scope.global.logout({ type: 'danger', msg: String(response.message) });
              }
            })
            .error(function(response) {
              $scope.global.alert ({ type: 'danger', msg: String(response.message) });
            });
          } else {
            $scope.global.logout({ type: 'danger', msg: String(response.message) });
          }
        })
        .error(function(response) {
            $scope.global.logout({ type: 'danger', msg: String(response.message) });
        });
      } else broadcast();
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
      userService.getUsers($scope.global.city.path.key, undefined, undefined, 32, alturl)
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
        $scope.getUsers('/api/1.0/' + $scope.global.city.path.key + '/users?limit=32');        
      }      
      $scope.global.city.selectedCluster = ['*'];        
      $scope.selectedRole = ['*'];
      setTitle();
    }
    
    function setTitle() {
      var item, 
          role = '', 
          cluster = '';
      if ($scope.selectedRole[0] == '*') { 
        role = "People";
      } else {
        for (item in $scope.selectedRole) {
          role += ($scope.selectedRole[item] + 's');
          if (item < $scope.selectedRole.length - 1) {            
            if (item < $scope.selectedRole.length - 2 ) {
            role += '</strong>,<strong> ';
            } else role += ' </strong>&<strong> ';
          }
        }
      }
      if ($scope.global.city.selectedCluster[0] == '*') {
        cluster = $scope.global.city.value.citystate.split(',')[0];
      } else {
        item = 0;
        for (item in $scope.global.city.selectedCluster) {          
          cluster += $scope.global.city.selectedCluster[item];          
          if (item < $scope.global.city.selectedCluster.length - 1) {            
            if (item < $scope.global.city.selectedCluster.length - 2 ) {
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
        $scope.global.city.selectedCluster = ['*']; 
      } else {
        if ($scope.global.city.selectedCluster.indexOf('*') >= 0) {
          $scope.global.city.selectedCluster.splice($scope.global.city.selectedCluster.indexOf('*'), 1);
        }
        if ($scope.global.city.selectedCluster.indexOf(cluster) < 0) {
          $scope.global.city.selectedCluster.push(cluster);
        } else $scope.global.city.selectedCluster.splice($scope.global.city.selectedCluster.indexOf(cluster), 1);
        if ($scope.global.city.selectedCluster.length === 0) { 
          $scope.global.city.selectedCluster = ['*'];
        }
      }
        
      userService.getUsers($scope.global.city.path.key, $scope.global.city.selectedCluster, $scope.selectedRole, 32, undefined)
      .then(function(response) {
        $scope.loadingCluster = false;
        $scope.users = resultService.setPage(response.data);     
        setTitle();
      });
    };
    
    $scope.search = function(query) {          
      $scope.global.search.tag = query;
      $scope.global.search.results = undefined;
      userService.search($scope.global.city.path.key, query)
      .then(function(response) {        
        $scope.global.search = resultService.setPage(response.data);
        $scope.global.search.lastQuery = query;
        $location.path('/search');
      });  	  
    }; 
    
    $scope.filterRole = function(role) {      
      $scope.loadingRole = true;  
      if (role == '*') {         
        $scope.selectedRole = ['*'];        
      } else {
        if ($scope.selectedRole.indexOf('*') >= 0) {
          $scope.selectedRole.splice($scope.selectedRole.indexOf('*'), 1);
        }
        if ($scope.selectedRole.indexOf(role) < 0) {
          $scope.selectedRole.push(role);
        } else $scope.selectedRole.splice($scope.selectedRole.indexOf(role), 1);
        if ($scope.selectedRole.length === 0) { 
          $scope.selectedRole = ['*'];
        }
      }
      
      userService.getUsers($scope.global.city.path.key, $scope.global.city.selectedCluster, $scope.selectedRole, 32, undefined)
      .then(function(response) {        
        $scope.loadingRole = false;
        $scope.users = resultService.setPage(response.data);                   
        setTitle();
      });
    };
            
    if (!$scope.global.city) {
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
      if (!$scope.global.user.value.api_key) {
        userService.getKey()
        .then(function(response) {
          $scope.global.user.value.api_key = response.data;
          $bootbox.alert({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.value.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.value.api_key + "</pre>"});
        });
      } else $bootbox.alert({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.value.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.value.api_key + "</pre>"});
    };
    
    $scope.isCityAdvisor = function(status) {
      userService.setCityAdvisor($scope.global.profile.path.key, $scope.global.city.path.key, 'cityAdvisor', status, function(response, rescode) {
        var sameuser = false;
        var cluster;
        if (rescode == 201) {
          if ($scope.global.profile.path.key == $scope.global.user.path.key) { sameuser = true; }
          if ($scope.global.profile.value.cities[$scope.global.city.path.key].cityAdvisor === undefined) { //need to create key
            $scope.global.profile.value.cities[$scope.global.city.path.key]['cityAdvisor'] = false;
          }
          
          $scope.global.profile.value.cities[$scope.global.city.path.key].cityAdvisor = status;
                                
          for (cluster in $scope.global.city.value.clusters) {
            if (status === true) {
              if ($scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster]) {
                $scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].advisorStatus = true;              
              }
            } else {
              if (!$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].roles || ($scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].roles.indexOf("Advisor") < 0)) {
                $scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].advisorStatus = false;
              } else {
                $scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].advisorStatus = true;
              }              
            }
          }
          
          if (sameuser) {            
            $scope.global.user.value.cities[$scope.global.city.path.key].cityAdvisor = status;
          }
        } else {            
            $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) }; 
            console.warn("WARNING: " +  response.message);                      
        }
      });
    };
    
    $scope.setRole = function(cluster, role, status) {
      userService.setRole($scope.global.profile.path.key, $scope.global.city.path.key, cluster, role, status, function(response, rescode) {              
        var sameuser = false;
        if (rescode == 201) {
          if ($scope.global.profile.path.key == $scope.global.user.path.key) { sameuser = true; }
          if ($scope.global.profile.value.cities[$scope.global.city.path.key].clusters === undefined) { //need to create clusters key
            $scope.global.profile.value.cities[$scope.global.city.path.key]['clusters'] = {};
          }
          if ($scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster] === undefined) { //need to create the cluster in user profile            
              $scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster] = { "roles": [] };              
            }
          if ($scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].roles === undefined) { //this can happen due to temp local scope variables
              $scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].roles = [];              
            }
          var thiscluster = $scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster];

          if (status === true) {
            if (thiscluster.roles.indexOf(role) < 0) {
              thiscluster.roles.push(role);
            } // else they already have the role, no action needed
          } else {
            if (thiscluster.roles.indexOf(role) >= 0) {
              thiscluster.roles.splice(thiscluster.roles.indexOf(role), 1);
            } // else they do not have the role, no action needed
          }
          
          $scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster] = thiscluster;
          if (sameuser) { $scope.global.user.value.cities[$scope.global.city.path.key].clusters[cluster] = thiscluster; }
          
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
  
  .controller('AddPeopleController', ['$scope', '$auth', 'userService', function ($scope, $auth, userService) {
      
    $scope.addPerson = function(url, email, userid) {                  
      $scope.disabled = true;
      userService.addPerson(url, email, userid, function(response) {
        $scope.disabled = false;
        if (response.status !== 200) {          
          $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };  
          console.warn("WARNING: " +  response.message);
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
          if (response.data.message) {
            $scope.global.alert = {type: 'danger', msg: String(response.data.message)};
          }
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
          if (response.data.message) {
            $scope.global.alert = {type: 'danger', msg: String(response.data.message)};
          }
          console.warn("WARNING:");
              console.log(response);
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
        userService.search($scope.global.city.path.key, query)
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

