function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start
    $compileProvider.debugInfoEnabled(true);

    $stateProvider

        // Dashboard - Main page

        .state('dashboard', {
            url: "/dashboard",
            templateUrl: "views/dashboard.html",
            params: {
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

         // People views
        .state('people', {
            abstract: true,
            templateUrl: "views/common/content_small.html"
        })
        .state('people.dashboard', {
            url: "/people",
            templateUrl: 'views/people/people.dashboard.html',
            params: {
                pageTitle: 'People'
            }
        })
        .state('people.profile', {
            templateUrl: "views/people/people.profile.html",
            parent: 'people',
            params: {
                user: {},
                pageTitle: 'User Profile'
            },
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        return $location.path('/login');
                    }
                }]
            }
        })

        // Startup views
        .state('startups', {
            abstract: true,
            templateUrl: "views/common/content_small.html"
        })
        .state('startups.dashboard', {
            url: "/startups",
            templateUrl: 'views/startups/startups.dashboard.html',
            params: {
                pageTitle: 'Startups'
            }
        })
        .state('startups.profile', {
            templateUrl: "views/startups/startups.profile.html",
            parent: 'startups',
            params: {
                startup: {},
                pageTitle: 'Startup Profile'
            },
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        return $location.path('/login');
                    }
                }]
            }
        })

        // Industry views
        .state('industry', {
            abstract: true,
            templateUrl: "views/common/content_small.html"
        })
        .state('industry.dashboard', {
            url: "/industry",
            templateUrl: 'views/industries/industry.dashboard.html',
            params: {
                community: {}
            }
        })

        // Location views
        .state('location', {
            abstract: true,
            templateUrl: "views/common/content.html"
        })
        .state('location.dashboard', {
            templateUrl: 'views/locations/location.dashboard.html',
            params: {
                community: {}
            }
        })

        // Network views
        .state('network', {
            abstract: true,
            templateUrl: "views/common/content_small.html"
        })
        .state('network.dashboard', {
            url: "/network",
            templateUrl: 'views/networks/network.dashboard.html',
            params: {
                community: {}
            }
        });

    // Set default unmatched url state
    $urlRouterProvider.otherwise(
        function($injector, $location) {
            $injector.invoke(['$state', '$location', 'community_api', function($state, $location, community_api) {
                var path = $location.url().substr(1);
                community_api.getKey(path)
                    .then(function(response) {
                        switch (response.data.type) {
                            case "user":
                                $state.go('people.profile', { user : response.data});
                                break;
                            case "location":
                                $state.go('location.dashboard', { location : response.data});
                                break;
                        }
                    });
                //$state.go('dashboard');
            }]);
        });

    $locationProvider
        .html5Mode(true);

}

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
