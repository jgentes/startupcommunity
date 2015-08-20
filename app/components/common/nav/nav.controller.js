angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController)
    .controller('ChangeLocationController', ChangeLocationController);

function NavigationController($auth, $state, $location, $stateParams, $modal, user, community, communities) {

    // test for iframe embed, true if embedded
    try {
        this.embedded = window.self !== window.top;
    } catch (e) {
        this.embedded = true;
        this.referrer = document.referrer;
    }
    //this.embedded = false; // for testing
    this.community = community;
    this.location = $stateParams.location;

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

    // sort communities for use in nav and child dashboard pages
    for (item in communities.data) {
        if (communities.data[item].key !== community.key) {
            switch(communities.data[item].type) {
                case "location":
                    if (!this.locations) this.locations = {};
                    this.locations[item] = communities.data[item];
                    break;
                case "industry":
                    if (community.type !== "industry") {
                        if (!this.industries) this.industries = {};
                        this.industries[item] = communities.data[item];
                    }
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

    this.path = $location.path().replace(/\/$/, ""); //used for routing and used in view
    if (!$stateParams.location_key) {
        this.location_key = $stateParams.location.key ? $stateParams.location.key : (this.community.key == $stateParams.community_key ? undefined : $stateParams.community_key);
    } else this.location_key = $stateParams.location_key;

    if (community.type == "user" || community.type == "startup") {
        if (!this.location_key) {
            this.searchname = communities.data[this.community.profile.home].profile.name;
        } else this.searchname = communities.data[this.location_key].profile.name;
    } else if (community.type == "industry") {
        if (this.community.community_profiles[this.location_key]) {
            this.searchname = this.community.community_profiles[this.location_key].name;
        } else this.searchname = this.community.profile.name;
    } else this.searchname = this.community.profile.name;

    this.changeLocation = function() {
        var modalInstance = $modal.open({
            templateUrl: 'components/common/nav/nav.change_location.html',
            controller: ChangeLocationController,
            windowClass: "hmodal-warning"
        });
    };

    // for search box
    this.search = function(query) {
        if (community.type == "industry") {
            $state.go('industry.search.dashboard', {parent_key: community.key, query: query});
        } else if (community.type == "user" || community.type == "startup") {
            $state.go('search.dashboard', {community_key: this.community.profile.home, query: query});
        } else $state.go('search.dashboard', {query: query});

    };

    // for routing of root routes
    if (this.path.split('/').length < 3) {
        switch (community.type) {
            case "user":
                $state.go('people.profile');
                break;
            case "startup":
                $state.go('startups.profile');
                break;
            case "location":
                $state.go('location.dashboard');
                break;
            case "network":
                $state.go('network.dashboard');
                break;
            case "industry":
                $state.go('industry.dashboard');
                break;
        }
    }
    console.log('stateParams:');
    console.log($stateParams);
    console.log('community.key: '+ this.community.key);
    console.log('location_key: ' + this.location_key);

}

function ChangeLocationController($state, $modalInstance){
    $state.ok = function () {
        $modalInstance.close();
    };

    $state.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}