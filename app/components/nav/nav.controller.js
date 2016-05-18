angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController)
    .controller('SettingsController', SettingsController)
    .controller('EmbedSettingsController', EmbedSettingsController);

function NavigationController($rootScope, $scope, $auth, $state, $window, $location, $stateParams, $uibModal, user_service, community_service, user, sweet, knowtify, errorLogService, newsletter_service) {

    var self = this;

    if (user && user.token) $auth.setToken(user.token); // update local storage with latest user profile
    $rootScope.global.path = $location.path().replace(/\/$/, ""); //used for routing and used in view
    $rootScope.global.location_path = $stateParams.location_path;
    this.state = $state; // used in view because path doesn't always update properly.. esp. for /people

    var nav_community;

    var getCommunity = function () {

        var pullCommunity = function (comm_path) {
            $rootScope.global.community = undefined;
            community_service.getCommunity(comm_path)
                .then(function (response) {
                    $rootScope.global.community = response.data;
                    getLocation();
                })
        };

        var next = function() {

            var url = $location.path().replace(/\/$/, "").split('/'),
                lastitem = url.pop(),
                root = url.pop();

            if (lastitem == "people" || lastitem == "companies" || lastitem == "search" || lastitem == "invite" || lastitem == "add" || lastitem == "welcome") {
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

        // check if community is already in $rootScope.global

        if ($stateParams.community_path) {
            if ($rootScope.global.community && $rootScope.global.community.key == $stateParams.community_path)
                getLocation();
            else if ($rootScope.global.location && $rootScope.global.location.key == $stateParams.community_path) {
                $rootScope.global.community = $rootScope.global.location;
                getLocation();
            } else next();
        } else if ($stateParams.location_path) {
            if ($rootScope.global.community && $rootScope.global.community.key == $stateParams.location_path)
                getLocation();
            else if ($rootScope.global.location && $rootScope.global.location.key == $stateParams.location_path) {
                $rootScope.global.community = $rootScope.global.location;
                getLocation();
            } else next();
        }

    };

    var getLocation = function() {

        nav_community = $rootScope.global.community;

        // if community is a user, pull their home and use that for location [used when refreshing page on user profile]
        if (nav_community && nav_community.type == 'user') {

            if ($rootScope.global && $rootScope.global.location && $rootScope.global.location.key == nav_community.profile.home) {
                getNavTop();
            } else
                $rootScope.global.location = undefined;
                community_service.getKey(nav_community.profile.home)
                    .then(function(response) {
                        $rootScope.global.location = response.data;
                        getNavTop();
                    })

        } else if ($rootScope.global && $rootScope.global.location && $rootScope.global.location.key == $stateParams.location_path) {
            // check if location is already in $rootScope.global
            getNavTop();
        } else
            if ($stateParams.location_path !== nav_community.key) {
                $rootScope.global.location = undefined;
                community_service.getKey($stateParams.location_path)
                    .then(function(response) {
                        $rootScope.global.location = response.data;
                        getNavTop();
                    });
            } else {
                $rootScope.global.location = nav_community;
                getNavTop();
            }

    };

    var getNavTop = function() {

        // check if we already have correct navigation
        if ($rootScope.global && $rootScope.global.nav_top && $rootScope.global.nav_top.key == $stateParams.location_path)
            getCommunityTop();

        else {
            // if it's a user, pull home
            var true_loc = nav_community && nav_community.type == 'user' ?
                nav_community.profile.home :
                $rootScope.global.location.key;

            $rootScope.global.nav_top = undefined;
            community_service.getTop(true_loc)
                .then(function(response) {
                    $rootScope.global.nav_top = response.data;
                    getCommunityTop();
                })
        }

    };

    var getCommunityTop = function() {
        if (nav_community && nav_community.key && $rootScope.global.location && $rootScope.global.location.key && (nav_community.key !== $rootScope.global.location.key && ((nav_community.type == 'location') || (nav_community.resource) || (nav_community.type == 'cluster')))) {

            $rootScope.global.top = undefined;
            community_service.getTop($rootScope.global.location.key, nav_community.key, nav_community)
                .then(function(response) {
                    $rootScope.global.top = response.data;
                    loadNav();
                })
        } else {
            $rootScope.global.top = $rootScope.global.nav_top;
            loadNav();
        }
    };

    /* -------------- DEPENDENCIES HAVE BEEN RESOLVED --------------------- */

    var loadNav = function() {

       /* // *** ROUTING OF ROOT PATHS ***
        switch ($location.path().replace(/\/$/, "").split('/').pop()) {
            case 'people':
                $state.go('user.list');
                break;
            case 'companies':
                $state.go('company.list');
                break;
            case 'resources':
                $state.go('resource.list');
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
*/
        if ($stateParams.community_path !== "people" && $stateParams.community_path !== "companies" && $stateParams.community_path !== "search" && $stateParams.community_path !== "invite" && $stateParams.community_path !== "add" && $stateParams.community_path !== "welcome") {
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

        console.log('StateParams Location: ', $stateParams.location ? $stateParams.location.key : null);
        console.log('StateParams Location_Path: ', $stateParams.location_path ? $stateParams.location_path : null);
        console.log('StateParams Community: ', $stateParams.community ? $stateParams.community.key : null);
        console.log('StateParams Community_Path: ', $stateParams.community_path ? $stateParams.community_path : null);

        console.log('Nav RootScope Location: ', $rootScope.global.location ? $rootScope.global.location.key : null);
        console.log('Nav RootScope Community: ', $rootScope.global.community ? $rootScope.global.community.key : null);

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

        if ($auth.isAuthenticated() && user) {

            self.user = user; // reference 'this' by using 'nav' from 'NavigationController as nav' - * nav is also usable in child views *

        // LOAD 3RD PARTY SERVICES

        knowtify.push(['load_inbox', 'knowtify', {email: self.user.profile.email}]);

        if ($window.JacoRecorder)
            $window.JacoRecorder.identify(self.user.profile.email);

        rollbar_payload.payload['person'] = {
            "id": self.user.key,
            "name": self.user.profile.name,
            "email": self.user.profile.email
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

        // PRIMARY LEFT-NAV ITEM LIST
/*
        $rootScope.global.community = communities; // used in company list views
        $rootScope.global.nav_communities = nav_communities;
        */
        self.loaders = {};

        if (!$rootScope.global.community) $rootScope.global.community = $rootScope.global.community[$stateParams.location_path];
        if (!$rootScope.global.community) {
            // if still no community, there's a problem, reload the app
            $window.location.reload();
        }
        // the industry_icons save me a db call on every controller reload :) because top doesn't include item values.. maybe combine this with 'parents' service?
        self.industry_icons = {
            "construction" : {
                "icon" : "fa-wrench"
            },
            "legal" : {
                "icon" : "fa-gavel"
            },
            "tech" : {
                "icon" : "fa-code"
            },
            "medical" : {
                "icon" : "fa-stethoscope"
            },
            "healthcare" : {
                "icon" : "fa-ambulance"
            },
            "recreation" : {
                "icon" : "fa-sun-o"
            },
            "art" : {
                "icon" : "fa-picture-o"
            },
            "transportation" : {
                "icon" : "fa-road"
            },
            "consumer-goods" : {
                "icon" : "fa-barcode"
            },
            "non-profit" : {
                "icon" : "fa-heart-o"
            },
            "corporate" : {
                "icon" : "fa-building-o"
            },
            "government" : {
                "icon" : "fa-university"
            },
            "finance" : {
                "icon" : "fa-pie-chart"
            },
            "education" : {
                "icon": "fa-graduation-cap"
            },
            "manufacturing": {
                "icon" : "fa-cube"
            },
            "agriculture" : {
                "icon": "fa-pagelines"
            },
            "services" : {
                "icon": "fa-bell-o"
            }
        };

        var parents = community_service.parents();
        parents = parents.join('|').toLowerCase().split('|'); // change all to lowercase

        // sort communities for use in nav and child dashboard pages
        self.resources = [];

        for (item in $rootScope.global.nav_communities) { // need to determine what item is here, esp if user or company
            if ($rootScope.global.nav_communities[item]) {
                switch ($rootScope.global.nav_communities[item].type) {
                    case "location":
                        if (item !== $rootScope.global.location.key) {
                            if (!$rootScope.global.locations) $rootScope.global.locations = {};
                            $rootScope.global.locations[item] = $rootScope.global.nav_communities[item];
                        }
                        break;
                    case "cluster":
                        if (!self.clusters) self.clusters = {};
                        if ($rootScope.global.nav_communities[item].community_profiles && $rootScope.global.nav_communities[item].community_profiles[$rootScope.global.location.key] && $rootScope.global.nav_communities[item].community_profiles[$rootScope.global.location.key].parents && $rootScope.global.nav_communities[item].community_profiles[$rootScope.global.location.key].parents[0]) {
                            var cluster_type = $rootScope.global.nav_communities[item].community_profiles[$rootScope.global.location.key].parents[0];
                            if (!self.clusters[cluster_type]) self.clusters[cluster_type] = {};
                            self.clusters[cluster_type][item] = $rootScope.global.nav_communities[item];
                        }
                        break;
                    case "company":
                        if ($rootScope.global.nav_communities[item].resource) {
                            if ($rootScope.global.nav_communities[item].community_profiles && $rootScope.global.nav_communities[item].community_profiles[$rootScope.global.location.key] && $rootScope.global.nav_communities[item].community_profiles[$rootScope.global.location.key].parents && $rootScope.global.nav_communities[item].community_profiles[$rootScope.global.location.key].parents[0]) {
                                var resource_type = $rootScope.global.nav_communities[item].community_profiles[$rootScope.global.location.key].parents[0];
                                //if (!self.resources[resource_type]) self.resources[resource_type] = {};
                                //self.resources[resource_type][item] =  self.nav_communities[item];
                                self.resources.push($rootScope.global.nav_communities[item]);
                            }
                        }
                        break;
                }
            }
        }

        var location_key = $rootScope.global.location.key;
        self.resources = self.resources.sort(function(a, b) {
            var x = a.community_profiles[location_key].name;
            var y = b.community_profiles[location_key].name;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });

        if (angular.equals({}, self.clusters)) self.clusters = undefined; // had a hard time checking for empty object in the html

        // For tour
        if ($stateParams.tour) {
            angular.element(document).ready(function () {
                setTimeout(function() {
                    jQuery('#tourstart').trigger('click');
                }, 3000);
            });
        }

        self.end = function() {
            $state.go('user.dashboard', {profile: self.user, location_path: self.user.key, community: self.user, tour: false});
        };

        // BREADCRUMBS
        if ($rootScope.global.community.type == "user") {
            // note this changes location for nav items below
            if ($rootScope.global.location.key == $rootScope.global.community.key) $rootScope.global.location = $rootScope.global.community[$rootScope.global.community.profile.home];
        }

        // to avoid duplicate location_path / community_path when navigating to people & companies
        self.nav_url = $stateParams.location_path == $rootScope.global.community.key ?
            "({query: '*', user: nav.user })" :
            "({query: '*', user: nav.user })";

        // to set correct root path when navigating from user or company page

        self.nav_jump = ($rootScope.global.location && $rootScope.global.location.type == 'location') || (($rootScope.global.community.type == "user" || $rootScope.global.community.type == "company") &&
        ($rootScope.global.location && $rootScope.global.location.type == 'location')) ?
            "({community_path: item.key, community: item, query: '*', location_path: global.location.key, communities: global.community, user: nav.user })" :
            "({community_path: item.key, community: item, query: '*', location_path: nav.user.profile.home, communities: global.community, user: nav.user })";

        // SEARCH

        if ($stateParams.query) self.search.query = $stateParams.query;

        if ($rootScope.global.community.type == "cluster" || $rootScope.global.community.resource) {
            if ($rootScope.global.community.community_profiles && $rootScope.global.community.community_profiles[$stateParams.location_path]) {
                self.searchname = $rootScope.global.community.community_profiles[$stateParams.location_path].name;
            } else self.searchname = $rootScope.global.community.profile.name;
        } else self.searchname = $rootScope.global.location && $rootScope.global.location.profile ? $rootScope.global.location.profile.name : "";

        self.search = function(query) {

            if (!query) query = "*";

            if ($rootScope.global.community.type == "cluster" || $rootScope.global.community.resource) {
                $stateParams.location_path == $rootScope.global.community.key ?
                    $state.go('search.dashboard', {location_path: $stateParams.location_path, community: $rootScope.global.community, query: query}) :
                    $state.go('search.dashboard', {location_path: $stateParams.location_path, community_path: $rootScope.global.community.key, community: $rootScope.global.community, query: query});
            } else if ($rootScope.global.community.type == "user" || $rootScope.global.community.type == "company") {
                $state.go('search.dashboard', {location_path: $rootScope.global.community.profile.home, query: query});
            } else $state.go('search.dashboard', {query: query});

        };

        // CLICK FUNCTIONS
        
        self.goUser = function(profile) {
            $rootScope.global.community = profile.value;
            $state.go('user.dashboard',{location_path: profile.path.key, community_path: '' });
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
                        return $rootScope.global.community.key;
                    },
                    location_key: function() {
                        return $stateParams.location_path;
                    }
                }
            });
        };

        // COMMUNITY SETTINGS

        self.embedSettings = function(community) {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/nav/nav.embed_settings.html',
                controller: EmbedSettingsController,
                controllerAs: 'settings',
                windowClass: "hmodal-success",
                resolve: {
                    community: function() {
                        return community || $rootScope.global.community;
                    },
                    location: function() {
                        return $rootScope.global.location;
                    },
                    user: function() {
                        return self.user;
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
                        return $rootScope.global.location;
                    },
                    community: function() {
                        return community;
                    },
                    user: function() {
                        return self.user;
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
                        return self.user;
                    },
                    location: function() {
                        return $rootScope.global.location;
                    },
                    communities: function() {
                        return $rootScope.global.community;
                    }
                }
            });

            modalInstance.closed.then(function () {
                user_service.getProfile()
                    .then(function(response) {
                        self.user = response.data;
                    })
            });

        };

        self.syncNewsletter = function() {
            self.syncworking = true;
            newsletter_service.syncMembers(self.user.newsletter.lists, self.user.newsletter.brand_id, location.key)
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
                        return $rootScope.global.location;
                    },
                    communities: function() {
                        return $rootScope.global.community;
                    },
                    location: function() {
                        if ($rootScope.global.location.resource || $rootScope.global.location.type == 'cluster') {
                            return $rootScope.global.community[$rootScope.global.location.profile.home];
                        } else return $rootScope.global.location;
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
                    return self.user;
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
        var embed;
        self.embedded = false;

        try {
            self.embedded = window.self !== window.top;
        } catch (e) {
            self.embedded = true;
        }

        if (self.embedded) {
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
                if (storage.full) self.embedded = false;
            }

            try {
                if ($rootScope.global.location.type === 'cluster' && $rootScope.global.location.community_profiles[$stateParams.location_path] && $rootScope.global.location.community_profiles[$stateParams.location_path].embed) {
                    try {
                        embed = $rootScope.global.location.community_profiles[$stateParams.location_path].embed;
                    }
                    catch (e) {
                        errorLogService('embed problem: ', e);
                    }

                } else embed = $rootScope.global.location.profile.embed;
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
                        if (embed[u].full) self.embedded = false;
                        break;
                    }
                }
            }
        }

        //self.embedded = true; // for testing

    };

    getCommunity();

}

