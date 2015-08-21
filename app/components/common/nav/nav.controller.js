angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController)
    .controller('ChangeLocationController', ChangeLocationController);

function NavigationController($auth, $state, $location, $stateParams, $modal, user, location, community, communities) {

    // SENSITIVE VARIABLES THAT AFFECT NAVIGATION AND ALL CHILD TEMPLATES
    // When used in ui-sref links: location_path affects the url, location affects header and content, community affects header and secondary url

    this.location = jQuery.isEmptyObject($stateParams.location) ? (jQuery.isEmptyObject(location) ? communities.data[$stateParams.location_path] : location) : $stateParams.location;
    this.community = jQuery.isEmptyObject($stateParams.community) ? (community.key !== this.location.key ? community : this.location) : $stateParams.community;
    this.community_path = $stateParams.community_path;
    this.location_path = $stateParams.location_path || $stateParams.location.key || this.community_path;

    // CHECK FOR IFRAME

    try {
        this.embedded = window.self !== window.top;
    } catch (e) {
        this.embedded = true;
        this.referrer = document.referrer;
    }
    //this.embedded = false; // for testing

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

    } else {
        // assume there's an 'embed settings' somewhere in the network configuration screen which can be used to set color
        $('#main_content').css('background-color:', '#fff');
    }

    // PRIMARY LEFT-NAV ITEM LIST

    // sort communities for use in nav and child dashboard pages
    for (item in communities.data) {
        switch(communities.data[item].type) {
            case "location":
                if (item !== this.location.key) {
                    if (!this.locations) this.locations = {};
                    this.locations[item] = communities.data[item];
                }
                break;
            case "industry":
                if (!this.industries) this.industries = {};
                this.industries[item] = communities.data[item];
                break;
            case "network":
                if (item !== this.location.key) {
                    if (!this.networks) this.networks = {};
                    this.networks[item] = communities.data[item];
                }
                break;
            default:
                break;
        }

    }

    // BREADCRUMBS

    if (this.community.type == "user") {
        if (this.location.key == this.community.key) this.location = communities.data[this.community.profile.home];
    }

    // SEARCH
    //this.searchname = this.location.profile.name;

    if (this.community.type == "industry") {
        if (this.community.community_profiles && this.community.community_profiles[this.location_path]) {
            this.searchname = this.community.community_profiles[this.location_path].name;
        } else this.searchname = this.community.profile.name;
    } else this.searchname = this.location.profile.name;

    /*
    if (this.community.type == "user" || this.community.type == "startup") {
        this.searchname = communities.data[this.community.profile.home].profile.name;
        if (!this.location_path) {
            this.searchname = communities.data[this.community.profile.home].profile.name;
        } else this.searchname = communities.data[this.location_path].profile.name;
    } else if (this.community.type == "industry") {
        if (this.community.community_profiles[this.location_path]) {
            this.searchname = this.community.community_profiles[this.location_path].name;
        } else this.searchname = this.community.profile.name;
    } else this.searchname = this.location.profile.name;
*/
    this.search = function(query) {

        if (this.community.type == "industry") {
            $state.go('search.dashboard', {community_path: this.community.key, query: query});
        } else if (this.community.type == "user" || this.community.type == "startup") {
            $state.go('search.dashboard', {location_path: this.community.profile.home, query: query});
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


    // ROUTING OF ROOT PATHS

    this.path = function() {
        return $location.path().replace(/\/$/, ""); //used for routing and used in view
    };

    if (this.path().split('/').length < 3) {
        $state.go(this.community.type + '.dashboard');
    }

};

function ChangeLocationController($state, $modalInstance){
    $state.ok = function () {
        $modalInstance.close();
    };

    $state.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}