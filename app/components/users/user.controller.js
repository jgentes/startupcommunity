angular
    .module('startupcommunity')
    .controller('UserController', UserController)
    .controller('UserProfileController', UserProfileController)
    .controller('InviteUserController', InviteUserController)
    .controller('ContactUserController', ContactUserController);

function UserController($scope, $stateParams, $location, user_service, result_service, $sce) {
    //todo usercontroller and company controller are dups, need to be consolidated

    this.selectedClusters = [];
    this.selectedResources = [];
    this.selectedRole = ['*'];
    this.communityFilter = [$stateParams.location_path];
    
    var self = this; // for accessing 'this' in child functions

    this.url = $stateParams.community_path && $stateParams.location_path ?
        "({community_path: val})" :
        "({location_path: val})";

    this.usercount = 16;

    // Title of list box changes based on context
    var setTitle = function(){
        var item;
        self.role = '';
        self.cluster = '';

        if (self.selectedRole[0] == '*') {
            self.role = "People";
        } else {
            for (item in self.selectedRole) {
                self.role += (self.selectedRole[item][0].toUpperCase() + self.selectedRole[item].slice(1) + 's');
                if (item < self.selectedRole.length - 1) {
                    if (item < self.selectedRole.length - 2 ) {
                        self.role += '</strong>,<strong> ';
                    } else self.role += ' </strong>&<strong> ';
                }
            }
        }

        if (self.selectedClusters.length == 0 && self.selectedResources.length == 0) {
            if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                self.selection = $scope.global.community.community_profiles[$stateParams.location_path].name;
            } else self.selection = $scope.global.community.profile.name;
        } else {
            self.selection = "";
            var selectedCommunities = self.selectedClusters.concat(self.selectedResources);
            for (item in selectedCommunities) {
                self.selection += $scope.global.community[selectedCommunities[item]].profile.name;
                if (item < selectedCommunities.length - 1) {
                    if (item < selectedCommunities.length - 2 ) {
                        self.selection += ', ';
                    } else self.selection += ' & ';
                }
            }
        }

        $scope.global.query = $stateParams.query || undefined;

        if (!$scope.global.query || $scope.global.query == "*") {
            self.title = '<strong>' + self.role + '</strong> in ' + self.selection;
        } else {
            self.title = 'People matching <strong>"' + $scope.global.query + '"</strong> ';
            self.title += ' in <strong>';
            if ($stateParams.community_path && $stateParams.location_path) {
                if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                    self.title += $scope.global.community.community_profiles[$stateParams.location_path].name +'</strong>';
                } else self.title += $scope.global.community.profile.name +'</strong>';
            } else self.title += $scope.global.community.profile.name + '</strong>';
        }

        var pageTitle = '<br><small>' + $scope.global.community.profile.name + '</small>';
        self.pageTitle = $sce.trustAsHtml(pageTitle);
    };

    var loadCtrl = function() {
        onLoad(); // de-register the watcher

        self.searchUsers = function(alturl) {
            self.loadingUser = true;

            // remove random sort
            if (alturl) alturl = alturl.replace(/([&\?]sort=_random*$|sort=_random&|[?&]sort=_random(?=#))/, '');

            if ($scope.global.query && $scope.global.query !== '*') {
                self.tag = $scope.global.query;
            } else self.tag = undefined;

            var limit = $location.search().limit;

            setTitle();

            user_service.search(self.communityFilter, self.clusterFilter, $scope.global.query, undefined, limit || self.usercount, alturl)
                .then(function (response) {
                    self.tag = undefined;
                    self.users = result_service.setPage(response.data);
                    self.loadingUser = false;
                    self.lastQuery = $scope.global.query;
                });
        };

        if ($scope.global.community.type == 'cluster') {
            if ($scope.global.community.community_profiles[$stateParams.location_path]) {
                self.clusterFilter = $scope.global.community.community_profiles[$stateParams.location_path].industries;
            } else self.clusterFilter = $scope.global.community.profile.industries;
        } else {
            self.clusterFilter = [];
            if ($scope.global.community.type == 'user' || $scope.global.community.type == 'company') {
                $scope.global.community = $scope.global.location;
            } else if ($scope.global.community.key && $scope.global.community.key !== $scope.global.location.key) self.communityFilter.push($scope.global.community.key);
        }
        
        self.searchUsers();

    };

    var onLoad = $scope.$watch(function () {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
    });

    this.filterRole = function(role) {
        self.loadingRole = true;
        if (role == '*') {
            self.selectedRole = ['*'];
        } else {
            if (self.selectedRole.indexOf('*') > -1) {
                self.selectedRole.splice(self.selectedRole.indexOf('*'), 1);
            }
            if (self.selectedRole.indexOf(role) < 0) {
                self.selectedRole.push(role);
            } else self.selectedRole.splice(self.selectedRole.indexOf(role), 1);
            if (self.selectedRole.length === 0) {
                self.selectedRole = ['*'];
            }
        }

        user_service.search(self.communityFilter, self.clusterFilter, undefined, self.selectedRole, 20, undefined)
            .then(function(response) {
                self.loadingRole = false;
                self.users = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.filterClusters = function(selection) {
        if (selection == undefined) {
            self.selectedClusters = [];
        } else {
            if (self.selectedClusters.indexOf(selection) < 0) {
                self.selectedClusters.push(selection);
            } else self.selectedClusters.splice(self.selectedClusters.indexOf(selection), 1);
            if (self.selectedClusters.length == 0) self.allClusters = true;
        }

        user_service.search(self.communityFilter, self.selectedClusters, undefined, self.selectedRole, 30, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingResource = false;
                self.users = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.filterResources = function(selection) {
        if (selection == undefined) {
            self.selectedResources = [];
        } else {
            if (self.selectedResources.indexOf(selection) < 0) {
                self.selectedResources.push(selection);
            } else self.selectedResources.splice(self.selectedResources.indexOf(selection), 1);
            if (self.selectedResources.length == 0) self.allResources = true;
        }

        self.communityFilter = self.communityFilter.concat(self.selectedResources);

        user_service.search(self.communityFilter, self.clusterFilter, undefined, self.selectedRole, 20, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingResource = false;
                self.users = result_service.setPage(response.data);
                setTitle();
            });
    };
}

function ContactUserController($scope, $uibModalInstance, notify_service, sweet){

    this.user = $scope.global.user; //used in view
    var self = this;

    this.send = function () {

        if (self.form.$valid) {
            var formdata = {
                "name" : self.form.name_value,
                "email" : self.form.email_value,
                "company" : self.form.company_value,
                "reason" : self.form.reason_value
            };

            notify_service.contact($scope.global.user.key, formdata, $scope.global.community.key, $scope.global.location.key)
                .then(function(response) {

                    $uibModalInstance.close();

                    if (response.status !== 200) {
                        sweet.show({
                            title: "Sorry, something went wrong.",
                            text: "Here's what we know: " + response.data.message,
                            type: "error"
                        });

                    } else {
                        sweet.show({
                            title: "Connection Request Sent!",
                            text: "Expect to hear a response soon.",
                            type: "success"
                        });
                    }

                });
        } else {
            self.form.submitted = true;
        }


    };

    this.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}

function UserProfileController($scope, $stateParams, $http, $uibModal, $mixpanel, user_service, community_service, message_service) {

    var self = this;

    if (!jQuery.isEmptyObject($stateParams.profile)) this.user = $stateParams.profile; // set basic profile details while pulling the rest

    this.reply = {};
    this.team_panels = user_service.team_panels();
    this.working = false;
    $mixpanel.track('Viewed Profile');

    var loadCtrl = function() {
        onLoad(); // de-register the watcher

        var userkey = (self.user && self.user.key) ?
            self.user.key :
            $stateParams.community_path ?
                $stateParams.community_path :
                $stateParams.location_path;

        if (!$stateParams.noreload) {
            community_service.getCommunity(userkey, $stateParams.profile ? true : false)
                .then(function (response) {
                    self.user = response.data;
                });
        } else self.user = $scope.global.community;

    };

    var onLoad = $scope.$watch(function () {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
    });

    this.contact = function(community_key) {

        var modalInstance = $uibModal.open({
            templateUrl: 'components/users/user.contact.html',
            controller: ContactUserController,
            controllerAs: 'contact',
            windowClass: "hmodal-warning",
            resolve: {
                user: function() {
                    return self.user;
                },
                community_key: function() {
                    return community_key;
                },
                location_key: function() {
                    return $scope.global.location.key;
                }
            }
        });
    };

    this.getKey = function() {
        if (!$scope.global.user.profile.api_key) {
            user_service.getKey()
                .then(function(response) {
                    var api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
    };

    this.askQuestion = function() {
        self.working = true;

        if (self.question && $scope.global.user) {
            // update user profile

            message_service.addMessage('question', $scope.global.user, self.user, self.question)
                .then(function (response) {
                    self.question = undefined;

                    if (response.status !== 200) {
                        self.alert = {type: 'danger', message: String(response.data.message)};
                    } else {
                        self.working = false;
                        if (!$scope.global.community.newmessages) $scope.global.community.newmessages = {};
                        $scope.global.community.newmessages[response.data.key] = response.data;
                        $http.get('/api/2.1/community/' + self.user.key); // refresh outdated cache
                    }

                    $mixpanel.track('Asked Question');
                })
                .catch(function (error) {
                    self.working = false;
                    self.alert = {type: 'danger', message: String(error.data.message)};
                });
        } else self.alert = {type: 'danger', message: 'Please login before posting a question'};
    };

    this.ask = function() {
        $('#ask').addClass('active');
        $('#profile').removeClass('active');
        $('#companies').removeClass('active');
        $('#ask_li').addClass('active');
        $('#profile_li').removeClass('active');
        $('#companies_li').removeClass('active');
        $('#questionbox').addClass('glowing-border');
    };

    this.postReply = function(parent) {
        self.working[parent.key] = true;

        if (self.reply[parent.key] && user) {
            // update user profile

            message_service.addMessage('reply', user, self.user, self.reply[parent.key], parent)
                .then(function (response) {
                    self.reply[parent.key] = undefined;

                    if (response.status !== 200) {
                        self.alert = {type: 'danger', message: String(response.data.message)};
                    } else {
                        self.working[parent.key] = false;
                        if ($scope.global.community.messages[parent.key]) {
                            $scope.global.community.messages[parent.key].replies.push(response.data);
                        } else $scope.global.community.newmessages[parent.key].replies.push(response.data);
                        $http.get('/api/2.1/community/' + self.user.key); // refresh outdated cache
                    }

                    $mixpanel.track('Replied to Question');
                })
                .catch(function (error) {
                    self.working[parent.key] = false;
                    self.alert = {type: 'danger', message: String(error.data.message)};
                });
        } else self.alert = {type: 'danger', message: 'Please login before posting a comment'};
    }
}

function InviteUserController($scope, $mixpanel, user_service, community_service) {
    var self = this,
        user = $scope.global.user;

    var leader = [];

    if (user && user.roles && !jQuery.isEmptyObject(user.roles.leader)) {

        for (l in user.roles.leader) leader.push(l);

        community_service.getResources(undefined, leader, true)
            .then(function(response) {
                self.resources = response.data;
            });
    } else self.resources = {};

    if ($scope.global.community.type == 'cluster' || $scope.global.community.resource && $scope.global.location)
        $scope.global.community = $scope.global.location;

    this.inviteUser = function() {

        if (self.form.email_value) {

            var emails = self.form.email_value.split(/\s*,\s*/),
                message = self.form.message_value || "",
                resources = self.form.resources ? Object.keys(self.form.resources) : undefined,
                formdata;

            if (self.form.$valid || emails.length > 0) {

                for (e in emails) {

                    $scope.global.loaders['sendinvite'] = true;

                    formdata = {
                        "email" : emails[e],
                        "message" : message,
                        "resources" : resources
                    };

                    if (user) {

                        user_service.inviteUser(formdata.email, formdata.message, $scope.global.location.profile.name, $scope.global.location.key, formdata.resources)
                            .then(function(response) {
                                $scope.global.loaders['sendinvite'] = false;
                                self.form = {
                                    submitted: false,
                                    email_value: "",
                                    message_value: "",
                                    resources: {}
                                };

                                if (response.status !== 200) {
                                    self.alert ? self.alert.message += '<br> ' + String(response.data.message) : self.alert = { type: 'danger', message: String(response.data.message || response.message) };
                                } else {
                                    self.alert ? self.alert.message += '<br> ' + String(response.data.message) : self.alert = { type: 'success', message: String(response.data.message || response.message) };
                                }

                                $mixpanel.track('Sent Invite');
                            })
                            .catch(function(error) {
                                $scope.global.loaders['sendinvite'] = false;
                                self.form = { submitted: false };
                                self.alert = { type: 'danger', message: String(error.data.message) };
                            })
                    } else {
                        user_service.join(formdata.email, formdata.message, $scope.global.location.profile.name, $scope.global.location.key)
                            .then(function(response) {
                                $scope.global.loaders['sendinvite'] = false;
                                self.form = {
                                    submitted: false,
                                    email_value: "",
                                    message_value: ""
                                };

                                if (response.status !== 200) {
                                    self.alert = { type: 'danger', message: String(response.data.message) };
                                } else {
                                    self.alert = { type: 'success', message: response.data.message };
                                }

                                $mixpanel.track('Sent Invite');
                            })
                            .catch(function(error) {
                                $scope.global.loaders['sendinvite'] = false;
                                self.form = { submitted: false };
                                self.alert = { type: 'danger', message: String(error.data.message) };
                            })
                    }

                }

            } else {
                $scope.global.loaders['sendinvite'] = false;
                self.form.submitted = true;
            }
        } else {
            $scope.global.loaders['sendinvite'] = false;
            self.form.submitted = true;
        }

    };

    this.working = false;

}
