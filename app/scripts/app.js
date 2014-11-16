'use strict';

var app = angular.module('StartupCommunity', [    
    'ui.bootstrap',
    'ui.select2',     
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
    'angulartics', 
    'angulartics.segment.io',
    'satellizer'
  ]);

app  
  .config(function($authProvider) {
   
    $authProvider.linkedin({
      clientId: "75bqixdv58z1az",
      url: '/auth/linkedin'
    });

  })
  
  .config(['$provide', '$routeProvider', '$locationProvider', function ($provide, $routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        redirectTo: '/people'
      })
      .when('/people', {
        templateUrl: 'views/people.html',
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
          }],
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'bower_components/jquery-validation/dist/jquery.validate.js',
              'bower_components/stepy/lib/jquery.stepy.js'
            ]);
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
      .when('/:templateFile', { // this could be dangerous because it could expose hidden views
        templateUrl: function (param) { return 'views/'+param.templateFile+'.html' }
      })
      .otherwise({
        redirectTo: '/' // this needs to be a 404 page
      });
      $locationProvider
        .html5Mode(true);
  }]);

 