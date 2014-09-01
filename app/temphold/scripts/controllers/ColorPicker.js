'use strict'

angular
  .module('theme.colorpicker-controller', [])
  .controller('ColorPickerController', ['$scope', '$global', function ($scope, $global) {
    $scope.headerStylesheet = 'default.css';
    $scope.sidebarStylesheet = 'default.css';
    $scope.headerBarHidden = $global.get('headerBarHidden');
    $scope.layoutFixed = $global.get('layoutBoxed');
    $scope.headerFixed = $global.get('fixedHeader');

    $scope.setHeaderStyle = function (filename, $event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.headerStylesheet = filename;
    };

    $scope.setSidebarStyle = function (filename, $event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.sidebarStylesheet = filename;
    };

    $scope.$watch('headerFixed', function (newVal) {
      if (newVal === undefined) return;
      $global.set('fixedHeader', newVal);
    });
    $scope.$watch('layoutFixed', function (newVal) {
      $global.set('layoutBoxed', newVal);
    });

    $scope.$on('globalStyles:changed:layoutBoxed', function (event, newVal) {
      $scope.layoutFixed = newVal;
    });
  }])
