function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start with remove binding information inside the DOM element
    $compileProvider.debugInfoEnabled(true);

    // Set default unmatched url state

    $urlRouterProvider.otherwise("/dashboard");
    $stateProvider

        // Dashboard - Main page
        .state('dashboard', {
            url: "/dashboard",
            templateUrl: "views/dashboard.html",
            data: {
                pageTitle: 'Dashboard',
            }
        })
        .state('search', {
            templateUrl: 'views/search.html',
            url: "/search",
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        return $location.path('/login');
                    }
                }]
            }
        })
        .state('invite', {
            templateUrl: '../views/invite_people.html',
            url: "/people/invite",
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        return $location.path('/login');
                    }
                }]
            }
        })
        .state('profile', {
            templateUrl: 'views/user_profile.html',
            url: "/profile",
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        return $location.path('/login');
                    }
                }]
            }
        })
        .state('login', {
            url: "/login",
            templateUrl: 'views/login.html'
        })

        .state('network', {
            templateUrl: 'views/network.html',
            url: "/network",
            resolve: {
                lazyLoad: ['lazyLoad', function (lazyLoad) {
                    return lazyLoad.load([
                        'assets/plugins/fullcalendar/fullcalendar.js'
                    ]);
                }]
            }
        })
        .state('network.resources', {
            url: "/resources",
            templateUrl: 'views/network.resources.html'
        });

    $locationProvider
        .html5Mode(true);

};

angular
    .module('startupcommunity')
    .config(configState)
    .config(function($authProvider) {

      $authProvider.linkedin({
          clientId: "75bqixdv58z1az"
      });

    })
    .config(function(uiGmapGoogleMapApiProvider) {
        uiGmapGoogleMapApiProvider.configure({
            key: '480490194210-u5lpfv6rdch4bto4j9n1vtjvsui4osjv.apps.googleusercontent.com',
            v: '3.17',
            libraries: 'weather,geometry,visualization'
        });
    })

    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
    });

angular
  .module('analytics.mixpanel')
  .config(['$mixpanelProvider', function($mixpanelProvider) {
      $mixpanelProvider.apiKey("0f110baeb6150d7e3b8968e32d7a5595");
  }]);
