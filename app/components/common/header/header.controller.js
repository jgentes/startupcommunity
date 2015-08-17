angular
    .module('startupcommunity')
    .controller('HeaderController', HeaderController);

function HeaderController($stateParams, community, communities) {
    console.log($stateParams);
    console.log(community);
    console.log(communities);
    this.community = community;

    switch(community.type) {
        case "user":
            this.back = 'people.dashboard';
            this.location = communities.data[community.profile.home];
            break;
        case "startup":
            this.back = 'startups.dashboard';
            this.location = communities.data[community.profile.home];
            break;
        case "network":
            this.location = communities.data[community.profile.home];
            break;
        case "industry":
        case "location":
            this.location = communities.data[community.key];
            break;
    }

    if (this.back) {
        switch(this.location.type) {
            case "network":
                this.parent_url = "network.dashboard({community_key: header.location.key})";
                break;
            case "industry":
                this.parent_url = "industry.dashboard({community_key: header.location.key, industry_key: header.community.key})";
                break;
            case "location":
                this.parent_url = this.back + "({community_key: header.location.key})";
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
                    this.parent_url = this.back + "({community_key: header.location.key})";
                } else this.parent_url = "location.dashboard({community_key: header.location.key})";
                break;
        }
    }



    if ($stateParams.embed) {
        // assume there's an 'embed settings' somewhere in the network configuration screen which can be used to set color
        $('#main_content').css('background-color:', '#fff');
    }

}