function SettingsController(user, community_service) {
    var self = this;
    var leader = [];
    
    if (user.roles && user.roles.leader) {
        
        for (l in user.roles.leader) leader.push(l);

        community_service.getResources(undefined, leader)
            .then(function(response) {
                self.resources = response.data;
            })
    } else self.resources = {};
    
}

function EmbedSettingsController($uibModalInstance, sweet, user, community_service, community, location){

    this.user = user;
    var self = this;
    $rootScope.global.location = location; // used in view

    //force pull of community settings every time to avoid stale data
    community_service.getKey(community.key)
        .then(function(response) {
            $rootScope.global.community = response.data;

            // load existing embed settings
            if ($rootScope.global.community.community_profiles && $rootScope.global.community.community_profiles[location.key] && $rootScope.global.community.community_profiles[location.key].embed) {
                self.embed = $rootScope.global.community.community_profiles[location.key].embed;
            } else if ($rootScope.global.community.profile && $rootScope.global.community.profile.embed) self.embed = $rootScope.global.community.profile.embed; // for locations
        });

    this.addEmbed = function() {
        if (self.form.$valid) {
            if (!self.embed) {
                self.embed = [];
            }

            self.embed.push({
                "url" : self.formdata.embed_url_value,
                "color" : self.formdata.embed_color_value || '#fff',
                "full" : self.formdata.embed_full_value || false,
                "creator" : self.user.key
            });

        } else {
            self.form.submitted = true;
        }
    };

    this.removeEmbed = function(index) {
        self.embed.splice(index, 1);
    };

    this.save = function () {

        community_service.setSettings(self.embed, location.key, $rootScope.global.community.key)
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
                        //$http.get('/api/2.1/community/' + location.key + '/' + $rootScope.global.community.key);
                        $uibModalInstance.close();
                    });
                }
            });
    };

    this.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}

