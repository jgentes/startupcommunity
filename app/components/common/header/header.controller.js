angular
    .module('startupcommunity')
    .controller('HeaderController', HeaderController);

function HeaderController($stateParams, community, communities) {

    this.community = community;
    this.location = $stateParams.location;

    switch(community.type) {
        case "user":
            this.parent_state = "people.dashboard({community_key: header.location.key || header.community.profile.home})";
            if (!this.location) this.location = communities.data[community.profile.home];
            break;
        case "startup":
            this.parent_state = 'startups.dashboard({community_key: header.community.profile.home})';
            if (!this.location) this.location = communities.data[community.profile.home];
            break;
        case "network":
            this.parent_state = 'location.dashboard({community_key: header.community.profile.home})';
            this.location = communities.data[community.profile.home];
            break;
        case "industry":
            this.parent_state = 'location.dashboard({community_key: header.location.key})';
            this.location = ($stateParams.location.key ? communities.data[$stateParams.location.key] : communities.data[community.key]);
            break;
        case "location":
            this.parent_state = 'location.dashboard({community_key: header.community.key})';
            this.location = communities.data[community.key];
            break;
    }
    /*
    if (this.parent_state) {
        switch(this.location.type) {
            case "network":
                this.parent_state = "network.dashboard({community_key: header.location.key})";
                break;
            case "industry":
                this.parent_state = "industry.dashboard({community_key: header.location.key, location.key: header.community.key})";
                break;
            case "location":
            case "user":
            case "startup":
                this.parent_state = "({community_key: header.location.key, community: " + communities.data[community.key] + "})";
                break;
        }
    } else {
        switch(this.location.type) {
            case "user":
                this.parent_url = "people.profile({community_key: header.location.key})";
                break;
            case "startup":
                this.parent_url = "startup.profile({community_key: header.location.key})";
                break;
            case "network":
                this.parent_url = "network.dashboard({community_key: header.location.key})";
                break;
            case "industry":
                this.parent_url = "industry.dashboard({community_key: header.location.key, industry_key: header.community.key})";
                break;
            case "location":
                if (this.back) {
                    this.parent_url = this.back + "({community_key: header.location.key, community: " + communities.data[community.key] + "})";
                } else this.parent_url = "location.dashboard({community_key: header.location.key})";
                break;
        }
    }

 */

    if ($stateParams.embed) {
        // assume there's an 'embed settings' somewhere in the network configuration screen which can be used to set color
        $('#main_content').css('background-color:', '#fff');
    }

}