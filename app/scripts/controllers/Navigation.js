'use strict'

angular
  .module('theme.navigation-controller', [])
  .controller('NavigationController', ['$scope', '$location', '$timeout', '$global', function ($scope, $location, $timeout, $global) {
    $scope.menu = [
        {
            label: 'Bend',
            iconClasses: 'fa fa-globe',
            url: '#/alpha/social'
        },
        {
            heading: 'COMMUNITY'
        },
        {
            label: 'Leaders',
            iconClasses: 'fa fa-flag-o'            
        },
        {
            label: 'Mentors',
            iconClasses: 'fa fa-graduation-cap',
            html: '<span class="badge badge-info">100</span>',
            url: '#/alpha/social',
            children: [
                {
                    label:"Add a Mentor",
                    url:"#/notsure"
                }
            ]
        },
        {
            label: 'Startups',
            iconClasses: 'fa fa-rocket'            
        },
        {
            heading: 'CLUSTERS'            
        },
        {
            label: 'Tech',
            iconClasses: 'fa fa-code'
        },
        {
            label: 'Bio-Science',
            iconClasses: 'fa fa-flask'
        },
        {
            label: 'Outdoor',
            iconClasses: 'fa fa-tree'
        },
        {
            label: 'Makers',
            iconClasses: 'fa fa-wrench'
        }
    ];
    
    var setParent = function (children, parent) {
        angular.forEach(children, function (child) {
            child.parent = parent;
            if (child.children !== undefined) {
                setParent (child.children, child);
            }
        });
    };

    $scope.findItemByUrl = function (children, url) {
      for (var i = 0, length = children.length; i<length; i++) {
        if (children[i].url && children[i].url.replace('#', '') == url) return children[i];
        if (children[i].children !== undefined) {
          var item = $scope.findItemByUrl (children[i].children, url);
          if (item) return item;
        }
      }
    };
    
    setParent ($scope.menu, null);
    
    $scope.openItems = [];
    $scope.selectedItems = [];
    $scope.selectedFromNavMenu = false;
    
    $scope.select = function (item) {
        // close open nodes
        if (item.open) {
            item.open = false;
            return;
        }
        for (var i = $scope.openItems.length - 1; i >= 0; i--) {
            $scope.openItems[i].open = false;
        };
        $scope.openItems = [];
        var parentRef = item;
        while (parentRef !== null) {
            parentRef.open = true;
            $scope.openItems.push(parentRef);
            parentRef = parentRef.parent;
        }

        // handle leaf nodes
        if (!item.children || (item.children && item.children.length<1)) {
            $scope.selectedFromNavMenu = true;
            for (var j = $scope.selectedItems.length - 1; j >= 0; j--) {
                $scope.selectedItems[j].selected = false;
            };
            $scope.selectedItems = [];
            var parentRef = item;
            while (parentRef !== null) {
                parentRef.selected = true;
                $scope.selectedItems.push(parentRef);
                parentRef = parentRef.parent;
            }
        };
    };

    $scope.$watch(function () {
      return $location.path();
    }, function (newVal, oldVal) {
      if ($scope.selectedFromNavMenu == false) {
        var item = $scope.findItemByUrl ($scope.menu, newVal);
        if (item)
          $timeout (function () { $scope.select (item); });
      }
      $scope.selectedFromNavMenu = false;
    });

    // searchbar

    $scope.goToSearch = function () {
        $location.path('/extras-search')
    };
  }])