function CommunityController($uibModalInstance, $mixpanel, sweet, community_service, community, location, $http, $window, user, $state){

    $rootScope.global.location = location;
    var loc_key = location.key;
    $rootScope.global.communityForm = {"name":""}; // to avoid 'undefined' for initial url
    var self = this;
    this.update = false;

    this.industryList = community_service.industries();

    this.encode = function(uri) {
        return encodeURI(uri.toLowerCase().replace(/\s+/g, '-'));
    };

    if (community.type == 'cluster') {
        self.parents = community_service.parents();
    } else if (community.resource) {
        community_service.getResources(loc_key)
            .then(function(recs) {
                self.resources = recs.data;
            });
    }

    if (community.key) {

        loc_key = user.roles.leader[community.key][0]; // this will need to be selected by the user if they are a leader of one resource in multiple locations

        //force pull of community settings every time to avoid stale data

        community_service.getKey(community.key)
            .then(function(response) {
                var community = response.data;

                if (community && community.community_profiles && community.community_profiles[loc_key]) {
                    self.update = true;
                    $rootScope.global.community = community.community_profiles[loc_key];
                    $rootScope.global.communityForm = {
                        "name": $rootScope.global.community.name,
                        "headline": $rootScope.global.community.headline,
                        "industries": $rootScope.global.community.industries,
                        "url": decodeURI(community.key)
                    };

                    if ($rootScope.global.community.parents) {
                        switch ($rootScope.global.community.parents[0]) {
                            case 'consumer-goods':
                                $rootScope.global.communityForm['parent'] = 'Consumer Goods';
                                break;
                            case 'non-profit':
                                $rootScope.global.communityForm['parent'] = 'Non-Profit';
                                break;
                            default:
                                if (community.resource) {
                                    // allow multiply types only for resources
                                    var _parents = $rootScope.global.community.parents || [];
                                    $rootScope.global.communityForm['parent'] = _parents.filter(function(item) {
                                        return item !== null;
                                    });
                                }
                                else {
                                    $rootScope.global.communityForm['parent'] = $rootScope.global.community.parents[0][0].toUpperCase() + $rootScope.global.community.parents[0].slice(1);
                                }
                        }
                    }
                }

            });
    }

    this.editCommunity = function() {
        self.working = true;
        var rename = false;

        if (self.form.$valid) {

            if ($rootScope.global.communityForm.url) {
                try {
                    var encodedUrl = $rootScope.global.communityForm.url.toLowerCase().replace(/\s+/g, '-');
                }
                catch (e) {
                    sweet.show({
                        title: "Sorry, something is wrong with the url path.",
                        type: "error"
                    });
                    self.submitted = true;
                }
            }
            
            if ($rootScope.global.communityForm.parent) {
                var parents = angular.isArray($rootScope.global.communityForm.parent) ? $rootScope.global.communityForm.parent : [$rootScope.global.communityForm.parent.toLowerCase()];
            } else parents = [];

            var newCommunity = {
                type: community.type,
                profile: {
                    name: $rootScope.global.communityForm.name,
                    headline: $rootScope.global.communityForm.headline,
                    parents: parents
                },
                resource: $rootScope.global.communityForm.resource ? $rootScope.global.communityForm.resource.key : "",
                url: encodedUrl || $rootScope.global.communityForm.name.toLowerCase().replace(/\s+/g, '-')
            };

            if (community.type == 'cluster') {
                newCommunity.profile['industries'] = $rootScope.global.communityForm.industries;
            }

            if (community.community_profiles && community.community_profiles[loc_key] && community.community_profiles[loc_key].embed) {
                newCommunity.profile['embed'] = community.community_profiles[loc_key].embed;
            }

            if (community.key && (community.key !== newCommunity.url)) rename = true; // determine if this is a rename operation

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
                            title: community.type[0].toUpperCase() + community.type.slice(1) + (self.update ? " updated!" : " created!"),
                            type: "success",
                            closeOnConfirm: true
                        });

                        $http.get('/api/2.1/community/' + loc_key + '/' + newCommunity.url + '/top').then(function() {
                            $window.location.href = '/'+ loc_key + '/' + newCommunity.url;
                        });
                    }
                    $mixpanel.track('Added ' + community.type[0].toUpperCase() + community.type.slice(1));
                });

        } else {
            self.submitted = true;
            self.working = false;
        }
    };

    this.deleteCommunity = function () {
        self.working = true;

        if (community.type == 'cluster') {
            var text = "You can recreate this cluster at any time.";
        } else if (community.resource) {
            text = "Members will be removed from the resource, but they will remain in the community."
        } else text = "";

        sweet.show({
            title: "Are you sure?",
            text: text,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete " + $rootScope.global.community.name + "!",
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
                            text: "The " + $rootScope.global.community.name + " community is gone.",
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