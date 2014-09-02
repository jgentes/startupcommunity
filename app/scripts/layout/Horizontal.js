'use strict'

angular
  .module('theme.layout-horizontal', [])
  .controller('HorizontalPageController', ['$scope', '$global', function ($scope, $global) {
    $global.set('layoutHorizontal', true);

    $scope.$on('$destroy', function () {
      $global.set('layoutHorizontal', false);
    });
  }])
  .controller('HorizontalPage2Controller', ['$scope', '$global', function ($scope, $global) {
    $global.set('layoutHorizontal', true);
    $global.set('layoutHorizontalLargeIcons', true);

    $scope.$on('$destroy', function () {
      $global.set('layoutHorizontal', false);
      $global.set('layoutHorizontalLargeIcons', false);
    });
  }])
