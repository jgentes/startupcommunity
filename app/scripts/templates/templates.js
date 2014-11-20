angular.module('theme.templates', []).run(['$templateCache', function ($templateCache) {
  'use strict';

  $templateCache.put('app/templates/nav_renderer.html',
    "<a ng-if=\"!item.heading\" ng-click=\"select(item)\" ng-href=\"{{item.url}}\">\n" +
    "\t<i ng-if=\"item.iconClasses\" class=\"{{item.iconClasses}}\"></i><span>{{item.label}}</span>\n" +
    "\t<span ng-bind-html=\"item.html\"></span>\n" +
    "</a>\n" +
    "<h5 ng-if=\"item.heading\" class=\"heading\">{{item.heading}}</h5>\n" +
    "<ul ng-if=\"item.children.length\" data-slide-out-nav=\"item.open\">\n" +
    "    <li ng-repeat=\"item in item.children\"\n" +
    "\t    ng-class=\"{ hasChild: (item.children!==undefined),\n" +
    "                      active: item.selected,\n" +
    "                        open: (item.children!==undefined) && item.open }\"\n" +
    "    \tng-include=\"'views/templates/nav_renderer.html'\"\n" +
    "    ></li>\n" +
    "</ul>\n"
  );


  $templateCache.put('app/templates/people_renderer.html',
    "<div class=\"widget\">\n" +
    "    <div style=\"overflow: hidden;\" class=\"widget-simple\" ng-class=\"['themed-background-dark','themed-background-dark-night', 'themed-background-dark-fire', 'themed-background-dark-autumn', 'themed-background-dark-fancy', 'themed-background-dark-flatie'][$index % 6]\">\n" +
    "        <div>\n" +
    "            <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img ng-src=\"{{::item.value.avatar || item.value.linkedin.pictureUrl || '/public/blank_avatar.png'}}\" alt=\"{{::item.value.name}}\" class=\"widget-image img-circle pull-left\"></a>\n" +
    "        </div>\n" +
    "        <h4 class=\"widget-content widget-content-light\">\n" +
    "            <div ng-class=\"['themed-color','themed-color-night', 'themed-color-fire', 'themed-color-autumn', 'themed-color-fancy', 'themed-color-flatie'][$index % 6]\">\n" +
    "                <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\" style=\"color: inherit; text-decoration: none;\"><strong>{{::item.value.name}}</strong></a>\n" +
    "                <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" class=\"btn btn-xs\" ng-class=\"['themed-color', 'themed-color-night', 'themed-color-fire', 'themed-color-autumn', 'themed-color-fancy', 'themed-color-flatie'][$index % 6]\" style=\"float:right\">\n" +
    "                    <i class=\"fa fa-chevron-down fa-fw\"></i>\n" +
    "                </a>\n" +
    "            </div>\n" +
    "            <small>{{::item.value.linkedin.headline}}</small>\n" +
    "        </h4>\n" +
    "        \n" +
    "    </div>\n" +
    "    <div class=\"widget-extra\" ng-show=\"showSummary\">\n" +
    "        <h4 class=\"sub-header\">Summary</h4>\n" +
    "        <p style=\"white-space:pre-wrap;\">{{::item.value.linkedin.summary}}</p>\n" +
    "    </div>\n" +
    "</div>"
  );
}])