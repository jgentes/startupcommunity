angular
    .module('startupcommunity')
    .controller('NavigationController', NavigationController);

function NavigationController($state, $location, $modal, $stateParams, user, community, communities) {
    console.log('params')
    console.log($stateParams);
    console.log('community')
    console.log(community);
    console.log('communities')
    console.log(communities.data);
    this.user = user.data; // reference 'this' by using 'nav' from 'NavigationController as nav' - * nav is also usable in child views *
    this.path = $location.path(); //used for routing and used in view

    window.$state = $state; // used for console

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

    // sort communities for use in nav and child dashboard pages
    for (item in communities.data) {
        switch(communities.data[item].type) {
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
        }
    }

    // determine what community or location/community we are in and set map appropriately
    var current = this.path.split('/').pop();
    switch(current) {
        case "people":
        case "startups":
            this.community = community;
            this.maploc = this.community.profile.name;
            break;
        default:
            switch (communities.data[current].type) {
                case "location":
                case "industry":
                    this.community = community;
                    this.maploc = this.community.profile.name;
                    break;
                case "network":
                    this.community = community;
                    this.maploc = this.community.profile.home;
                    break;
                case "user":
                case "startup":
                    this.community = communities.data[community.profile.home];
                    this.maploc = this.community.profile.home;
            }



    }

    // used for the 'change' feature displayed on map
    this.setMap = function(center) {
        this.hideChange = false;
        if (!this.latlng) {
            this.latlng = {
                "lat": center.A,
                "lng": center.F
            };
        }
    };

    $('body').on('click', '#changeLocation', function() {
        var modalInstance = $modal.open({
            templateUrl: 'components/common/nav/nav.change_location.html',
            controller: ChangeLocationController,
            windowClass: "hmodal-warning"
        });
    });

    // for routing of root routes
    if (this.path.split('/').length < 3) {
        switch (community.type) {
            case "user":
                $state.go('people.profile');
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
}