angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController);

function NavigationController($auth, $state, $window, $timeout, $location, $scope, $stateParams, $modal, user_service, community_service, user, location, community, communities, knowtify, errorLogService) {
    if (user.data && user.data.token) $auth.setToken(user.data.token); // update local storage with latest user profile

    // SENSITIVE VARIABLES THAT AFFECT NAVIGATION AND ALL CHILD TEMPLATES
    // When used in ui-sref links: location_path affects the url, location affects header and content, community affects header and secondary url
    try { // catch any initial db connectivity problems
        this.location = jQuery.isEmptyObject(location) ? community : location;
        this.community = jQuery.isEmptyObject($stateParams.community) ?
            (community.key !== this.location.key ?
                community :
                this.location) :
            $stateParams.community;
        this.location_path = $stateParams.location_path || $stateParams.location.key || this.community.key;
    }
    catch(err) {
        $state.go('404');
    }

    var self = this;

    // ANONYMOUS ACCESS OR PROFILE DISPLAY

    if ($auth.isAuthenticated() && user.data.user) {

        this.user = user.data.user; // reference 'this' by using 'nav' from 'NavigationController as nav' - * nav is also usable in child views *

        knowtify.push(['load_inbox', 'knowtify', {email: this.user.profile.email}]);

        $window.HelpCrunch('onReady', function() {
            newMessage();
        });

        var newMessage = function() {
            $window.HelpCrunch('onNewUnreadMessages', function(event) {
                self.chatMessageCount = event.unreadMessages;
                $timeout(function() {
                    $scope.$apply();
                });
            });
        }
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
    if (!this.community) this.community = communities.data[this.location_path];
    if (!this.community) {
        // if still no community, there's a problem, reload the app
        $window.location.reload();
    }

    this.communities = communities.data; // used in company list views

    var parents = community_service.parents();
    parents[parents.indexOf("Consumer Goods")] = "consumer-goods";
    parents = parents.join('|').toLowerCase().split('|'); // change all to lowercase

    // sort communities for use in nav and child dashboard pages
    for (item in communities.data) { // no clue what item is here, esp if user or company
        if (item !== this.community.key) { // ie. edco-stable-of-experts
            if (communities.data[item]) {
                switch (communities.data[item].type) {
                    case "location":
                        if (!this.locations) this.locations = {};
                        this.locations[item] = communities.data[item];
                        break;
                    case "cluster":
                        if (!this.clusters) this.clusters = {};
                        if (parents.indexOf(item) > -1) {
                            if (!this.parents) this.parents = {};
                            this.parents[item] = communities.data[item];
                        } else this.clusters[item] = communities.data[item];
                        break;
                    case "network":
                        if (!this.networks) this.networks = {};
                        this.networks[item] = communities.data[item];
                        break;
                    default:
                        break;
                }
            }
        }
    }

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
        if (this.location.key == this.community.key) this.location = communities.data[this.community.profile.home];
    }

    // to avoid duplicate location_path / community_path when navigating to people & companies
    this.nav_url = this.location_path == this.community.key ?
        "({location_path: nav.location_path, community: nav.community, query: '*'})" :
        "({location_path: nav.location_path, community: nav.community, query: '*', community_path: nav.community.key})";

    // to set correct root path when navigating from user or company page

    this.nav_jump = (this.location && this.location.type == 'location') || ((this.community.type == "user" || this.community.type == "company") &&
        (this.location && this.location.type == 'location')) ?

        "({community_path: item.key, community: item, query: '*', location_path: nav.location.key})" :
        "({community_path: item.key, community: item, query: '*', location_path: nav.location.profile.home})";

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

        var modalInstance = $modal.open({
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

    this.communitySettings = function() {

        var modalInstance = $modal.open({
            templateUrl: 'components/common/nav/nav.community_settings.html',
            controller: CommunitySettingsController,
            controllerAs: 'settings',
            windowClass: "hmodal-success",
            resolve: {
                community: function() {
                    return self.community;
                },
                location: function() {
                    return self.location;
                },
                location_key: function() {
                    return $stateParams.location_path;
                },
                user: function() {
                    return self.user;
                }
            }
        });
    };

    // ADD NETWORK

    this.addNetwork = function() {

        var modalInstance = $modal.open({
            templateUrl: 'components/common/nav/nav.add_network.html',
            controller: addNetworkController,
            controllerAs: 'add',
            windowClass: "hmodal-info",
            resolve: {
                location: function() {
                    return self.location;
                }
            }
        });
    };


    // ADD CLUSTER

    this.addCluster = function() {

        var modalInstance = $modal.open({
            templateUrl: 'components/common/nav/nav.add_cluster.html',
            controller: addClusterController,
            controllerAs: 'add',
            windowClass: "hmodal-success",
            resolve: {
                location: function() {
                    return self.location;
                }
            }
        });
    };

    // REQUEST INVITATION

    this.requestInvitation = function() {

        var modalInstance = $modal.open({
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
                    return self.location;
                }
            }
        });
    };

    // INVITE PEOPLE

    this.invitePeople = function() {

        var modalInstance = $modal.open({
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

    this.addCompany = function() {

        var modalInstance = $modal.open({
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
                }
            }
        });
    };


    // *** ROUTING OF ROOT PATHS ***

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


    // CHECK FOR IFRAME (redirect, if needed, must happen after routing)
    var embed;
    this.embedded = false;

    try {
        this.embedded = window.self !== window.top;
    } catch (e) {
        this.embedded = true;
    }

    if (this.embedded) {
        var verified = false,
            expired = true,
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
        if ($window.localStorage && $window.localStorage.getItem('startupcommunity-embed')) {
            var storage = JSON.parse($window.localStorage.getItem('startupcommunity-embed'))[domain];
            if (storage) {
                verified = storage.verified;
                expired = storage.expired > Date.now();
            }
        }

        if (!verified || expired) {

            if (this.community.type === 'cluster' && this.community.community_profiles[this.location_path] && this.community.community_profiles[this.location_path].embed) {
                embed = this.community.community_profiles[this.location_path].embed;
            } else embed = this.community.profile.embed;

            if (embed) {
                for (u in embed) {
                    if (embed[u].url == domain) {
                        verified = true;
                        this.color = embed[u].color;
                        if ($window.localStorage) {
                            var domain_embed = {};
                            domain_embed[domain] = {
                                "verified" : true,
                                "color" : this.color,
                                "full" : embed[u].full,
                                "expire" : Date.now() + 1800
                            };
                            $window.localStorage.setItem('startupcommunity-embed',JSON.stringify(domain_embed));
                        }
                        if (embed[u].full) this.embedded = false;
                    }
                }
            }

            if (!verified) $state.go('500');
        } else {
            if (storage) {
                this.color = storage.color;
                if (storage.full) this.embedded = false;
            }
        }
    }

    //this.embedded = true; // for testing

}

function CommunitySettingsController($modalInstance, $state, sweet, user, community_service, community, location, location_key){

    this.user = user;
    this.location_key = location_key;
    var self = this;

    //force pull of community settings every time to avoid stale data
    community_service.getKey(community.key)
        .then(function(response) {
            self.community = response.data;

            if (community.type == 'cluster' && self.community.community_profiles[location_key] && self.community.community_profiles[location_key].embed) {
                self.embed = self.community.community_profiles[location_key].embed;
            } else self.embed = self.community.profile.embed;

        });



    this.addEmbed = function() {
        if (self.form.$valid) {
            if (!self.embed) {
                self.embed = [];
            }

            self.embed.push({
                "url" : self.formdata.embed_url_value,
                "color" : self.formdata.embed_color_value || '#fff',
                "full" : self.formdata.embed_full_value || false
            });

        } else {
            self.form.submitted = true;
        }
    };

    this.removeEmbed = function(index) {
        self.embed.splice(index, 1);
    };

    this.save = function () {

        community_service.setSettings(self.embed, self.location_key, self.community.key)
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
                        $modalInstance.close();
                    });
                }
            });
    };

    this.delete = function () {

        sweet.show({
            title: "Are you sure?",
            text: "You cannot recover this once it has been deleted!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete " + self.community.profile.name + "!",
            closeOnConfirm: false
        }, function () {

            community_service.deleteCommunity(self.community, self.location_key)
                .then(function(response) {

                    if (response.status !== 204) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: response.data.message,
                            type: "error"
                        });

                    } else {
                        sweet.show({
                            title: "Deleted!",
                            text: "The " + self.community.profile.name + " community is gone.",
                            type: "success"
                        }, function() {
                            $modalInstance.close();
                            $state.go('community.dashboard', {location_path: self.location_key, community_path: null, community: location});
                        })
                    }
                });

        });


    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function addClusterController($modalInstance, $stateParams, $mixpanel, sweet, community_service, location, $http, $window){

    this.location = location;
    this.name = ""; // to avoid 'undefined' for initial url
    var self = this;

    this.parents = [ 'Agriculture', 'Art', 'Construction', 'Consumer Goods', 'Corporate', 'Education', 'Finance', 'Government', 'Healthcare', 'Legal', 'Manufacturing', 'Medical', 'Non-Profit', 'Recreation', 'Services', 'Tech', 'Transportation' ];

    this.industryList = community_service.industries();

    this.encode = function(uri) {
        return encodeURI(uri);
    };

    this.createCluster = function() {
        if (self.form.$valid) {

            if (self.url) {
                try {
                    self.url = this.encode(self.url);
                }
                catch (e) {
                    sweet.show({
                        title: "Sorry, something is wrong with the url path.",
                        type: "error"
                    });
                    self.submitted = true;
                }
            }

            var cluster = {
                type: "cluster",
                profile: {
                    name: self.name,
                    headline: self.headline,
                    parents: [self.parent],
                    industries: self.industries
                },
                url: self.url
            };

            community_service.addCommunity(cluster, self.location.key)
                .then(function(response) {

                    if (response.status !== 201) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: response.data.message,
                            type: "error"
                        });

                    } else {
                        sweet.show({
                            title: "Cluster created!",
                            type: "success"
                        }, function(){
                            $http.get('/api/2.1/community/' + $stateParams.location_path); // refresh outdated cache
                            $modalInstance.close();
                            $window.location.reload();
                        });
                    }
                    $mixpanel.track('Added Cluster');
                });

            //

        } else {
            self.submitted = true;
        }
    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function addNetworkController($modalInstance, $stateParams, $mixpanel, sweet, community_service, location, $http, $window){

    this.location = location;
    this.name = ""; // to avoid 'undefined' for initial url
    var self = this;

    this.parents = [ 'Accelerator', 'College', 'Coworking Space', 'Incubator', 'Investment Fund', 'Mentor Group', 'VC Firm' ];

    this.encode = function(uri) {
        return encodeURI(uri);
    };

    this.createNetwork = function() {
        if (self.form.$valid) {

            if (self.url) {
                try {
                    self.url = this.encode(self.url);
                }
                catch (e) {
                    sweet.show({
                        title: "Sorry, something is wrong with the url path.",
                        type: "error"
                    });
                    self.submitted = true;
                }
            }

            var network = {
                type: "network",
                profile: {
                    name: self.name,
                    headline: self.headline,
                    parents: [self.parent]
                },
                url: self.url
            };

            community_service.addCommunity(network, self.location.key)
                .then(function(response) {

                    if (response.status !== 201) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: response.data.message,
                            type: "error"
                        });

                    } else {
                        sweet.show({
                            title: "Network created!",
                            type: "success"
                        }, function(){
                            $http.get('/api/2.1/community/' + $stateParams.location_path); // refresh outdated cache
                            $modalInstance.close();
                            $window.location.reload();
                        });
                    }
                    $mixpanel.track('Added Network');
                });

            //

        } else {
            self.submitted = true;
        }
    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}