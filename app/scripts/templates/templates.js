angular.module('theme.templates', []).run(['$templateCache', function ($templateCache) {
  'use strict';

  $templateCache.put('app/templates/invest_renderer.html',
    "<tr>\r" +
    "\n" +
    "  <td class=\"text-center\" style=\"width: 68px; vertical-align: top; height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" src=\"https://d1qb2nb5cznatu.cloudfront.net/startups/i/120454-e8aacd8ef4a5b9a83636ef3bc17e1579-thumb_jpg.jpg\" alt=\"{{::item.value.name}}\" class=\"widget-image img-rounded pull-left\"></a>\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "  <td style=\"vertical-align: center;  height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>Flatiron Health </strong></a>\r" +
    "\n" +
    "    <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" style=\"color: #DDDDDD;\">\r" +
    "\n" +
    "      <i class=\"fa fa-chevron-down fa-fw\"></i>\r" +
    "\n" +
    "    </a>\r" +
    "\n" +
    "    <br>\r" +
    "\n" +
    "    <span class=\"text-muted\">Cloud-based IT insights for Healthcare.</span>\r" +
    "\n" +
    "\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "  <td style=\"vertical-align: top; padding-top: 25px; height: 80px;\">\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "    <span class=\"btn btn-xs btn-alt btn-default\"><i class=\"fa fa-flask\"></i>\r" +
    "\n" +
    "      </span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-success\">$30k</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-default\">1 Person</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "</tr>\r" +
    "\n" +
    "\r" +
    "\n" +
    "<tr>\r" +
    "\n" +
    "  <td class=\"text-center\" style=\"width: 68px; vertical-align: top; height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" src=\"https://d1qb2nb5cznatu.cloudfront.net/startups/i/85108-ccf40d86e68a7694547882e43fd2dfce-thumb_jpg.jpg\" alt=\"{{::item.value.name}}\" class=\"widget-image img-rounded pull-left\"></a>\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "  <td style=\"vertical-align: center;  height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>Lore </strong></a>\r" +
    "\n" +
    "    <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" style=\"color: #DDDDDD;\">\r" +
    "\n" +
    "      <i class=\"fa fa-chevron-down fa-fw\"></i>\r" +
    "\n" +
    "    </a>\r" +
    "\n" +
    "    <br>\r" +
    "\n" +
    "    <span class=\"text-muted\">Reinventing education for the internet age.</span>\r" +
    "\n" +
    "\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "  <td style=\"vertical-align: top; padding-top: 25px; height: 80px;\">\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "    <span class=\"btn btn-xs btn-alt btn-default\"><i class=\"fa fa-code\"></i>\r" +
    "\n" +
    "      </span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-success\">$30k</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-default\">2 People</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "</tr>\r" +
    "\n" +
    "\r" +
    "\n" +
    "<tr>\r" +
    "\n" +
    "  <td class=\"text-center\" style=\"width: 68px; vertical-align: top; height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" src=\"https://d1qb2nb5cznatu.cloudfront.net/startups/i/32615-1224220b2f0fde5ddb57a9091e3bbd8f-thumb_jpg.jpg\" alt=\"{{::item.value.name}}\" class=\"widget-image img-rounded pull-left\"></a>\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "  <td style=\"vertical-align: center;  height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>Dogster </strong></a>\r" +
    "\n" +
    "    <a title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" style=\"color: #DDDDDD;\">\r" +
    "\n" +
    "      <i class=\"fa fa-chevron-down fa-fw\"></i>\r" +
    "\n" +
    "    </a>\r" +
    "\n" +
    "    <br>\r" +
    "\n" +
    "    <span class=\"text-muted\">Acquired by Say Media in 2011</span>\r" +
    "\n" +
    "\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "  <td style=\"vertical-align: top; padding-top: 25px; height: 80px;\">\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-default\"><i class=\"fa fa-wrench\"></i>\r" +
    "\n" +
    "      </span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-success\">$50k</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-default\">4 People</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "</tr>\r" +
    "\n" +
    "\r" +
    "\n" +
    "\r" +
    "\n" +
    "\r" +
    "\n" +
    "\r" +
    "\n"
  );


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


  $templateCache.put('app/templates/network_people_renderer.html',
    "<td class=\"text-center\" style=\"width: 58px; vertical-align: top; height: 80px;\">\r" +
    "\n" +
    "  <div ng-show=\"item.value.linkedin.pictureUrl\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" ng-src=\"{{item.value.linkedin.pictureUrl || item.value.avatar}}\" alt=\"{{::item.value.name}}\" class=\"widget-image img-circle pull-left\"/></a>\r" +
    "\n" +
    "  </div>\r" +
    "\n" +
    "  <div ng-show=\"!item.value.linkedin.pictureUrl\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" ng-src=\"{{'/public/blank_avatar.png'}}\" alt=\"{{::item.value.name}}\" class=\"widget-image img-circle pull-left\"/></a>\r" +
    "\n" +
    "  </div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "</td>   \r" +
    "\n" +
    "<td style=\"vertical-align: middle; height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>{{::item.value.name}} </strong></a>\r" +
    "\n" +
    "    <br>\r" +
    "\n" +
    "    <span class=\"text-muted\" ng-bind-html=\"::item.value.linkedin.headline | highlight:global.search.lastQuery\"></span>\r" +
    "\n" +
    "</td>\r" +
    "\n" +
    "<td style=\"vertical-align: middle; height: 80px;\">\r" +
    "\n" +
    "    <li ng-repeat=\"(cluster, val) in item.value.cities[global.city.path.key].clusters\" style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "       <span ng-hide=\"((val.roles.indexOf('Advisor') >= 0) && (val.roles.indexOf('Founder') < 0) && (val.roles.indexOf('Investor') < 0)) && item.value.cities[global.city.path.key].cityAdvisor === true\" title=\"{{cluster}} Cluster\" class=\"btn btn-xs btn-alt btn-default\" ng-class=\"{ 'btn-info' : ((val.roles.indexOf('Advisor') >= 0) && (val.roles.indexOf('Founder') < 0) && (item.value.cities[global.city.path.key].cityAdvisor === false || item.value.cities[global.city.path.key].cityAdvisor === undefined)), 'btn-danger' : (val.roles.indexOf('Founder') >= 0) }\" style=\"cursor: default;\"><i class=\"fa {{global.city.value.clusters[cluster].icon}}\"></i></span>\r" +
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


  $templateCache.put('app/templates/people_renderer.html',
    "<td class=\"text-center\" style=\"width: 58px; vertical-align: top; height: 80px;\">\r" +
    "\n" +
    "  <div ng-show=\"item.value.linkedin.pictureUrl\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" ng-src=\"{{item.value.linkedin.pictureUrl || item.value.avatar}}\" alt=\"{{::item.value.name}}\" class=\"widget-image img-circle pull-left\"/></a>\r" +
    "\n" +
    "  </div>\r" +
    "\n" +
    "  <div ng-show=\"!item.value.linkedin.pictureUrl\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" ng-src=\"{{'/public/blank_avatar.png'}}\" alt=\"{{::item.value.name}}\" class=\"widget-image img-circle pull-left\"/></a>\r" +
    "\n" +
    "  </div>\r" +
    "\n" +
    "\r" +
    "\n" +
    "</td>   \r" +
    "\n" +
    "<td style=\"vertical-align: middle; height: 80px;\">\r" +
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
    "<td style=\"vertical-align: middle; height: 80px;\">\r" +
    "\n" +
    "    <li ng-repeat=\"(cluster, val) in item.value.cities[global.city.path.key].clusters\" style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "       <span ng-hide=\"((val.roles.indexOf('Advisor') >= 0) && (val.roles.indexOf('Founder') < 0) && (val.roles.indexOf('Investor') < 0)) && item.value.cities[global.city.path.key].cityAdvisor === true\" title=\"{{cluster}} Cluster\" class=\"btn btn-xs btn-alt btn-default\" ng-class=\"{ 'btn-info' : ((val.roles.indexOf('Advisor') >= 0) && (val.roles.indexOf('Founder') < 0) && (item.value.cities[global.city.path.key].cityAdvisor === false || item.value.cities[global.city.path.key].cityAdvisor === undefined)), 'btn-danger' : (val.roles.indexOf('Founder') >= 0) }\" style=\"cursor: default;\"><i class=\"fa {{global.city.value.clusters[cluster].icon}}\"></i></span>\r" +
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


  $templateCache.put('app/templates/startup_renderer.html',
    "<tr>\r" +
    "\n" +
    "  <td class=\"text-center\" style=\"width: 68px; vertical-align: top; height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" src=\"https://d1qb2nb5cznatu.cloudfront.net/startups/i/954-13fdc4ab72232e61a8f2360ff3593c81-thumb_jpg.jpg\" alt=\"{{::item.value.name}}\" class=\"widget-image img-rounded pull-left\"></a>\r" +
    "\n" +
    "</td>   \r" +
    "\n" +
    "<td style=\"vertical-align: center;  height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>Wanderfly </strong></a>\r" +
    "\n" +
    "    <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" style=\"color: #DDDDDD;\">\r" +
    "\n" +
    "        <i class=\"fa fa-chevron-down fa-fw\"></i>\r" +
    "\n" +
    "    </a>\r" +
    "\n" +
    "    <br>\r" +
    "\n" +
    "    <span class=\"text-muted\">Visual travel discovery</span>\r" +
    "\n" +
    "\r" +
    "\n" +
    "</td>\r" +
    "\n" +
    "<td style=\"vertical-align: top; padding-top: 25px; height: 80px;\">\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-default\"><i class=\"fa fa-code\"></i>\r" +
    "\n" +
    "      </span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "  <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "    <span class=\"btn btn-xs btn-alt btn-success\">$500k</span>\r" +
    "\n" +
    "  </li>\r" +
    "\n" +
    "  <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "    <span class=\"btn btn-xs btn-alt btn-default\">7 People</span>\r" +
    "\n" +
    "  </li>\r" +
    "\n" +
    "</td>\r" +
    "\n" +
    "</tr>\r" +
    "\n" +
    "\r" +
    "\n" +
    "<tr>\r" +
    "\n" +
    "  <td class=\"text-center\" style=\"width: 68px; vertical-align: top; height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" src=\"https://d1qb2nb5cznatu.cloudfront.net/startups/i/120454-e8aacd8ef4a5b9a83636ef3bc17e1579-thumb_jpg.jpg\" alt=\"{{::item.value.name}}\" class=\"widget-image img-rounded pull-left\"></a>\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "  <td style=\"vertical-align: center;  height: 80px;\">\r" +
    "\n" +
    "    <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>Flatiron Health </strong></a>\r" +
    "\n" +
    "    <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" style=\"color: #DDDDDD;\">\r" +
    "\n" +
    "      <i class=\"fa fa-chevron-down fa-fw\"></i>\r" +
    "\n" +
    "    </a>\r" +
    "\n" +
    "    <br>\r" +
    "\n" +
    "    <span class=\"text-muted\">Cloud-based IT insights for Healthcare.</span>\r" +
    "\n" +
    "\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "  <td style=\"vertical-align: top; padding-top: 25px; height: 80px;\">\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "    <span class=\"btn btn-xs btn-alt btn-default\"><i class=\"fa fa-flask\"></i>\r" +
    "\n" +
    "      </span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-success\">$30k</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "    <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "      <span class=\"btn btn-xs btn-alt btn-default\">1 Person</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "  </td>\r" +
    "\n" +
    "</tr>\r" +
    "\n" +
    "\r" +
    "\n" +
    "<tr>\r" +
    "\n" +
    "<td class=\"text-center\" style=\"width: 68px; vertical-align: top; height: 80px;\">\r" +
    "\n" +
    "  <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img style=\"height:58px\" src=\"https://d1qb2nb5cznatu.cloudfront.net/startups/i/24260-292a2c5b11a309d2d890caea1246d31d-thumb_jpg.jpg\" alt=\"{{::item.value.name}}\" class=\"widget-image img-rounded pull-left\"></a>\r" +
    "\n" +
    "</td>\r" +
    "\n" +
    "<td style=\"vertical-align: center;  height: 80px;\">\r" +
    "\n" +
    "  <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><strong>Lovely </strong></a>\r" +
    "\n" +
    "  <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" style=\"color: #DDDDDD;\">\r" +
    "\n" +
    "    <i class=\"fa fa-chevron-down fa-fw\"></i>\r" +
    "\n" +
    "  </a>\r" +
    "\n" +
    "  <br>\r" +
    "\n" +
    "  <span class=\"text-muted\">Building a marketplace for rentals</span>\r" +
    "\n" +
    "\r" +
    "\n" +
    "</td>\r" +
    "\n" +
    "<td style=\"vertical-align: top; padding-top: 25px; height: 80px;\">\r" +
    "\n" +
    "  <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "    <span class=\"btn btn-xs btn-alt btn-default\"><i class=\"fa fa-code\"></i>\r" +
    "\n" +
    "      </span>\r" +
    "\n" +
    "  </li>\r" +
    "\n" +
    "  <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "    <span class=\"btn btn-xs btn-alt btn-success\">$200k</span>\r" +
    "\n" +
    "  </li>\r" +
    "\n" +
    "  <li style=\"list-style: none; display: inline; float: right; padding-left: 5px;\">\r" +
    "\n" +
    "    <span class=\"btn btn-xs btn-alt btn-default\">3 People</span>\r" +
    "\n" +
    "    </li>\r" +
    "\n" +
    "\r" +
    "\n" +
    "</td>\r" +
    "\n" +
    "</tr>\r" +
    "\n"
  );
}])