angular
  .module('appControllers', [])
  .run(function($rootScope, $q, profileService) {
    
    $rootScope.deferred = $q.defer(); // the .deferred function is placed in rootscope to be executed by the controller
      
    profileService.getProfile()
        .then(function(response) {     
          $rootScope.user = response.data;
          profileService.setProfileScope(response.data);
          $rootScope.deferred.resolve();
        });
  })
  .controller('MainController', ['$scope','$window', '$global', '$route', '$timeout', '$interval', 'progressLoader', '$location', '$auth', 'profileService', function ($scope, $window, $global, $route, $timeout, $interval, progressLoader, $location, $auth, profileService) {
    $scope.style_fixedHeader = $global.get('fixedHeader');
    $scope.style_headerBarHidden = $global.get('headerBarHidden');
    $scope.style_layoutBoxed = $global.get('layoutBoxed');
    $scope.style_fullscreen = $global.get('fullscreen');
    $scope.style_leftbarCollapsed = $global.get('leftbarCollapsed');
    $scope.style_leftbarShown = $global.get('leftbarShown');
    $scope.style_rightbarCollapsed = $global.get('rightbarCollapsed');
    $scope.style_isSmallScreen = false;
    $scope.style_layoutHorizontal = $global.get('layoutHorizontal');
    $scope.alert = { global: undefined };

    $scope.hideHeaderBar = function () {
        $global.set('headerBarHidden', true);
    };

    $scope.showHeaderBar = function ($event) {
      $event.stopPropagation();
      $global.set('headerBarHidden', false);
    };

    $scope.toggleLeftBar = function () {
      if ($scope.style_isSmallScreen) {
        return $global.set('leftbarShown', !$scope.style_leftbarShown);
      }
      $global.set('leftbarCollapsed', !$scope.style_leftbarCollapsed);      
    };

    $scope.toggleRightBar = function () {
      $global.set('rightbarCollapsed', !$scope.style_rightbarCollapsed);
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
      if (!$scope.user) {        // Get and set user scope          
        profileService.getProfile()
        .then(function(response) {
          if (response.data.value) {
            $scope.user = response.data;
          }
        });
      }
    });
    
    $scope.$on('$routeChangeSuccess', function (e) {      
      progressLoader.end();
      
    });
            
    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated(); //returns true or false based on browser local storage token
    };  
    
    $scope.editProfile = function() {      
      profileService.setProfileScope($scope.user);            
      $location.path('/profile');
      $route.reload();
    };
    
    $scope.logOut = function() {      
      $auth.logout()
        .then(function() {
          $scope.user = undefined;
          $scope.alert.global = undefined;
          $route.reload();
          });
    };      
  
    $scope.closeAlert = function() {
      $scope.alert.global = undefined;
    };  
    
  }])
  
  .filter('words', function() {    
    return function(text, wordnum) {
      if (text) {     
        return text.split(" ")[wordnum];
      }
    };
  })
        
  .controller('PeopleController', ['$scope', '$location', 'userService', 'profileService', function ($scope, $location, userService, profileService) {
    
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
    
    $scope.getUsers();
    
    $scope.viewUser = function(userindex) {      
      profileService.setProfileScope($scope.users.results[userindex]);
      $location.path('/profile');
    };
    
  }])
  
  .controller('ProfileController', ['$scope', 'profileService', '$location', function ($scope, profileService, $location) {
        
    $scope.deferred.promise.then(function() {    
      profileService.getProfileScope(function(profile) {        
        $scope.profile = profile;
      });
    });
        
    $scope.putProfile = function(userid, profile) {
      profileService.putProfile(userid, profile, function(response) {
        if (response.status !== 200) {          
            $scope.alert.global = { type: 'danger', msg: 'There was a problem: ' + String(response.message) }; 
            console.warn(response.message);
          } else {
            $scope.profile = response.data; // may need to tell angular to refresh view
            $scope.alert.global = { type: 'success', msg: 'Mentor updated! ' + response.data.name + ' is good to go.' };  
          }
        });
    };  
    
    $scope.removeProfile = function(userid) {
      profileService.removeProfile(userid, function(response) {        
        $location.path('/mentors');
        $scope.alert.global = { type: 'success', msg: "Mentor removed. Hopefully they'll return some day." };             
      });
    };  
    
  }])
  
  .controller('AddMentorController', ['$scope', '$auth', 'userService', function ($scope, $auth, userService) {
      
    $scope.addMentor = function(url, email, userid) {                  
        userService.addMentor(url, email, userid, function(response) {            
          if (response.status !== 200) {          
            $scope.alert.global = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };  
            console.warn(response.message);
          } else {
            $scope.users = response.data;
            $scope.alert.global = { type: 'success', msg: 'Mentor imported! ' + response.data.name + ' is good to go.' };     
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
        .then(function(success) {
          $scope.alert.global = undefined;
          console.log('Logged in!');                    
        })
        .catch(function(response) {
          $scope.alert.global = { type: 'danger', msg: 'There was a problem: ' + String(response.data.message) };          
          console.warn(response.data.message);
        });
    };
    $scope.authenticate = function(provider) {
      $auth.authenticate(provider)
        .then(function(success) {
          $scope.alert.global = undefined;
          console.log('Logged in!');
        })
        .catch(function(response) {
          $scope.alert.global = { type: 'danger', msg: 'There was a problem: ' + String(response.data.message) };     
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
        $scope.alert.global = { type: 'success', msg: "You're in! Registration was successful - welcome aboard."};        
        $location.path('/login');
      });
    };
  }])
  
  .controller('ProfileCtrl', function($scope, $auth, profileService) {
   // Clearly need to combine this and ProfileController.. whoops.
    /**
     * Update user's profile information.
     */
    $scope.updateProfile = function() {
      profileService.updateProfile({
        displayName: $scope.user.displayName,
        email: $scope.user.email
      }).then(function() {
        $scope.alert.global = { type: 'success', msg: "Great news. Your profile has been updated."};        
      });
    };

    /**
     * Link third-party provider.
     */
    $scope.link = function(provider) {
      $auth.link(provider)
        .then(function() {
          $scope.alert.global = { type: 'success', msg: 'Well done. You have successfully linked your ' + provider + ' account'};    
        })
        .then(function() {
          $scope.getProfile();
        })
        .catch(function(response) {          
            $scope.alert.global = { type: 'danger', msg: 'Sorry, but we ran into this error: ' + response.data.message};                 
        });
    };

    /**
     * Unlink third-party provider.
     */
    $scope.unlink = function(provider) {
      $auth.unlink(provider)
        .then(function() {
          $scope.alert.global = { type: 'success', msg: 'Bam. You have successfully unlinked your ' + provider + ' account'};          
        })
        .then(function() {
          $scope.getProfile();
        })
        .catch(function(response) {
          $scope.alert.global = { type: 'danger', msg: 'Aww, shucks. We ran into this error while unlinking your ' + provider + ' account: ' + response.data.message};     
        });
    };

    $scope.getProfile();

  })
  
 
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
            $scope.alert.global = {msg: 'Thanks, we look forward to helping you build a vibrant startup community in <strong>' + $scope.formData.city.substr(0, $scope.formData.city.length - 4) + '</strong>!  We\'ll be in touch soon.'}; 
            $scope.formData = {};
            
          }else {
            $scope.alert.global = {type: 'error', msg: 'Something went wrong!'}; 
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
  
  .controller('ChatRoomController', ['$scope', '$timeout', function ($scope, $t) {
    var eliza = new ElizaBot();
    var avatars = ['potter.png', 'tennant.png', 'johansson.png', 'jackson.png', 'jobs.png'];
    $scope.messages = [];
    $scope.userText = '';
    $scope.elizaTyping = false;
    $scope.elizaAvatar = 'johansson.png';

    $scope.sendMessage = function (msg) {
      var im = {
        class: 'me',
        avatar: 'jackson.png',
        text: msg
      };
      this.messages.push(im);
      this.userText = '';

      $t( function () {
        $scope.elizaAvatar = _.shuffle(avatars).shift();
        $scope.elizaTyping = true;
      }, 500);

      $t( function () {
        var reply = eliza.transform(msg);
        var im = {
          class: 'chat-success',
          avatar: $scope.elizaAvatar,
          text: reply
        };
        $scope.elizaTyping = false;
        $scope.messages.push(im);
      }, 1200);
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
})

