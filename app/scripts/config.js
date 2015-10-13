function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start
    $compileProvider
        .debugInfoEnabled(true); // set to false for production

    $locationProvider
        .html5Mode(true);

    $stateProvider

        .state('invite', {
            templateUrl: 'views/invite_user.html',
            url: "/users/invite",
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
                alert: {}
            },
            templateUrl: 'components/common/auth/login.html'
        })
        .state('logout', {
            url: "/logout",
            params: {
                alert: {}
            },
            onEnter: function($auth, $state, $stateParams) {
                $auth.logout()
                    .then(function() {
                        $state.go('login', { alert: $stateParams.message });
                    })
            }
        })

        // the root state with core dependencies for injection in child states
        .state('root', {
            url: "/:location_path",
            templateUrl: "components/common/nav/nav.html",
            controller: "NavigationController as nav",
            params: {
                profile: {},  // must include params for *any* root-level object for inheritance, such as users, companies, networks, etc
                community: {},
                location: {}
            },
            resolve: {
                user: ['user_service', '$state', '$mixpanel',
                    function(user_service, $state, $mixpanel) {
                        return user_service.getProfile()
                            .success(function(response) {

                                if (response.message) {
                                    $state.go('logout', { message: String(response.message) });
                                }

                                if (response.key) {
                                    $mixpanel.people.set({
                                        "$name": response.profile.name,
                                        "$email": response.profile.email
                                    });

                                }
                            })
                            .error(function(response) {
                                $state.go('logout', { message: String(response.message) });
                            });
                    }],
                communities: ['$stateParams', 'community_service',
                    function($stateParams, community_service) {
                        return community_service.getCommunity($stateParams.location_path)
                            .error(function(response) {
                                $state.go('404', { message: String(response.message) });
                            });
                    }],
                community: ['$stateParams', '$location', 'communities', 'community_service',
                    function($stateParams, $location, communities, community_service) {
                        if (jQuery.isEmptyObject($stateParams.community)) { // if community is passed in via ui-sref, just use that

                            var pullCommunity = function () {
                                if (communities.data[$stateParams.location_path]) { // if location_path has already been pulled, use that
                                    return communities.data[$stateParams.location_path]; // this should also avoid re-pull for /people and /companies
                                } else {
                                    var communityData = community_service.getCommunity($stateParams.location_path);
                                    return communityData.data;
                                }
                            };

                            if (jQuery.isEmptyObject($stateParams.profile)) {
                                // set community based on type, determined by URL
                                var url = $location.path().replace(/\/$/, "").split('/'),
                                    lastitem = url.pop(),
                                    root = url.pop();

                                if (lastitem == "people" || lastitem == "companies" || lastitem == "search" || lastitem == "invite" || lastitem == "add" || lastitem == "welcome") {
                                    if (lastitem == "invite" || lastitem == "add") {
                                        return communities.data[url.pop()];
                                    } else return communities.data[root]; // return preceding url path as community, such as tech for 'bend-or/tech/people'
                                } else if (communities.data[lastitem] && (communities.data[lastitem].type == "cluster" || communities.data[lastitem].type == "network")) {
                                    return communities.data[lastitem]; // return tech in 'bend-or/tech'
                                } else return pullCommunity();
                            } else return pullCommunity();

                        } else return $stateParams.community;
                    }],
                location: ['$stateParams', 'community', 'communities',
                    function($stateParams, community, communities) {
                        if(jQuery.isEmptyObject($stateParams.location)) {
                            if (communities.data[$stateParams.location_path].type == 'location') {
                                return communities.data[$stateParams.location_path];
                            } else return {};
                        } else return $stateParams.location;
                    }]
            }
        })

        // ORDER MATTERS.. first matching url wins!

        .state('welcome', {
            parent: "root",
            url: "^/:location_path/:community_path/welcome?invite_code",
            params: {
                community_path: {
                    value: null,
                    squash: true
                }
            },
            views: {
                "@": { // this forces override of root template
                    templateUrl: "components/common/welcome/welcome.html",
                    controller: "WelcomeController as welcome"
                }
            }
        })
        .state('welcome.roles', {
            templateUrl: "../components/common/welcome/welcome.roles.html"
        })
        .state('welcome.skills', {
            templateUrl: "../components/common/welcome/welcome.skills.html"
        })
        .state('welcome.profile', {
            templateUrl: "components/common/welcome/welcome.profile.html"
        })
        .state('welcome.companies', {
            templateUrl: "components/common/welcome/welcome.companies.html"
        })

        .state('search', {
            parent: 'root',
            abstract: true,
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html"
                },
                'content': {
                    templateUrl: 'components/common/search/search.dashboard.html'
                }
            }
        })
        .state('search.dashboard', {
            url: "^/:location_path/:community_path/search",
            params: {
                community_path: {
                    value: null,
                    squash: true
                },
                query: '*',
                pageTitle: 'Search'
            },
            views: {
                'people': {
                    templateUrl: 'components/users/user.list.html',
                    controller: "UserController as users"
                },
                'companies': {
                    templateUrl: '../components/companies/company.list.html',
                    controller: "CompanyController as companies"
                }
            }
        })

        // User views
        .state('user', {
            parent: 'root',
            abstract: true
        })
        .state('user.dashboard', {
            params: {
                profile: {},
                location: {},
                pageTitle: 'User Profile'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html"
                },
                'content': {
                    templateUrl: "components/users/user.dashboard.html",
                    controller: 'UserProfileController as profile'
                }
            }
        })

        .state('user.list', {
            url: "^/:location_path/:community_path/people",
            params: {
                community_path: {
                    value: null,
                    squash: true
                },
                pageTitle: 'People'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html"
                },
                'content': {
                    templateUrl: 'components/users/user.list.html',
                    controller: "UserController as users"
                }
            }
        })
        .state('user.invite', {
            url: "/:community_path/people/invite",
            params: {
                community: {},
                community_path: {
                    value: null,
                    squash: true
                },
                pageTitle: 'Invite People',
                pageDescription: 'New users will be asked to identify their roles and industry focus within the community.',
                icon: 'pe-7s-id'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html"
                },
                'content': {
                    templateUrl: 'components/users/user.invite.html',
                    controller: "InviteUserController as invite"
                }
            }
        })
        
        // Company views
        .state('company', {
            parent: 'root',
            abstract: true
        })
        .state('company.dashboard', {
            params: {
                profile: {},
                location: {},
                pageTitle: 'Company Profile'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html"
                },
                'content': {
                    templateUrl: "../components/companies/company.dashboard.html",
                    controller: 'CompanyProfileController as profile'
                }
            }
        })
        .state('company.list', {
            url: "^/:location_path/:community_path/companies",
            params: {
                community_path: {
                    value: null,
                    squash: true
                },
                pageTitle: 'Companies'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html"
                },
                'content': {
                    templateUrl: '../components/companies/company.list.html',
                    controller: "CompanyController as companies"
                }
            }
        })
        .state('company.add', {
            url: "/:community_path/companies/add",
            params: {
                community: {},
                community_path: {
                    value: null,
                    squash: true
                },
                pageTitle: 'Add Company',
                pageDescription: 'AngelList URL is required to pull the logo, headline, and summary for each company.',
                icon: 'pe-7s-id'
            },
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html"
                },
                'content': {
                    templateUrl: '../components/companies/company.add.html',
                    controller: "AddCompanyController as add"
                }
            }

        })

        
        // Location views
        .state('location', {
            parent: "root",
            abstract: true,
            views: {
                'header': {
                    templateUrl: "components/common/header/header_big.html"
                },
                'content': {
                    template: "<div ui-view='people'></div>"
                }
            }
        })
        .state('location.dashboard', {
            params: {
                pageTitle: "Location"
            },
            resolve: {
                top: ['community_service', '$stateParams',
                    function (community_service, $stateParams) {
                        return community_service.getTop($stateParams.location_path, $stateParams.community_path);
                    }]
            },
            views: {
                'header@root': {
                    templateUrl: "components/common/header/header_dash.html",
                    controller: "DashboardController as dashboard"
                },
                'people': {
                    templateUrl: 'components/common/dashboard/dashboard.html',
                    controller: "DashboardController as dashboard"
                }
            }
        })

        // Network views
        .state('network', {
            parent: "root",
            abstract: true,
            views: {
                'header': {
                    templateUrl: "components/common/header/header_big.html"
                },
                'content': {
                    template: "<div ui-view='people'></div>"
                }
            }
        })
        .state('network.dashboard', {
            url: "/:community_path",
            params: {
                community: {}, // root url goes blank without this because it needs community passed in
                pageTitle: "Network"
            },
            resolve: {
                top: ['community_service', '$stateParams',
                    function (community_service, $stateParams) {
                        return community_service.getTop($stateParams.location_path, $stateParams.community_path);
                    }]
            },
            views: {
                'people': {
                    templateUrl: 'components/common/dashboard/dashboard.html',
                    controller: "DashboardController as dashboard"
                }
            }
        })

        // Cluster views
        .state('cluster', {
            parent: "root",
            abstract: true,
            views: {
                'header': {
                    templateUrl: "components/common/header/header_big.html"
                },
                'content': {
                    template: "<div ui-view='people'></div>"
                }
            }
        })
        .state('cluster.dashboard', {
            url: "/:community_path",
            params: {
                community: {},
                pageTitle: "Cluster"
            },
            resolve: {
                top: ['community_service', '$stateParams',
                    function (community_service, $stateParams) {
                        return community_service.getTop($stateParams.location_path, $stateParams.community_path);
                    }]
            },
            views: {
                'people': {
                    templateUrl: 'components/common/dashboard/dashboard.html',
                    controller: "DashboardController as dashboard"
                }
            }
        })



        .state('404', {
            templateUrl: "components/common/errors/404.html",
            controller: "ErrorPageController as error"
        })

        .state('500', {
            templateUrl: "components/common/errors/500.html",
            controller: "ErrorPageController as error"
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
        $authProvider.loginRedirect = false; //otherwise will go home
        $authProvider.linkedin({
            clientId: "75bqixdv58z1az",
            state: function() {
                return window.location.pathname;
            }
        });
    })
    .run(function(editableOptions) {
        editableOptions.theme = 'bs3';
    })
    .run(function($rootScope, $state) {
        $rootScope.$state = $state; // allows use if $state within views
        window.$state = $state; // allows use of $state within console
        $rootScope.$on("$stateChangeError", console.log.bind(console)); // for debugging of ui-router
        $rootScope.$on('$stateChangeSuccess',function(){
            $("html, body").animate({ scrollTop: 0 }, 200);
        });
/*
        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams){
                //console.log('from: ');
                //console.log(fromState);
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