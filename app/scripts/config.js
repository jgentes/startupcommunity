function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start
    $compileProvider.debugInfoEnabled(true);

    $locationProvider
        .html5Mode(true);

    // Set default unmatched url state - this runs first for undefined url paths
    $urlRouterProvider.otherwise(
        function($injector, $location) {
            $injector.invoke(['$state', '$location', '$auth', 'community_api', function($state, $location, $auth, community_api) {

                if (!$auth.isAuthenticated()) {
                    $state.go('login');
                } else {
                    var path = $location.url().substr(1);

                    community_api.getKey(path)
                        .then(function(response) {

                            switch (response.data.type) {
                                case "user":
                                    $state.go('sc.people.profile', { community : response.data});
                                    break;
                                case "location":
                                    $state.go('sc.location.dashboard', { community : response.data});
                                    break;
                                case "network":
                                    $state.go('network.dashboard', { community : response.data});
                                    break;
                                case "industry":
                                    $state.go('industry.dashboard', { community : response.data});
                                    break;
                                default:
                                    $state.go('404');
                                    break;
                            }
                        })
                        .catch(function(err){
                            if (err.status == 404) {
                                $state.go('404')
                            } else {
                                console.log("SEARCH FAIL:");
                                console.warn(err);
                            }
                        });
                    //$state.go('dashboard');
                }


            }]);
        });


    $stateProvider

        // preload is run once
        .state('preload', {
            abstract: true,
            template: "<ui-view/>",
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }],
                user: ['user_api', '$state', '$mixpanel',
                    function(user_api, $state, $mixpanel) {
                        return user_api.getProfile()
                            .success(function(response) {
                                if (response.message) {
                                    $state.go('logout', { error: { type: 'danger', msg: String(response.message) }});
                                }

                                if (response.key) {
                                    $mixpanel.people.set({
                                        "$name": response.profile.name,
                                        "$email": response.profile.email
                                    });
                                    UserVoice.push(['identify', {
                                        id: response.key,
                                        name: response.profile.name,
                                        email: response.profile.email
                                    }]);
                                }
                            })
                            .error(function(response) {
                                $state.go('logout', { error: { type: 'danger', msg: String(response.message) }});
                            });
                    }]
            }
        })

        .state('sc', {
            parent: 'preload',
            abstract: true,
            templateUrl: "components/common/nav/nav.html",
            controller: "NavigationController as nav",
            params: {
                community: {}
            },
            resolve: {
                communities: ['community_api', '$stateParams',
                    function(community_api, $stateParams) {
                        return community_api.getCommunity($stateParams.community.key);
                    }]
            }
        })

        // Location views
        .state('sc.location', {
            abstract: true,
            templateUrl: "components/common/content/content_big.html"
        })
        .state('sc.location.dashboard', {
            templateUrl: 'components/locations/location.dashboard.html',
            controller: "LocationController as loc",
            params: {
                community: {},
                pageTitle: "Location Profile"
            },
            resolve: {
                users: ['user_api', '$stateParams', function(user_api, $stateParams) {
                    //todo change to Leader
                    return user_api.getUsers($stateParams.community.key, undefined, undefined, encodeURIComponent(['Advisor']), 30);
                }],
                communities: ['community_api', '$state', '$stateParams', 'communities',
                    function(community_api, $state, $stateParams, communities) {
                        if ($stateParams.community.key !== communities.data.key) return community_api.getCommunity($stateParams.community.key);
                    }]

            }
        })

        // People views
        .state('sc.people', {
            abstract: true,
            templateUrl: "components/common/content/content_small.html"
        })
        .state('sc.people.dashboard', {
            url: "/people",
            templateUrl: 'views/people/people.dashboard.html',
            params: {
                community: {},
                pageTitle: 'People'
            }
        })
        .state('sc.people.profile', {
            templateUrl: "components/people/people.profile.html",
            controller: 'PeopleProfileController as profile',
            params: {
                community: {},
                pageTitle: 'User Profile'
            },
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }]
            }
        })

        .state('search', {
            templateUrl: 'views/search.html',
            url: "/search",
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }]
            }
        })
        .state('invite', {
            templateUrl: '../views/invite_people.html',
            url: "/people/invite",
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }]
            }
        })
        .state('login', {
            url: "/login",
            params: {
                error: {}
            },
            templateUrl: 'components/common/auth/login.html'
        })
        .state('logout', {
            url: "/logout",
            params: {
                error: {}
            },
            onEnter: function($auth, $stateParams, $state) {
                $auth.logout()
                    .then(function() {
                        $state.go('login', {error: $stateParams.error});
                    });
            }
        })

        // Startup views
        .state('startups', {
            abstract: true,
            templateUrl: "components/common/content/content_small.html"
        })
        .state('startups.dashboard', {
            url: "/startups",
            templateUrl: 'views/startups/startups.dashboard.html',
            params: {
                community: {},
                pageTitle: 'Startups'
            }
        })
        .state('startups.profile', {
            templateUrl: "views/startups/startups.profile.html",
            parent: 'startups',
            params: {
                community: {},
                pageTitle: 'Startup Profile'
            },
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }]
            }
        })

        // Industry views
        .state('industry', {
            abstract: true,
            templateUrl: "components/common/content/content_big.html"
        })
        .state('industry.dashboard', {
            templateUrl: 'views/industries/industry.dashboard.html',
            params: {
                community: {},
                pageTitle: "Industry Profile"
            },
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }]
            }
        })

        // Network views
        .state('network', {
            abstract: true,
            templateUrl: "components/common/content/content_big.html"
        })
        .state('network.dashboard', {
            templateUrl: 'views/networks/network.dashboard.html',
            params: {
                community: {},
                pageTitle: "Network Profile"
            },
            resolve: {
                authenticated: ['$location', '$auth', function($location, $auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }]
            }
        })

        .state('404', {
            templateUrl: "components/common/errors/404.html"
        });

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
    })


    // for Angular client exception logging to server
    .factory(
    "traceService",
    function () {
        return ({
            print: printStackTrace
        });
    }
)

    .provider("$exceptionHandler", {
        $get: function (exceptionLoggingService) {
            return (exceptionLoggingService);
        }
    })

    .factory("exceptionLoggingService", ["$log", "$window", "traceService", function ($log, $window, traceService) {
        function error(exception, cause) { // preserve the default behaviour which will log the error to the console, and allow the application to continue running.
            $log.error.apply($log, arguments); // now try to log the error to the server side.
            try{
                var errorMessage = exception.toString();
                // use our traceService to generate a stack trace
                var stackTrace = traceService.print({e: exception});

                $.ajax({
                    type: "POST",
                    url: "/api/logger",
                    contentType: "application/json",
                    data: angular.toJson({
                        url: $window.location.href,
                        message: errorMessage,
                        type: "exception",
                        stackTrace: stackTrace,
                        cause: ( cause || "")
                    })
                });
            } catch (loggingError) {
                $log.warn("Error server-side logging failed");
                $log.log(loggingError);
            }
        }

        return (error);
    }])

    .factory("applicationLoggingService", ["$log", "$window", function ($log, $window) {
        return ({
            error: function (message) {
                $log.error.apply($log, arguments);
                $.ajax({
                    type: "POST",
                    url: "/api/logger",
                    contentType: "application/json",
                    data: angular.toJson({url: $window.location.href, message: message, type: "error"})
                });
            }, debug: function (message) {
                $log.log.apply($log, arguments);
                $.ajax({
                    type: "POST",
                    url: "/api/logger",
                    contentType: "application/json",
                    data: angular.toJson({url: $window.location.href, message: message, type: "debug"})
                });
            }
        });
    }])

    .config(['$httpProvider', function($httpProvider) { // this interceptor uses the application logging service to log server-side any errors from $http requests

        $httpProvider.interceptors.push(['$rootScope', '$q', '$injector', '$location', 'applicationLoggingService', function ($rootScope, $q, $injector, $location, applicationLoggingService) {
            return function (promise) {
                return promise.then(function (response) {
                    return response;
                }, function (response) {
                    if (response.status === null || response.status === 500) {
                        var error = {
                            method: response.config.method,
                            url: response.config.url,
                            message: response.data,
                            status: response.status
                        };
                        applicationLoggingService.error(JSON.stringify(error));
                    }
                    return $q.reject(response);
                });
            };
        }]);
    }]);

angular
    .module('analytics.mixpanel')
    .config(['$mixpanelProvider', function($mixpanelProvider) {
        $mixpanelProvider.apiKey("0f110baeb6150d7e3b8968e32d7a5595");
    }]);