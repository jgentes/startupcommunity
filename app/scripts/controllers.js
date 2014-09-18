angular
  .module('appControllers', [])
  .controller('MainController', ['$scope', '$window', '$global', '$timeout', '$interval', 'progressLoader', '$location', function ($scope, $window, $global, $timeout, $interval, progressLoader, $location) {
    $scope.style_fullscreen = $global.get('fullscreen');
    /*
    $scope.style_fixedHeader = $global.get('fixedHeader');
    $scope.style_headerBarHidden = $global.get('headerBarHidden');
    $scope.style_layoutBoxed = $global.get('layoutBoxed');
    $scope.style_leftbarCollapsed = $global.get('leftbarCollapsed');
    $scope.style_leftbarShown = $global.get('leftbarShown');
    $scope.style_rightbarCollapsed = $global.get('rightbarCollapsed');
    $scope.style_isSmallScreen = false;
    $scope.style_showSearchCollapsed = $global.get('showSearchCollapsed');

    $scope.hideSearchBar = function () {
        $global.set('showSearchCollapsed', false);
    };

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
*/
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
    
    
  }])
  
  .controller('LoginCtrl', ['$scope', '$auth', '$global', 
    function($scope, $auth, $global) {
      $global.set('fullscreen', true);    
      $scope.$on('$destroy', function () {
        $global.set('fullscreen', false);
      });
      $scope.authenticate = function(provider) {
        $auth.authenticate(provider);
      };
  
  }])
  /*
  .controller('UserController', ['$scope', '$location', '$window', '$global', 'UserService', 'AuthenticationService',  
    function UserController($scope, $location, $window, $global, UserService, AuthenticationService) {
        //Borrowed heavily from http://www.kdelemme.com/2014/03/09/authentication-with-angularjs-and-a-node-js-rest-api/
        $global.set('fullscreen', true);
        $scope.isAuthenticated = AuthenticationService.isAuthenticated;
        $scope.$on('$destroy', function () {
          $global.set('fullscreen', false);
        });
        
        
        $scope.signInLinkedin = function signInLinkedin() {
          
          $window.location.replace('/auth/linkedin');
                
          /*
          
                var url = '/auth/linkedin',
                    width = 1000,
                    height = 650,
                    top = (window.outerHeight - height) / 2,
                    left = (window.outerWidth - width) / 2;
                $window.open(url, 'linkedin_login', 'width=' + width + ',height=' + height + ',scrollbars=0,top=' + top + ',left=' + left);
            */    
 /*        };
       
        //User Controller (signIn, logOut)
        $scope.signIn = function signIn(email, password) {
            if (email !== null && password !== null) {

                UserService.signIn(email, password).success(function(data) {
                    AuthenticationService.isAuthenticated = true;
                    $window.sessionStorage.token = data.token;
                    $location.path("/authtest");
                }).error(function(status, data) {
                    console.log(status);
                    console.log(data);
                });
            }
        };

        $scope.logOut = function logOut() {
            if (AuthenticationService.isAuthenticated) {
                
                UserService.logOut().success(function(data) {
                    AuthenticationService.isAuthenticated = false;
                    delete $window.sessionStorage.token;
                    $location.path("/");
                }).error(function(status, data) {
                    console.log(status);
                    console.log(data);
                });
            }
            else {
                $location.path("/login");
            }
        };

        $scope.signup = function signup(email, name, password, passwordConfirm) {
            if (AuthenticationService.isAuthenticated) {
                $location.path("/");
            }
            else {
                UserService.signup(email, name, password, passwordConfirm).success(function(data) {
                    $location.path("/login");
                }).error(function(status, data) {
                    console.log(status);
                    console.log(data);
                });
            }
        };
    }
  ])
*/
  .controller('AuthTestController', ['$scope', '$global', 'AuthenticationService', function ($scope, $global, AuthenticationService) {
    $global.set('fullscreen', true);
    console.log('AuthenticationService: ' + AuthenticationService.isAuthenticated);    
    $scope.isAuthenticated = AuthenticationService.isAuthenticated;
    $scope.$on('$destroy', function () {
      $global.set('fullscreen', false);
    });
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
  .controller('LaunchformController', ['$scope', '$global', '$http', function ($scope, $global, $http) {
  	$global.set('fullscreen', true);
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
      return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: val,
          sensor: false,
          components: 'country:US'
        }
      }).then(function(res){
        var addresses = [];
        var f = '';
        angular.forEach(res.data.results, function(item){           
          if (item.types[0] == 'locality') {
            for (f=1;f<item.address_components.length;f++) {
              if (item.address_components[f].types[0] == "administrative_area_level_1") {
                addresses.push(item.address_components[0].short_name + ', ' + item.address_components[f].short_name);
                break;
              }
            }
          }
        });
        return addresses;
      });
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
});