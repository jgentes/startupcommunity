function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start
    /*$compileProvider
     .debugInfoEnabled(true); // set to false for production*/

    $locationProvider
        .html5Mode(true);

    $stateProvider

    // ORDER MATTERS.. first matching url wins!

        .state('login', {
            url: "/login",
            controller: "LoginController as auth",
            params: {
                alert: {}
            },
            templateUrl: 'components/auth/login.html'
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

        .state('404', {
            templateUrl: "components/errors/404.html",
            controller: "ErrorPageController as error"
        })

        .state('500', {
            templateUrl: "components/errors/500.html",
            controller: "ErrorPageController as error"
        })

        // the root state with core dependencies for injection in child states
        .state('root', {
            url: "/:location_path",
            templateUrl: "components/nav/nav.html",
            controller: "NavigationController as nav",
            params: {
                profile: {},
                community: {},
                location: {},
                top: null,
                communities: null,
                user: null,
                tour: false
            },
            resolve: {
                user: ['user_service', '$state', '$mixpanel', '$location', '$stateParams',
                    function(user_service, $state, $mixpanel, $location, $stateParams) {

                        if ($stateParams.user) {
                            return $stateParams.user;
                        } else return user_service.getProfile()
                            .then(function(response) {

                                if (response.message) {
                                    $location.url('/logout');
                                }

                                if (response.key) {
                                    $mixpanel.people.set({
                                        "$name": response.profile.name,
                                        "$email": response.profile.email
                                    });
                                }

                                return response.data;

                            })
                            .catch(function(response) {
                                //todo add exception logging here
                                $location.url('/logout');
                            });
                    }],
                communities: ['$stateParams', 'community_service', 'user',
                    function($stateParams, community_service, user) {                  
                        // user is injected to prevent communities from loading until user is valid
                        if ($stateParams.communities && ($stateParams.communities.key == $stateParams.location_path)) {
                            return $stateParams.communities;
                        } else return community_service.getCommunity($stateParams.location_path)
                            .then(function(response) {
                                return response.data;
                            })
                            .catch(function(response) {
                                console.log(response);
                                $state.go('404', { message: String(response) });
                            });
                    }],
                community: ['$stateParams', '$location', 'communities', 'community_service',
                    function($stateParams, $location, communities, community_service) {
                        if (jQuery.isEmptyObject($stateParams.community)) { // if community is passed in via ui-sref, just use that
                            
                            var pullCommunity = function () {
                                if (communities[$stateParams.location_path]) { // if location_path has already been pulled, use that
                                    return communities[$stateParams.location_path]; // this should also avoid re-pull for /people and /companies
                                } else {
                                    return community_service.getCommunity($stateParams.location_path)
                                        .then(function(response) {
                                            return response.data;
                                        })
                                }
                            };

                            if (jQuery.isEmptyObject($stateParams.profile)) {
                                // set community based on type, determined by URL
                                var url = $location.path().replace(/\/$/, "").split('/'),
                                    lastitem = url.pop(),
                                    root = url.pop();

                                if (lastitem == "people" || lastitem == "companies" || lastitem == "search" || lastitem == "invite" || lastitem == "add" || lastitem == "welcome") {
                                    if (lastitem == "invite" || lastitem == "add") {
                                        return communities[url.pop()];
                                    } else return communities[root]; // return preceding url path as community, such as tech for 'bend-or/tech/people'
                                } else if (communities[lastitem] && (communities[lastitem].type == "cluster" || communities[lastitem].resource)) {
                                    return communities[lastitem]; // return tech in 'bend-or/tech'
                                } else return pullCommunity();
                            } else return pullCommunity();

                        } else return $stateParams.community;
                    }],
                location: ['$stateParams', 'communities', 'community',
                    function($stateParams, communities, community) {
                        if (community.type == 'user' || community.type == 'company') {
                            return communities[community.profile.home];
                        } else if(jQuery.isEmptyObject($stateParams.location) || $stateParams.location.type !== 'location') {
                            if (communities[$stateParams.location_path]) {
                                return communities[$stateParams.location_path];
                            } else return {};
                        } else if ($stateParams.location.type == 'location') {
                            return $stateParams.location;
                        } else return {};
                    }],
                nav_communities: ['community_service', 'communities', 'community', 'location', '$stateParams',
                    function(community_service, communities, community, location, $stateParams) {
                        // this logic is mostly to avoid pulling community from db if it can be passed from previous state
                        if (communities && communities.key && location && location.key) {
                            return (location.key == communities.key) ?
                                communities :
                                ($stateParams.communities && $stateParams.communities.key == location.key) ?
                                $stateParams.communities :
                                community_service.getCommunity(location.key)
                                    .then(function(response) {
                                        return response.data;
                                    })
                                    .catch(function(response) {
                                        console.log(response);
                                    });
                        } else return communities;
                    }],
                top: ['community_service', 'location', '$stateParams',
                    function (community_service, location, $stateParams) {
                        if ($stateParams.top) {
                            return $stateParams.top;
                        } else if (location && location.key && ((location.type == 'location') || (location.resource) || (location.type == 'cluster'))) {
                            return community_service.getTop(location.key)
                                .then(function(response) {
                                    return response.data;
                                })
                        } else return undefined;
                    }],
                community_top: ['community_service', 'community', 'location', 'top',
                    function (community_service, community, location, top) {
                        if (community && community.key && location && location.key) {
                            if (community.key !== location.key && ((community.type == 'location') || (community.resource) || (community.type == 'cluster'))) {
                                return community_service.getTop(location.key, community.key, community)
                                    .then(function(response) {
                                        return response.data;
                                    })
                            } else return top;
                        } else return top;
                    }],
                company: ['community',
                    function(community) {
                        return community.type == 'company' ? community : null;
                    }]
            }
        })

        // User views
        .state('user', {
            parent: 'root',
            abstract: true
        })
        .state('user.dashboard', {
            params: {
                pageTitle: 'User Profile'
            },
            views: {
                'header': {
                    templateUrl: "components/header/header_small.html"
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
                    templateUrl: "components/header/header_small.html"
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
                    templateUrl: "components/header/header_small.html"
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
                    templateUrl: "components/header/header_small.html"
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
                pageTitle: 'Add a Company'
            },
            views: {
                'header': {
                    templateUrl: "components/header/header_small.html"
                },
                'content': {
                    templateUrl: '../components/resources/resource.add.html',
                    controller: "EditCompanyController as add"
                }
            }
        })
        .state('company.edit', {
            url: "/:community_path/edit",
            params: {
                community: {},
                community_path: {
                    value: null,
                    squash: true
                },
                pageTitle: 'Edit a Company'
            },
            views: {
                'header': {
                    templateUrl: "components/header/header_small.html"
                },
                'content': {
                    templateUrl: '../components/resources/resource.add.html',
                    controller: "EditCompanyController as add"
                }
            }
        })


        .state('resource', {
            parent: 'root',
            abstract: true
        })
        .state('resource.list', {
            url: "^/:location_path/:community_path/resources",
            params: {
                community_path: {
                    value: null,
                    squash: true
                },
                pageTitle: 'Resources'
            },
            views: {
                'header': {
                    templateUrl: "components/header/header_small.html"
                },
                'content': {
                    templateUrl: '../components/companies/company.list.html',
                    controller: "CompanyController as companies"
                }
            }
        })
        .state('resource.add', {
            url: "^/:location_path/:community_path/resources/add",
            params: {
                community_path: {
                    value: null,
                    squash: true
                },
                pageTitle: 'Add a Resource'
            },
            views: {
                'content': {
                    templateUrl: '../components/resources/resource.add.html',
                    controller: "EditCompanyController as add"
                }
            }
        })



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
            resolve: {
              $uibModalInstance: function() { return null; } // necessary to avoid unknown provider for $uibModalInstance when controller not invoked through modal
            },
            views: {
                "@": { // this forces override of root template
                    templateUrl: "components/welcome/welcome.html",
                    controller: "WelcomeController as welcome"
                }
            }
        })
        .state('welcome.roles', {
            templateUrl: "components/welcome/welcome.roles.html"
        })
        .state('welcome.skills', {
            templateUrl: "components/welcome/welcome.skills.html"
        })
        .state('welcome.profile', {
            templateUrl: "components/welcome/welcome.profile.html"
        })
        .state('welcome.invite', {
            templateUrl: "components/welcome/welcome.invite.html",
            controller: "InviteUserController as invite"
        })

        .state('settings', {
            parent: 'root',
            url: '/settings',
            params: {
                location_path: null
            },
            views: {
                'content': {
                    templateUrl: "components/settings.html",
                    controller: "SettingsController as settings"
                }
            }
        })

        .state('newsletter', {
            parent: 'root',
            url: '/newsletter',
            views: {
                'content': {
                    templateUrl: "components/newsletter/newsletter.html",
                    controller: 'NewsletterController as news'
                }
            }
        })

        .state('search', {
            parent: 'root',
            abstract: true,
            views: {
                'header': {
                    templateUrl: "components/header/header_small.html"
                },
                'content': {
                    templateUrl: 'components/search/search.dashboard.html'
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

        // Community views
        .state('community', {
            parent: "root",
            abstract: true,
            views: {
                'header': {
                    templateUrl: "components/header/header_small.html"
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
                tour: false,
                pageTitle: 'Overview'
            },
            views: {
                'people': {
                    templateUrl: 'components/dashboard/dashboard.html',
                    controller: "DashboardController as dashboard"
                }
            }
        })
        .state('community.dashboard.location',{})
        .state('community.dashboard.cluster',{})
        .state('community.dashboard.company',{}); // for user profile page when companies are in communities

        // BE CAREFUL NOT TO PUT STATES AFTER COMMUNITY.. COMMUNITY SEEMS TO TRUMP ANYTHING FOLLOWING IT

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
    .run(function(editableOptions) {
        editableOptions.theme = 'bs3';
    })
    .run(function($rootScope, $state, $timeout, $auth) {
        $rootScope.$state = $state; // allows use if $state within views
        window.$state = $state; // allows use of $state within console
        $rootScope.$on('$stateChangeError', function (evt, toState, toParams, fromState, fromParams, error) {
            //todo add exception logging here
            $auth.removeToken();
            console.log(evt, error);
            $state.go('login', {alert: 'Sorry, please login again. ' + error.statusText}, {reload: true});
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

       /* $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams){
                console.log(event);
                console.log('from: ');
                console.log(fromState);
                console.log('to:');
                console.log(toState);
            })
*/
    })


    // for Angular client exception logging to server

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
        function( $log, $window) {

            function log( exception, cause ) {

                $log.error.apply( $log, arguments );

                try {
                    var errorMessage = exception.toString();

                    $.ajax({
                        type: "POST",
                        url: "/api/logger",
                        contentType: "application/json",
                        data: angular.toJson({
                            errorMessage: errorMessage,
                            errorUrl: $window.location.href,
                            //stackTrace: result,
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