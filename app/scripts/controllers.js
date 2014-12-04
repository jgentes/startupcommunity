angular
  .module('appControllers', [])
  .controller('MainController', ['$scope','$window', '$global', '$route', '$timeout', '$interval', 'progressLoader', '$location', '$auth', 'userService', 'cityService', 'segmentio', function ($scope, $window, $global, $route, $timeout, $interval, progressLoader, $location, $auth, userService, cityService, segmentio) {
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
            
    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated(); //returns true or false based on browser local storage token
    };  
    
    $scope.search = function(query) {
      userService.search($scope.global.city.path.key, query)
      .then(function(results) {
        $scope.global.search = results.data;
        $location.path('/search');
      });
    };
    
    $scope.editProfile = function() {            
      $scope.global.profile = $scope.global.user;            
      $location.path('/profile');
      $route.reload();
    };
    
    $scope.logOut = function() {      
      $auth.logout()
      .then(function() {
        $scope.global.user = undefined;
        $scope.global.alert = undefined;
        $location.path('/login');
        });
    };      
  
    $scope.closeAlert = function() {
      $scope.global.alert = undefined;
    };
    
    var broadcast = function() {      
      $scope.$broadcast('sessionReady', true);
      segmentio.identify($scope.global.user.path.key, {
        name: $scope.global.user.value.name,
        email: $scope.global.user.value.email
      });
    };
      
    
    // Get and set user and city data         
    $scope.global.sessionReady = function() {
      if (!$scope.global.user || !$scope.global.city) {
        userService.getProfile()
        .then(function(response) {
          if (response.data) {
            $scope.global.user = response.data;
            if (!$scope.global.profile) {
              $scope.global.profile = response.data;
            }
            for (var citystate in $scope.global.user.value.cities) break; // grab first city
            cityService.getCity(citystate)
            .then(function(response) {
              if (response.data) {            
                $scope.global.city = response.data;  
                broadcast();
              }
            });        
          }
        });
      } else broadcast();
    };    
        
    segmentio.load('fn0wc8wvqu');
    
    $scope.global.sessionReady();       
    
    // Feedback mechanisms used during Beta
    
    var feedbackdata = {};
    
    $scope.global.betaTour = {
      items: [{
          "step": 1,
          "selector": ".beta",
          "title": "My role in the startup community is:",
          "content": "<fieldset><div class='checkbox'><label><input ng-change='global.feedback(\"advisor\", advisor)' type='checkbox' value='' ng-model='advisor'>Advisor {{advisor}}</label></div><div class='checkbox'><label><input ng-change='global.feedback(\"leader\", leader)' type='checkbox' value='' ng-model='leader'>Community Leader</label></div><div class='checkbox'><label><input type='checkbox' ng-change='global.feedback(\"member\", member)' value='' ng-model='member'>Community Member</label></div><div class='checkbox'><label><input ng-change='global.feedback(\"investor\", investor)' type='checkbox' value='' ng-model='investor'>Investor</label></div><div class='checkbox'><label><input ng-change='global.feedback(\"founder\", founder)' type='checkbox' value='' ng-model='founder'>Startup Founder</label></div><label>Something else?<input type='text' ng-change='global.feedback(\"other\", other)' ng-model='other' class='form-control'></label></fieldset>",
          "width": "300px",
          "placement": "right",        
          "finishButton": "<button class='btn btn-primary btn-mini bootstro-finish-btn'>Done! »</button>"          
      }]
    };
    
    $scope.global.feedback = function(type, value, submit) {
      console.log('hit!');
      feedbackdata[type] = value;
      console.log(feedbackdata[type] + ': ' + value);
    };
    
  }])
  
  .filter('words', function() {    
    return function(text, wordnum) {
      if (text) {     
        return text.split(" ")[wordnum];
      }
    };
  })
        
  .controller('PeopleController', ['$scope', '$location', 'userService', function ($scope, $location, userService) {            
    
    function setPage() {
      if ($scope.users.next) {
          $scope.users.start = Number($scope.users.next.match(/offset=([^&]+)/)[1]) - Number($scope.users.count) + 1;
          $scope.users.end = Number($scope.users.next.match(/offset=([^&]+)/)[1]);
        } else if ($scope.users.prev) {
          $scope.users.start = Number($scope.users.total_count) - Number($scope.users.count);
          $scope.users.end = $scope.users.total_count;
        } else if ($scope.users.count === 0 || $scope.users === undefined) {
          $scope.users.start = 0;
          $scope.users.end = 0;
        } else {          
          $scope.users.start = 1; $scope.users.end = $scope.users.total_count;
        }
    }
    
    $scope.rotateWidgetClass = function() {
      var arr = ["'themed-background-dark'",'themed-background-dark-night','themed-background-dark-modern', 'themed-background-dark-autumn', 'themed-background-dark-fancy', 'themed-background-dark-fire'];
      var idx = Math.floor(Math.random() * arr.length);
      return arr[idx];
    };
    
    $scope.getUsers = function(alturl) {
      userService.getUsers($scope.global.city.path.key, undefined, undefined, 32, alturl)
      .then(function(response) {          
        $scope.users = response.data;        
        setPage();
      });
    };  
    
    $scope.viewUser = function(user) {
      $scope.global.profile = user;
      $location.path('/profile');
    };    
    
    function getData() {
      if ($location.$$path == '/people' || $scope.global.search === undefined) {
        $scope.getUsers('/api/' + $scope.global.city.path.key + '/users?limit=32');                                  
      } else if ($location.$$path == '/search') {
        $scope.users = $scope.global.search;
        setPage();        
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
          role += $scope.selectedRole[item];
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
        $scope.users = response.data;        
        setPage();
        setTitle();
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
        $scope.users = response.data;           
        setPage();
        setTitle();
      });
    };
            
    if (!$scope.global.city) {
      $scope.$on('sessionReady', function(event, status) {
        getData();         
      });                    
    } else getData();             
    
  }])    
  
  .controller('ProfileController', ['$scope', 'userService', '$location', '$auth', '$bootbox', function ($scope, userService, $location, $auth, $bootbox) {
    
    $scope.putProfile = function(userid, profile) {
      userService.putProfile(userid, profile, function(response) {
        if (response.status !== 200) {          
            $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) }; 
            console.warn(response.message);
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
          $bootbox.alert({title: "See our <a href='https://www.mashape.com/jgentes/applications/startupcommunity-org' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.value.api_key + "</pre>"});
        });
      } else $bootbox.alert({title: "See our <a href='https://www.mashape.com/jgentes/applications/startupcommunity-org' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.value.api_key + "</pre>"});
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
            console.warn(response.message);                      
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
            console.warn(response.message);
                        
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
          console.warn(response.message);
        } else {            
          $scope.global.alert = { type: 'success', msg: 'Person imported! ' + response.data.name + ' is good to go.' };     
        }
      });
    };    
      
    $scope.disabled = false;
    
  }])
  
  .controller('LoginCtrl', ['$scope', '$auth', '$global', '$location', '$route', function($scope, $auth, $global, $location, $route) {
    $global.set('fullscreen', true);    
    $scope.$on('$destroy', function () {
      $global.set('fullscreen', false);
    });
    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };
    $scope.login = function() {
      $auth.login({ email: $scope.email, password: $scope.password })
        .then(function(response) {
          $scope.global.user = response.data.user;
          $scope.global.alert = undefined;
          $scope.global.sessionReady();
          $location.path('/');
          console.log('Logged in!');                    
        })
        .catch(function(response) {
          $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.data.message) };          
          console.warn(response.data.message);
        });
    };
    $scope.authenticate = function(provider) {
      $auth.authenticate(provider)
        .then(function(response) {
          $scope.global.user = response.data.user;
          $scope.global.alert = undefined;
          $scope.global.sessionReady();
          console.log('Logged in!');
          $location.path('/');
          $route.reload();          
        })
        .catch(function(response) {
          $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.data) };     
          console.warn(response.data);
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
  
  .controller('LaunchformController', ['$scope', '$global', '$http', '$q', 'geocoder', function ($scope, $global, $http, $q, geocoder) {
  	$global.set('fullscreen', true);
  	$scope.$on('$destroy', function () {
      $global.set('fullscreen', false);
    });
  	$scope.formData = {};  	
  	$scope.subscribe = function() { 
      $http({
  	        method  : 'POST',
  	        url     : '/sub',
  	        data    : $.param({ email: $scope.formData.email, city: $scope.formData.city }),  // pass in data as strings
  	        headers : { 'Content-Type': 'application/x-www-form-urlencoded' }  // set the headers so angular passing info as form data (not request payload)
  	    }).success(function(data, status, headers) {
          if(data.success){
            $scope.global.alert = { type: 'success', msg: 'Thanks, we look forward to helping you build a vibrant startup community in <strong>' + $scope.formData.city.substr(0, $scope.formData.city.length - 4) + '</strong>!  We\'ll be in touch soon.'}; 
            $scope.formData = {};
            
          }else {
            $scope.global.alert = {type: 'danger', msg: 'Something went wrong!'}; 
          }
      });
    };
    
    $scope.getLocation = function(val) {      
      var deferred = $q.defer();      
      
      geocoder.geocode({ address: String(val), componentRestrictions: {'country':'US'} }, function(callbackResult) {        
        deferred.resolve(callbackResult);
      });
        
      return deferred.promise;            
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
    
  }]);
  	
  
  

