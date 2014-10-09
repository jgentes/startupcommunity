angular
  .module('appControllers', [])
  .controller('MainController', ['$scope', '$window', '$global', '$timeout', '$interval', 'progressLoader', '$location', '$auth', 'accountService', 'pinesNotifications', function ($scope, $window, $global, $timeout, $interval, progressLoader, $location, $auth, accountService, pinesNotifications) {
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
    
/*
    $scope.rightbarAccordionsShowOne = false;
    $scope.rightbarAccordions = [{open:true},{open:true},{open:true},{open:true},{open:true},{open:true},{open:true}];
*/
    $scope.$on('$routeChangeStart', function (e) {
      // console.log('start: ', $location.path());
      progressLoader.start();
      progressLoader.set(50);
    });
    $scope.$on('$routeChangeSuccess', function (e) {
      // console.log('success: ', $location.path());
      progressLoader.end();
    });
    
    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated(); //returns true or false based on browser local storage token
    };
    
    /**
     * Get user's profile information.
     */
    
    $scope.logOut = function() {
      $auth.logout()
        .then(function() {
          pinesNotifications.notify({
              title: 'You are now logged out.',
              text: 'Why not go meet up with a friend?',
              type: 'info',
              icon: 'fa fa-lock',
              duration: 5
            });
        });
    };
    
     
    $scope.getProfile = function() {
      accountService.getProfile()
        .then(function(response) {
          $scope.user = response.data;
        });
    };
    
    $scope.getProfile();
    
  }])
  
  .filter('words', function() {    
    return function(text, wordnum) {
      if (text) {     
        return text.split(" ")[wordnum];
      }
    };
  })
        
  .controller('PeopleController', ['$scope', 'userService', 'accountService', function ($scope, userService, accountService) {
    
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
    
  }])
  
  .controller('AddMentorController', ['$scope', '$auth', 'userService', 'pinesNotifications', function ($scope, $auth, userService, pinesNotifications) {
      
    $scope.addMentor = function(url, email, userid) {                  
        userService.addMentor(url, email, userid, function(response) {          
          console.log(response);
          if (response.status === 200) {            
            console.log('bad rsponse');          
            pinesNotifications.notify({
              title: 'Sorry, we had a problem with Linkedin.',
              text: "We couldn't find a profile using that URL. Here's more detail: " + response.data.message,
              type: 'error',            
              duration: 30
            });
          } else {
            console.log('good rsponse');
            $scope.users = response.data;
            console.log(response);
            pinesNotifications.notify({
              title: 'Mentor Imported!',
              text: 'Everything looks good for ' + response.data.name,
              type: 'success',
              duration: 5
            });
          }
        });
      };    
  }])
  
  .controller('LoginCtrl', ['$scope', '$auth', '$global', 'pinesNotifications', function($scope, $auth, $global, pinesNotifications) {
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
          pinesNotifications.notify({
            title: 'Successfully logged in!',
            text: 'Welcome back, ' + $scope.email + '.',
            type: 'info',
            duration: 3
          });
          console.log('Logged in!');          
        })
        .catch(function(response) {
          // add alert here
          console.log(response.data.message);
        });
    };
    $scope.authenticate = function(provider) {
      $auth.authenticate(provider)
        .then(function(success) {          
          pinesNotifications.notify({
            title: 'Successfully logged in!',
            text: 'You authenticated using ' + provider + '.',
            type: 'success',
            icon: 'fa fa-check',
            duration: 5
          });
          console.log('Logged in!');
          
        })
        .catch(function(response) {
          pinesNotifications.notify({
            title: 'There was a problem:',
            text: String(response.data),
            type: 'error',
            duration: 15
          });
          console.log(response.data);
        });
    };
  }])
  
  .controller('SignupCtrl', ['$scope', '$auth', '$global', 'pinesNotifications', function($scope, $auth, $global, pinesNotifications) {
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
          duration: 5
        });
      });
    };
  }])
  
  .controller('ProfileCtrl', function($scope, $auth, accountService, pinesNotifications) {

    /** THIS SHOULD NOW BE COVERED BY MAINCONTROLLER
     * Get user's profile information.
     
    $scope.getProfile = function() {
      accountService.getProfile()
        .success(function(data) {
          $scope.user = data;
        })
        .error(function() {
          pinesNotifications.notify({
            title: 'Something went wrong.',
            text: "We weren't able to pull your user profile.",
            type: 'error',
            duration: 5
          });
        });
    };
*/

    /**
     * Update user's profile information.
     */
    $scope.updateProfile = function() {
      accountService.updateProfile({
        displayName: $scope.user.displayName,
        email: $scope.user.email
      }).then(function() {
        pinesNotifications.notify({
          title: 'Great news.',
          text: "Your profile has been updated.",
          type: 'success',
          duration: 5
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
            duration: 5
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
            duration: 5
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
            duration: 5
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
            duration: 5
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

