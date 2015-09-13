/*
 * angular-knowtify
 *
 * Copyright (c) 2015 James Gentes
 * Licensed under the MIT license.
 * https://github.com/jgentes/angular-knowtify
 */

'use strict';

/**
 * Wraps the Knowtify JavaScript global to make it injectable and aid in testing.
 * Requires an injectable Knowtify API Key to be present. This can be done
 * by configuring the module like so:
 *
 *    angular.module('knowtify')
 *        .config(['$knowtifyProvider', function($knowtifyProvider) {
 *            $knowtifyProvider.setApiKey('your API key');
 *        }]);
 */
angular.module('knowtfiy', [])
    .provider('$knowtify', function () {
        var apiKey, superProperties;

        /**
         * Init the Knowtify global
         */
        function init() {
            //TODO verify this by removing library call
            if (!Object.prototype.hasOwnProperty.call(window, 'knowtify')) {
                throw 'Global `knowtify` not available. Did you forget to include the library on your app page?';
            };

            konwtify.init(apiKey);
            /* Not sure what superproperties are all about
            waitTillAsyncApiLoaded(function () {
                if (superProperties) knowtify.register(superProperties);
            });
            */
        }

        /**
         * Wait till the async portion of the Knowtify lib has loaded otherwise we'll end up passing back a reference
         * to a bare JS array which won't actually track anything when called.
         *
         * @param callback to be called once the API has finished loading
         */
        function waitTillAsyncApiLoaded(callback) {
            if (!Object.prototype.hasOwnProperty.call(window, 'knowtify') || (window.knowtify['__loaded'] === undefined)) {
                setTimeout(function () {
                    waitTillAsyncApiLoaded(callback);
                }, 500);
            }

            callback();
        }

        /**
         * Perform a dynamic call to the specified knowtify function against the window.knowtify object.
         *
         * @param name the knowtify function name. Can be dot separated to specify sub-property functions
         * @returns {Function} a function that will lookup and dispatch a call to the window.knowtify object
         */
        function callKnowtifyFn(name) {
            return function () {
                var fn = window.knowtify,
                    parts = name.split('.'),
                    scope, i;

                for (i = 0; i < parts.length; i++) {
                    scope = fn;
                    fn = fn[parts[i]];
                }

                return fn.apply(scope, arguments);
            }
        }

        /**
         * Get or set the Knowtify API key. This can be done via a provider config.
         *
         * @param key your Knowtify API key
         */
        this.apiKey = function (key) {
            if (!key) return apiKey;
            // "697926551ec864a9c587bafbfa318beb";
            apiKey = key;
        };

        /**
         * Get or set a special set of properties to include/send with every event.
         *
         * @param properties a map properties
         *
         * @see https://mixpanel.com/help/reference/javascript#super-properties
         
        this.superProperties = function (properties) {
            if (!properties) return superProperties;

            superProperties = properties;
        };
*/
        this.$get = function () {
            init();
            
            // Here we dynamically call the knowtify functions against the
            // window.knowtify object as we can't be sure when the window reference will be updated.
            return {
                init: callKnowtifyFn('init'),
                push: callKnowtifyFn('push'),
                disable: callKnowtifyFn('disable'),
                track: callKnowtifyFn('track'),
                track_links: callKnowtifyFn('track_links'),
                track_forms: callKnowtifyFn('track_forms'),
                register: callKnowtifyFn('register'),
                register_once: callKnowtifyFn('register_once'),
                unregister: callKnowtifyFn('unregister'),
                identify: callKnowtifyFn('identify'),
                get_distinct_id: callKnowtifyFn('get_distinct_id'),
                alias: callKnowtifyFn('alias'),
                set_config: callKnowtifyFn('set_config'),
                get_config: callKnowtifyFn('get_config'),
                get_property: callKnowtifyFn('get_property'),
                people: {
                    set: callKnowtifyFn('people.set'),
                    set_once: callKnowtifyFn('people.set_once'),
                    increment: callKnowtifyFn('people.increment'),
                    append: callKnowtifyFn('people.append'),
                    track_charge: callKnowtifyFn('people.track_charge'),
                    clear_charges: callKnowtifyFn('people.clear_charges'),
                    delete_user: callKnowtifyFn('people.delete_user')
                }
            };
        };
    });