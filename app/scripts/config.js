function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start
    /*$compileProvider
     .debugInfoEnabled(true); // set to false for production*/

    $locationProvider
        .html5Mode(true);

    $stateProvider

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
            onEnter: function($auth, $location) {
                $auth.logout()
                    .then(function() {
                        $location.path('/login');
                    })
                    .catch(function(err) {
                        console.warn('WARNING: Logout error', err);
                        $location.path('/login');
                    });
            }
        })

        // the root state with core dependencies for injection in child states
        .state('root', {
            url: "/:location_path",
            templateUrl: "components/common/nav/nav.html",
            controller: "NavigationController as nav",
            params: {
                profile: {},  // must include params here for inheritance
                community: {},
                location: {},
                tour: false
            },
            resolve: {
                user: ['user_service', '$state', '$mixpanel', '$location',
                    function(user_service, $state, $mixpanel, $location) {
                        return user_service.getProfile()
                            .success(function(response) {

                                if (response.message) {
                                    $location.url('/logout');
                                }

                                if (response.key) {
                                    $mixpanel.people.set({
                                        "$name": response.profile.name,
                                        "$email": response.profile.email
                                    });

                                }
                            })
                            .error(function(response) {
                                //todo add exception logging here
                                $location.url('/logout');
                            });
                    }],
                communities: ['$stateParams', 'community_service', 'user',
                    function($stateParams, community_service, user) {
                        // user is injected to prevent communities from loading until user is valid
                        return community_service.getCommunity($stateParams.location_path)
                            .error(function(response) {
                                console.log(response);
                                $state.go('404', { message: String(response) });
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
                            if (communities.data[$stateParams.location_path] && communities.data[$stateParams.location_path].type == 'location') {
                                return communities.data[$stateParams.location_path];
                            } else return {};
                        } else return $stateParams.location;
                    }]
            }
        })


        .state('email', {
            parent: 'root',
            url: '/email',
            views: {
                'content': {
                    templateUrl: "components/common/email.html",
                    controller: 'EmailController as email'
                }
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
                },
                go: null
            },
            views: {
                "@": { // this forces override of root template
                    templateUrl: "components/common/welcome/welcome.html",
                    controller: "WelcomeController as welcome"
                }
            }
        })
        .state('welcome.roles', {
            templateUrl: "components/common/welcome/welcome.roles.html"
        })
        .state('welcome.skills', {
            templateUrl: "components/common/welcome/welcome.skills.html"
        })
        .state('welcome.profile', {
            templateUrl: "components/common/welcome/welcome.profile.html"
        })
        .state('welcome.companies', {
            templateUrl: "components/common/welcome/welcome.companies.html"
        })
        .state('welcome.invite', {
            templateUrl: "components/common/welcome/welcome.invite.html",
            controller: "InviteUserController as invite"
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

        // Community views
        .state('community', {
            parent: "root",
            abstract: true,
            views: {
                'header': {
                    templateUrl: "components/common/header/header_small.html"
                },
                'content': {
                    template: "<div ui-view='people'></div>"
                }
            }
        })
        .state('community.dashboard', {
            url: "/:community_path",
            params: {
                location_path: null,
                community_path: null,
                tour: false
            },
            resolve: {
                top: ['community_service', '$stateParams', 'community',
                    function (community_service, $stateParams, community) {
                        return community_service.getTop($stateParams.location_path, $stateParams.community_path, community);
                    }]
            },
            views: {
                'people': {
                    templateUrl: 'components/common/dashboard/dashboard.html',
                    controller: "DashboardController as dashboard"
                }
            }
        })
        .state('community.dashboard.company',{})
        .state('community.dashboard.location',{})
        .state('community.dashboard.cluster',{})

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
        //$authProvider.authHeader = 'x-access-token'; // to fix 400 Bad Request issue
        $authProvider.loginRedirect = false; //otherwise will go home
        $authProvider.linkedin({
            clientId: "75bqixdv58z1az",
            state: function() {
                return window.location.pathname;
            }
        });
    })
    .config(function ($opbeatProvider) {
        $opbeatProvider.config({
            debug: false,
            orgId: 'adf86d959a464b28a1df269d2e7ba468',
            appId: '6fcd00ba8b'
        });
        $opbeatProvider.install()
    })
    .run(function(editableOptions) {
        editableOptions.theme = 'bs3';
    })
    .run(function($rootScope, $state, $timeout, $auth) {
        $rootScope.$state = $state; // allows use if $state within views
        window.$state = $state; // allows use of $state within console
        $rootScope.$on('$stateChangeError', function (evt, toState, toParams, fromState, fromParams, error) {
            //todo add exception logging here
            $auth.removeToken();
            $state.go('login', {alert: error.statusText + ', please login again.'}, {reload: true});
        });
        $rootScope.$on('$stateChangeSuccess',function(){
            $("html, body").animate({ scrollTop: 0 }, 200);
        });
        $rootScope.$on('$viewContentLoaded', function(){
            // remove the splash screen
            $timeout( function() {
                $('#majorsplash').css('display', 'none');
                $('#minorsplash').css('display', 'none');
            }, 500);
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
        "stacktraceService",
        function() {
            // "printStackTrace" is a global object.
            return({
                print: printStackTrace
            });
        }
    )

    .provider(
        "$exceptionHandler",
        {
            $get: function( errorLogService ) {
                return( errorLogService );
            }
        }
    )
    // this factory pushes the exceptions to the server
    .factory(
        "errorLogService",
        function( $log, $window, stacktraceService) {

            function log( exception, cause ) {

                $log.error.apply( $log, arguments );

                try {
                    var errorMessage = exception.toString();
                    var stackTrace = stacktraceService.print({ e: exception });

                    $.ajax({
                        type: "POST",
                        url: "/api/logger",
                        contentType: "application/json",
                        data: angular.toJson({
                            errorMessage: errorMessage,
                            errorUrl: $window.location.href,
                            //stackTrace: stackTrace,
                            cause: ( cause || "" )
                        })
                    });
                } catch ( loggingError ) {
                    $log.warn( "Error logging failed" );
                    $log.log( loggingError );
                }
            }
            // Return the logging function.
            return( log );
        }
    )
    // this factory is used to capture sourcemaps
    .factory('$exceptionHandler',
        function($log, $window, $injector, errorLogService) {
            var getSourceMappedStackTrace = function(exception) {
                var $q = $injector.get('$q'),
                    $http = $injector.get('$http'),
                    SMConsumer = window.sourceMap.SourceMapConsumer,
                    cache = {};

                // Retrieve a SourceMap object for a minified script URL
                var getMapForScript = function(url) {
                    if (cache[url]) {
                        return cache[url];
                    } else {
                        var promise = $http.get(url).then(function(response) {
                            var m = response.data.match(/\/\/# sourceMappingURL=(.+\.map)/);
                            if (m) {
                                var path = url.match(/^(.+)\/[^/]+$/);
                                path = path && path[1];
                                return $http.get(path + '/' + m[1]).then(function(response) {
                                    return new SMConsumer(response.data);
                                });
                            } else {
                                return $q.reject();
                            }
                        });
                        cache[url] = promise;
                        return promise;
                    }
                };

                if (exception.stack) { // not all browsers support stack traces
                    return $q.all($.map(exception.stack.split(/\n/), function(stackLine) {
                        var match = stackLine.match(/^(.+)(http.+):(\d+):(\d+)/);
                        if (match) {
                            var prefix = match[1], url = match[2], line = match[3], col = match[4];
                            return getMapForScript(url).then(function(map) {
                                var pos = map.originalPositionFor({
                                    line: parseInt(line, 10),
                                    column: parseInt(col, 10)
                                });
                                var mangledName = prefix.match(/\s*(at)?\s*(.*?)\s*(\(|@)/);
                                mangledName = (mangledName && mangledName[2]) || '';
                                return '    at ' + (pos.name ? pos.name : mangledName) + ' ' +
                                    $window.location.origin + pos.source + ':' + pos.line + ':' +
                                    pos.column;
                            }, function() {
                                return stackLine;
                            });
                        } else {
                            return $q.when(stackLine);
                        }
                    })).then(function (lines) {
                        return lines.join('\n');
                    });
                } else {
                    return $q.when('');
                }
            };

            return function(exception) {
                getSourceMappedStackTrace(exception).then(function(final) {
                    errorLogService(final);
                });
            };
        });

angular
    .module('analytics.mixpanel')
    .config(['$mixpanelProvider', function($mixpanelProvider) {
        $mixpanelProvider.apiKey("0f110baeb6150d7e3b8968e32d7a5595");
    }]);