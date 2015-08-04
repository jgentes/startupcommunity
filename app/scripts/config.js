function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start
    $compileProvider.debugInfoEnabled(true);

    $locationProvider
        .html5Mode(true);

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
            controller: "LoginController as auth",
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

        // the root state with core dependencies for injection in child states
        .state('root', {
            parent: 'preload',
            url: "/:community_key",
            templateUrl: "components/common/nav/nav.html",
            controller: "NavigationController as nav",
            params: {
                profile: {},  // must include params for *any* root-level object for inheritance, such as users, startups, networks, etc
                community: {}
            },
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }],
                communities: ['$stateParams', 'community_api',
                    function($stateParams, community_api) {
                        return community_api.getCommunity($stateParams.community_key);
                    }],
                community: ['$stateParams', '$location', 'communities', 'community_api',
                    function($stateParams, $location, communities, community_api) {
                        if (jQuery.isEmptyObject($stateParams.community)) { // if community is passed in via ui-sref, just use that

                            var pullCommunity = function () {
                                if (communities.data[$stateParams.community_key]) { // if community_key has already been pulled, use that
                                    return communities.data[$stateParams.community_key]; // this should also avoid re-pull for /people and /startups
                                } else {
                                    var communityData = community_api.getCommunity($stateParams.community_key);
                                    return communityData.data;
                                }
                            };

                            if ($stateParams.profile || $stateParams.startup) {
                                return pullCommunity();
                            } else {
                                // set community based on type, determined by URL
                                var url = $location.path().replace(/\/$/, "").split('/'),
                                    lastitem = url.pop(),
                                    root = url.pop();

                                if (lastitem == "people" || lastitem == "startups") {
                                    return communities.data[root]; // return preceding url path as community, such as tech for 'bend-or/tech/people'
                                } else if (communities.data[lastitem].type == "industry") {
                                    return communities.data[lastitem]; // return tech in 'bend-or/tech'
                                } else return pullCommunity();
                            }
                        } else return $stateParams.community;
                    }]
            }
        })

        // Location views
        .state('location', {
            parent: "root",
            abstract: true
        })
        .state('location.dashboard', {
            params: {
                community: {},
                pageTitle: "Location Profile"
            },
            views: {
                'header': {
                    templateUrl: "../components/common/header/header_big.html",
                    controller: "ContentController as content"
                },
                'content': {
                    templateUrl: 'components/locations/location.dashboard.html',
                    controller: "LocationController as loc"
                }
            },
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }],
                leaders: ['user_api', '$stateParams', function(user_api, $stateParams) {
                    return user_api.getUsers([$stateParams.community_key], ['leader'], 18);
                }],
                communities: ['community_api', '$stateParams', 'communities',
                    function(community_api, $stateParams, communities) {
                        if ($stateParams.community_key !== communities.data.key) return community_api.getCommunity($stateParams.community_key);
                    }]

            }
        })
        .state('location.people', {
            url: "/people",
            params: {
                community: {},
                pageTitle: 'People'
            },
            views: {
                'header': {
                    templateUrl: "../components/common/header/header_small.html",
                    controller: "ContentController as content"
                },
                'content': {
                    templateUrl: 'components/people/people.dashboard.html',
                    controller: "PeopleController as people"
                }
            }

        })

        // People views
        .state('people', {
            parent: 'root',
            abstract: true
        })
        .state('people.profile', {
            params: {
                profile: {},
                community: {},
                pageTitle: 'User Profile'
            },
            views: {
                'header': {
                    templateUrl: "../components/common/header/header_small.html",
                    controller: "ContentController as content"
                },
                'content': {
                    templateUrl: "components/people/people.profile.html",
                    controller: 'PeopleProfileController as profile'
                }
            },
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }]
            }
        })

        // Industry views
        .state('industry', {
            parent: "root",
            abstract: true
        })
        .state('industry.dashboard', {
            url: "/:industry_key",
            params: {
                community: {},
                pageTitle: "Industry Profile"
            },
            views: {
                'header': {
                    templateUrl: "../components/common/header/header_big.html",
                    controller: "ContentController as content"
                },
                'content': {
                    templateUrl: 'components/industries/industry.dashboard.html',
                    controller: "IndustryController as ind"
                }
            },
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }],
                leaders: ['user_api', '$stateParams', function(user_api, $stateParams) {
                    return user_api.getUsers([$stateParams.community_key], ['leader'], 30);
                }],
                communities: ['community_api', '$stateParams', 'communities',
                    function(community_api, $stateParams, communities) {
                        if ($stateParams.community_key !== communities.data.key) return community_api.getCommunity($stateParams.community_key);
                    }]

            }
        })
        .state('industry.people', {
            url: "/:industry_key/people",
            params: {
                community: {},
                pageTitle: 'People'
            },
            views: {
                'header': {
                    templateUrl: "../components/common/header/header_small.html",
                    controller: "ContentController as content"
                },
                'content': {
                    templateUrl: 'components/people/people.dashboard.html',
                    controller: "PeopleController as people"
                }
            }
        })

        // Startup views
        .state('startups', {
            parent: 'root',
            abstract: true,
            templateUrl: "../components/common/header/header_small.html",
            controller: "ContentController as content"
        })
        .state('startups.dashboard', {
            url: "/startups",
            templateUrl: 'components/startups/startups.dashboard.html',
            controller: "StartupsController as startups",
            params: {
                community: {},
                pageTitle: 'Startups'
            }
        })
        .state('startups.profile', {
            templateUrl: "components/startups/startups.profile.html",
            controller: "StartupsProfileController as profile",
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


        // Network views
        .state('network', {
            parent: "root",
            abstract: true,
            templateUrl: "../components/common/header/header_big.html",
            controller: "ContentController as content"
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

    // Set default unmatched url state - this runs first for undefined url paths
    $urlRouterProvider.otherwise(
        function($injector) {
            $injector.invoke(['$state', function($state) {
                $state.go('404');
            }]);
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
        // for debugging of ui-router
        $rootScope.$on("$stateChangeError", console.log.bind(console));
        /*
        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams){
                console.log('from: ')
                console.log(fromState);
                console.log('to:');
                console.log(toState);
            })
        */
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