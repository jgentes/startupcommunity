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
  .controller('MainController', ['$scope','$window', '$global', '$route', '$timeout', '$interval', 'progressLoader', '$location', '$auth', 'profileService', 'pinesNotifications', function ($scope, $window, $global, $route, $timeout, $interval, progressLoader, $location, $auth, profileService, pinesNotifications) {
    $scope.style_fixedHeader = $global.get('fixedHeader');
    $scope.style_headerBarHidden = $global.get('headerBarHidden');
    $scope.style_layoutBoxed = $global.get('layoutBoxed');
    $scope.style_fullscreen = $global.get('fullscreen');
    $scope.style_leftbarCollapsed = $global.get('leftbarCollapsed');
    $scope.style_leftbarShown = $global.get('leftbarShown');
    $scope.style_rightbarCollapsed = $global.get('rightbarCollapsed');
    $scope.style_isSmallScreen = false;
    $scope.style_layoutHorizontal = $global.get('layoutHorizontal');


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
          $scope.user = null;          
          pinesNotifications.notify({
              title: 'You are now logged out.',
              text: 'Why not go meet up with a friend?',
              type: 'info',
              icon: 'fa fa-lock',
              duration: 3,
              styling: "bootstrap3"
            });
          $route.reload();
          });
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
  
  .controller('ProfileController', ['$scope', 'profileService', 'pinesNotifications', '$location', function ($scope, profileService, pinesNotifications, $location) {
        
    profileService.getProfileScope(function(profile) {        
      $scope.profile = profile;
    });
        
    $scope.putProfile = function(userid, profile) {
      profileService.putProfile(userid, profile, function(response) {
        if (response.status !== 200) {          
            pinesNotifications.notify({
              title: 'Sorry, there was a problem.',
              text: response.message,
              type: 'error',                        
              duration: 20,
              shadow: false
            });
          } else {
            $scope.profile = response.data; // may need to tell angular to refresh view
            pinesNotifications.notify({
              title: 'Mentor updated!',
              text: response.data.name + ' is good to go.',
              type: 'success',
              duration: 5,
              shadow: false
            });
          }
        });
    };  
    
    $scope.removeProfile = function(userid) {
      profileService.removeProfile(userid, function(response) {        
        $location.path('/mentors');
        pinesNotifications.notify({
          title: 'Mentor removed.',
          text: "Hopefully they'll return some day.",
          type: 'success',
          duration: 5,
          shadow: false
        });          
      });
    };  
    
  }])
  
  .controller('AddMentorController', ['$scope', '$auth', 'userService', 'pinesNotifications', function ($scope, $auth, userService, pinesNotifications) {
      
    $scope.addMentor = function(url, email, userid) {                  
        userService.addMentor(url, email, userid, function(response) {            
          if (response.status !== 200) {          
            pinesNotifications.notify({
              title: 'Sorry, there was a problem.',
              text: response.message,
              type: 'error',                        
              duration: 20,
              shadow: false
            });
          } else {
            $scope.users = response.data;
            pinesNotifications.notify({
              title: 'Mentor Imported!',
              text: response.data.name + ' is good to go.',
              type: 'success',
              duration: 5,
              shadow: false
            });
          }
        });
      };    
  }])
  
  .controller('LoginCtrl', ['$scope', '$auth', '$global', 'pinesNotifications', '$location', '$route', function($scope, $auth, $global, pinesNotifications, $location, $route) {
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
          console.log('Logged in!');                    
        })
        .catch(function(response) {
          pinesNotifications.notify({
            title: 'There was a problem:',
            text: String(response.data.message),
            type: 'error',
            duration: 15,
            shadow: false
          });
          console.log(response.data.message);
        });
    };
    $scope.authenticate = function(provider) {
      $auth.authenticate(provider)
        .then(function(success) {          
          console.log('Logged in!');
        })
        .catch(function(response) {
          pinesNotifications.notify({
            title: 'There was a problem:',
            text: String(response.data.message),
            type: 'error',
            duration: 15,
            shadow: false
          });
          console.log(response.data.message);
        });
    };
  }])
  
  .controller('SignupCtrl', ['$scope', '$auth', '$global', 'pinesNotifications', '$location', function($scope, $auth, $global, pinesNotifications, $location) {
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
        pinesNotifications.notify({
          title: "You're in!",
          text: 'Registration was successful - welcome aboard!',
          type: 'success',
          duration: 5,
          shadow: false
        });
        $location.path('/login');
      });
    };
  }])
  
  .controller('ProfileCtrl', function($scope, $auth, profileService, pinesNotifications) {
   // Clearly need to combine this and ProfileController.. whoops.
    /**
     * Update user's profile information.
     */
    $scope.updateProfile = function() {
      profileService.updateProfile({
        displayName: $scope.user.displayName,
        email: $scope.user.email
      }).then(function() {
        pinesNotifications.notify({
          title: 'Great news.',
          text: "Your profile has been updated.",
          type: 'success',
          duration: 5,
          shadow: false
        });
      });
    };

    /**
     * Link third-party provider.
     */
    $scope.link = function(provider) {
      $auth.link(provider)
        .then(function() {
          pinesNotifications.notify({
            title: 'Well done.',
            text: 'You have successfully linked your ' + provider + ' account',
            type: 'success',
            duration: 5,
            shadow: false
          });
        })
        .then(function() {
          $scope.getProfile();
        })
        .catch(function(response) {
          pinesNotifications.notify({
            title: 'Aww, shucks.',
            text: 'Sorry, but we ran into this error: ' + response.data.message,
            type: 'error',
            duration: 5,
            shadow: false
          });          
        });
    };

    /**
     * Unlink third-party provider.
     */
    $scope.unlink = function(provider) {
      $auth.unlink(provider)
        .then(function() {
          pinesNotifications.notify({
            title: 'Bam.',
            text: 'You have successfully unlinked your ' + provider + ' account',
            type: 'success',
            duration: 5,
            shadow: false
          });
        })
        .then(function() {
          $scope.getProfile();
        })
        .catch(function(response) {
          pinesNotifications.notify({
            title: 'Doh!.',
            text: 'Sorry, but we ran into this error while unlinking your ' + provider + ' account: ' + response.data.message,
            type: 'error',
            duration: 5,
            shadow: false
          });  
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
            $scope.alert = {msg: 'Thanks, we look forward to helping you build a vibrant startup community in <strong>' + $scope.formData.city.substr(0, $scope.formData.city.length - 4) + '</strong>!  We\'ll be in touch soon.'}; 
            $scope.formData = {};
            
          }else {
            $scope.alert = {type: 'error', msg: 'Something went wrong!'}; 
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

