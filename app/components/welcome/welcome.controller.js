angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($scope, $auth, $location, $q, $http, $mixpanel, $stateParams, $state, sweet, user_service, community_service) {
    var self = this,
        user = $scope.global.user,
        community_path = $stateParams.community_path ? $stateParams.community_path : $stateParams.location_path;
    
    $scope.global.location = jQuery.isEmptyObject($scope.global.location) ? $scope.global.community.profile.name : $scope.global.location.profile.name.split(',')[0];
    this.panel = 'auth';
    this.working = false; // used for waiting indicator
    this.industries = []; // need a placeholder until next call is resolved
    this.industries = community_service.industries();
    this.parents = []; // need a placeholder until next call is resolved
    this.parents = community_service.parents();
    this.quote = true;
    this.submitted = false;

    var checkProfile = function() {
        if (!user.profile["name"]) $scope.global.user.profile["name"] = user.profile.linkedin.firstName + ' ' + user.profile.linkedin.lastName;
        if (!user.profile["email"]) $scope.global.user.profile["email"] = user.profile.linkedin.emailAddress;
        if (!user.profile["headline"]) $scope.global.user.profile["headline"] = user.profile.linkedin.headline;
        if (!user.profile["avatar"]) $scope.global.user.profile["avatar"] = user.profile.linkedin.pictureUrl;
        if (!user.profile["summary"]) $scope.global.user.profile["summary"] = user.profile.linkedin.summary;

        if (user.roles) {
            if (!self.roles) self["roles"] = {};
            for (role in user.roles) {
                if (role !== 'leader') {
                    self.roles[role] = true;
                }
            }
        }

        if (user.profile.skills) {
            self.skills = user.profile.skills;
        } else self.skills =[];

        if (user.profile.parents) {
            switch(user.profile.parents[0]) {
                case 'consumer-goods':
                    self.selectedParent = 'Consumer Goods';
                    break;
                case 'non-profit':
                    self.selectedParent = 'Non-Profit';
                    break;
                default:
                    self.selectedParent = user.profile.parents[0][0].toUpperCase() + user.profile.parents[0].slice(1);
            }
        }
    };

    // for role selection

    this.selectRoles = [{
        value: 'not involved',
        text: 'not involved'
    }, {
        value: 'founder',
        text: 'Founder',
        description: "You have started or co-founded a business venture."
    }, {
        value: 'investor',
        text: 'Investor',
        description: "You are an active investor in startup companies."
    },{
        value: 'team',
        text: 'Team Member',
        description: "You are a current employee or team member of a local company."
    },{
        value: 'mentor',
        text: 'Mentor',
        description: "You are willing to provide guidance to entrepreneurs without compensation - the 'give before you get' philosophy."
    },{
        value: 'provider',
        text: 'Service Provider',
        description: "You provide services to community members for a fee."
    }];

    this.authenticate = function() {

        self.working = true;
        if (!$location.search().invite_code) {
            this.alert = {type: 'danger', message: 'You must have an invitation to continue. Please check your email and click on the link provided there.'};
            self.working = false;
        } else {
            $auth.authenticate('linkedin', {invite_code: $location.search().invite_code})
                .then(function(response) {

                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: 'There was a problem: ' + String(response.data.message) };
                    } else {
                        $scope.global.user = response.data.value;
                        $scope.global.user["key"] = response.data.path.key;
                        self.quote = false;

                        checkProfile();

                        $mixpanel.identify(response.data.path.key);
                        $mixpanel.track('Accepted Invite');

                        self.panel = 'roles';
                    }

                })
                .catch(function(response) {
                    if (response.error || response.data) {
                        self.alert = {type: 'danger', message: String(response.error || response.data.message)};
                    } else self.alert = undefined;
                });

            self.working = false;
        }
    };

    // if already authenticated, just move straight to roles

    if (user && user.profile) {
        checkProfile();
        this.panel = 'roles';
    }

    // for profile pic upload to S3
    this.uploadAvatar = function (file) {

        if (file) {
            // get the secure S3 url
            user_service.getProfileUrl(file.name)
                .then(function(response) {
                    var signedUrl = response.data.put,
                        fileUrl = response.data.get;

                    var d_completed = $q.defer();
                    var xhr = new XMLHttpRequest();
                    xhr.file = file;

                    xhr.onreadystatechange = function(e) {
                        if ( 4 == this.readyState ) {
                            $scope.global.user.profile["avatar"] = fileUrl;
                            d_completed.resolve(true);
                        }
                    };
                    xhr.open('PUT', signedUrl, true);
                    xhr.setRequestHeader("Content-Type","application/octet-stream");
                    xhr.send(file);
                })
        } else self.alert = { type: 'danger', message: 'Please select a file!' };

    };
    
    this.submitProfile = function() {

        if (self.selectedParent) {
            self.panel = 'skills';
            self.submitted = false;
        } else self.submitted = true;

    };    
    
    this.clickToTweet = function() {
        var getQuote = document.getElementById( "quote" ).innerHTML;

        window.open( "http://twitter.com/intent/tweet?text=" + getQuote + "%20via%20StartupCommunity.org&related=startupyourcity&", "twitterwindow", "height=450, width=550, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0" );

    };

    this.submit = function() {
        self.submitted = true;

        user = $scope.global.user;

        // add roles
        if (!user.roles) {
            user["roles"] = {};
        }

        for (role in self.roles) {
            // do not allow founder of location
            if (!((role == 'founder') && (community_path == $stateParams.location_path))) {

                if (!user.roles[role]) {
                    user.roles[role] = {};
                    user.roles[role][community_path] = [$stateParams.location_path];
                    user.roles[role][$stateParams.location_path] = [$stateParams.location_path];
                } else if (!user.roles[role][community_path]) {
                    user.roles[role][community_path] = [$stateParams.location_path];
                    user.roles[role][$stateParams.location_path] = [$stateParams.location_path];
                } else if (user.roles[role][community_path].indexOf($stateParams.location_path) < 0) {
                    user.roles[role][community_path].push($stateParams.location_path);
                    user.roles[role][$stateParams.location_path] = [$stateParams.location_path];
                } // else it's already there
            }


        }

        // allow user to remove roles
        var rolelist = ['founder', 'investor', 'team', 'mentor', 'provider'];

        for (dRole in rolelist) {
            if (self.roles && !self.roles[rolelist[dRole]]) {
                if (user.roles[rolelist[dRole]] && user.roles[rolelist[dRole]][community_path]) delete user.roles[rolelist[dRole]][community_path];
                if (user.roles[rolelist[dRole]] && user.roles[rolelist[dRole]][$stateParams.location_path]) delete user.roles[rolelist[dRole]][$stateParams.location_path];
                if (jQuery.isEmptyObject(user.roles[rolelist[dRole]])) delete user.roles[rolelist[dRole]];
            }
        }

        // add skills
        user.profile["skills"] = self.skills;

        // add parent industry
        user.profile["parents"] = [self.selectedParent.toLowerCase()];

        // update user profile
        user_service.updateProfile(user)
            .then(function(response) {
                if (response.status !== 200) {
                    self.alert = { type: 'danger', message: String(response.data.message) };
                } else {
                    $http.get('/api/2.1/community/' + user.key + '?nocache=true')
                        .then(function(response) {
                            self.submitted = false;
                            
                            $scope.global.user = response.data;
                            
                            if ($stateParams.go) {
                                $state.go('user.dashboard', {
                                    profile: user,
                                    location_path: user.key,
                                    tour: false
                                });
                            } else {
                                sweet.show({
                                        title: "Welcome.",
                                        text: "Let's have a look at your community.",
                                        type: "success",
                                        showCancelButton: false,
                                        confirmButtonText: "Let's go!",
                                        closeOnConfirm: true
                                    },
                                    function (isConfirm) {
                                        if (isConfirm) {
                                            $state.go('community.dashboard', {
                                                profile: user,
                                                location_path: $stateParams.location_path,
                                                tour: true
                                            });
                                        }
                                    });
                            }
                        })


                }
            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            });

    };

}