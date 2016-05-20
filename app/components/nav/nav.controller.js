angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController)
    .controller('SettingsController', SettingsController)
    .controller('EmbedSettingsController', EmbedSettingsController);

function NavigationController($scope, $auth, $state, $window, $location, $stateParams, $uibModal, $mixpanel, user_service, community_service, sweet, knowtify, errorLogService, newsletter_service) {

    var self = this;
    
    $scope.global.path = $location.path().replace(/\/$/, ""); //used for routing and used in view
    $scope.global.query = undefined;
    this.state = $state; // used in view because path doesn't always update properly.. esp. for /people

    var nav_community,
        lastitems = ["people", "companies", "resources", "search", "invite", "add", "welcome", "settings"];

    var getProfile = function() {
        
        if (!$scope.global.user) {
            user_service.getProfile()
                .then(function(response) {

                    if (response.message) {
                        $location.url('/logout');
                    }

                    if (response.key) {
                        $mixpanel.people.set({
                            "$name": response.profile.name,
                            "$email": response.profile.email
                        });
                    }

                    $scope.global.user = response.data;
                    
                    if ($scope.global.user.token) $auth.setToken($scope.global.user.token); // update local storage with latest user profile
                    
                    getCommunity();

                })
                .catch(function(response) {
                    //todo add exception logging here
                    $location.url('/logout');
                });
        } else getCommunity();
        
    };
    

    var getCommunity = function () {

        var pullCommunity = function (comm_path) {

            community_service.getCommunity(comm_path)
                .then(function (response) {
                    $scope.global.community = response.data;
                    getLocation();
                })
        };

        var next = function() {

            var url = $location.path().replace(/\/$/, "").split('/'),
                lastitem = url.pop(),
                root = url.pop();

            if (lastitems.indexOf(lastitem) > -1) {
                if (lastitem == "invite" || lastitem == "add") {
                    pullCommunity(url.pop());
                    // return preceding url path as community, such as tech for 'bend-or/tech/people'
                } else pullCommunity(root);
            } else {
                pullCommunity($stateParams.community_path || $stateParams.location_path);
            }
        };

        // fix urls with spaces
        if ($stateParams.community_path) $stateParams.community_path = $stateParams.community_path.replace(/\s+/g, '-');
        if ($stateParams.location_path) $stateParams.location_path = $stateParams.location_path.replace(/\s+/g, '-');

        // check if community is already in $scope.global

        if ($stateParams.community_path && lastitems.indexOf($stateParams.community_path) < 0) {
            if ($scope.global.community && $scope.global.community.key == $stateParams.community_path)
                getLocation();
            else if ($scope.global.location && $scope.global.location.key == $stateParams.community_path) {
                $scope.global.community = $scope.global.location;
                getLocation();
            } else next();
        } else if ($stateParams.location_path) {
            if ($scope.global.community && $scope.global.community.key == $stateParams.location_path)
                getLocation();
            else if ($scope.global.location && $scope.global.location.key == $stateParams.location_path) {
                $scope.global.community = $scope.global.location;
                getLocation();
            } else next();
        }

    };

    var getLocation = function() {

        nav_community = $scope.global.community;

        // if community is a user or company, pull their home and use that for location [used when refreshing page on user profile]
        if (nav_community && (nav_community.type == 'user' || nav_community.type == 'company')) {

            if ($scope.global && $scope.global.location && $scope.global.location.key == nav_community.profile.home) {
                getNavTop();
            } else
                community_service.getCommunity(nav_community.profile.home)
                    .then(function(response) {
                        $scope.global.location = response.data;
                        getNavTop();
                    })

        } else if ($scope.global && $scope.global.location && $scope.global.location.key == $stateParams.location_path) {
            // check if location is already in $scope.global
            getNavTop();
        } else
            if ($stateParams.location_path !== nav_community.key) {

                community_service.getCommunity($stateParams.location_path)
                    .then(function(response) {
                        $scope.global.location = response.data;
                        getNavTop();
                    });
            } else {
                $scope.global.location = nav_community;
                getNavTop();
            }

    };

    var getNavTop = function() {

        // check if we already have correct navigation
        if ($scope.global && $scope.global.nav_top && $scope.global.nav_top.key == $stateParams.location_path)
            getCommunityTop();

        else {
            // if it's a user, pull home
            var true_loc = nav_community && nav_community.type == 'user' ?
                nav_community.profile.home :
                $scope.global.location.key;

            community_service.getTop(true_loc)
                .then(function(response) {
                    $scope.global.nav_top = response.data;
                    getCommunityTop();
                })
        }

    };

    var getCommunityTop = function() {
        if (nav_community && nav_community.key && $scope.global.location && $scope.global.location.key && (nav_community.key !== $scope.global.location.key && ((nav_community.type == 'location') || (nav_community.resource) || (nav_community.type == 'cluster')))) {

            community_service.getTop($scope.global.location.key, nav_community.key, nav_community)
                .then(function(response) {
                    $scope.global.top = response.data;
                    loadNav();
                })
        } else {
            $scope.global.top = $scope.global.nav_top;
            loadNav();
        }
    };

    /* -------------- DEPENDENCIES HAVE BEEN RESOLVED --------------------- */

    var loadNav = function() {

        console.log('StateParams: ', $stateParams);

        console.log('Nav RootScope Location: ', $scope.global.location ? $scope.global.location.key : null);
        console.log('Nav RootScope Community: ', $scope.global.community ? $scope.global.community.key : null);

        var rollbar_payload = {
                "payload": {
                    "environment": $location.host() !== 'startupcommunity.org' ? "development" : "production"
                }
            };

        var go_rollbar = function() {
            if ($window.Rollbar)
                $window.Rollbar.configure(rollbar_payload);
            if (rollbar_payload.payload.jayco)
                jaco(); // this removes the watcher for the session id;
        };

        // ANONYMOUS OR LOGGED IN ?

        if ($auth.isAuthenticated() && $scope.global.user) {

            var user = $scope.global.user; // reference 'this' by using 'nav' from 'NavigationController as nav' - * nav is also usable in child views *

            // LOAD 3RD PARTY SERVICES

            knowtify.push(['load_inbox', 'knowtify', {email: user.profile.email}]);

            if ($window.JacoRecorder)
                $window.JacoRecorder.identify(user.profile.email);

            rollbar_payload.payload['person'] = {
                "id": user.key,
                "name": user.profile.name,
                "email": user.profile.email
            };

        } else go_rollbar();

        if ($window.JacoRecorder) {

            var jaco = $scope.$watch(function () {
                if ($window.JacoRecorder.state && $window.JacoRecorder.state.session && $window.JacoRecorder.state.session.id) {
                    rollbar_payload.payload['custom'] = {
                        "jaco_url": "https://bo.getjaco.com/backoffice/sessions/%24%7" + $window.JacoRecorder.state.session.id + "%7D"
                    };
                    go_rollbar();
                }
            });
        }

        // *** ROUTING OF ROOT PATHS ***

        switch ($location.path().replace(/\/$/, "").split('/').pop()) {

            case 'people':
                $state.go('user.list', {}, { location: false });
                break;

            case 'companies':
                $state.go('company.list', {}, { location: false });
                break;

            case 'resources':
                $state.go('resource.list', {}, { location: false });
                break;

            case 'search':
                $state.go('search.dashboard', {}, { location: false });
                break;

            case 'settings':
                $state.go('settings', {}, { location: false });
                break;

            default:

                switch (nav_community.type) {

                    case 'user':
                        $state.go('user.dashboard');
                        break;

                    case 'company':
                        $state.go('company.dashboard');
                        break;

                    default:
                        $state.go('community.dashboard');
                }
        }

        self.loaders = {}; // for various loading indicators in navigation

        if (!$scope.global.community) $scope.global.community = $scope.global.community[$stateParams.location_path];
        if (!$scope.global.community) {
            // if still no community, there's a problem, reload the app
            $window.location.reload();
        }
        // the industry_icons save me a db call on every controller reload :) because top doesn't include item values.. maybe combine this with 'parents' service?
        $scope.global.industry_icons = { "construction": {"icon": "fa-wrench"}, "legal": {"icon": "fa-gavel"}, "tech": {"icon": "fa-code"}, "medical": {"icon": "fa-stethoscope"}, "healthcare": {"icon": "fa-ambulance"}, "recreation": {"icon": "fa-sun-o"}, "art": {"icon": "fa-picture-o"}, "transportation": {"icon": "fa-road"}, "consumer-goods": {"icon": "fa-barcode"}, "non-profit": {"icon": "fa-heart-o"}, "corporate": {"icon": "fa-building-o"}, "government": {"icon": "fa-university"}, "finance": {"icon": "fa-pie-chart"}, "education": {"icon": "fa-graduation-cap"}, "manufacturing": {"icon": "fa-cube"}, "agriculture": {"icon": "fa-pagelines"}, "services": {"icon": "fa-bell-o"}};

        var parents = community_service.parents();
        parents = parents.join('|').toLowerCase().split('|'); // change all to lowercase

        var location_key = $scope.global.location.key;

        // For tour
        if ($stateParams.tour) {
            angular.element(document).ready(function () {
                setTimeout(function() {
                    jQuery('#tourstart').trigger('click');
                }, 3000);
            });
        }

        self.end = function() {
            $state.go('user.dashboard', {profile: $scope.global.user, location_path: $scope.global.user.key, tour: false});
        };

        // to set correct root path when navigating

        if ($scope.global.location.key == $scope.global.community.key || lastitems.indexOf($stateParams.community_path) < 0) {
            self.nav_url = "({location_path: global.location.key, community_path: '', tail_path: '', query: undefined})";
            self.notify = "{notify: false}";
        } else {
            self.nav_url = "({location_path: global.location.key, community_path: global.community.key, tail_path: '', query: undefined})";
            self.notify = "{notify: true}";
        }

        self.nav_jump = ($scope.global.location && $scope.global.location.type == 'location') || (($scope.global.community.type == "user" || $scope.global.community.type == "company") &&
        ($scope.global.location && $scope.global.location.type == 'location')) ?
            "({community_path: item.key, location_path: global.location.key })" :
            "({community_path: item.key, location_path: global.user.profile.home })";

        // SEARCH

        self.search = function(query) {
            
            if ($scope.global.community.type == "cluster" || $scope.global.community.resource) {
                $stateParams.location_path == $scope.global.community.key ?
                        $state.go('search.dashboard', {location_path: $stateParams.location_path, query: query, tail_path: ''}, {notify: false}) :
                        $state.go('search.dashboard', {location_path: $stateParams.location_path, community_path: $scope.global.community.key, query: query, tail_path: ''}, {reload: true});
            } else if ($scope.global.community.type == "user" || $scope.global.community.type == "company") {
                $state.go('search.dashboard', {location_path: $scope.global.community.profile.home, query: query, tail_path: ''}, {notify: false});
            } else if (lastitems.indexOf($stateParams.community_path) > -1) {
                $state.go('search.dashboard', {location_path: $stateParams.location_path, community_path: '', query: query, tail_path: ''}, {location: false})
            } else $state.go('search.dashboard', {query: query, tail_path: ''}, {notify: false});

        };

        // CONTACT USER

        self.contact = function(user) {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/users/user.contact.html',
                controller: ContactUserController,
                controllerAs: 'contact',
                windowClass: "hmodal-warning",
                resolve: {
                    user: function() {
                        user.value["key"] = user.path.key;
                        return user.value;
                    },
                    community_key: function() {
                        return $scope.global.community.key;
                    },
                    location_key: function() {
                        return $stateParams.location_path;
                    }
                }
            });
        };

        // COMMUNITY SETTINGS

        self.embedSettings = function(community_record) {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/nav/nav.embed_settings.html',
                controller: EmbedSettingsController,
                controllerAs: 'settings',
                windowClass: "hmodal-success",
                resolve: {
                    embed_community: function() {

                        //force pull of community settings every time to avoid stale data
                        return community_service.getKey(community_record.key)
                            .then(function(response) {
                                return response.data;
                            })
                    }
                }
            });
        };

        // ADD OR MODIFY CLUSTER, RESOURCE, OR LOCATION

        self.editCommunity = function(community) {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/nav/nav.edit_' + community.type + '.html',
                controller: CommunityController,
                controllerAs: 'edit',
                windowClass: "hmodal-success",
                resolve: {
                    location: function() {
                        return $scope.global.location;
                    },
                    community: function() {
                        return community;
                    },
                    user: function() {
                        return $scope.global.user;
                    }
                }
            });
        };

        self.removeUser = function(ruser) {
            sweet.show({
                title: "Are you sure?",
                text: "Removing this user from " + community.profile.name + " does not remove them from the entire community. You can easily add them to the resource again in the future.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, remove " + ruser.value.profile.name,
                closeOnConfirm: false
            }, function () {
                user_service.removeCommunity(ruser.path.key, community)
                    .then(function(response) {
                        if (response.status !== 201) {
                            sweet.show({
                                title: "Sorry, something went wrong.",
                                text: "Here's what we know: " + response.data.message,
                                type: "error"
                            });

                        } else {
                            sweet.show("Success!", ruser.value.profile.name + " has been removed.", "success");
                        }
                    })
            });
        };

        self.setupNewsletter = function() {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/newsletter/setup_newsletter.html',
                controller: SetupNewsController,
                controllerAs: 'news',
                windowClass: "hmodal-warning",
                resolve: {
                    user: function() {
                        return $scope.global.user;
                    },
                    location: function() {
                        return $scope.global.location;
                    },
                    communities: function() {
                        return $scope.global.community;
                    }
                }
            });

            modalInstance.closed.then(function () {
                user_service.getProfile()
                    .then(function(response) {
                        $scope.global.user = response.data;
                    })
            });

        };

        self.syncNewsletter = function() {
            self.syncworking = true;
            newsletter_service.syncMembers($scope.global.user.newsletter.lists, $scope.global.user.newsletter.brand_id, location.key)
                .then(function(response) {
                    self.syncworking = false;
                    if (response.status !== 201) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: "Here's what we know: " + response.data.message,
                            type: "error"
                        });

                    } else {
                        sweet.show("Success!", "Your lists have been synchronized.", "success");
                    }
                });
        };

        // REQUEST INVITATION

        self.requestInvitation = function() {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/users/user.request_invite.html',
                controller: InviteUserController,
                controllerAs: 'invite',
                windowClass: "hmodal-info",
                resolve: {
                    user: function() {
                        return null;
                    },
                    community: function() {
                        return $scope.global.location;
                    },
                    communities: function() {
                        return $scope.global.community;
                    },
                    location: function() {
                        if ($scope.global.location.resource || $scope.global.location.type == 'cluster') {
                            return $scope.global.community[$scope.global.location.profile.home];
                        } else return $scope.global.location;
                    }
                }
            });
        };

        // INVITE PEOPLE
    
    this.invitePeople = function() {
        
        var modalInstance = $uibModal.open({
            templateUrl: 'components/users/user.invite.html',
            controller: InviteUserController,
            controllerAs: 'invite',
            windowClass: "hmodal-info",
            resolve: {
                user: function() {
                    return $scope.global.user;
                },
                community: function() {
                    return self.community;
                },
                communities: function() {
                    return self.communities;
                },
                location: function() {
                    return self.location;
                }
            }
        });
    };

        // CHECK FOR IFRAME (redirect, if needed, must happen after routing)
        
        $scope.global.embedded = false;

        try {
            $scope.global.embedded = window.self !== window.top;
        } catch (e) {
            $scope.global.embedded = true;
        }

        if ($scope.global.embedded) {
            var expired = true,
                domain;

            angular.element(document).ready(function () {
                setTimeout(function() {
                    $("body").toggleClass("hide-sidebar");
                }, 1000);
            });

            //find & remove protocol (http, ftp, etc.) and get domain
            if (document.referrer.indexOf("://") > -1) {
                domain = document.referrer.split('/')[2];
            }
            else {
                domain = document.referrer.split('/')[0];
            }

            //find & remove port number
            domain = domain.split(':')[0];

            // use localStorage to persist 'allowed to embed' across communities if the initial referral domain is verified
            try {
                if ($window.localStorage && $window.localStorage.getItem('startupcommunity-embed')) {
                    var storage = JSON.parse($window.localStorage.getItem('startupcommunity-embed'))[domain];
                }
            } catch (e) {
                //errorLogService('Localstorage problem: ', e);
            }

            if (storage) {
                self.color = storage.color;
                if (storage.full) $scope.global.embedded = false;
            }

            try {
                if ($scope.global.location.type === 'cluster' && $scope.global.location.community_profiles[$stateParams.location_path] && $scope.global.location.community_profiles[$stateParams.location_path].embed) {
                    try {
                        embed = $scope.global.location.community_profiles[$stateParams.location_path].embed;
                    }
                    catch (e) {
                        errorLogService('embed problem: ', e);
                    }

                } else embed = $scope.global.location.profile.embed;
            }
            catch (e) {
                errorLogService('embed problem: ', e);
            }

            if (embed) {
                for (u in embed) {
                    if (embed[u].url == domain) {
                        try {
                            if ($window.localStorage) {
                                var domain_embed = {};
                                domain_embed[domain] = {
                                    "color" : embed[u].color || '#fff',
                                    "full" : embed[u].full || false
                                };

                                $window.localStorage.setItem('startupcommunity-embed',JSON.stringify(domain_embed));

                            }
                        } catch (e) {
                            //errorLogService('Localstorage problem: ', e);
                        }
                        if (embed[u].full) $scope.global.embedded = false;
                        break;
                    }
                }
            }
        }

        //$scope.global.embedded = true; // for testing

    };

    getProfile();

}

