angular.module('theme.templates', []).run(['$templateCache', function ($templateCache) {
  'use strict';

  $templateCache.put('app/templates/nav_renderer.html',
    "<a ng-if=\"!item.heading\" ng-click=\"select(item)\" ng-href=\"{{item.url}}\" id=\"{{item.id}}\">\r" +
    "\n" +
    "\t<i ng-if=\"item.iconClasses\" class=\"{{item.iconClasses}}\"></i><span>{{item.label}}</span>\r" +
    "\n" +
    "\t<span ng-bind-html=\"item.html\"></span>\r" +
    "\n" +
    "</a>\r" +
    "\n" +
    "<h5 ng-if=\"item.heading\" class=\"heading\" id=\"{{item.id}}\">{{item.heading}}</h5>\r" +
    "\n" +
    "<ul ng-if=\"item.children.length\" data-slide-out-nav=\"item.open\">\r" +
    "\n" +
    "    <li ng-repeat=\"item in item.children\"\r" +
    "\n" +
    "\t    ng-class=\"{ hasChild: (item.children!==undefined),\r" +
    "\n" +
    "                      active: item.selected,\r" +
    "\n" +
    "                        open: (item.children!==undefined) && item.open }\"\r" +
    "\n" +
    "    \tng-include=\"'views/templates/nav_renderer.html'\"\r" +
    "\n" +
    "    ></li>\r" +
    "\n" +
    "</ul>\r" +
    "\n"
  );


  $templateCache.put('app/templates/people_renderer.html',
    "<td class=\"text-center\" style=\"width: 5%; vertical-align: top;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:48px\" ng-src=\"{{::item.value.avatar || item.value.linkedin.pictureUrl || '/public/blank_avatar.png'}}\" alt=\"{{::item.value.name}}\" class=\"widget-image img-circle pull-left\"></a>                                \r" +
    "\n" +
    "</td>   \r" +
    "\n" +
    "<td style=\"width: 65%; vertical-align: top;  padding-top: 8px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>{{::item.value.name}} </strong></a>\r" +
    "\n" +
    "    <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" style=\"color: #DDDDDD;\">\r" +
    "\n" +
    "        <i class=\"fa fa-chevron-down fa-fw\"></i>\r" +
    "\n" +
    "    </a>\r" +
    "\n" +
    "    <br>\r" +
    "\n" +
    "    <span class=\"text-muted\" ng-bind-html=\"::item.value.linkedin.headline | highlight:global.search.lastQuery\"></span>                                \r" +
    "\n" +
    "    <div ng-show=\"(showSummary || global.search.count) && item.value.linkedin.summary\" style=\"padding-bottom: 10px;\">\r" +
    "\n" +
    "        <hr>\r" +
    "\n" +
    "        <span class=\"text-muted\" style=\"white-space:pre-wrap;\" ng-bind-html=\"::item.value.linkedin.summary | linky:'_blank' | highlight:global.search.lastQuery | safe_html\"></span>\r" +
    "\n" +
    "    </div>\r" +
    "\n" +
    "</td>\r" +
    "\n" +
    "<td style=\"width: 30%; vertical-align: top; padding-top: 19px;\">\r" +
    "\n" +
    "    <li ng-repeat=\"(cluster, val) in item.value.cities[global.city.path.key].clusters\" style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "       <span ng-hide=\"((val.roles.indexOf('Advisor') >= 0) && (val.roles.indexOf('Leader') < 0) && (val.roles.indexOf('Member') < 0)) && item.value.cities[global.city.path.key].cityAdvisor === true\" title=\"{{cluster}} Cluster\" class=\"btn btn-xs btn-alt btn-default\" ng-class=\"{ 'btn-info' : ((val.roles.indexOf('Advisor') >= 0) && (val.roles.indexOf('Leader') < 0) && (item.value.cities[global.city.path.key].cityAdvisor === false || item.value.cities[global.city.path.key].cityAdvisor === undefined)), 'btn-danger' : (val.roles.indexOf('Leader') >= 0) }\" style=\"cursor: default;\"><i class=\"fa {{global.city.value.clusters[cluster].icon}}\"></i></span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li ng-if=\"item.value.cities[global.city.path.key].cityAdvisor === true\" style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "       <span title=\"General Advisor\" class=\"btn btn-xs btn-alt btn-info\" style=\"cursor: default;\">General Advisor</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <div id=\"skills\" ng-show=\"(showSummary || global.search.count) && item.value.linkedin.summary\" style=\"padding-top:40px\">\r" +
    "\n" +
    "        <li ng-repeat=\"skill in item.value.linkedin.skills.values\" class=\"label btn-default\" style=\"margin-right: 3px; margin-top: 3px; float:right; padding-bottom: 5px;\">\r" +
    "\n" +
    "            <a><span ng-click=\"search(skill.skill.name)\" ng-bind-html=\"::skill.skill.name | highlight:global.search.lastQuery\"></span></a>\r" +
    "\n" +
    "        </li>\t\t\t\r" +
    "\n" +
    "    </div>\r" +
    "\n" +
    "</td>"
  );
}])