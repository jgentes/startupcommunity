/*
 * angular-knowtify - a simple Angular wrapper for the Knowtify API
 *
 * @author James Gentes
 * @date   Sep 14th, 2015
 * https://github.com/jgentes/angular-knowtify
 */

'use strict';

/**
 * Requires Knowtify script to be in your app HTML file:
 *
 * <script type="text/javascript">
 * var _knowtify = _knowtify || [];
 * var _knowtifyInbox = _knowtifyInbox || [];
 * _knowtify.public_token = "YOUR_PUBLIC_TOKEN_HERE";
 *
 * (function(d,s,t,u){var j = d.createElement(s);var p = d.getElementsByTagName(s)[0];
 *        j.type = t;j.async = true;j.src = u;p.parentNode.insertBefore(j, p);})(document,'script','text/javascript', 'https://s3.amazonaws.com/js.knowtify.io/knowtify.js');
 * </script>
 */
angular.module('knowtify', [])
    .provider('knowtify', function () {

        /**
         * Wait till the async portion of the Knowtify lib has loaded otherwise we'll end up passing back a reference
         * to a bare JS array which won't actually track anything when called.
         *
         * @param callback to be called once the API has finished loading
         */
        function waitTillAsyncApiLoaded(callback) {
            if (!Object.prototype.hasOwnProperty.call(window, '_knowtify')) {
                setTimeout(function () {
                    waitTillAsyncApiLoaded(callback);
                }, 500);
            } else callback();
        }

        /**
         * Perform a dynamic call to the specified knowtify function against the window._knowtify object.
         *
         * @param params the _knowtify call content, such as:
         *  (['event', 'testing', {
         *  id: 123,
         *  email: "yourname@gmail.com"
         *  }])
         * @returns {Function} a function that will lookup and dispatch a call to the window._knowtify object
         */
        function callKnowtifyPush() {
            return function(params) {
                waitTillAsyncApiLoaded(function() {
                    window._knowtify.push(params);
                });
            }
        }

        this.$get = function () {
            // Here we dynamically call the knowtify functions against the
            // window._knowtify object as we can't be sure when the window reference will be updated.
            return {
                push: callKnowtifyPush()
            };
        };
    });