function SettingsController($scope, community_service) {
    var self = this, 
        leader = [];
    this.clusters = {};
    
    if ($scope.global.user.roles && $scope.global.user.roles.leader) {
        
        for (l in $scope.global.user.roles.leader) leader.push(l);

        community_service.getResources(undefined, leader)
            .then(function(response) {
                self.resources = response.data;
            })
    } else self.resources = {};
    
    if ($scope.global.location && $scope.global.location.clusters) {
        
        for (c in $scope.global.location.clusters) {
            self.clusters[c] = $scope.global.location.clusters[c];
        }
    }
    
}

function EmbedSettingsController($scope, $uibModalInstance, sweet, embed_community, community_service){
    
    var self = this,
        thiscommunity = embed_community;

    // load existing embed settings
    if (thiscommunity.community_profiles && thiscommunity.community_profiles[$scope.global.location.key] && thiscommunity.community_profiles[$scope.global.location.key].embed) {
        self.embed = thiscommunity.community_profiles[$scope.global.location.key].embed;
    } else if (thiscommunity.profile && thiscommunity.profile.embed) self.embed = thiscommunity.profile.embed; // for locations

    this.addEmbed = function() {
        if (self.form.$valid) {
            if (!self.embed) {
                self.embed = [];
            }

            self.embed.push({
                "url" : self.formdata.embed_url_value,
                "color" : self.formdata.embed_color_value || '#fff',
                "full" : self.formdata.embed_full_value || false,
                "creator" : $scope.global.user.key
            });

        } else {
            self.form.submitted = true;
        }
    };

    this.removeEmbed = function(index) {
        self.embed.splice(index, 1);
    };

    this.save = function () {

        community_service.setSettings(self.embed, $scope.global.location.key, thiscommunity.key)
            .then(function(response) {

                if (response.status !== 201) {
                    sweet.show({
                        title: "Sorry, something went wrong.",
                        text: response.data.message,
                        type: "error"
                    });

                } else {
                    sweet.show({
                        title: "Settings saved!",
                        type: "success"
                    }, function(){
                        $uibModalInstance.close();
                    });
                }
            });
    };

    this.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}

