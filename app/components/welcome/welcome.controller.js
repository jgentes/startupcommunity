angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($rootScope, $auth, $q, $http, $mixpanel, $stateParams, $state, sweet, user_service, community_service, user) {
    var self = this;
    $rootScope.global.location = jQuery.isEmptyObject($rootScope.global.location) ? $rootScope.global.community.profile.name : $rootScope.global.location.profile.name.split(',')[0];
    this.auth = false;
    this.working = false; // used for waiting indicator
    var community_path = $stateParams.community_path ? $stateParams.community_path : $stateParams.location_path;
    this.industries = []; // need a placeholder until next call is resolved
    this.industries = community_service.industries();
    this.parents = []; // need a placeholder until next call is resolved
    this.parents = community_service.parents();
    this.user = user;
    this.quote = true;
    this.submitted = false;

    var checkProfile = function() {
        if (!self.user.profile["name"]) self.user.profile["name"] = self.user.profile.linkedin.firstName + ' ' + self.user.profile.linkedin.lastName;
        if (!self.user.profile["email"]) self.user.profile["email"] = self.user.profile.linkedin.emailAddress;
        if (!self.user.profile["headline"]) self.user.profile["headline"] = self.user.profile.linkedin.headline;
        if (!self.user.profile["avatar"]) self.user.profile["avatar"] = self.user.profile.linkedin.pictureUrl;
        if (!self.user.profile["summary"]) self.user.profile["summary"] = self.user.profile.linkedin.summary;

        if (self.user.roles) {
            if (!self.roles) self["roles"] = {};
            for (role in self.user.roles) {
                if (role !== 'leader') {
                    self.roles[role] = true;
                }
            }
        }

        if (self.user.profile.skills) {
            self.skills = self.user.profile.skills;
        } else self.skills =[];

        if (self.user.profile.parents) {
            switch(self.user.profile.parents[0]) {
                case 'consumer-goods':
                    self.selectedParent = 'Consumer Goods';
                    break;
                case 'non-profit':
                    self.selectedParent = 'Non-Profit';
                    break;
                default:
                    self.selectedParent = self.user.profile.parents[0][0].toUpperCase() + self.user.profile.parents[0].slice(1);
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
        if (!$stateParams.invite_code) {
            this.alert = {type: 'danger', message: 'You must have an invitation to continue. Please check your email and click on the link provided there.'};
            self.working = false;
        } else {
            $auth.authenticate('linkedin', {invite_code: $stateParams.invite_code})
                .then(function(response) {

                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: 'There was a problem: ' + String(response.data.message) };
                    } else {
                        self.auth = true;
                        self.user = response.data.value;
                        self.user["key"] = response.data.path.key;
                        self.quote = false;

                        checkProfile();

                        $mixpanel.identify(response.data.path.key);
                        $mixpanel.track('Accepted Invite');

                        $state.go('welcome.roles');
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
    if (this.user && this.user.profile) {
        checkProfile();
        if ($stateParams.go) {
            this.auth = true;
            $state.go($stateParams.go);
        }
    }

    // for profile pic upload to S3
    this.uploadAvatar = function (file) {

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
                        self.user.profile["avatar"] = fileUrl;
                        d_completed.resolve(true);
                    }
                };
                xhr.open('PUT', signedUrl, true);
                xhr.setRequestHeader("Content-Type","application/octet-stream");
                xhr.send(file);
            })

    };
    
    this.submitProfile = function() {

        if (self.selectedParent) {
            $state.go('welcome.skills');
            self.submitted = false;
        } else self.submitted = true;

    };    
    
    this.clickToTweet = function() {
        var getQuote = document.getElementById( "quote" ).innerHTML;

        window.open( "http://twitter.com/intent/tweet?text=" + getQuote + "%20via%20StartupCommunity.org&related=startupyourcity&", "twitterwindow", "height=450, width=550, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0" );

    };

    this.submit = function() {
        self.submitted = true;

        // add roles
        if (!self.user.roles) {
            self.user["roles"] = {};
        }

        for (role in self.roles) {
            // do not allow founder of location
            if (!((role == 'founder') && (community_path == $stateParams.location_path))) {

                if (!self.user.roles[role]) {
                    self.user.roles[role] = {};
                    self.user.roles[role][community_path] = [$stateParams.location_path];
                    self.user.roles[role][$stateParams.location_path] = [$stateParams.location_path];
                } else if (!self.user.roles[role][community_path]) {
                    self.user.roles[role][community_path] = [$stateParams.location_path];
                    self.user.roles[role][$stateParams.location_path] = [$stateParams.location_path];
                } else if (self.user.roles[role][community_path].indexOf($stateParams.location_path) < 0) {
                    self.user.roles[role][community_path].push($stateParams.location_path);
                    self.user.roles[role][$stateParams.location_path] = [$stateParams.location_path];
                } // else it's already there
            }


        }

        // allow user to remove roles
        var rolelist = ['founder', 'investor', 'team', 'mentor', 'provider'];

        for (dRole in rolelist) {
            if (self.roles && !self.roles[rolelist[dRole]]) {
                if (self.user.roles[rolelist[dRole]] && self.user.roles[rolelist[dRole]][community_path]) delete self.user.roles[rolelist[dRole]][community_path];
                if (self.user.roles[rolelist[dRole]] && self.user.roles[rolelist[dRole]][$stateParams.location_path]) delete self.user.roles[rolelist[dRole]][$stateParams.location_path];
                if (jQuery.isEmptyObject(self.user.roles[rolelist[dRole]])) delete self.user.roles[rolelist[dRole]];
            }
        }

        // add skills
        self.user.profile["skills"] = self.skills;

        // add parent industry
        self.user.profile["parents"] = [self.selectedParent.toLowerCase()];

        // update user profile
        user_service.updateProfile(self.user)
            .then(function(response) {
                if (response.status !== 200) {
                    self.alert = { type: 'danger', message: String(response.data.message) };
                } else {
                    $http.get('/api/2.1/community/' + self.user.key + '?nocache=true')
                        .then(function(response) {
                            self.submitted = false;
                            
                            if ($stateParams.go) {
                                $state.go('user.dashboard', {
                                    communities: response.data,
                                    profile: self.user,
                                    location_path: self.user.key,
                                    query: '*',
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
                                                communities: response.data,
                                                profile: self.user,
                                                location_path: $stateParams.location_path,
                                                query: '*',
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