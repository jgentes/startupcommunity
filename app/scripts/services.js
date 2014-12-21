angular
  .module('appServices', [])
  
  .factory('userService', function($http) {
    return {        
      search: function(city, query) {
        return $http.get('/api/1.0/' + city + '/users' + (query ? '?search=' + query : ''));
      },
      getUsers: function(city, cluster, role, limit, alturl) {
        return $http.get(alturl || '/api/1.0/' + city + '/users' + (cluster ? '?cluster=' + cluster : '') + (cluster && role ? '&' : '?') + (role ? 'role=' + role : '') + (limit ? (cluster || role) ? '&limit=' + limit : '?limit=' + limit : ''));
      },
      putUser: function(userid, profile, callback) {
        $http.put('/api/1.0/user/' + userid + '?profile=' + profile)
        .success( function(response) {
          callback(response);
        })
        .error( function(response) {
          callback(response);
        });
      },
      getProfile: function(userid) {        
        return $http.get(userid ? '/api/1.0/profile/' + userid : '/api/1.0/profile'); // return me if no userid is provided
      },
      putProfile: function(profileData) { // addcallback!
        return $http.put('/api/1.0/profile', profileData);
      },
      removeProfile: function(userid, callback) {
        $http.post('/api/1.0/profile/remove/' + userid)
        .success( function(response) {
          callback(response);
        })
        .error( function(response) {
          callback(response);
        });
      },
      addPerson: function(url, email, userid, callback) {        
        $http.get('/api/1.0/addPerson?user={"url":"' + url + '","email":"' + email + '","userid":"' + userid + '"}')
        .success( function(response) {
          callback(response);
        })
        .error( function(response) {
          callback(response);
        });
      },
      getKey: function() {
        return $http.get('/api/1.0/profile/getkey');
      },      
      setCityAdvisor: function(userkey, citykey, role, status, callback) {
        $http.put('/api/1.0/profile/role?userkey=' + userkey + '&citykey=' + citykey + '&role=' + role + '&status=' + status)
        .success( function(data, status) {
          callback(data, status);
        })
        .error( function(data, status) {
          callback(data, status);
        });
      },
      setRole: function(userkey, citykey, cluster, role, status, callback) {
        $http.put('/api/1.0/profile/role?userkey=' + userkey + '&citykey=' + citykey + '&cluster=' + cluster + '&role=' + role + '&status=' + status)
        .success( function(data, status) {
          callback(data, status);
        })
        .error( function(data, status) {
          callback(data, status);
        });
      },
      feedback: function(data) {
        $http.post('/api/1.0/feedback?data=' + encodeURIComponent(JSON.stringify(data)));
      },      
      createTicket: function(email, subject, message) {
        $http.post('');
      }
    };
  })
  
  .factory('cityService', function($http) {
    return {
      getCity: function(city) {
        return $http.get('/api/1.0/city/' + city);
      }
    };
  })
  
  .factory('resultService', function() {
    // This service will eventually handle a variety of functions for multiple views, such as search, cluster view, people view, startup view, etc
    return {
      setPage: function($scope) {
        if ($scope !== undefined) {
          if ($scope.next) {
              $scope.start = Number($scope.next.match(/offset=([^&]+)/)[1]) - Number($scope.count) + 1;
              $scope.end = Number($scope.next.match(/offset=([^&]+)/)[1]);
            } else if ($scope.prev) {
              $scope.start = Number($scope.total_count) - Number($scope.count);
              $scope.end = $scope.total_count;
            } else if ($scope.count === 0 || $scope === undefined) {
              $scope.start = 0;
              $scope.end = 0;
            } else {          
              $scope.start = 1; $scope.end = $scope.total_count;
            }
        }
        return $scope;
      }
    };
  })
  
  .service('geocoder',function() {
    this.geocode = function(georequest, outerCallback) {
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode( georequest, function(results, status) {        
        if (status == google.maps.GeocoderStatus.OK) {          
          var f = '';                  
          var addresses = [];
          angular.forEach(results, function(item){  
            if (item.types[0] == 'locality') {          
              for (f=1;f<item.address_components.length;f++) {              
                if (item.address_components[f].types[0] == "administrative_area_level_1") {
                addresses.push(item.address_components[0].short_name + ', ' + item.address_components[f].short_name);                                
                break;
                }
              }
            }            
          });
          outerCallback(addresses);         
        } else {
          outerCallback({success:false, err: new Error('Geocode was not successful for the following reason: ' + status), results: null});
        }
      });
    };
  })
  
  .service('$global', ['$rootScope', 'EnquireService', '$document', function ($rootScope, EnquireService, $document) {
    this.settings = {
      fixedHeader: true,
      headerBarHidden: true,
      leftbarCollapsed: false,
      leftbarShown: false,
      rightbarCollapsed: false,
      fullscreen: false,
      layoutHorizontal: false,
      layoutHorizontalLargeIcons: false,
      layoutBoxed: false
    };

    var brandColors = {
        'default':      '#ecf0f1',

        'inverse':      '#95a5a6',
        'primary':      '#3498db',
        'success':      '#2ecc71',
        'warning':      '#f1c40f',
        'danger':       '#e74c3c',
        'info':         '#1abcaf',
        
        'brown':        '#c0392b',
        'indigo':       '#9b59b6',
        'orange':       '#e67e22',
        'midnightblue': '#34495e',
        'sky':          '#82c4e6',
        'magenta':      '#e73c68',
        'purple':       '#e044ab',
        'green':        '#16a085',
        'grape':        '#7a869c',
        'toyo':         '#556b8d',
        'alizarin':     '#e74c3c'
    };

    this.getBrandColor = function (name) {
        if (brandColors[name]) {
            return brandColors[name];
        } else {
            return brandColors['default'];
        }
    };

    $document.ready( function() {
      EnquireService.register("screen and (max-width: 767px)", {
        match: function () {
          $rootScope.$broadcast('globalStyles:maxWidth767', true);
        },
        unmatch: function () {
          $rootScope.$broadcast('globalStyles:maxWidth767', false);
        }
      });
    });

    this.get = function (key) { return this.settings[key]; };
    this.set = function (key, value) {
      this.settings[key] = value;
      $rootScope.$broadcast('globalStyles:changed', {key: key, value: this.settings[key]});
      $rootScope.$broadcast('globalStyles:changed:'+key, this.settings[key]);
    };
    this.values = function () { return this.settings; };
  }])
  .factory('pinesNotifications', function () {
    return {
      notify: function (args) {
        var notification = new PNotify(args);
        notification.notify = notification.update;
        return notification;
      },
    };
  })
  .factory('progressLoader', function () {
    return {
      start: function () {
        $(document).skylo('start');
      },
      set: function (position) {
        $(document).skylo('set', position);
      },
      end: function () {
        $(document).skylo('end');
      },
      get: function () {
        return $(document).skylo('get');
      },
      inch: function (amount) {
        $(document).skylo('show',function(){
            $(document).skylo('inch', amount);
        });
      }
    };
  })
  .factory('EnquireService', ['$window', function ($window) {
    return $window.enquire;
  }])
  .factory('$bootbox', ['$modal', function ($modal) {
    // NOTE: this is a workaround to make BootboxJS somewhat compatible with
    // Angular UI Bootstrap in the absence of regular bootstrap.js
    if ($.fn.modal == undefined) {
      $.fn.modal = function (directive) {
        var that = this;
        if (directive == 'hide') {
          if (this.data('bs.modal')) {
            this.data('bs.modal').close();
            $(that).remove();
          }
          return;
        } else if (directive == 'show') {
          return;
        }

        var modalInstance = $modal.open({
          template: $(this).find('.modal-content').html()
        });
        this.data('bs.modal', modalInstance);
        setTimeout (function () {
          $('.modal.ng-isolate-scope').remove();
          $(that).css({
            opacity: 1,
            display: 'block'
          }).addClass('in');
        }, 100);
      };
    }

    return bootbox;
  }])
  .service('lazyLoad', ['$q', '$timeout', function ($q, $t) {
    var deferred = $q.defer();
    var promise = deferred.promise;
    this.load = function (files) {
      angular.forEach(files, function (file) {
        if (file.indexOf('.js')>-1) { // script
          (function(d, script) {
            var fDeferred = $q.defer();
            script = d.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.onload = function() {
              $t( function () {
                fDeferred.resolve();
              });
            };
            script.onerror = function() {
              $t( function () {
                fDeferred.reject();
              });
            };

            promise = promise.then( function () {
              script.src = file;
              d.getElementsByTagName('head')[0].appendChild(script);
              return fDeferred.promise;
            });
          }(document));
        }
      });

      deferred.resolve();

      return promise;
    };
  }])
  .filter('safe_html', ['$sce', function($sce) {
    return function(val) {
      return $sce.trustAsHtml(val);
    };
}]);
