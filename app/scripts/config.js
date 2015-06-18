function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start with remove binding information inside the DOM element
    $compileProvider.debugInfoEnabled(true);

    $stateProvider

        // Dashboard - Main page

        .state('dashboard', {
            url: "/dashboard",
            templateUrl: "views/dashboard.html",
            data: {
                pageTitle: 'Dashboard'
            },
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        return $location.path('/login');
                    }
                }]
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
        .state('login', {
            url: "/login",
            templateUrl: 'views/login.html'
        })
        .state('people', {
            url: "/people",
            templateUrl: 'views/common/people.html',
            data: {
                pageTitle: 'People'
            }
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
        })

         // User views
        .state('user', {
            abstract: true,
            templateUrl: "views/common/content_small.html",
            data: {
                pageTitle: 'User'
            }
        })
        .state('user.profile', {
            templateUrl: "views/user/user.profile.html",
            data: {
                pageTitle: 'User Profile'
            },
            params: {
                user: {}
            },
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        return $location.path('/login');
                    }
                }]
            }
        });


    // Set default unmatched url state
    $urlRouterProvider.otherwise(
        function($injector, $location) {
            $injector.invoke(['$state', '$location', 'communityApi', function($state, $location, communityApi) {
                var path = $location.url().substr(1);
                communityApi.getKey(path)
                    .then(function(response) {

                        switch (response.data.type) {
                            case "user":
                                $state.go('user.profile', { user : response.data});
                        }
                    });
                //$state.go('dashboard');
            }]);
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

    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
        $rootScope.$on("$stateChangeError", console.log.bind(console)) // for debugging of ui-router
    });

angular
  .module('analytics.mixpanel')
  .config(['$mixpanelProvider', function($mixpanelProvider) {
      $mixpanelProvider.apiKey("0f110baeb6150d7e3b8968e32d7a5595");
  }]);
