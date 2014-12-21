angular.module('theme.templates', []).run(['$templateCache', function ($templateCache) {
  'use strict';

  $templateCache.put('app/templates/nav_renderer.html',
    "<a ng-if=\"!item.heading\" ng-click=\"select(item)\" ng-href=\"{{item.url}}\" id=\"{{item.id}}\">\n" +
    "\t<i ng-if=\"item.iconClasses\" class=\"{{item.iconClasses}}\"></i><span>{{item.label}}</span>\n" +
    "\t<span ng-bind-html=\"item.html\"></span>\n" +
    "</a>\n" +
    "<h5 ng-if=\"item.heading\" class=\"heading\" id=\"{{item.id}}\">{{item.heading}}</h5>\n" +
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
    "<td class=\"text-center\" style=\"width: 5%; vertical-align: top;\">\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:48px\" ng-src=\"{{::item.value.avatar || item.value.linkedin.pictureUrl || '/public/blank_avatar.png'}}\" alt=\"{{::item.value.name}}\" class=\"widget-image img-circle pull-left\"></a>                                \n" +
    "</td>   \n" +
    "<td style=\"width: 65%; vertical-align: top;  padding-top: 8px;\">\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>{{::item.value.name}} </strong></a>\n" +
    "    <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" style=\"color: #DDDDDD;\">\n" +
    "        <i class=\"fa fa-chevron-down fa-fw\"></i>\n" +
    "    </a>\n" +
    "    <br>\n" +
    "    <span class=\"text-muted\" ng-bind-html=\"::item.value.linkedin.headline | highlight:global.search.lastQuery\"></span>                                \n" +
    "    <div ng-show=\"(showSummary || global.search.count) && item.value.linkedin.summary\">\n" +
    "        <hr>\n" +
    "        <span class=\"text-muted\" style=\"white-space:pre-wrap;\" ng-bind-html=\"::item.value.linkedin.summary | linky | highlight:global.search.lastQuery\"></span>\n" +
    "    </div>\n" +
    "</td>\n" +
    "<td style=\"width: 30%; vertical-align: top; padding-top: 19px;\">\n" +
    "    <li ng-repeat=\"(cluster, val) in item.value.cities[global.city.path.key].clusters\" style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\n" +
    "       <span ng-hide=\"((val.roles.indexOf('Advisor') >= 0) && (val.roles.indexOf('Leader') < 0) && (val.roles.indexOf('Member') < 0)) && item.value.cities[global.city.path.key].cityAdvisor === true\" title=\"{{cluster}} Cluster\" class=\"btn btn-xs btn-alt btn-default\" ng-class=\"{ 'btn-info' : ((val.roles.indexOf('Advisor') >= 0) && (val.roles.indexOf('Leader') < 0) && (item.value.cities[global.city.path.key].cityAdvisor === false || item.value.cities[global.city.path.key].cityAdvisor === undefined)), 'btn-danger' : (val.roles.indexOf('Leader') >= 0) }\" style=\"cursor: default;\"><i class=\"fa {{global.city.value.clusters[cluster].icon}}\"></i></span>\n" +
    "    </li>\n" +
    "    <li ng-if=\"item.value.cities[global.city.path.key].cityAdvisor === true\" style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\n" +
    "       <span title=\"General Advisor\" class=\"btn btn-xs btn-alt btn-info\" style=\"cursor: default;\">General Advisor</span>\n" +
    "    </li>\n" +
    "</td>"
  );
}])