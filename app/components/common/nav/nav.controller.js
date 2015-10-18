angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController)
    .controller('ChangeLocationController', ChangeLocationController);

function NavigationController($auth, $state, $window, $location, $stateParams, $modal, user, location, community, communities, knowtify) {
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

        knowtify.push(['load_inbox', 'knowtify', {id: this.user.key, email: this.user.profile.email}]);

    }

    // PRIMARY LEFT-NAV ITEM LIST
    if (!this.community) this.community = communities.data[this.location_path];
    // sort communities for use in nav and child dashboard pages
    for (item in communities.data) { // no clue what item is here, esp if user or company
        if (item !== this.community.key) { // edco-stable-of-experts
            if (communities.data[item]) {
                switch (communities.data[item].type) {
                    case "location":
                        if (!this.locations) this.locations = {};
                        this.locations[item] = communities.data[item];
                        break;
                    case "cluster":
                        if (!this.clusters) this.clusters = {};
                        this.clusters[item] = communities.data[item];
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

    this.communities = communities.data; // used in company list views

    // to avoid duplicate location_path / community_path when navigating to people & companies
    this.nav_url = this.location_path == this.community.key ?
        "({location_path: nav.location_path, community: nav.community, query: '*'})" :
        "({location_path: nav.location_path, community: nav.community, query: '*', community_path: nav.community.key})";

    // to set correct root path when navigating from user or company page
    this.nav_jump = this.community.type == "user" || this.community.type == "company" ?
        "({community_path: item.key, community: item, query: '*', location_path: nav.location.key})" :
        "({community_path: item.key, community: item, query: '*'})";


    // BREADCRUMBS

    if (this.community.type == "user") {
        if (this.location.key == this.community.key) this.location = communities.data[this.community.profile.home];
    }

    // SEARCH

    if ($stateParams.query) this.search.query = $stateParams.query;

    if (this.community.type == "cluster" || this.community.type == "network") {
        if (this.community.community_profiles && this.community.community_profiles[this.location_path]) {
            this.searchname = this.community.community_profiles[this.location_path].name;
        } else this.searchname = this.community.profile.name;
    } else this.searchname = this.location.profile.name;

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
                    return user.path;
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

    // CHANGE LOCATION

    this.changeLocation = function() {
        var modalInstance = $modal.open({
            templateUrl: 'components/common/nav/nav.change_location.html',
            controller: ChangeLocationController,
            windowClass: "hmodal-warning"
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
                location_key: function() {
                    return $stateParams.location_path;
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
                community: function() {
                    return self.community;
                },
                location_key: function() {
                    return $stateParams.location_path;
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
            domain;

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
        if ($window.localStorage) verified = $window.localStorage.getItem(domain + '_embed_verified');

        if (!verified) {


            if (this.community.type === 'cluster' && this.community.community_profiles[this.location_path] && this.community.community_profiles[this.location_path].embed) {
                embed = this.community.community_profiles[this.location_path].embed;
            } else embed = this.community.profile.embed;

            if (embed) {
                for (u in embed) {
                    if (embed[u].url == domain) {
                        verified = true;
                        this.color = embed[u].color;
                        $window.localStorage && $window.localStorage.setItem(domain + '_embed_verified', true);
                        $window.localStorage && $window.localStorage.setItem(domain + '_embed_color', this.color);
                    }
                }
            }

            if (!verified) $state.go('500');
        } else {
            this.color = $window.localStorage.getItem(domain + '_embed_color');
        }
    }

    //this.embedded = true; // for testing

}

function ChangeLocationController($modalInstance){
    this.ok = function () {
        $modalInstance.close();
    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function CommunitySettingsController($modalInstance, $state, sweet, community_service, community, location_key){

    this.community = community;
    this.location_key = location_key;
    var self = this;

    if (community.type == 'cluster' && self.community.community_profiles[location_key] && self.community.community_profiles[location_key].embed) {
        this.embed = self.community.community_profiles[location_key].embed;
    } else this.embed = this.community.profile.embed;

    this.addEmbed = function() {
        if (self.form.$valid) {
            if (!self.embed) {
                self.embed = [];
            }
            self.embed.push({
                "url" : self.formdata.embed_url_value,
                "color" : self.formdata.embed_color_value
            })
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
                        text: "Here's what we know: " + response.data.message,
                        type: "error"
                    });

                } else {
                    sweet.show({
                        title: "Settings saved!",
                        type: "success"
                    }, function(){
                        $modalInstance.close();
                        $state.reload();
                    });
                }
            });
    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
        $state.reload();
    };
}

function addClusterController($modalInstance, $state, sweet, community_service, community, location_key){

    this.community = community;
    this.location_key = location_key;
    this.name = ""; // to avoid 'undefined' for initial url
    var self = this;

    this.parents = [ 'Agriculture', 'Art', 'Construction', 'Consumer Goods', 'Corporate', 'Education', 'Finance', 'Government', 'Healthcare', 'Legal', 'Manufacturing', 'Medical', 'Non-Profit', 'Recreation', 'Services', 'Tech', 'Transportation' ];

    this.industryList = community_service.industries();

    this.encode = function(uri) {
        return encodeURI(uri);
    };

    this.createCluster = function() {
        if (self.form.$valid) {

            var cluster = {
                type: "cluster",
                profile: {
                    name: self.name,
                    headline: self.headline,
                    parents: [self.parent],
                    industries: self.industries
                }
            };

            community_service.addCommunity(cluster, self.location_key, self.community.key)
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
                            $modalInstance.close();
                            $state.reload();
                        });
                    }
                });

            //

        } else {
            self.submitted = true;
        }
    };

    this.save = function () {

        $modalInstance.close();

        community_service.setSettings(self.embed, self.location_key, self.community.key)
            .then(function(response) {

                if (response.status !== 201) {
                    sweet.show({
                        title: "Sorry, something went wrong.",
                        text: "Here's what we know: " + response.data.message,
                        type: "error"
                    });

                } else {
                    sweet.show({
                        title: "Cluster created!",
                        type: "success"
                    });

                    $state.reload();
                }
            });
    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
        $state.reload();
    };
}