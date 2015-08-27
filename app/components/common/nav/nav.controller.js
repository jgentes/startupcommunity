angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController)
    .controller('ChangeLocationController', ChangeLocationController);

function NavigationController($auth, $state, $location, $stateParams, $modal, user, location, community, communities) {

    // SENSITIVE VARIABLES THAT AFFECT NAVIGATION AND ALL CHILD TEMPLATES
    // When used in ui-sref links: location_path affects the url, location affects header and content, community affects header and secondary url
    try { // catch any initial db connectivity problems
        this.location = jQuery.isEmptyObject($stateParams.location) ? (jQuery.isEmptyObject(location) ? communities.data[$stateParams.location_path] : location) : $stateParams.location;
        this.community = jQuery.isEmptyObject($stateParams.community) ? (community.key !== this.location.key ? community : this.location) : $stateParams.community;
        this.location_path = $stateParams.location_path || $stateParams.location.key || this.community.key;
    }
    catch(err) {
        $state.go('404');
    }

    var self = this;

    // CHECK FOR IFRAME
    this.embedded = false;
    try {
        this.embedded = window.self !== window.top;
    } catch (e) {
        this.embedded = true;
    }

    if (this.embedded) {
        var verified = false;
        var domain;
        this.embed = this.community.profile.embed;

        //find & remove protocol (http, ftp, etc.) and get domain
        if (document.referrer.indexOf("://") > -1) {
            domain = document.referrer.split('/')[2];
        }
        else {
            domain = document.referrer.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];

        if (this.community.type === 'network' || this.community.type === 'industry') {
            if (this.community.community_profiles[this.location_path] && this.community.community_profiles[this.location_path].embed) {
                this.embed = this.community.community_profiles[this.location_path].embed;
            }
        }
        console.log(this.embed);

        if (this.embed) {
            for (u in this.embedd) {
                if (this.embedd[u].url == domain) {
                    console.log('verified!');
                    verified = true;
                    if (this.embedd[u].color) $('#main_content').css('background-color:', this.embed[u].color);
                }
            }
        }

        if (!verified) $state.go('500');
    }

    //this.embedded = true; // for testing

    // ANONYMOUS ACCESS OR PROFILE DISPLAY

    if ($auth.isAuthenticated()) {

        this.user = user.data; // reference 'this' by using 'nav' from 'NavigationController as nav' - * nav is also usable in child views *

        // Role icons displayed in user profile
        var rolelist = [],
            j,
            k,
            role;

        for (j in this.user.communities) {
            for (k in this.user.communities[j]) {
                role = k[0].toUpperCase() + k.slice(1);
                if (rolelist.indexOf(role) < 0) {
                    rolelist.push(role);
                }
            }
        }

        this.user.profile["roles"] = rolelist;

    }

    // PRIMARY LEFT-NAV ITEM LIST

    // sort communities for use in nav and child dashboard pages
    for (item in communities.data) {
        if (item !== this.community.key) {
            switch (communities.data[item].type) {
                case "location":
                    if (!this.locations) this.locations = {};
                    this.locations[item] = communities.data[item];
                    break;
                case "industry":
                    if (!this.industries) this.industries = {};
                    this.industries[item] = communities.data[item];
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

    // to avoid duplicate location_path / community_path when navigating to people & startups
    this.list_url = this.location_path == this.community.key ?
        ".list({location_path: nav.location_path, community: nav.community, query: '*'})" :
        ".list({location_path: nav.location_path, community_path: nav.community.key, community: nav.community, query: '*'})";


    // BREADCRUMBS

    if (this.community.type == "user") {
        if (this.location.key == this.community.key) this.location = communities.data[this.community.profile.home];
    }

    // SEARCH

    if (this.community.type == "industry" || this.community.type == "network") {
        if (this.community.community_profiles && this.community.community_profiles[this.location_path]) {
            this.searchname = this.community.community_profiles[this.location_path].name;
        } else this.searchname = this.community.profile.name;
    } else this.searchname = this.location.profile.name;

    this.search = function(query) {

        if (!query) query = "*";

        if (self.community.type == "industry" || self.community.type == "network") {
            self.location_path == self.community.key ?
                $state.go('search.dashboard', {location_path: self.location_path, community: self.community, query: query}) :
                $state.go('search.dashboard', {location_path: self.location_path, community_path: self.community.key, community: self.community, query: query});
        } else if (self.community.type == "user" || self.community.type == "startup") {
            $state.go('search.dashboard', {location_path: self.community.profile.home, query: query});
        } else $state.go('search.dashboard', {query: query});

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

    // ROUTING OF ROOT PATHS

    this.path = function() {
        return $location.path().replace(/\/$/, ""); //used for routing and used in view
    };

    if (this.path().split('/').length < 3) {
        $state.go(this.community.type + '.dashboard');
    }

}

function ChangeLocationController($modalInstance){
    this.ok = function () {
        $modalInstance.close();
    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function CommunitySettingsController($modalInstance, sweet, community_service, community, location_key){

    this.community = community;
    this.location_key = location_key;
    var self = this;

    this.addEmbed = function() {
        if (self.form.$valid) {
            if (!self.community.profile.embed) {
                self.community.profile["embed"] = [];
            }
            self.community.profile.embed.push({
                "url" : self.formdata.embed_url_value,
                "color" : self.formdata.embed_color_value
            })
        } else {
            self.form.submitted = true;
        }
    };

    this.removeEmbed = function(index) {
        self.community.profile.embed.splice(index, 1);
    };

    this.save = function () {

        $modalInstance.close();

        community_service.setSettings(self.community.profile.embed, self.location_key, self.community.key)
            .then(function(response) {

                if (response.status !== 201) {
                    sweet.show({
                        title: "Sorry, something went wrong.",
                        text: "Here's what we know: " + response.data.message,
                        type: "error"
                    });

                } else {
                    sweet.show({
                        title: "Settings Saved!",
                        type: "success"
                    });

                    $state.go($state.current, {reload: true});
                }
            });
    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}