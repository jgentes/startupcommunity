'use strict';

var app = angular.module('StartupCommunity', [        
    'ui.bootstrap',
    'ui.select2',
    'ui.highlight',
    'toggle-switch',
    'form-directives',
    'navigation-controller',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'ngAnimate',
    'appControllers',
    'appServices',
    'appDirectives',
    'theme.templates',
    'theme.template-overrides',
    'analytics.mixpanel',
    'satellizer'
  ]);

app  
  .config(function($authProvider) {
   
    $authProvider.linkedin({
      clientId: "75bqixdv58z1az", //move this to config file
      url: '/auth/linkedin'
    });

  })
  
  .config(['$provide', '$routeProvider', '$locationProvider', '$logProvider', function ($provide, $routeProvider, $locationProvider, $logProvider) {
    $routeProvider
      .when('/', {
        redirectTo: '/people'
      })
      .when('/launchform', {
        templateUrl: 'views/login.html'
      })
      .when('/people', {
        templateUrl: 'views/people.html',
        resolve: {
          authenticated: ['$location', '$auth', function($location, $auth) {
            if (!$auth.isAuthenticated()) {
              return $location.path('/login');
            }
          }]
        }
      })
      .when('/search', {
        templateUrl: 'views/search.html',
        resolve: {
          authenticated: ['$location', '$auth', function($location, $auth) {
            if (!$auth.isAuthenticated()) {
              return $location.path('/launchform');
            }
          }]
        }
      })
      .when('/people/add', {
        templateUrl: 'views/add_people.html',
        resolve: {
          authenticated: ['$location', '$auth', function($location, $auth) {
            if (!$auth.isAuthenticated()) {
              return $location.path('/launchform');
            }
          }]
        }
      })
      .when('/profile', {
        templateUrl: 'views/user_profile.html',
        resolve: {
          authenticated: ['$location', '$auth', function($location, $auth) {
            if (!$auth.isAuthenticated()) {
              return $location.path('/launchform');
            }
          }]
        }
      })
      .when('/alpha', {
        templateUrl: 'views/home.html'
      })
      .when('/login', {
        templateUrl: 'views/login.html'
      })      
      .when('/logout', {
        controller: 'LogoutCtrl'
      })        
      /*
      .when('/:templateFile', { // this could be dangerous because it could expose hidden views
        templateUrl: function (param) { return 'views/'+param.templateFile+'.html' }
      })
      */
      .otherwise({
        templateUrl: 'views/404.html'
      });
      $locationProvider
        .html5Mode(true);
        
      //disable logging
      $logProvider.debugEnabled(true);
  }]);

angular.module('analytics.mixpanel')
  .config(['$mixpanelProvider', function($mixpanelProvider) {
    $mixpanelProvider.apiKey("0f110baeb6150d7e3b8968e32d7a5595");
  }]);