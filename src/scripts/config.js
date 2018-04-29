angular.module('startupcommunity', [
    'ui.router',
    'ui.bootstrap',
    'ui.highlight',
    'ui.select',
    'ngSanitize',
    'hSweetAlert',
    'satellizer',
    'services',
    'ngFileUpload',
    'bm.bsTour',
    'angular-ladda'
]);

function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start
    $compileProvider
        .debugInfoEnabled(process && process.env && process.env.NODE_ENV == 'local' || false); // set to false for production

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
            templateUrl: require('../components/auth/login.html')
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
            templateUrl: require("../components/errors/404.html")
        })

        .state('500', {
            templateUrl: require("../components/errors/500.html")
        })

        // the root state with core dependencies for injection in child states
        // note: if you set a param in root, and use/change that param in a ui-sref link, it will reload root
        .state('root', {
            url: "/:location_path/:community_path/:tail_path",
            templateUrl: require("../components/nav/nav.html"),
            controller: "NavigationController as nav",
            params: {
                // params must be defined here to be used in children (except for paths)
                location_path: {
                    squash: true
                },
                community_path: {
                    squash: true
                },
                tail_path: {
                    // tail path is used to force refresh of nav controller when loc_path and com_path remain constant during navigation (back button)
                    squash: true
                },
                tour: false,
                query: undefined
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
                noreload: false
            },
            views: {
                'header': {
                    templateUrl: require("../components/header/header_small.html")
                },
                'content': {
                    templateUrl: require("../components/users/user.dashboard.html"),
                    controller: 'UserProfileController as profile'
                }
            }
        })
        .state('user.list', {
            views: {
                'header': {
                    templateUrl: require("../components/header/header_small.html")
                },
                'content': {
                    templateUrl: require('../components/users/user.list.html'),
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
                noreload: false
            },
            views: {
                'header': {
                    templateUrl: require("../components/header/header_small.html")
                },
                'content': {
                    templateUrl: require("../components/companies/company.dashboard.html"),
                    controller: 'CompanyProfileController as profile'
                }
            }
        })
        .state('company.list', {
            views: {
                'header': {
                    templateUrl: require("../components/header/header_small.html")
                },
                'content': {
                    templateUrl: require('../components/companies/company.list.html'),
                    controller: "CompanyController as companies"
                }
            }
        })
        .state('company.add', {
            url: "^/:location_path/add-company",
            views: {
                'content': {
                    templateUrl: require('../components/resources/resource.add.html'),
                    controller: "EditCompanyController as add"
                }
            }
        })
        .state('company.edit', {
            url: "/edit",
            views: {
                'content': {
                    templateUrl: require('../components/resources/resource.add.html'),
                    controller: "EditCompanyController as add"
                }
            }
        })


        .state('resource', {
            parent: 'root',
            abstract: true
        })
        .state('resource.list', {
            views: {
                'header': {
                    templateUrl: require("../components/header/header_small.html")
                },
                'content': {
                    templateUrl: require('../components/companies/company.list.html'),
                    controller: "CompanyController as companies"
                }
            }
        })
        .state('resource.add', {
            url: "^/:location_path/add-resource",
            views: {
                'content': {
                    templateUrl: require('../components/resources/resource.add.html'),
                    controller: "EditCompanyController as add"
                }
            }
        })
        .state('resource.edit', {
            url: "/edit",
            views: {
                'content': {
                    templateUrl: require('../components/resources/resource.add.html'),
                    controller: "EditCompanyController as add"
                }
            }
        })

        .state('welcome', {
            parent: "root",
            url: "^/:location_path/:community_path/welcome",
            params: {
                community_path: {
                    value: null,
                    squash: true
                }
            },
            resolve: {
                $uibModalInstance: function() { return null; } // necessary to avoid unknown provider for $uibModalInstance when controller not invoked through modal
            },
            views: {
                "@": { // this forces override of root template
                    templateUrl: require("../components/welcome/welcome.html"),
                    controller: "WelcomeController as welcome"
                }
            }
        })

        .state('settings', { parent: 'root', url: '/settings', views: { 'content': { templateUrl: require("../components/settings.html"), controller: "SettingsController as settings" } } })

        .state('newsletter', { parent: 'root', url: '/newsletter', views: { 'content': { templateUrl: require("../components/newsletter/newsletter.html"), controller: 'NewsletterController as news' } } })

        .state('search', {
            parent: 'root',
            abstract: true,
            views: {
                'header': {
                    templateUrl: require("../components/header/header_small.html")
                },
                'content': {
                    templateUrl: require('../components/search/search.dashboard.html')
                }
            }
        })
        .state('search.dashboard', {
            url: "/search",
            params: {
                tail_path: '',
                query: '*'
            },
            views: {
                'people': {
                    templateUrl: require('../components/users/user.list.html'),
                    controller: "UserController as users"
                },
                'companies': {
                    templateUrl: require('../components/companies/company.list.html'),
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
                    templateUrl: require("../components/header/header_small.html")
                },
                'content': {
                    template: "<div ui-view='people'></div>"
                }
            }
        })
        .state('community.dashboard', {
            params: { tour: false },
            views: {
                'people': {
                    templateUrl: require('../components/dashboard/dashboard.html'),
                    controller: "DashboardController as dashboard"
                }
            }
        })
        .state('community.dashboard.location', {})
        .state('community.dashboard.cluster', {})
        .state('community.dashboard.company', {}); // for user profile page when companies are in communities

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
    .run(function($rootScope, $state, $timeout, $auth) {
        $rootScope.global = {}; // initialize my global scope object (required even though only $scope.global is used)

        $rootScope.$state = $state; // allows use if $state within views
        //window.$state = $state; // allows use of $state within console
        $rootScope.$on('$stateChangeError', function(evt, toState, toParams, fromState, fromParams, error) {
            //todo add exception logging here
            $auth.removeToken();
            console.log(evt, error);
            $state.go('login', { alert: 'Sorry, please login again. ' + error.statusText }, { reload: true });
        });
        $rootScope.$on('$viewContentLoaded', function() {
            // remove the splash screen
            $('#majorsplash').css('display', 'none');
        });
        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams) {
                $('#minorsplash').css('display', 'block');
                /* 
                 console.log('----------------------------');
                 console.log('from: ' + fromState.name);
                 console.log('to:' + toState.name);
                 
                 console.log(fromState);                
                 console.log(toState);
                 console.log(event);
                 */
            });
        $rootScope.$on('$stateChangeSuccess', function() {
            $("html, body").animate({ scrollTop: 0 }, 200);
        });
    })


    // for Angular client exception logging to server

    .provider(
        "$exceptionHandler", {
            $get: function(errorLogService) {
                return (errorLogService);
            }
        }
    )

    // this factory pushes the exceptions to the server
    .factory(
        "errorLogService",
        function($log, $window) {

            function log(exception, cause) {

                $log.error.apply($log, arguments);

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
                            cause: (cause || "")
                        })
                    });

                }
                catch (loggingError) {
                    $log.warn("Error logging failed");
                    $log.log(loggingError);
                }
            }
            // Return the logging function.
            return (log);
        }
    )
