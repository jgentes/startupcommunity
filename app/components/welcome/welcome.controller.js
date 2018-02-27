angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($scope, $auth, $location, $q, $mixpanel, $stateParams, $state, sweet, user_service, community_service) {
    var self = this,
        user = $scope.global.user;

    this.panel = 'auth';
    this.working = false; // used for waiting indicator
    this.industries = []; // need a placeholder until next call is resolved
    this.industries = community_service.industries();
    this.parents = []; // need a placeholder until next call is resolved
    this.parents = community_service.parents();
    this.quote = true;
    this.submitted = false;

    var checkProfile = function() {
        if (!user.name) $scope.global.user.name = user.linkedin.firstName + ' ' + user.linkedin.lastName;
        if (!user.email) $scope.global.user.email = user.linkedin.emailAddress;
        if (!user.headline) $scope.global.user.headline = user.linkedin.headline;
        if (!user.avatar) $scope.global.user.avatar = user.linkedin.pictureUrl;
        if (!user.summary) $scope.global.user.summary = user.linkedin.summary;

        if (user.roles) {
            if (!self.rolelist) self["rolelist"] = {};
            for (var role in user.roles) {
                if (role !== 'leader') {
                    self.rolelist[role] = true;
                }
            }
        }

        if (user.skills) {
            self.skills = user.skills;
        } else self.skills =[];

        if (user.parents) {
            switch(user.parents[0]) {
                case 'consumer-goods':
                    self.selectedParent = 'Consumer-Goods';
                    break;
                case 'non-profit':
                    self.selectedParent = 'Non-Profit';
                    break;
                default:
                    self.selectedParent = user.parents[0][0].toUpperCase() + user.parents[0].slice(1);
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
                        $scope.global.user = response.data;
                        $scope.global.user.key = response.data.slug;
                        user = $scope.global.user;
                        self.quote = false;

                        checkProfile();

                        $mixpanel.identify(response.data.slug);
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

    if (user) {
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
                            $scope.global.user.avatar = fileUrl;
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

    this.changeRole = function(selection) {
        console.log(selection, user.roles)
        if (!user.roles[selection]) {
            self.rolelist[selection] = !self.rolelist[selection];
        } else if (Object.slugs(user.roles[selection]).length == 1 && Object.slugs(user.roles[selection]).indexOf($stateParams.location_path) == 0) {
            self.rolelist[selection] = !self.rolelist[selection];
        } else {

            sweet.show({
                title: "Hold on a sec.",
                text: "You have this role in one or more companies. You'll need to remove yourself from them before removing this role. Go to your <a href='" + $scope.global.user.slug + "'>profile page</a> to view them.",
                type: "warning",
                html: true
            });
        }
    };

    this.submit = function() {
        self.submitted = true;

        user = $scope.global.user;

        // add roles
        if (!user.roles) {
            user["roles"] = {};
        }

        for (var role in self.rolelist) {
            // do not allow founder of location
            if (!((role == 'founder'))) {

                if (!user.roles[role]) user.roles[role] = {};
                user.roles[role][$stateParams.location_path] = [$stateParams.location_path];
            }
        }

        // allow user to remove roles
        var rolenames = ['founder', 'investor', 'team', 'mentor', 'provider'];
 
        for (var dRole in rolenames) {

            if (self.rolelist && !self.rolelist[rolenames[dRole]]) {
                if (user.roles[rolenames[dRole]] && user.roles[rolenames[dRole]][$stateParams.location_path])
                    delete user.roles[rolenames[dRole]][$stateParams.location_path];
                if (jQuery.isEmptyObject(user.roles[rolenames[dRole]]))
                    delete user.roles[rolenames[dRole]];
            }
        }

        // add skills
        user.skills = self.skills;

        // add parent industry
        user.parents = [self.selectedParent.toLowerCase()];

        // update user profile
        user_service.updateProfile(user)
            .then(function(response) {
                if (response.status !== 200) {
                    self.submitted = false;
                    sweet.show({
                        title: "Sorry, something went wrong.",
                        text: "Here's what we know: " + response.data.message,
                        type: "error"
                    }, function() {
                        $state.go('community.dashboard', {
                            location_path: $stateParams.location_path,
                            community_path: '',
                            tail_path: '',
                            tour: true
                        });
                    });
                } else {
                    self.submitted = false;
                    $scope.global.user = response.data.user;

                    if (!$location.search().invite_code) {
                        $state.go('user.dashboard', {
                            profile: $scope.global.user,
                            location_path: $scope.global.user.slug,
                            community_path: '',
                            tail_path: '',
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
                                        profile: $scope.global.user,
                                        location_path: $stateParams.location_path,
                                        community_path: '',
                                        tail_path: '',
                                        tour: true
                                    });
                                }
                            });
                    }

                }
            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            });

    };

}