function configState($stateProvider, $urlRouterProvider, $compileProvider, $locationProvider) {

    // Optimize load start with remove binding information inside the DOM element
    $compileProvider.debugInfoEnabled(true);

    // Set default unmatched url state

    $urlRouterProvider.otherwise("/dashboard");
    $stateProvider

        // Dashboard - Main page
        .state('dashboard', {
            url: "/dashboard",
            templateUrl: "views/dashboard.html",
            data: {
                pageTitle: 'Dashboard',
            }
        })

    $locationProvider
        .html5Mode(true);

};

angular
    .module('startupcommunity')
    .config(configState)
    .config(function($authProvider) {

      $authProvider.linkedin({
          clientId: "75bqixdv58z1az"
      });

    })

    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
    });

angular
  .module('analytics.mixpanel')
  .config(['$mixpanelProvider', function($mixpanelProvider) {
      $mixpanelProvider.apiKey("0f110baeb6150d7e3b8968e32d7a5595");
  }]);