/*// this factory is used to capture sourcemaps
.factory('$exceptionHandler',
    function($log, $window, $injector, errorLogService) {
        var getSourceMappedStackTrace = function(exception) {
            var $q = $injector.get('$q'),
                $http = $injector.get('$http'),
                SMConsumer = $window.sourceMap.SourceMapConsumer,
                cache = {};
    
            // Retrieve a SourceMap object for a minified script URL
            var getMapForScript = function(url) {
                if (cache[url]) {
                    return cache[url];
                }
                else {
                    var promise = $http.get(url).then(function(response) {
                        var m = response.data.match(/\/\/# sourceMappingURL=(.+\.map)/);
                        if (m) {
                            var path = url.match(/^(.+)\/[^/]+$/);
                            path = path && path[1];
                            return $http.get(path + '/' + m[1]).then(function(response) {
                                return new SMConsumer(response.data);
                            });
                        }
                        else {
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
                        var prefix = match[1],
                            url = match[2],
                            line = match[3],
                            col = match[4];
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
                    }
                    else {
                        return $q.when(stackLine);
                    }
                })).then(function(lines) {
                    return lines.join('\n');
                });
            }
            else {
                return $q.when('');
            }
        };
    
        return function(exception, cause) {
            if ($window.Bugsnag) $window.Bugsnag.notifyException(exception);
            getSourceMappedStackTrace(exception).then(function(final) {
                errorLogService(final, $window);
            });
        };
    });
*/
