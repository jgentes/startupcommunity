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
        redirectTo: '/advisors'
      })
      .when('/advisors', {
        templateUrl: 'views/advisors.html',
        resolve: {
          authenticated: ['$location', '$auth', function($location, $auth) {
            if (!$auth.isAuthenticated()) {
              return $location.path('/launchform');
            }
          }]
        }
      })
      .when('/advisors/add', {
        templateUrl: 'views/add_advisors.html',
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
      /*
      .when('/calendar', {
        templateUrl: 'views/calendar.html',
        resolve: {
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'assets/plugins/fullcalendar/fullcalendar.js'
            ]);
          }]
        }
      })
      .when('/form-ckeditor', {
        templateUrl: 'views/form-ckeditor.html',
        resolve: {
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'assets/plugins/form-ckeditor/ckeditor.js',
              'assets/plugins/form-ckeditor/lang/en.js'
            ]);
          }]
        }
      })
      .when('/form-imagecrop', {
        templateUrl: 'views/form-imagecrop.html',
        resolve: {
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'assets/plugins/jcrop/js/jquery.Jcrop.js'
            ]);
          }]
        }
      })
      .when('/form-wizard', {
        templateUrl: 'views/form-wizard.html',
        resolve: {
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'bower_components/jquery-validation/dist/jquery.validate.js',
              'bower_components/stepy/lib/jquery.stepy.js'
            ]);
          }]
        }
      })
      .when('/form-masks', {
        templateUrl: 'views/form-masks.html',
        resolve: {
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'bower_components/jquery.inputmask/dist/jquery.inputmask.bundle.js'
            ]);
          }]
        }
      })
      .when('/maps-vector', {
        templateUrl: 'views/maps-vector.html',
        resolve: {
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'bower_components/jqvmap/jqvmap/maps/jquery.vmap.europe.js',
              'bower_components/jqvmap/jqvmap/maps/jquery.vmap.usa.js'
            ]);
          }]
        }
      })
      .when('/charts-canvas', {
        templateUrl: 'views/charts-canvas.html',
        resolve: {
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'bower_components/Chart.js/Chart.min.js'
            ]);
          }]
        }
      })
      .when('/charts-svg', {
        templateUrl: 'views/charts-svg.html',
        resolve: {
          lazyLoad: ['lazyLoad', function (lazyLoad) {
            return lazyLoad.load([
              'bower_components/raphael/raphael.js',
              'bower_components/morris.js/morris.js'
            ]);
          }]
        }
      })
      */
      .when('/:templateFile', { // this could be dangerous because it could expose hidden views
        templateUrl: function (param) { return 'views/'+param.templateFile+'.html' }
      })
      .otherwise({
        redirectTo: '/' // this needs to be a 404 page
      });
      $locationProvider
        .html5Mode(true);
  }]);

 