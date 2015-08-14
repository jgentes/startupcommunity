function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start
    $compileProvider
        .debugInfoEnabled(true);

    $locationProvider
        .html5Mode(true);

    $stateProvider

        // preload is run once
        .state('preload', {
            abstract: true,
            template: "<ui-view/>",
            resolve: {
                user: ['user_service', '$state', '$mixpanel',
                    function(user_service, $state, $mixpanel) {
                        return user_service.getProfile()
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
        .state('invite', {
            templateUrl: 'views/invite_people.html',
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
                query: '*',
                community: {}
            },
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }],
                communities: ['$stateParams', 'community_service',
                    function($stateParams, community_service) {
                        return community_service.getCommunity($stateParams.community_key);
                    }],
                community: ['$stateParams', '$location', 'communities', 'community_service',
                    function($stateParams, $location, communities, community_service) {
                        if (jQuery.isEmptyObject($stateParams.community)) { // if community is passed in via ui-sref, just use that

                            var pullCommunity = function () {
                                if (communities.data[$stateParams.community_key]) { // if community_key has already been pulled, use that
                                    return communities.data[$stateParams.community_key]; // this should also avoid re-pull for /people and /startups
                                } else {
                                    var communityData = community_service.getCommunity($stateParams.community_key);
                                    return communityData.data;
                                }
                            };

                            if (jQuery.isEmptyObject($stateParams.profile)) {
                                // set community based on type, determined by URL
                                var url = $location.path().replace(/\/$/, "").split('/'),
                                    lastitem = url.pop(),
                                    root = url.pop();
                                if (lastitem == "people" || lastitem == "startups" || lastitem == "search") {
                                    return communities.data[root]; // return preceding url path as community, such as tech for 'bend-or/tech/people'
                                } else if (communities.data[lastitem] && communities.data[lastitem].type == "industry") {
                                    return communities.data[lastitem]; // return tech in 'bend-or/tech'
                                } else return pullCommunity();
                            } else return pullCommunity();

                        } else return $stateParams.community;
                    }]
            }
        })

        .state('search', {
            parent: 'root',
            abstract: true,
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html",
                    controller: "HeaderController as header"
                },
                'content': {
                    templateUrl: 'components/common/search/search.dashboard.html'
                }
            }
        })
        .state('search.dashboard', {
            url: "/search",
            params: {
                community: {},
                query: '*',
                pageTitle: 'Search'
            },
            views: {
                'people': {
                    templateUrl: 'components/people/people.dashboard.html',
                    controller: "PeopleController as people"
                },
                'startups': {
                    templateUrl: 'components/startups/startups.dashboard.html',
                    controller: "StartupsController as startups"
                }
            }
        })

        .state('embed', {
            parent: 'preload',
            url: "/:community_key",
            abstract: true,
            templateUrl: 'components/common/header/header_embed.html',
            controller: 'HeaderController as header',
            params: {
                query: '*',
                community: {},
                embed: true
            },
            resolve: {
                communities: ['$stateParams', 'community_service',
                    function($stateParams, community_service) {
                        return community_service.getCommunity($stateParams.community_key);
                    }],
                community: ['$stateParams', '$location', 'communities', 'community_service',
                    function($stateParams, $location, communities, community_service) {
                        if (jQuery.isEmptyObject($stateParams.community)) { // if community is passed in via ui-sref, just use that

                            var pullCommunity = function () {
                                if (communities.data[$stateParams.community_key]) { // if community_key has already been pulled, use that
                                    return communities.data[$stateParams.community_key]; // this should also avoid re-pull for /people and /startups
                                } else {
                                    var communityData = community_service.getCommunity($stateParams.community_key);
                                    return communityData.data;
                                }
                            };

                            if (jQuery.isEmptyObject($stateParams.profile)) {
                                // set community based on type, determined by URL
                                var url = $location.path().replace(/\/$/, "").split('/'),
                                    lastitem = url.pop(),
                                    root = url.pop();
                                if (lastitem == "people" || lastitem == "startups" || lastitem == "search") {
                                    return communities.data[root]; // return preceding url path as community, such as tech for 'bend-or/tech/people'
                                } else if (communities.data[lastitem] && communities.data[lastitem].type == "industry") {
                                    return communities.data[lastitem]; // return tech in 'bend-or/tech'
                                } else return pullCommunity();
                            } else return pullCommunity();

                        } else return $stateParams.community;
                    }]
            }
        })
        .state('embed.dashboard', {
            url: "/embed",
            templateUrl: 'components/people/people.dashboard.html',
            controller: "PeopleController as people"
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
                    templateUrl: "components/common/header/header_small.html",
                    controller: "HeaderController as header"
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
        .state('people.dashboard', {
            url: "/people",
            params: {
                community: {},
                pageTitle: 'People'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html",
                    controller: "HeaderController as header"
                },
                'content': {
                    templateUrl: 'components/people/people.dashboard.html',
                    controller: "PeopleController as people"
                }
            }
        })
        .state('people.invite', {
            url: "/people/invite",
            params: {
                community: {},
                pageTitle: 'Invite People'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html",
                    controller: "HeaderController as header"
                },
                'content': {
                    templateUrl: 'components/people/people.invite.html',
                    controller: "InvitePeopleController as invite"
                }
            }

        })
        
        // Startup views
        .state('startups', {
            parent: 'root',
            abstract: true
        })
        .state('startups.dashboard', {
            url: "/startups",
            params: {
                community: {},
                pageTitle: 'Startups'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html",
                    controller: "HeaderController as header"
                },
                'content': {
                    templateUrl: 'components/startups/startups.dashboard.html',
                    controller: "StartupsController as startups"
                }
            }
        })
        .state('startups.profile', {
            params: {
                profile: {},
                community: {},
                pageTitle: 'Startup Profile'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html",
                    controller: "HeaderController as header"
                },
                'content': {
                    templateUrl: "components/startups/startup.profile.html",
                    controller: 'StartupProfileController as profile'
                }
            },
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }],
                team: ['user_service', '$stateParams', function(user_service, $stateParams) {
                    return user_service.search([$stateParams.community_key], '*', ['*'], 18);
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
                    templateUrl: "components/common/header/header_big.html",
                    controller: "HeaderController as header"
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
                leaders: ['user_service', '$stateParams', function(user_service, $stateParams) {
                    return user_service.search([$stateParams.community_key], '*', ['leader'], 18);
                }],
                communities: ['community_service', '$stateParams', 'communities',
                    function(community_service, $stateParams, communities) { //check if communities data can be inherited
                        if ($stateParams.community_key !== communities.data.key) return community_service.getCommunity($stateParams.community_key);
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
                    templateUrl: "components/common/header/header_big.html",
                    controller: "HeaderController as header"
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
                leaders: ['user_service', '$stateParams', function(user_service, $stateParams) {
                    return user_service.search([$stateParams.community_key], '*', ['leader'], 30);
                }],
                communities: ['community_service', '$stateParams', 'communities',
                    function(community_service, $stateParams, communities) { // check to see if this can be inherited
                        if ($stateParams.community_key !== communities.data.key) return community_service.getCommunity($stateParams.community_key);
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
                    templateUrl: "components/common/header/header_small.html",
                    controller: "HeaderController as header"
                },
                'content': {
                    templateUrl: 'components/people/people.dashboard.html',
                    controller: "PeopleController as people"
                }
            }
        })
        .state('industry.search.dashboard', {
            parent: 'search',
            url: "/:industry_key/search",
            params: {
                community: {},
                query: '*',
                pageTitle: 'Search'
            },
            views: {
                "people": {
                    templateUrl: 'components/people/people.dashboard.html',
                    controller: "PeopleController as people"
                }
            }
        })

        // Network views
        .state('network', {
            parent: "root",
            abstract: true
        })
        .state('network.dashboard', {
            params: {
                community: {},
                pageTitle: "Network Profile"
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_big.html",
                    controller: "HeaderController as header"
                },
                'content': {
                    templateUrl: 'components/networks/network.dashboard.html',
                    controller: "NetworkController as net"
                }
            },
            resolve: {
                authenticated: ['$auth', function($auth) {
                    if (!$auth.isAuthenticated()) {
                        $state.go('login');
                    }
                }],
                leaders: ['user_service', '$stateParams', function(user_service, $stateParams) {
                    return user_service.search([$stateParams.community_key], '*', ['leader'], 18);
                }],
                communities: ['community_service', '$stateParams', 'communities',
                    function(community_service, $stateParams, communities) { // check to see if this can be inherited
                        if ($stateParams.community_key !== communities.data.key) return community_service.getCommunity($stateParams.community_key);
                    }]

            }
        })

        .state('404', {
            templateUrl: "components/common/errors/404.html"
        });

    // Set default unmatched url stat
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
        $rootScope.$state = $state; // allows use if $state within views
        window.$state = $state; // allows use of $state within console
        $rootScope.$on("$stateChangeError", console.log.bind(console)); // for debugging of ui-router

        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams){
                //console.log('from: ')
                //console.log(fromState);
                //console.log('to:');
                //console.log(toState);
            })

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