function CommunityController($scope, $uibModalInstance, $mixpanel, sweet, community_service, $http, $window, $state){
    
    $scope.global.communityForm = {"name":""}; // to avoid 'undefined' for initial url
    var self = this;
    this.update = false;

    this.industryList = community_service.industries();

    this.encode = function(uri) {
        return encodeURI(uri.toLowerCase().replace(/\s+/g, '-'));
    };

    if ($scope.global.community.type == 'cluster') {
        self.parents = community_service.parents();
    } else if ($scope.global.community.resource) {
        community_service.getResources($scope.global.location.key)
            .then(function(recs) {
                self.resources = recs.data;
            });
    }

    if ($scope.global.community.key) {

        loc_key = user.roles.leader[$scope.global.community.key][0]; // this will need to be selected by the user if they are a leader of one resource in multiple locations

        //force pull of community settings every time to avoid stale data

        community_service.getKey($scope.global.community.key)
            .then(function(response) {
                var community = response.data;

                if (community && community.community_profiles && community.community_profiles[loc_key]) {
                    self.update = true;
                    $scope.global.community = community.community_profiles[loc_key];
                    $scope.global.communityForm = {
                        "name": $scope.global.community.name,
                        "headline": $scope.global.community.headline,
                        "industries": $scope.global.community.industries,
                        "url": decodeURI(community.key)
                    };

                    if ($scope.global.community.parents) {
                        switch ($scope.global.community.parents[0]) {
                            case 'consumer-goods':
                                $scope.global.communityForm['parent'] = 'Consumer Goods';
                                break;
                            case 'non-profit':
                                $scope.global.communityForm['parent'] = 'Non-Profit';
                                break;
                            default:
                                if (community.resource) {
                                    // allow multiply types only for resources
                                    var _parents = $scope.global.community.parents || [];
                                    $scope.global.communityForm['parent'] = _parents.filter(function(item) {
                                        return item !== null;
                                    });
                                }
                                else {
                                    $scope.global.communityForm['parent'] = $scope.global.community.parents[0][0].toUpperCase() + $scope.global.community.parents[0].slice(1);
                                }
                        }
                    }
                }

            });
    }

    this.editCommunity = function() {
        self.working = true;
        var rename = false,
            thiscommunity = $scope.global.community;

        if (self.form.$valid) {

            if ($scope.global.communityForm.url) {
                try {
                    var encodedUrl = $scope.global.communityForm.url.toLowerCase().replace(/\s+/g, '-');
                }
                catch (e) {
                    sweet.show({
                        title: "Sorry, something is wrong with the url path.",
                        type: "error"
                    });
                    self.submitted = true;
                }
            }
            
            if ($scope.global.communityForm.parent) {
                var parents = angular.isArray($scope.global.communityForm.parent) ? $scope.global.communityForm.parent : [$scope.global.communityForm.parent.toLowerCase()];
            } else parents = [];

            var newCommunity = {
                type: thiscommunity.type,
                profile: {
                    name: $scope.global.communityForm.name,
                    headline: $scope.global.communityForm.headline,
                    parents: parents
                },
                resource: $scope.global.communityForm.resource ? $scope.global.communityForm.resource.key : "",
                url: encodedUrl || $scope.global.communityForm.name.toLowerCase().replace(/\s+/g, '-')
            };

            if (thiscommunity.type == 'cluster') {
                newCommunity.profile['industries'] = $scope.global.communityForm.industries;
            }

            if (thiscommunity.community_profiles && thiscommunity.community_profiles[loc_key] && thiscommunity.community_profiles[loc_key].embed) {
                newCommunity.profile['embed'] = $scope.global.community.community_profiles[loc_key].embed;
            }

            if (thiscommunity.key && (thiscommunity.key !== newCommunity.url)) rename = true; // determine if this is a rename operation

            community_service.editCommunity(newCommunity, loc_key)
                .then(function(response) {
                    self.working = false;

                    if (response.status !== 201) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: response.data.message,
                            type: "error"
                        });

                    } else {
                        if (rename) community_service.deleteCommunity(community, loc_key, newCommunity.url);

                        // refresh outdated cache
                        $http.get('/api/2.1/community/' + user.key);
                        $http.get('/api/2.1/community/' + loc_key);

                        sweet.show({
                            title: thiscommunity.type[0].toUpperCase() + thiscommunity.type.slice(1) + (self.update ? " updated!" : " created!"),
                            type: "success",
                            closeOnConfirm: true
                        });

                        $http.get('/api/2.1/community/' + loc_key + '/' + newCommunity.url + '/top').then(function() {
                            $window.location.href = '/'+ loc_key + '/' + newCommunity.url;
                        });
                    }
                    $mixpanel.track('Added ' + thiscommunity.type[0].toUpperCase() + thiscommunity.type.slice(1));
                });

        } else {
            self.submitted = true;
            self.working = false;
        }
    };

    this.deleteCommunity = function () {
        self.working = true;

        if ($scope.global.community.type == 'cluster') {
            var text = "You can recreate this cluster at any time.";
        } else if ($scope.global.community.resource) {
            text = "Members will be removed from the resource, but they will remain in the community."
        } else text = "";

        sweet.show({
            title: "Are you sure?",
            text: text,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete " + $scope.global.community.name + "!",
            closeOnConfirm: false
        }, function () {

            community_service.deleteCommunity(community, loc_key)
                .then(function(response) {
                    self.working = false;

                    if (response.status !== 204) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: response.data.message,
                            type: "error"
                        });

                    } else {
                        sweet.show({
                            title: "Deleted!",
                            text: "The " + $scope.global.community.name + " community is gone.",
                            type: "success",
                            closeOnConfirm: true
                        });
                        
                        $state.reload();
                    }
                });
        });
    };

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}