angular.module('knowtify', ['ng'])
    .factory('knowtify', ['$rootScope', '$window', '$location', '$log',
        function($rootScope, $window, $location, $log) {
            var service = {};
            // need to figure out what knowtify's version of analytics once installed
            var _knowtify = _knowtify || [];
            var _knowtifyInbox = _knowtifyInbox || [];
            _knowtify.public_token = "FROM_YOUR_KNOWTIFY_ACCOUNT";

            // Define a factory that generates wrapper methods to push arrays of
            // arguments onto our `analytics` queue, where the first element of the arrays
            // is always the name of the analytics.js method itself (eg. `track`).
            var methodFactory = function(type) {
                return function() {
                    var args = Array.prototype.slice.call(arguments, 0);
                    $log.debug('Call Knowtify API with', type, args);
                    if (_knowtify.initialized) {
                        $log.debug('Knowtify API initialized, calling API');

                        //TODO COMPLETE FROM HERE ON

                        $window.analytics[type].apply($window.analytics, args);
                    } else {
                        $log.debug('Segmentio API not yet initialized, queueing call');
                        $window.analytics.push([type].concat(args));
                    }
                };
            };

            // Loop through analytics.js' methods and generate a wrapper method for each.
            var methods = ['identify', 'track', 'trackLink', 'trackForm', 'trackClick',
                'trackSubmit', 'page', 'pageview', 'ab', 'alias', 'ready', 'group'
            ];
            for (var i = 0; i < methods.length; i++) {
                service[methods[i]] = methodFactory(methods[i]);
            }

            // Listening to $viewContentLoaded event to track pageview
            $rootScope.$on('$viewContentLoaded', function() {
                if (service.location != $location.path()) {
                    service.location = $location.path();
                    service.pageview(service.location);
                }
            });

            /**
             * @description
             * Load Segment.io analytics script
             * @param apiKey The key API to use
             */
            service.load = function(apiKey) {
                // Create an async script element for analytics.js.
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.async = true;
                script.src = 'http://js.knowtify.io/knowtify.js';

                // Find the first script element on the page and insert our script next to it.
                var firstScript = document.getElementsByTagName('script')[0];
                firstScript.parentNode.insertBefore(script, firstScript);
            };

            return service;
        }
    ]);
