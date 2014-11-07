angular
  .module('appControllers', [])
  .controller('MainController', ['$scope','$window', '$global', '$route', '$timeout', '$interval', 'progressLoader', '$location', '$auth', 'userService', function ($scope, $window, $global, $route, $timeout, $interval, progressLoader, $location, $auth, userService) {
    $scope.style_fixedHeader = $global.get('fixedHeader');
    $scope.style_headerBarHidden = $global.get('headerBarHidden');
    $scope.style_layoutBoxed = $global.get('layoutBoxed');
    $scope.style_fullscreen = $global.get('fullscreen');
    $scope.style_leftbarCollapsed = $global.get('leftbarCollapsed');
    $scope.style_leftbarShown = $global.get('leftbarShown');
    $scope.style_rightbarCollapsed = $global.get('rightbarCollapsed');
    $scope.style_isSmallScreen = false;
    $scope.style_layoutHorizontal = $global.get('layoutHorizontal');
    $scope.global = { alert: undefined, citystate: 'Bend, OR', clusters: {} };
    

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
      userService.search(query)
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
    
    if (!$scope.global.user) {        // Get and set user scope          
        userService.getProfile()
        .then(function(response) {
          if (response.data.value) {
            $scope.global.user = response.data;
            if (!$scope.global.profile) {
              $scope.global.profile = response.data;
            }
          }
        });
      }
    /*
    if (!$scope.global.city) {
      cityService.getCity()
      .then(function(response) {
        if (response.data.value) {
          $scope.global.city = response.data;
        }
      });
    }
    */
  }])
  
  .filter('words', function() {    
    return function(text, wordnum) {
      if (text) {     
        return text.split(" ")[wordnum];
      }
    };
  })
        
  .controller('PeopleController', ['$scope', '$location', 'userService', function ($scope, $location, userService) {
    
    $scope.rotateWidgetClass = function() {
      var arr = ["'themed-background-dark'",'themed-background-dark-night','themed-background-dark-amethyst', 'themed-background-dark-modern', 'themed-background-dark-autumn', 'themed-background-dark-flatie', 'themed-background-dark-spring', 'themed-background-dark-fancy', 'themed-background-dark-fire'];
      var idx = Math.floor(Math.random() * arr.length);
      return arr[idx];
    };
    
    $scope.getUsers = function(alturl) {
      userService.getUsers(alturl)
        .then(function(response) {          
          $scope.users = response.data;
        });
    };
    
    $scope.getUsers('/api/bend-or/users?limit=32');
    
    $scope.viewUser = function(userindex) {            
      $scope.global.profile = ($location.$$path == '/search') ? $scope.global.search.results[userindex] : $scope.users.results[userindex];
      $location.path('/profile');
    };
    
  }])
  
  .controller('ProfileController', ['$scope', 'userService', '$location', '$auth', function ($scope, userService, $location, $auth) {

    $scope.putProfile = function(userid, profile) {
      userService.putProfile(userid, profile, function(response) {
        if (response.status !== 200) {          
            $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) }; 
            console.warn(response.message);
          } else {
            $scope.profile = response.data; // may need to tell angular to refresh view
            $scope.global.alert = { type: 'success', msg: 'Advisor updated! ' + response.data.name + ' is good to go.' };  
          }
        });
    };  
    
    $scope.removeProfile = function(userid) {
      userService.removeProfile(userid, function(response) {        
        $location.path('/advisors');
        $scope.global.alert = { type: 'success', msg: "Advisor removed. Hopefully they'll return some day." };             
      });
    };  
    
    $scope.updateProfile = function() {
      userService.updateProfile({
        displayName: $scope.global.user.displayName,
        email: $scope.global.user.email
      }).then(function() {
        $scope.global.alert = { type: 'success', msg: "Great news. Your profile has been updated."};        
      });
    };    
        
    $scope.isAdmin = function() {
      var city = $scope.global.user.value.cities[$scope.global.citystate];      
      return city.admin || false;      
    };
    
    $scope.isLeader = function(cluster) {      
      if ($scope.isAdmin()) { return true; }      
      var city = $scope.global.user.value.cities[$scope.global.citystate]; //get current city from user profile
      if (city.clusters[cluster]) {
        if (city.clusters[cluster].roles.indexOf("Leader") >= 0) {
          return true;
        }
      }
      return false;
    };
    
    $scope.setRoles = function() {
      userService.setRoles({
        user: something,
        roles: something
      }).then(function() {
        $scope.global.alert = { type: 'success', msg: "Bravo. You've updated the roles for " + user + "."};        
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
  
  .controller('AddAdvisorController', ['$scope', '$auth', 'userService', function ($scope, $auth, userService) {
      
    $scope.addAdvisor = function(url, email, userid) {                  
        userService.addAdvisor(url, email, userid, function(response) {            
          if (response.status !== 200) {          
            $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };  
            console.warn(response.message);
          } else {            
            $scope.global.alert = { type: 'success', msg: 'Advisor imported! ' + response.data.name + ' is good to go.' };     
          }
        });
      };    
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

