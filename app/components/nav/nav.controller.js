angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController)
    .controller('SettingsController', SettingsController)
    .controller('EmbedSettingsController', EmbedSettingsController);

function NavigationController($scope, $auth, $state, $window, $location, $stateParams, $uibModal, $mixpanel, user_service, community_service, sweet, knowtify, errorLogService, newsletter_service) {

    var self = this;
    $scope.global.path = $location.path().replace(/\/$/, ""); //used for routing and used in view
    $scope.global.query = undefined;
    $scope.global.top = undefined;
    $scope.global.community = undefined;
    $scope.global.loaders = {};
    $scope.global.lastitems = ["people", "companies", "resources", "search", "invite", "add-company", "add-resource", "welcome", "settings", "edit", "newsletter"];
    this.state = $state; // used in header because path doesn't always update properly..

    var nav_community;

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
                .catch(function(response) {
                    if (response.status == 404) {
                        $state.go('404');
                    } else {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: "Here's what we know: " + response.data.message,
                            type: "error"
                        }, function() {
                            $state.reload();
                        })
                    }
                })
        };

        var next = function() {

            var url = $location.path().replace(/\/$/, "").split('/'),
                lastitem = url.pop(),
                root = url.pop();

            if ($scope.global.lastitems.indexOf(lastitem) > -1) {
                pullCommunity(root);
            } else {
                pullCommunity($stateParams.community_path || $stateParams.location_path);
            }
        };

        // replace spaces in urls with hyphens
        if ($stateParams.community_path) $stateParams.community_path = $stateParams.community_path.replace(/\s+/g, '-');
        if ($stateParams.location_path) $stateParams.location_path = $stateParams.location_path.replace(/\s+/g, '-');

        // check if community is already in $scope.global

        if ($stateParams.community_path && $scope.global.lastitems.indexOf($stateParams.community_path) < 0) {
            if ($scope.global.location && $scope.global.location.key == $stateParams.community_path) {
                $scope.global.community = $scope.global.location;
                getLocation();
            } else next();
        } else if ($stateParams.location_path) {
            if ($scope.global.location && $scope.global.location.key == $stateParams.location_path) {
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
        
        var path_url = $location.path().replace(/\/$/, "").split('/').pop(); // used for routing

        /*  
        console.log($stateParams);
        console.log(path_url);
        console.log(nav_community);
        console.log('Nav RootScope Location: ', $scope.global.location ? $scope.global.location.key : null);
        console.log('Nav RootScope Community: ', $scope.global.community ? $scope.global.community.key : null);
        */
        // for header breadcrumbs
        switch ($scope.global.community.type) {
            case ('company'):
                self.btype = $scope.global.community.resource ? 'resource' : 'company';
                break;

            case ('cluster'):
                self.btype = 'industry';
                break;

            default:
                self.btype = $scope.global.community.type;
                break;
        }

        // ANONYMOUS OR LOGGED IN ?

        if ($auth.isAuthenticated() && $scope.global.user) {

            var user = $scope.global.user; // reference 'this' by using 'nav' from 'NavigationController as nav' - * nav is also usable in child views *

            // LOAD 3RD PARTY SERVICES

            knowtify.push(['load_inbox', 'knowtify', {email: user.profile.email}]);

            if ($window.JacoRecorder && $location.host() !== 'localhost:5000')
                $window.JacoRecorder.identify(user.profile.email);

            if ($window.Bugsnag) {
                $window.Bugsnag.user = {
                    key: user.key,
                    name: user.profile.name,
                    email: user.profile.email
                };
            }

        }

        if ($window.Bugsnag && $location.host() !== 'startupcommunity.org') $window.Bugsnag.releaseStage = "development";

        // to set correct root path when navigating via header liniks..  craziness is needed because using bracket syntax inside of ui-sref doesn't work
        
        $scope.global['nav'] = $scope.global.nav || {};

        if (($scope.global.location.key !== $scope.global.community.key && $scope.global.lastitems.indexOf($stateParams.community_path) < 0 && $scope.global.community.type !== 'user' && $scope.global.community.type !== 'company') || $scope.global.community.type == 'cluster') {

            $scope.global.nav['overview'] = $scope.global.community.key;
            $scope.global.nav['people'] = {
                community: $scope.global.community.key,
                tail: 'people'
            };
            $scope.global.nav['companies'] = {
                community: $scope.global.community.key,
                tail: 'companies'
            };
            $scope.global.nav['resources'] = {
                community: $scope.global.community.key,
                tail: 'resources'
            };

        } else {

            $scope.global.nav['overview'] = '';
            $scope.global.nav['people'] = {
                community: 'people',
                tail: undefined
            };
            $scope.global.nav['companies'] = {
                community: 'companies',
                tail: undefined
            };
            $scope.global.nav['resources'] = {
                community: 'resources',
                tail: undefined
            };
        }

        // *** ROUTING OF ROOT PATHS ***

        if ($scope.global.lastitems.indexOf(path_url) > -1) {

            switch (path_url) {

                case 'people':
                    $state.go('user.list');
                    break;

                case 'companies':
                    $state.go('company.list');
                    break;

                case 'resources':
                    $state.go('resource.list');
                    break;

                case 'search':
                    $state.go('search.dashboard', {}, {location: false});
                    break;

                case 'settings':
                    $state.go('settings', {}, {location: false});
                    break;

                case 'newsletter':
                    $state.go('newsletter', {}, {location: false});
                    break;

                case 'edit':
                    $state.go('company.edit', {}, {location: false});
                    break;

                case 'add-company':
                    $state.go('company.add', {}, {location: false});
                    break;

                case 'add-resource':
                    $state.go('resource.add', {}, {location: false});
                    break;

                case 'welcome':
                    $state.go('welcome', {}, {location: false});
                    break;

                default:
                    $state.go('404', {}, {location: false});
            }
        } else {
            
            switch (nav_community.type) {

                case 'user':
                    $state.go('user.dashboard', {noreload: true});
                    break;

                case 'company':
                    $state.go('company.dashboard', {noreload: true});
                    break;

                default:
                    $state.go('community.dashboard');
            }
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


        // SEARCH (this function is a good example of replacing ui-sref for common links)

        self.search = function(query) {
            
            if ($scope.global.community.type == "cluster" || $scope.global.community.resource) {
                $stateParams.location_path == $scope.global.community.key ?
                        $state.go('search.dashboard', {location_path: $stateParams.location_path, query: query, tail_path: ''}, {notify: false}) :
                        $state.go('search.dashboard', {location_path: $stateParams.location_path, community_path: $scope.global.community.key, query: query, tail_path: ''}, {reload: true});
            } else if ($scope.global.community.type == "user" || $scope.global.community.type == "company") {
                $state.go('search.dashboard', {location_path: $scope.global.community.profile.home, query: query, tail_path: ''}, {notify: false});
            } else if ($scope.global.lastitems.indexOf($stateParams.community_path) > -1) {
                $state.go('search.dashboard', {location_path: $stateParams.location_path, community_path: '', query: query, tail_path: ''}, {location: false})
            } else $state.go('search.dashboard', {query: query, tail_path: ''}, {notify: false});

        };

        // CONTACT USER

        self.contact = function(user) {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/users/user.contact.html',
                controller: ContactUserController,
                controllerAs: 'contact',
                windowClass: "hmodal-warning"
            });
        };

        // COMMUNITY SETTINGS

        self.embedSettings = function(community_key) {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/nav/nav.embed_settings.html',
                controller: EmbedSettingsController,
                controllerAs: 'settings',
                windowClass: "hmodal-success",
                resolve: {
                    embed_community: function() {

                        //force pull of community settings every time to avoid stale data
                        return community_service.getKey(community_key)
                            .then(function(response) {
                                $scope.global.community = response.data;
                                return response.data;
                            })
                    }
                }
            });
        };

        // ADD OR MODIFY CLUSTER, RESOURCE, OR LOCATION
        // note there are *2* editcommunity functions in this file :)
        self.editCommunity = function(community_key) {

            var modalInstance = $uibModal.open({
                templateUrl: 'components/nav/nav.edit_cluster.html',
                controller: CommunityController,
                controllerAs: 'edit',
                windowClass: "hmodal-success",
                resolve: {
                    edit_community: function() {

                        if (community_key) {

                            //force pull of community settings every time to avoid stale data
                            return community_service.getKey(community_key)
                                .then(function(response) {
                                    $scope.global.community = response.data;
                                    return response.data;
                                })

                        } else return null;
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
                windowClass: "hmodal-info"
            });
        };

        // INVITE PEOPLE
    
        self.invitePeople = function() {

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

        //$scope.global.embedded = true; // for testing

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
            
            var embed;

            try {
                if ($scope.global.community.type === 'cluster' && $scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path] && $scope.global.community.community_profiles[$stateParams.location_path].embed) {
                    try {
                        embed = $scope.global.community.community_profiles[$stateParams.location_path].embed;
                    }
                    catch (e) {
                        errorLogService('embed problem: ', e);
                    }

                } else {
                    try {
                        embed = $scope.global.location.profile.embed;
                    }
                    catch (e) {
                        errorLogService('embed problem2: ', e);
                    }
                }
            }
            catch (e) {
                errorLogService('embed problem3: ', e);
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
            .catch(function() {
                self.resources = {};
            })
    } else self.resources = {};
    
    if ($scope.global.location && $scope.global.location.clusters) {
        
        for (c in $scope.global.location.clusters) {
            for (clus in $scope.global.location.clusters[c]) {
                self.clusters[clus] = $scope.global.location.clusters[c][clus];
            }
        }
    }
    
}

function EmbedSettingsController($scope, $uibModalInstance, sweet, embed_community, community_service){
    
    var self = this;
    this.thiscommunity = embed_community;

    // load existing embed settings
    if (self.thiscommunity.community_profiles && self.thiscommunity.community_profiles[$scope.global.location.key] && self.thiscommunity.community_profiles[$scope.global.location.key].embed) {
        self.embed = self.thiscommunity.community_profiles[$scope.global.location.key].embed;
    } else if (self.thiscommunity.profile && self.thiscommunity.profile.embed) self.embed = self.thiscommunity.profile.embed; // for locations

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

        self.working = true;

        community_service.setSettings(self.embed, $scope.global.location.key, self.thiscommunity.key)
            .then(function(response) {

                self.working = false;

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

function CommunityController($scope, $uibModalInstance, $mixpanel, sweet, edit_community, community_service, user_service, $window){
    
    var self = this,
        community = edit_community,
        loc_key = $scope.global.location.key;

    this.update = false;
    this.communityForm = {"name":""}; // to avoid 'undefined' for initial url
    this.industryList = community_service.industries();

    self.parents = community_service.parents();
    
    if (community && community.community_profiles && community.community_profiles[loc_key]) {
        self.update = true;
        self.community = community.community_profiles[loc_key];
        self.communityForm = {
            "name": self.community.name,
            "headline": self.community.headline,
            "industries": self.community.industries,
            "url": decodeURI(community.key)
        };

        if (self.community.parents) {
            switch (self.community.parents[0]) {
                case 'consumer-goods':
                    self.communityForm['parent'] = 'Consumer-Goods';
                    break;
                case 'non-profit':
                    self.communityForm['parent'] = 'Non-Profit';
                    break;
                default:
                    if (self.community.resource) {
                        // allow multiply types only for resources
                        var _parents = self.community.parents || [];
                        self.communityForm['parent'] = _parents.filter(function(item) {
                            return item !== null;
                        });
                    }
                    else {
                        self.communityForm['parent'] = self.community.parents[0][0].toUpperCase() + self.community.parents[0].slice(1);
                    }
            }
        }

    }

    this.updateCommunity = function(type) {
        self.working = true;
        var rename = false,
            thiscommunity = $scope.global.community;

        thiscommunity.type = type || '';

        if (self.form.$valid) {

            if (self.communityForm.url) {
                try {
                    var encodedUrl = self.communityForm.url.toLowerCase().replace(/\s+/g, '-');
                }
                catch (e) {
                    sweet.show({
                        title: "Sorry, something is wrong with the url path.",
                        type: "error"
                    });
                    self.submitted = true;
                }
            }
            
            if (self.communityForm.parent) {
                var parents = angular.isArray(self.communityForm.parent) ? self.communityForm.parent : [self.communityForm.parent.toLowerCase()];
            } else parents = [];

            var newCommunity = {
                type: thiscommunity.type,
                profile: {
                    name: self.communityForm.name,
                    headline: self.communityForm.headline,
                    parents: parents
                },
                resource: self.communityForm.resource ? self.communityForm.resource.key : false,
                url: encodedUrl || self.communityForm.name.toLowerCase().replace(/\s+/g, '-')
            };

            if (thiscommunity.type == 'cluster') {
                newCommunity.profile['industries'] = self.communityForm.industries;
            }

            if (thiscommunity.community_profiles && thiscommunity.community_profiles[loc_key] && thiscommunity.community_profiles[loc_key].embed) {
                newCommunity.profile['embed'] = $scope.global.community.community_profiles[loc_key].embed;
            }

            if (thiscommunity.key && (thiscommunity.key !== newCommunity.url)) rename = true; // determine if this is a rename operation (not currently used)

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
                        if (rename) community_service.deleteCommunity(newCommunity, loc_key, newCommunity.url);

                        // refresh outdated cache

                        community_service.getCommunity(loc_key, true)
                            .then(function (response) {
                                $scope.global.location = response.data;
                            });

                        community_service.getTop(loc_key)
                            .then(function(response) {

                                sweet.show({
                                    title: "Successfully" + (self.update ? " updated!" : " created!"),
                                    type: "success",
                                    closeOnConfirm: true
                                }, function() {
                                    $scope.global.nav_top = {};
                                    $window.location.href = '/'+ loc_key + '/' + newCommunity.url;
                                });

                            }); // clear cache


                        user_service.getProfile()
                            .then(function(response) {
                                $scope.global.user = response.data;
                            });


                    }
                    $mixpanel.track('Added ' + thiscommunity.type);
                });

        } else {
            self.submitted = true;
            self.working = false;
        }
    };

    this.deleteCommunity = function () {
        self.deleting = true;

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
            confirmButtonText: "Yes, delete " + $scope.global.community.profile.name + "!",
            closeOnConfirm: false
        }, function () {

            community_service.deleteCommunity(community, loc_key)
                .then(function(response) {
                    self.deleting = false;

                    if (response.status !== 204) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: response.data.message,
                            type: "error"
                        });

                    } else {

                        community_service.getTop(loc_key)
                            .then(function(response) {
                                $scope.global.nav_top = response.data;

                                sweet.show({
                                    title: "Deleted!",
                                    text: "The " + $scope.global.community.profile.name + " community is gone.",
                                    type: "success",
                                    closeOnConfirm: true
                                }, function () {
                                    $window.location.href = '/' + loc_key + '/settings';
                                });
                            });
                    }
                });
        });
    };

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}