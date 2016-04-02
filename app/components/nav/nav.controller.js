angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController);

function NavigationController($auth, $state, $window, $timeout, $location, $scope, $stateParams, $uibModal, user_service, community_service, user, sweet, location, community, communities, nav_communities, top, knowtify, errorLogService, newsletter_service) {

    this.createBrand = function() {
        newsletter_service.createBrand()
            .then(function(response) {
                console.log(response);
            })
    };

    if (user && user.token) $auth.setToken(user.token); // update local storage with latest user profile

    // SENSITIVE VARIABLES THAT AFFECT NAVIGATION AND ALL CHILD TEMPLATES
    // When used in ui-sref links: location_path affects the url, location affects header and content, community affects header and second url parameter
    try { // catch any initial db connectivity problems

        if (jQuery.isEmptyObject(location)) {
            if (community.type !== 'location' && community.profile && community.profile.home) {
                this.location = communities[community.profile.home];
            } else this.location = community;
        } else this.location = location;

        this.community = jQuery.isEmptyObject($stateParams.community) ?
            (community.key !== this.location.key ?
                community :
                this.location) :
            $stateParams.community;

        this.location_path = $stateParams.location_path || $stateParams.location.key || this.community.key;
    }
    catch(err) {
        errorLogService('NavController Catch27: ' + err);
        $state.go('404');
    }

    // *** ROUTING OF ROOT PATHS ***
    this.state = $state; // used in view because path doesn't always update properly.. esp. for /people
    this.path = $location.path().replace(/\/$/, ""); //used for routing and used in view

    if (this.path.split('/').length < 3) {
        switch (this.community.type) {
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

    var self = this;

    if (top) {        
        this.top = top;
    }

    // ANONYMOUS ACCESS OR PROFILE DISPLAY

    if ($auth.isAuthenticated() && user) {

        this.user = user; // reference 'this' by using 'nav' from 'NavigationController as nav' - * nav is also usable in child views *

        knowtify.push(['load_inbox', 'knowtify', {email: this.user.profile.email}]);

        $window.HelpCrunch('onReady', function() {
            newMessage();
        });

        var newMessage = function() {
            $window.HelpCrunch('onNewUnreadMessages', function(event) {
                event.setMaxListeners(1); // to avoid (node) warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
                self.chatMessageCount = event.unreadMessages;
                $timeout(function() {
                    $scope.$apply();
                });
            });
        };

    }

    this.openChat = function() {
        user_service.getHelpToken()
            .then(function(response) {
                $('.helpcrunch-chat-header>span').replaceWith('<span>StartupCommunity.org Live Chat</span>');
                $('.helpcrunch-logo').replaceWith('<img class="helpcrunch-logo" src="/public/images/plant_only.jpg" style="height:32px;">');
                $window.HelpCrunch('updateUser', {
                    name: self.user.profile.name,
                    email: self.user.profile.email,
                    user_id: self.user.key,
                    signature: response.data
                });
                $window.HelpCrunch('openChat');
            });
    };

    // PRIMARY LEFT-NAV ITEM LIST

    this.communities = communities; // used in company list views
    this.nav_communities = nav_communities;

    if (!this.community) this.community = this.communities[this.location_path];
    if (!this.community) {
        // if still no community, there's a problem, reload the app
        $window.location.reload();
    }
    // the industry_icons save me a db call on every controller reload :) because top doesn't include item values.. maybe combine this with 'parents' service?
    this.industry_icons = {
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
    this.networks = [];

    for (item in this.nav_communities) { // need to determine what item is here, esp if user or company
        if (this.nav_communities[item]) {
            switch (this.nav_communities[item].type) {
                case "location":
                    if (item !== this.location.key) {
                        if (!this.locations) this.locations = {};
                        this.locations[item] = this.nav_communities[item];
                    }
                    break;
                case "cluster":
                    if (!this.clusters) this.clusters = {};
                    if (this.nav_communities[item].community_profiles && this.nav_communities[item].community_profiles[this.location.key] && this.nav_communities[item].community_profiles[this.location.key].parents && this.nav_communities[item].community_profiles[this.location.key].parents[0]) {
                        var cluster_type = this.nav_communities[item].community_profiles[this.location.key].parents[0];
                        if (!this.clusters[cluster_type]) this.clusters[cluster_type] = {};
                        this.clusters[cluster_type][item] = this.nav_communities[item];
                    }
                    break;
                case "network":
                    if (this.nav_communities[item].community_profiles && this.nav_communities[item].community_profiles[this.location.key] && this.nav_communities[item].community_profiles[this.location.key].parents && this.nav_communities[item].community_profiles[this.location.key].parents[0]) {
                        var network_type = this.nav_communities[item].community_profiles[this.location.key].parents[0];
                        //if (!this.networks[network_type]) this.networks[network_type] = {};
                        //this.networks[network_type][item] =  this.nav_communities[item];
                        this.networks.push(this.nav_communities[item]);
                    }

                    break;
                default:
                    break;
            }
        }
    }

    var location_key = this.location.key;
    this.networks = this.networks.sort(function(a, b) {
        var x = a.community_profiles[location_key].name;
        var y = b.community_profiles[location_key].name;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });

    if (angular.equals({}, this.clusters)) this.clusters = undefined; // had a hard time checking for empty object in the html

    // For tour
    if ($stateParams.tour) {
        angular.element(document).ready(function () {
            setTimeout(function() {
                jQuery('#tourstart').trigger('click');
            }, 3000);
        });
    }

    this.end = function() {
        $state.go('user.dashboard', {profile: self.user, location_path: self.user.key, community: self.user, tour: false});
    };

    // BREADCRUMBS
    if (this.community.type == "user") {
        // note this changes location for nav items below
        if (this.location.key == this.community.key) this.location = this.communities[this.community.profile.home];
    }

    // to avoid duplicate location_path / community_path when navigating to people & companies
    this.nav_url = this.location_path == this.community.key ?
        "({location_path: nav.location_path, community: nav.community, query: '*', top: nav.top, communities: nav.communities, user: nav.user })" :
        "({location_path: nav.location_path, community: nav.community, query: '*', community_path: nav.community.key, top: nav.top, communities: nav.communities, user: nav.user })";

    // to set correct root path when navigating from user or company page

    this.nav_jump = (this.location && this.location.type == 'location') || ((this.community.type == "user" || this.community.type == "company") &&
        (this.location && this.location.type == 'location')) ?
        "({community_path: item.key, community: item, query: '*', location_path: nav.location.key, top: nav.top, communities: nav.communities, user: nav.user })" :
        "({community_path: item.key, community: item, query: '*', location_path: nav.user.profile.home, top: nav.top, communities: nav.communities, user: nav.user })";

    // SEARCH

    if ($stateParams.query) this.search.query = $stateParams.query;

    if (this.community.type == "cluster" || this.community.type == "network") {
        if (this.community.community_profiles && this.community.community_profiles[this.location_path]) {
            this.searchname = this.community.community_profiles[this.location_path].name;
        } else this.searchname = this.community.profile.name;
    } else this.searchname = this.location ? this.location.profile.name : "";

    this.search = function(query) {

        if (!query) query = "*";

        if (self.community.type == "cluster" || self.community.type == "network") {
            self.location_path == self.community.key ?
                $state.go('search.dashboard', {location_path: self.location_path, community: self.community, query: query}) :
                $state.go('search.dashboard', {location_path: self.location_path, community_path: self.community.key, community: self.community, query: query});
        } else if (self.community.type == "user" || self.community.type == "company") {
            $state.go('search.dashboard', {location_path: self.community.profile.home, query: query});
        } else $state.go('search.dashboard', {query: query});

    };

    // CONTACT USER

    this.contact = function(user) {

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
                    return self.community.key;
                },
                location_key: function() {
                    return $stateParams.location_path;;
                }
            }
        });
    };

    // COMMUNITY SETTINGS

    this.embedSettings = function(community) {

        var modalInstance = $uibModal.open({
            templateUrl: 'components/nav/nav.embed_settings.html',
            controller: EmbedSettingsController,
            controllerAs: 'settings',
            windowClass: "hmodal-success",
            resolve: {
                community: function() {
                    return community || self.community;
                },
                location: function() {
                    return self.location;
                },
                user: function() {
                    return self.user;
                }
            }
        });
    };

    // ADD OR MODIFY CLUSTER, NETWORK, OR LOCATION

    this.editCommunity = function(community) {

        var modalInstance = $uibModal.open({
            templateUrl: 'components/nav/nav.edit_' + community.type + '.html',
            controller: CommunityController,
            controllerAs: 'edit',
            windowClass: "hmodal-success",
            resolve: {
                location: function() {
                    return self.location;
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

    this.removeUser = function(ruser) {
        sweet.show({
            title: "Are you sure?",
            text: "Removing this user from " + community.profile.name + " does not remove them from the entire community. You can easily add them to the network again in the future.",
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

    this.setupNewsletter = function() {

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
                    return self.location;
                },
                communities: function() {
                    return self.communities;
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
    
    this.syncNewsletter = function() {
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

    this.requestInvitation = function() {

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
                    return self.location;
                },
                communities: function() {
                    return self.communities;
                },
                location: function() {
                    if (self.location.type == 'network' || self.location.type == 'cluster') {
                        return self.communities[self.location.profile.home];
                    } else return self.location;
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

    // ADD COMPANY

    this.addCompany = function(company) {

        var modalInstance = $uibModal.open({
            templateUrl: 'components/companies/company.add.html',
            controller: WelcomeController,
            controllerAs: 'welcome',
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
                },
                company: function() {
                    return company || null;
                }
            }
        });

        modalInstance.closed.then(function () {
            $state.reload();
        });
    };

    // ADD RESOURCE

    this.addResource = function(company) {

        var modalInstance = $uibModal.open({
            templateUrl: 'components/resources/resource.add.html',
            controller: EditResourceController,
            controllerAs: 'add',
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
                },
                company: function() {
                    return company || null;
                }
            }
        });

        modalInstance.closed.then(function () {
            $state.reload();
        });
    };

    // CHECK FOR IFRAME (redirect, if needed, must happen after routing)
    var embed;
    this.embedded = false;

    try {
        this.embedded = window.self !== window.top;
    } catch (e) {
        this.embedded = true;
    }

    if (this.embedded) {
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
            this.color = storage.color;
            if (storage.full) this.embedded = false;
        }

        try {
            if (this.location.type === 'cluster' && this.location.community_profiles[this.location_path] && this.location.community_profiles[this.location_path].embed) {
                try {
                    embed = this.location.community_profiles[this.location_path].embed;
                }
                catch (e) {
                    errorLogService('embed problem: ', e);
                }

            } else embed = this.location.profile.embed;
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
                    if (embed[u].full) this.embedded = false;
                    break;
                }
            }
        }
    }

    //this.embedded = true; // for testing

}

function EmbedSettingsController($uibModalInstance, sweet, user, community_service, community, location){

    this.user = user;
    var self = this;
    this.location = location; // used in view

    //force pull of community settings every time to avoid stale data
    community_service.getKey(community.key)
        .then(function(response) {
            self.community = response.data;

            // load existing embed settings
            if (self.community.community_profiles && self.community.community_profiles[location.key] && self.community.community_profiles[location.key].embed) {
                self.embed = self.community.community_profiles[location.key].embed;
            } else if (self.community.profile && self.community.profile.embed) self.embed = self.community.profile.embed; // for locations
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

        community_service.setSettings(self.embed, location.key, self.community.key)
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
                        //$http.get('/api/2.1/community/' + location.key + '/' + self.community.key);
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

    this.location = location;
    var loc_key = location.key;
    this.communityForm = {"name":""}; // to avoid 'undefined' for initial url
    var self = this;
    this.update = false;

    this.industryList = community_service.industries();

    this.encode = function(uri) {
        return encodeURI(uri);
    };

    if (community.type == 'cluster') {
        self.parents = community_service.parents();
    } else if (community.type == 'network') {
        self.parents = community_service.network_parents();
        self.parentTypes = self.parents.map(function(item) {
            return { id: item.toLowerCase(), label: item}
        });
    }

    if (community.key) {

        loc_key = user.roles.leader[community.key][0]; // this will need to be selected by the user if they are a leader of one network in multiple locations

        //force pull of community settings every time to avoid stale data

        community_service.getKey(community.key)
            .then(function(response) {
                var community = response.data;

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
                                self.communityForm['parent'] = 'Consumer Goods';
                                break;
                            case 'non-profit':
                                self.communityForm['parent'] = 'Non-Profit';
                                break;
                            default:
                                if (community.type == 'network') {
                                    // allow multiply types only for networks
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

            });
    }

    this.editCommunity = function() {
        self.working = true;
        var rename = false;

        if (self.form.$valid) {

            if (self.communityForm.url) {
                try {
                    var encodedUrl = encodeURI(self.communityForm.url);
                }
                catch (e) {
                    sweet.show({
                        title: "Sorry, something is wrong with the url path.",
                        type: "error"
                    });
                    self.submitted = true;
                }
            }

            var newCommunity = {
                type: community.type,
                profile: {
                    name: self.communityForm.name,
                    headline: self.communityForm.headline,
                    parents: (angular.isArray(self.communityForm.parent)) ? self.communityForm.parent : [self.communityForm.parent.toLowerCase()]
                },
                url: encodedUrl || encodeURI(self.communityForm.name.toLowerCase())
            };

            if (community.type == 'cluster') {
                newCommunity.profile['industries'] = self.communityForm.industries;
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
                        sweet.show({
                            title: community.type[0].toUpperCase() + community.type.slice(1) + (self.update ? " updated!" : " created!"),
                            type: "success"
                        }, function(){
                            // refresh outdated cache
                            $http.get('/api/2.1/community/' + user.key);
                            $http.get('/api/2.1/community/' + loc_key);
                            $http.get('/api/2.1/community/' + loc_key + '/' + newCommunity.url + '/top').then(function() {
                                $window.location.href = '/'+ loc_key + '/' + newCommunity.url;
                            });

                            $uibModalInstance.close();
                        });
                        if (rename) community_service.deleteCommunity(community, loc_key, newCommunity.url);
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
        } else if (community.type == 'network') {
            text = "Members will be removed from the network, but they will remain in the community."
        } else text = "";

        sweet.show({
            title: "Are you sure?",
            text: text,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete " + self.community.name + "!",
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
                            text: "The " + self.community.name + " community is gone.",
                            type: "success"
                        }, function() {
                            $uibModalInstance.close();
                            $state.reload();
                        })
                    }
                });
        });
    };

    this.cancel = function () {
        self.working = false;
        $uibModalInstance.dismiss('cancel');
    };
}