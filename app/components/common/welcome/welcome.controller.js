angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($auth, $q, $http, $mixpanel, $stateParams, $scope, $state, $filter, sweet, community, location, user_service, company_service, community_service, user) {
    var self = this;
    this.location = jQuery.isEmptyObject(location) ? community.profile.name : location.profile.name.split(',')[0];
    this.auth = false;
    this.working = false; // used for waiting indicator
    this.updateCompany= false; // used if company already exists
    var community_path = $stateParams.community_path ? $stateParams.community_path : $stateParams.location_path;
    this.industries = community_service.industries();
    this.community = community; // used in add company (not welcome) modal
    this.parents = [ 'Agriculture', 'Art', 'Construction', 'Consumer Goods', 'Corporate', 'Education', 'Finance', 'Government', 'Healthcare', 'Legal', 'Manufacturing', 'Medical', 'Non-Profit', 'Recreation', 'Services', 'Tech', 'Transportation' ];
    this.stages = [ 'Bootstrap', 'Seed', 'Series A', 'Series B', 'Later'];
    this.user = user.data.user ? user.data.user : user;

    this.shouldIadd = function() {
        self.alert = {type: "warning", message: "Startups find experts based on their work experience. If you work with the company while living in the community, you should add it."}
    };

    this.notListed = function() {
        this.alert = {type: "warning", message: "Please <a href='https://angel.co/intro' target='_blank'>click here</a> to create a profile for the startup on AngelList."}
    };

    var checkProfile = function() {
        if (!self.user.profile["name"]) self.user.profile["name"] = self.user.profile.linkedin.firstName + ' ' + self.user.profile.linkedin.lastName;
        if (!self.user.profile["email"]) self.user.profile["email"] = self.user.profile.linkedin.emailAddress;
        if (!self.user.profile["headline"]) self.user.profile["headline"] = self.user.profile.linkedin.headline;
        if (!self.user.profile["avatar"]) self.user.profile["avatar"] = self.user.profile.linkedin.pictureUrl;
        if (!self.user.profile["summary"]) self.user.profile["summary"] = self.user.profile.linkedin.summary;

        if (self.user.roles) {
            if (!self.roles) self["roles"] = {};
            for (role in self.user.roles) {
                self.roles[role] = true;
            }
        }

        if (self.user.profile.skills) {
            if (!self.skills) self.skills =[];
            for (skill in self.user.profile.skills) {
                self.skills.push(self.user.profile.skills[skill]);
            }
        }
    };

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
                        self.user = response.data.user.value;
                        self.user["key"] = response.data.user.path.key;

                        checkProfile();

                        $mixpanel.identify(response.data.user.path.key);
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
    if (this.user.profile) {
        checkProfile();
        this.auth = true;
        $state.go('welcome.roles');
    };

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

    // for startup logo upload to S3
    this.uploadLogo = function (file) {
        // get the secure S3 url
        company_service.getLogoUrl(file.name, self.selectedCompany.name)
            .then(function(response) {
                var signedUrl = response.data.put,
                    fileUrl = response.data.get;

                var d_completed = $q.defer();
                var xhr = new XMLHttpRequest();
                xhr.file = file;

                xhr.onreadystatechange = function(e) {
                    if ( 4 == this.readyState ) {
                        self.selectedCompany.thumb_url = fileUrl;
                        d_completed.resolve(true);
                    }
                };
                xhr.open('PUT', signedUrl, true);
                xhr.setRequestHeader("Content-Type","application/octet-stream");
                xhr.send(file);
            })

    };

    this.submitProfile = function() {

        if (self.user.profile.parent) {
            $state.go('welcome.skills');
            self.submitted = false;
        } else self.submitted = true;

    };

    // for typeahead on company search field
    this.getCompanies = function(val) {
        return $http.get('/api/2.1/angel/startups/search?val=' + val)
        .then(function(response){
            if (!response.data.error) {
                return response.data.slice(0,6).map(function(item){
                    return item;
                });
            } else {
                self.alert = { type: 'danger', message: 'There was a problem: ' + String(response.data.error) };
            }

        }, function(error) {
            self.alert = { type: 'danger', message: 'There was a problem: ' + JSON.stringify(error) };
        });
    };

    // present user with list of roles they selected previously when creating companies
    $scope.$watchCollection('welcome.roles', function(newVal, oldVal) {
        self.selectRoles = [{
            value: 'none',
            text: 'not involved'
        }];
        for (r in newVal) {
            if (newVal[r]) { // only true items
                self.selectRoles.push({
                    value: r,
                    text: r[0].toUpperCase() + r.slice(1)
                })
            }
        }

        self.selectedRole = 'none';

    });

    $scope.$watch('welcome.selectedCompany.id', function(newVal, oldVal) {
        if (newVal) {
            $http.get('/api/2.1/angel/startup?id=' + newVal)
                .then(function(response){
                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: String(response.data.message) };
                    } else {
                        self.selectedCompany = response.data;
                    }
                }, function(error) {
                    self.alert = { type: 'danger', message: 'There was a problem!' };
                    console.warn(error);
                });

            company_service.search(null, null, 'value.profile.angellist.id: ' + newVal, null, 1)
                .then(function(response) {
                    if (response.data.count > 0) {
                        self.updateCompany = true;
                        if (response.data.results[0].value.profile.industries) self.selectedCompany.industries = response.data.results[0].value.profile.industries;
                        if (response.data.results[0].value.profile.parents) self.selectedCompany.parent = response.data.results[0].value.profile.parents[0];
                        if (response.data.results[0].value.profile.stage) self.selectedCompany.stage = response.data.results[0].value.profile.stage;
                        self.alert = { type: 'warning', message: self.selectedCompany.name + ' is already in the system, but you may update the company record.'};
                    }
                })
        }
    });

    // used in add company view
    this.showRole = function() {
        var selected = $filter('filter')(self.selectRoles, {value: self.selectedRole}, true);
        return selected[0].text;
    };

    this.addCompany = function() {

        if (self.selectedCompany.parent) {

            self.working = true;
            var role = self.selectedRole == 'none' ? undefined : self.selectedRole;

            if (community.type == 'cluster') community_path = location.key; // do not allow companies to be added directly to clusters
            if (community.type == 'network' && !(self.user.roles && self.user.roles.leader && self.user.roles.leader[community.key] && self.user.roles.leader[community.key].indexOf(location.key) < 0)) community_path = location.key;

            company_service.addCompany(self.selectedCompany, role, location.key, community_path)
                .then(function(response) {

                    self.working = false;
                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: String(response.data.message) };
                    } else {
                        self.selectedCompany = undefined;
                        self.company = undefined;
                        self.updateCompany = false;
                        self.selectedRole = 'none';
                        self.submitted = false;
                        self.alert = { type: 'success', message: String(response.data.message) };
                    }
                })
                .catch(function(error) {
                    self.working = false;
                    self.alert = { type: 'danger', message: String(error.data.message) };
                })

        } else self.submitted = true;

    };

    this.next = function() {
        if (self.selectedCompany) {
            self.alert = {type: "warning", message: "Warning: " + self.selectedCompany.name + " has been selected but hasn't been added yet. Please add the company or cancel before continuing."};
        } else $state.go('welcome.invite');
    };

    this.submit = function() {

        // add roles
        if (!self.user.roles) {
            self.user["roles"] = {};
        }

        for (role in self.roles) {
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

        // allow user to remove roles
        for (dRole in ['founder', 'investor', 'team', 'mentor', 'provider']) {
            if (self.roles.length && self.roles[dRole] && self.roles[dRole] == false) {
                if (self.user.roles[dRole] && self.user.roles[dRole][community_path]) delete self.user.roles.mentor[community_path];
                if (self.user.roles[dRole] && self.user.roles[dRole][$stateParams.location_path]) delete self.user.roles.mentor[$stateParams.location_path];
            }
        }

        // add skills
        self.user.profile["skills"] = self.skills;

        // add parent industry
        self.user.profile["parents"] = [self.selectedParent];

        // update user profile
        user_service.updateProfile(self.user)
            .then(function(response) {
                if (response.status !== 200) {
                    self.alert = { type: 'danger', message: String(response.data.message) };
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
                                $state.go('community.dashboard', {profile: self.user, location_path: $stateParams.location_path, query: '*', tour: true});
                            }
                        });
                }
            })
            .catch(function(error) {
                self.working = false;
                self.alert = { type: 'danger', message: String(error.data.message) };
            });

    };

}