 'use strict'

angular
  .module('navigation-controller', [])
  .controller('NavigationController', ['$scope', '$location', '$timeout', '$global', 'userService', function ($scope, $location, $timeout, $global, userService) {
    
    var buildNav = function() {
        var menu = [
            {
                label: 'Bend',
                iconClasses: 'fa fa-globe',
                url: '/people',
                id: 'globe'
            },
            {
                heading: 'COMMUNITY',
                navClass: 'noback'
            },
            {
                label: 'People',
                iconClasses: 'fa fa-flag',
                url: '/people',
                children: [
                    {
                        label: 'Invite People',
                        url: '/people/invite'
                    }
                ]
            },
            {
                heading: 'CLUSTERS',
                navClass: 'noback',
                id: 'clusters'
            }
        ];

        for (var item in $scope.global.community.industries) {
            var industry = $scope.global.findKey($scope.global.community.industries[item].communities, $scope.global.context.location, []);

            menu.push(
              {
                  label: industry[0].profile.name,
                  cluster: false,
                  iconClasses: 'fa ' + industry[0].profile.icon
              });
        }

        var setParent = function (children, parent) {
          angular.forEach(children, function (child) {
              child.parent = parent;
              if (child.children !== undefined) {
                  setParent (child.children, child);
              }
          });
        };
        
        $scope.menu = menu;
        setParent ($scope.menu, null);
        $scope.openItems = [];
        $scope.selectedItems = [];
        $scope.selectedFromNavMenu = false;
        
        $scope.findItemByUrl = function (children, url) {
          for (var i = 0, length = children.length; i<length; i++) {
            if (children[i].url && children[i].url.replace('#', '') == url) return children[i];
            if (children[i].children !== undefined) {
              var item = $scope.findItemByUrl (children[i].children, url);
              if (item) return item;
            }
          }
        };
        
        $scope.select = function (item) {
          
            if (item.ngclick) {
              eval(item.ngclick);
            }
            // close open nodes
            if (item.open) {
                item.open = false;
                return;
            }
            for (var i = $scope.openItems.length - 1; i >= 0; i--) {
                $scope.openItems[i].open = false;
            }
            $scope.openItems = [];
            var parentRef = item;
            while (parentRef !== null) {
                parentRef.open = true;
                $scope.openItems.push(parentRef);
                parentRef = parentRef.parent;
            }
    
            // handle leaf nodes // !! removed if no children statement here
            
            $scope.selectedFromNavMenu = true;
            for (var j = $scope.selectedItems.length - 1; j >= 0; j--) {
                $scope.selectedItems[j].selected = false;
            }

            $scope.selectedItems = [];
            parentRef = item;

            while (parentRef !== null) {
                item.selected = true;
                $scope.selectedItems.push(parentRef);
                parentRef = parentRef.parent;
            }            

        };
        
        $scope.$watch(function () {
          return $location.path();
        }, function (newVal, oldVal) {
          if ($scope.selectedFromNavMenu === false) {
            var item = $scope.findItemByUrl ($scope.menu, newVal);
            if (item)
              $timeout (function () { $scope.select (item); });
          }
          $scope.selectedFromNavMenu = false;
        });
        
    };    
    
    if (!$scope.global.community.industries) {
      $scope.$on('sessionReady', function(event, status) {               
        if (status) {
          buildNav();
        }
      });
    } else buildNav();
    

  }]);











