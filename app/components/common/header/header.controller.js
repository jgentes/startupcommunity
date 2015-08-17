angular
    .module('startupcommunity')
    .controller('HeaderController', HeaderController);

function HeaderController($stateParams, community, communities) {

    this.community = community;

    switch(community.type) {
        case "user":
        case "startup":
        case "network":
            this.location = communities.data[community.profile.home];
            break;
        case "industry":
        case "location":
            this.location = communities.data[community.key];
            break;
    }
    console.log(this.location.type);
    switch(this.location.type) {
        case "user":
            this.parent_url = "people.profile({community_key: header.location.key})";
            break;
        case "startup":
            this.parent_url = "startup.profile({community_key: header.location.key})";
            break;
        case "network":
            this.parent_url = "network.dashboard({community_key: headerlocation.key})";
            break;
        case "industry":
            this.parent_url = "industry.dashboard({community_key: header.location.key, industry_key: header.community.key})";
            break;
        case "location":
            this.parent_url = "location.dashboard({community_key: header.location.key})";
            break;
    }
    console.log(this.location.profile.name);
    console.log(this.community.key);
    console.log(this.location.key);
    console.log(this.parent_url)


    if ($stateParams.embed) {
        // assume there's an 'embed settings' somewhere in the network configuration screen which can be used to set color
        $('#main_content').css('background-color:', '#fff');
    }

}