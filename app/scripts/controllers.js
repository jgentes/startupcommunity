angular
  .module('appControllers', [])
  .controller('MainController', ['$scope','$window', '$global', '$route', '$timeout', '$interval', 'progressLoader', '$location', '$auth', 'userService', 'cityService', function ($scope, $window, $global, $route, $timeout, $interval, progressLoader, $location, $auth, userService, cityService) {
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
                $scope.$broadcast('sessionReady', true);
              }
            });        
          }
        });
      } else $scope.$broadcast('sessionReady', true);
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
        
  .controller('PeopleController', ['$scope', '$location', 'userService', function ($scope, $location, userService) {
          
    function setPage() {
      if ($scope.users.next) {
          $scope.users.start = Number($scope.users.next.match(/offset=([^&]+)/)[1]) - Number($scope.users.count) + 1;
          $scope.users.end = Number($scope.users.next.match(/offset=([^&]+)/)[1]);
        } else if ($scope.users.prev) {
          $scope.users.start = Number($scope.users.total_count) - Number($scope.users.count);
          $scope.users.end = $scope.users.total_count;
        } else if ($scope.users.count === 0) {
          $scope.users.start = 0;
          $scope.users.end = 0;
        } else { 
          $scope.users.start = 1; $scope.users.end = $scope.users.total_count;
        }
    }
    
    $scope.rotateWidgetClass = function() {
      var arr = ["'themed-background-dark'",'themed-background-dark-night','themed-background-dark-amethyst', 'themed-background-dark-modern', 'themed-background-dark-autumn', 'themed-background-dark-flatie', 'themed-background-dark-spring', 'themed-background-dark-fancy', 'themed-background-dark-fire'];
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
    
    $scope.viewUser = function(userindex) {            
      $scope.global.profile = ($location.$$path == '/search' || $location.$$path == '/cluster') ? $scope.global.search.results[userindex] : $scope.users.results[userindex];
      $location.path('/profile');
    };    
    
    $scope.filterCluster = function(cluster) {      
      $scope.loadingCluster = true;
      $scope.selectedRole = 'People';
      if (cluster == $scope.global.city.value.citystate.split(',')[0]) { cluster = undefined; }
      userService.getUsers($scope.global.city.path.key, cluster, undefined, 32, undefined)
      .then(function(response) {
        $scope.loadingCluster = false;
        $scope.users = response.data;        
        setPage();
      });
    };
    
    $scope.filterRole = function(role) {      
      $scope.loadingRole = true;
      $scope.global.city.selectedCluster = $scope.global.city.value.citystate.split(',')[0];      
      if (role == 'People') { role = undefined; } else role = role.slice(0,-1);      
      userService.getUsers($scope.global.city.path.key, undefined, role, 32, undefined)
      .then(function(response) {        
        $scope.loadingRole = false;
        $scope.users = response.data;           
        setPage();
      });
    };
    
    if ($location.$$path == '/people') {
      if (!$scope.global.city) {    
        $scope.$on('sessionReady', function(event, status) {               
          if (status) {
            $scope.getUsers('/api/' + $scope.global.city.path.key + '/users?limit=32');            
            $scope.global.city.selectedCluster = $scope.global.city.value.citystate.split(',')[0];
            $scope.selectedRole = 'People';
          }
        });
      } else $scope.getUsers('/api/' + $scope.global.city.path.key + '/users?limit=32');
    }
    
  }])    
  
  .controller('ProfileController', ['$scope', 'userService', '$location', '$auth', function ($scope, userService, $location, $auth) {

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
    
    $scope.removeProfile = function(userid) {
      userService.removeProfile(userid, function(response) {        
        $location.path('/people');
        $scope.global.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };             
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
          var thiscluster = $scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster];
          
          if (status === true) {
            if (thiscluster.roles.indexOf(role) < 0) {
              thiscluster.roles.push(role);
            } // else they already have the role, no action needed
          } else {
            if (thiscluster.roles.indexOf(role) >= 0) {
              thiscluster.roles.splice(role);
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
          $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.data.message) };     
          console.warn(response.data.message);
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
  
 
  .directive('scrollToBottom', function () {
    return {
      restrict: 'A',
      scope: {
        model: '=scrollToBottom'
      },
      link: function (scope, element, attr) {
        scope.$watch('model', function (n, o) {
          if (n != o) {
            element[0].scrollTop = element[0].scrollHeight;
          }
        });
      }
    };
});

