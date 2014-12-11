'use strict'

angular
  .module('navigation-controller', [])
  .controller('NavigationController', ['$scope', '$location', '$timeout', '$global', 'userService', function ($scope, $location, $timeout, $global, userService) {
    
    var buildNav = function() {        
        var menu = [
            {
                label: $scope.global.city.value.citystate.split(',')[0],
                iconClasses: 'fa fa-globe',
                url: '/'
            },
            {
                heading: 'COMMUNITY',
                navClass: 'beta1 noback'
            },
            {
                label: 'People',
                iconClasses: 'fa fa-leaf',
                url: '/people',
                children: [
                    {
                        label: 'Add People',
                        url: '/people/add'
                    }
                ]
            },
            {
                label: 'Startups',
                iconClasses: 'fa fa-rocket'            
            },
            {
                heading: 'CLUSTERS',
                navClass: 'beta2 noback'
            }
        ];
        
        for (var cluster in $scope.global.city.value.clusters) {            
            menu.push(
            {
                label: cluster,
                cluster: true,
                iconClasses: 'fa ' + $scope.global.city.value.clusters[cluster].icon,
                url: '/cluster'
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
                parentRef.selected = true;
                $scope.selectedItems.push(parentRef);
                parentRef = parentRef.parent;
            }
            
            if (item.cluster) {
              userService.getUsers($scope.global.city.path.key, item.label, undefined, undefined)
              .then(function(response) {          
                $scope.global.search = response.data;
                $location.path(item.url);
              });
            }
            
            if (item.role) {
              userService.getUsers($scope.global.city.path.key, undefined, item.label.slice(0, - 1), undefined)
              .then(function(response) {          
                $scope.global.search = response.data;
                $location.path(item.url);
              });
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
    
    if (!$scope.global.city) {    
      $scope.$on('sessionReady', function(event, status) {               
        if (status) {
          buildNav();    
        }
      });
    } else buildNav();
    

  }]);











