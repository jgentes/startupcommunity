import 'babel-polyfill';

/** IE9, IE10 and IE11 requires all of the following polyfills. **/
import 'core-js/es6/symbol';
import 'core-js/es6/object';
import 'core-js/es6/function';
import 'core-js/es6/parse-int';
import 'core-js/es6/parse-float';
import 'core-js/es6/number';
import 'core-js/es6/math';
import 'core-js/es6/string';
import 'core-js/es6/date';
import 'core-js/es6/array';
import 'core-js/es6/regexp';
import 'core-js/es6/map';
import 'core-js/es6/weak-map';
import 'core-js/es6/set';

/** Evergreen browsers require these. **/
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';

import "angular";
import "jquery";

import "angular-ui-router";
import "angular-ui-utils/modules/highlight/highlight.js";
import "angular-ui-bootstrap";
import "angular-sanitize";
import "popper.js";
import "sweetalert";
import "angular-h-sweetalert";
import "angular-notify";
import "satellizer";
import "ui-select";
import "ng-file-upload";
import "bootstrap-tour";
import "angular-bootstrap-tour";
import "ladda";
import "angular-ladda";
import "summernote";
import "metismenu";
import 'bootstrap-loader';

import "./scripts/config.js";
import "./scripts/misc.js";
import "./scripts/directives.js";
import "./scripts/services.js";
import "./components/dashboard/dashboard.controller.js";
import "./components/users/user.controller.js";
import "./components/companies/company.controller.js";
import "./components/auth/auth.controller.js";
import "./components/welcome/welcome.controller.js";
import "./components/nav/nav.controller.js";
import "./components/newsletter/newsletter.controller.js";

import "font-awesome/css/font-awesome.css";
import "sweetalert/dist/sweetalert.css";
import "ui-select/dist/select.min.css";
import "awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css";
import "bootstrap-tour/build/css/bootstrap-tour.min.css";
import "ladda/dist/ladda-themeless.min.css";
import "summernote/dist/summernote.css";
import "./less/style.less";

import "./fonts/pe-icon-7-stroke/css/pe-icon-7-stroke.css";
import "./fonts/pe-icon-7-stroke/css/helper.css";
/*// for debugging ui-router
import { trace } from "@uirouter/angularjs";
trace.enable(1, 5);
*/
