angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($auth, $q, $http, $window, $mixpanel, $uibModalInstance, $stateParams, $scope, $state, $filter, sweet, community, location, user_service, company_service, community_service, user, company) {
    var self = this;
    this.location = jQuery.isEmptyObject(location) ? community.profile.name : location.profile.name.split(',')[0];
    this.auth = false;
    this.working = false; // used for waiting indicator
    this.updateCompany= false; // used if company already exists
    var community_path = $stateParams.community_path ? $stateParams.community_path : $stateParams.location_path;
    this.industries = []; // need a placeholder until next call is resolved
    this.industries = community_service.industries();
    this.parents = []; // need a placeholder until next call is resolved
    this.parents = community_service.parents();
    this.community = community; // used in add company (not welcome) modal
    this.stages = [ 'Bootstrap', 'Seed', 'Series A', 'Series B', 'Later'];
    this.user = user;
    this.quote = true;

    this.shouldIadd = function() {
        self.alert = {type: "warning", message: "Startups find experts based on their work experience. If you work with the company while living in the community, you should add it."}
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

        if (self.selectedParent) {
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

    // for role selection on companies page

    this.selectRoles = user_service.roles();
    
    if (!this.selectedRole) this.selectedRole = 'not involved';

    this.showCurrent = function(profile) {
        self.updateCompany = true;
        self.notlisted = false;
        var oldco = profile;
        self.company = oldco.profile.name;
        if (!self.selectedCompany) self.selectedCompany = {};
        if (oldco.profile.angellist) self.selectedCompany = oldco.profile;
        self.selectedCompany['name'] = oldco.profile.name;
        self.selectedCompany['key'] = oldco.key;
        if (oldco.profile.industries) self.selectedCompany['industries'] = oldco.profile.industries;
        if (oldco.profile.stage) self.selectedCompany['stage'] = oldco.profile.stage;
        if (oldco.profile.headline) self.selectedCompany['high_concept'] = oldco.profile.headline;
        if (oldco.profile.summary) self.selectedCompany['product_desc'] = oldco.profile.summary;
        if (oldco.profile.avatar) self.selectedCompany['avatar'] = oldco.profile.avatar;

        if (oldco.profile.parents) {
            switch(oldco.profile.parents[0]) {
                case 'consumer-goods':
                    self.selectedCompany['parent'] = 'Consumer Goods';
                    break;
                case 'non-profit':
                    self.selectedCompany['parent'] = 'Non-Profit';
                    break;
                default:
                    self.selectedCompany['parent'] = oldco.profile.parents[0][0].toUpperCase() + oldco.profile.parents[0].slice(1);
            }
        }

        for (role in self.user.roles) {
            for (co in self.user.roles[role]) {
                if (co == oldco.key) {
                    self.selectedRole = role;
                    break;
                }
            }
        }
        self.alert = { type: 'warning', message: self.selectedCompany.name + ' is already in the system, but you may update it.'};
    };

    if (company) {
        // if company is passed in, probably editing existing company profile
        this.showCurrent(company);
        this.update = true;
        this.alert = undefined;
    }

    $scope.$watch('welcome.selectedCompany.id', function(newVal, oldVal) {
        if (newVal) {
            $http.get('/api/2.1/angel/startup?id=' + newVal)
                .then(function(response){
                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: String(response.data.message) };
                    } else {
                        self.selectedCompany = response.data;
                        // check whether company exists in local db, and if so, fill out fields with existing data
                        company_service.search(null, null, '@value.profile.angellist.id: ' + newVal, null, 1)
                            .then(function(response) {
                                if (response.data.count > 0) {
                                    self.showCurrent(response.data.results[0].value);
                                }
                            })
                    }
                }, function(error) {
                    self.alert = { type: 'danger', message: 'There was a problem!' };
                    console.warn(error);
                });
        }
    });

    this.checkName = function() {
        self.checking = true;
        company_service.search(null, null, '@value.profile.name: (' + self.company + ') AND @value.type: "company"', null, 10)
            .then(function(response) {
                if (response.data.count > 0) {
                    self.duplist = response.data.results;
                    // display list of potential matches to user
                    self.dups = [];
                    for (c in self.duplist) {
                        self.dups.push(self.duplist[c]);
                    }
                }
                self.selectedCompany = { name: self.company };
                self.checking = false;
            })
    };

    this.addCompany = function(e, resource) {
        if (e) e.preventDefault();

        if (self.selectedRole && (self.selectedRole !== 'not involved')) {
            if (!self.roles[self.selectedRole]) self.roles[self.selectedRole] = true;
        }

        if (self.selectedCompany && self.selectedCompany.parent) {
            // adjust parent industry caps
            self.selectedCompany.parent = self.selectedCompany.parent.toLowerCase();

            self.selectedCompany.resource = resource || false;

            if (angular.element('.summary_form a').hasClass('editable-hide')) {
                // they've edited the summary but haven't clicked checkmark to accept changes
                self.alert = { type: 'danger', message: 'You made changes to the summary. Please accept or cancel them before updating.' };
            } else {

                self.working = true;
                var role = self.selectedRole == 'not involved' ? undefined : self.selectedRole;

                if (community.type == 'cluster') community_path = location.key; // do not allow companies to be added directly to clusters
                if (community.type == 'network' && (self.user.roles && self.user.roles.leader && self.user.roles.leader[community.key]) && (self.user.roles.leader[community.key].indexOf(location.key) < 0)) community_path = location.key;
                console.log(self.selectedCompany)

                    company_service.addCompany(self.selectedCompany, role, location.key, community_path, self.selectedCompany.key)
                        .then(function(response) {
                            self.working = false;

                            if (response.status !== 200) {
                                sweet.show({
                                    title: "Sorry, something went wrong.",
                                    text: response.data.message,
                                    type: "error"
                                });

                            } else {
                                sweet.show({
                                    title: "Success!",
                                    text: response.data.message,
                                    type: "success"
                                }, function() {
                                    
                                    var co_key = response.data.key;

                                    // update local profile with company data

                                    if (!self.user.roles) {
                                        self.user["roles"] = {};
                                    } else {
                                        // search for existing role and delete if found

                                        for (r in self.user.roles) {
                                            for (co in self.user.roles[r]) {
                                                if (co == co_key) {
                                                    delete self.user.roles[r][co];
                                                }
                                            }
                                        }
                                    }

                                    if (self.selectedCompany && self.selectedCompany.key) $http.get('/api/2.1/community/' + self.selectedCompany.key + '?nocache=true');

                                    // add new role

                                    if (!self.user.roles[role]) {
                                        self.user.roles[role] = {};
                                        self.user.roles[role][co_key] = [location.key];
                                    } else if (!self.user.roles[role][co_key]) {
                                        self.user.roles[role][co_key] = [location.key];
                                    } else if (self.user.roles[role][co_key].indexOf(location.key) < 0) {
                                        self.user.roles[role][co_key].push(location.key);
                                    } // else the damn thing is already there

                                    // add community
                                    if (!self.user.communities) {
                                        self.user["communities"] = {};
                                    }

                                    if (self.user.communities.indexOf(co_key) < 0) {
                                        self.user.communities.push(co_key);
                                    }

                                    self.selectedCompany = undefined;
                                    self.company = undefined;
                                    self.updateCompany = false;
                                    self.selectedRole = 'not involved';
                                    self.submitted = false;
                                    self.dups = undefined;
                                    self.notlisted = false;
                                    if (self.update) self.updated = true;
                                    if ($uibModalInstance) $uibModalInstance.close();
                                })
                            }
                            
                        })
                        .catch(function(error) {
                            self.working = false;
                            self.alert = { type: 'danger', message: String(error.data.message) };
                        })
            }

        } else self.submitted = true;

    };

    this.deleteCompany = function (company_key) {
        self.working = true;

        sweet.show({
            title: "Are you sure?",
            text: "If this company has founders or team members in the system, only they can delete it.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete " + self.selectedCompany.name + "!",
            closeOnConfirm: false
        }, function () {

            company_service.deleteCompany(company_key)
                .then(function(response) {
                    self.working = false;

                    if (response.status !== 204) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: response.data.message,
                            type: "error"
                        });

                    } else {
                        sweet.show({
                            title: "Deleted!",
                            text: self.selectedCompany.name + " is gone.",
                            type: "success"
                        }, function() {
                            $http.get('/api/2.1/community/' + self.user.profile.home); // refresh outdated cache
                            $uibModalInstance.close();
                            $window.location.href = '/' + self.user.profile.home;
                        })
                    }
                });
        });
    };

    this.next = function() {
        if (self.selectedRole && (self.selectedRole !== 'not involved')) {
            if (!self.roles[self.selectedRole]) self.roles[self.selectedRole] = true;
        }

        if (self.selectedCompany) {
            self.alert = {type: "warning", message: "Warning: " + self.selectedCompany.name + " has been selected but hasn't been added yet. Please add the company or cancel before continuing."};
        } else $state.go('welcome.invite');
    };

    this.clickToTweet = function() {
        var getQuote = document.getElementById( "quote" ).innerHTML;

        window.open( "http://twitter.com/intent/tweet?text=" + getQuote + "%20via%20StartupCommunity.org&related=startupyourcity&", "twitterwindow", "height=450, width=550, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0" );

    };

    this.submit = function() {

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