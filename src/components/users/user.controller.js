/*global angular*/
/*global jQuery*/
/*global $*/
angular
    .module('startupcommunity')
    .controller('UserController', UserController)
    .controller('UserProfileController', UserProfileController)
    .controller('InviteUserController', InviteUserController)
    .controller('ContactUserController', ContactUserController);

function UserController($rootScope, $scope, $stateParams, $location, user_service, $sce) {
    //todo usercontroller and company controller are dups, need to be consolidated

    this.selectedClusters = [];
    //this.selectedResources = [];
    this.selectedRole = ['*'];
    this.communityFilter = [$stateParams.location_path];

    var self = this; // for accessing 'this' in child functions

    this.url = $stateParams.community_path && $stateParams.location_path ?
        '({community_path: val})' :
        '({location_path: val})';

    // Title of list box changes based on context
    var setTitle = function() {
        var item;
        self.role = '';
        self.cluster = '';

        if (self.selectedRole[0] == '*') {
            self.role = 'People';
        }
        else {
            for (item in self.selectedRole) {
                self.role += (self.selectedRole[item][0].toUpperCase() + self.selectedRole[item].slice(1) + 's');
                if (item < self.selectedRole.length - 1) {
                    if (item < self.selectedRole.length - 2) {
                        self.role += '</strong>,<strong> ';
                    }
                    else self.role += ' </strong>&<strong> ';
                }
            }
        }

        if (self.selectedClusters.length == 0) {
            if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                self.selection = $scope.global.community.community_profiles[$stateParams.location_path].name;
            }
            else self.selection = $scope.global.community.name;
        }
        else {
            self.selection = '';
            for (item in self.selectedClusters) {
                self.selection += (self.selectedClusters[item][0].toUpperCase() + self.selectedClusters[item].slice(1));
                if (item < self.selectedClusters.length - 1) {
                    if (item < self.selectedClusters.length - 2) {
                        self.selection += ', ';
                    }
                    else self.selection += ' & ';
                }
            }
        }

        $scope.global.query = $stateParams.query || undefined;

        if (!$scope.global.query || $scope.global.query == '*') {
            self.title = '<strong>' + self.role + '</strong> in ' + self.selection;
        }
        else {
            self.title = 'People matching <strong>"' + $scope.global.query + '"</strong> ';
            self.title += ' in <strong>';
            if ($stateParams.community_path && $stateParams.location_path) {
                if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                    self.title += $scope.global.community.community_profiles[$stateParams.location_path].name + '</strong>';
                }
                else self.title += $scope.global.community.name + '</strong>';
            }
            else self.title += $scope.global.community.name + '</strong>';
        }

        var pageTitle = '<br><small>' + $scope.global.community.name + '</small>';
        self.pageTitle = $sce.trustAsHtml(pageTitle);
    };

    var loadCtrl = function() {
        onLoad(); // de-register the watcher

        self.searchUsers = function(offset) {
            self.loadingUser = true;

            if ($scope.global.query && $scope.global.query !== '*') {
                self.tag = $scope.global.query;
            }
            else self.tag = undefined;

            var limit = $location.search().limit || 16;

            setTitle();

            user_service.search(self.communityFilter, self.clusterFilter, $scope.global.query, self.selectedRole, limit, offset)
                .then(function(response) {
                    self.tag = undefined;
                    self.users = response.data;
                    self.loadingUser = false;
                    self.lastQuery = $scope.global.query;
                    self.offset = (offset || 0) + limit;
                    self.count = response.data[0] ? response.data[0].count : 0;
                    self.limit = limit;
                });
        };

        if ($scope.global.community.type == 'cluster') {
            if ($scope.global.community.community_profiles && $scope.global.community.community_profiles[$stateParams.location_path]) {
                self.clusterFilter = $scope.global.community.community_profiles[$stateParams.location_path].industries;
            }
            else self.clusterFilter = $scope.global.community.industries;
        }
        else {
            self.clusterFilter = [];
            if ($scope.global.community.type == 'user' || ($scope.global.community.type == 'company' && !$scope.global.community.resource)) {
                $scope.global.community = $scope.global.location;
            }
            else if ($scope.global.community.id && $scope.global.community.id !== $scope.global.location.id) self.communityFilter.push($scope.global.community.id);
        }

        self.searchUsers();

    };

    var onLoad = $scope.$watch(function() {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
        if ($rootScope.global.user) $scope.global.user = $rootScope.global.user;
    });



    this.filterRole = function(role) {
        self.loadingRole = true;
        if (role == '*') {
            self.selectedRole = ['*'];
        }
        else {
            if (self.selectedRole.indexOf('*') > -1) {
                self.selectedRole.splice(self.selectedRole.indexOf('*'), 1);
            }
            if (self.selectedRole.indexOf(role) < 0) {
                self.selectedRole.push(role);
            }
            else self.selectedRole.splice(self.selectedRole.indexOf(role), 1);
            if (self.selectedRole.length === 0) {
                self.selectedRole = ['*'];
            }
        }

        user_service.search(self.communityFilter, self.clusterFilter, undefined, self.selectedRole, 16, undefined)
            .then(function(response) {
                self.loadingRole = false;
                self.users = response.data;
                setTitle();
                self.count = response.data[0] ? response.data[0].count : 0;
                self.limit = 16;
            });
    };

    this.filterClusters = function(selection) {
        if (selection == undefined) {
            self.selectedClusters = [];
        }
        else {
            if (self.selectedClusters.indexOf(selection) < 0) {
                self.selectedClusters.push(selection);
            }
            else self.selectedClusters.splice(self.selectedClusters.indexOf(selection), 1);
            if (self.selectedClusters.length == 0) self.allClusters = true;
        }

        user_service.search(self.communityFilter, self.selectedClusters, undefined, self.selectedRole, 16, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingResource = false;
                self.users = response.data;
                setTitle();
                self.count = response.data[0] ? response.data[0].count : 0;
                self.limit = 16;
            });
    };
    /*
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
                    self.users = response.data;
                    setTitle();
                });
        };
        */
}

function ContactUserController($scope, $uibModalInstance, notify_service, sweet, user) {

    this.user = user || $scope.global.user; //used in view

    var self = this;

    this.send = function() {

        if (self.form.$valid) {
            var formdata = {
                'name': self.form.name_value,
                'email': self.form.email_value,
                'company': self.form.company_value,
                'reason': self.form.reason_value
            };


            notify_service.contact($scope.global.community.id, formdata, $scope.global.location.id)
                .then(function(response) {

                    $uibModalInstance.close();

                    if (response.status !== 200) {
                        sweet.show({
                            title: 'Sorry, something went wrong.',
                            text: 'Here\'s what we know: ' + response.data.message,
                            type: 'error'
                        });

                    }
                    else {
                        sweet.show({
                            title: 'Connection Request Sent!',
                            text: 'Expect to hear a response soon.',
                            type: 'success'
                        });
                    }

                });
        }
        else {
            self.form.submitted = true;
        }


    };

    this.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };
}

function UserProfileController($rootScope, $scope, $stateParams, $http, $uibModal, user_service, community_service, message_service, sweet) {

    var self = this;

    if (!jQuery.isEmptyObject($stateParams.profile)) this.user = $stateParams.profile; // set basic profile details while pulling the rest

    this.reply = {};
    this.team_panels = user_service.team_panels();
    this.working = false;
    window.mixpanel.track('Viewed Profile');

    var loadCtrl = function() {
        onLoad(); // de-register the watcher

        if ($rootScope.global.user) $scope.global.user = $rootScope.global.user;

        var userkey = (self.user && self.user.id) ?
            self.user.id :
            $stateParams.community_path ?
            $stateParams.community_path :
            $stateParams.location_path;

        if (!$stateParams.noreload) {
            community_service.getCommunity(userkey)
                .then(function(response) {
                    self.user = response.find(c => c.id == userkey);
                });
        }
        else self.user = $scope.global.community;

    };

    var onLoad = $scope.$watch(function() {
        if ($scope.global.community && $scope.global.community.type) {
            loadCtrl();
        }
    });

    this.contact = function(community_id) {

        var modalInstance = $uibModal.open({
            templateUrl: require('./user.contact.html'),
            controller: ContactUserController,
            controllerAs: 'contact',
            windowClass: 'hmodal-warning',
            resolve: {
                user: function() {
                    return self.user;
                },
                community_id: function() {
                    return community_id;
                },
                location_id: function() {
                    return $scope.global.location.id;
                }
            }
        });
    };

    this.get = function() {
        if (!$scope.global.user.api_key) {
            user_service.getKey()
                .then(function(response) {
                    var api_key = response.data;
                    sweet.show({ title: 'See our <a href=\'http://startupcommunity.readme.io?appkey=' + api_key + '\' target=\'_blank\'>API documentation</a> for help using your key:', message: '<pre>' + api_key + '</pre>' });
                });
        }
        else sweet.show({ title: 'See our <a href=\'http://startupcommunity.readme.io?appkey=' + $scope.global.user.api_key + '\' target=\'_blank\'>API documentation</a> for help using your key:', message: '<pre>' + $scope.global.user.api_key + '</pre>' });
    };

    this.askQuestion = function() {
        self.working = true;

        if (self.question && $scope.global.user) {
            // update user profile

            message_service.addMessage('question', $scope.global.user, self.user, self.question)
                .then(function(response) {
                    self.question = undefined;

                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: String(response.data.message) };
                    }
                    else {
                        self.working = false;
                        if (!$scope.global.community.newmessages) $scope.global.community.newmessages = {};
                        $scope.global.community.newmessages[response.data.id] = response.data;
                    }

                    window.mixpanel.track('Asked Question');
                })
                .catch(function(error) {
                    self.working = false;
                    self.alert = { type: 'danger', message: String(error.data.message) };
                });
        }
        else self.alert = { type: 'danger', message: 'Please login before posting a question' };
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
        self.working[parent.id] = true;

        if (self.reply[parent.id] && $scope.global.user) {
            // update user profile

            message_service.addMessage('reply', $scope.global.user, self.user, self.reply[parent.id], parent)
                .then(function(response) {
                    self.reply[parent.id] = undefined;

                    if (response.status !== 200) {
                        self.alert = { type: 'danger', message: String(response.data.message) };
                    }
                    else {
                        self.working[parent.id] = false;
                        if ($scope.global.community.messages[parent.id]) {
                            $scope.global.community.messages[parent.id].replies.push(response.data);
                        }
                        else $scope.global.community.newmessages[parent.id].replies.push(response.data);
                    }

                    window.mixpanel.track('Replied to Question');
                })
                .catch(function(error) {
                    self.working[parent.id] = false;
                    self.alert = { type: 'danger', message: String(error.data.message) };
                });
        }
        else self.alert = { type: 'danger', message: 'Please login before posting a comment' };
    };
}

function InviteUserController($scope, user_service, community_service) {
    var self = this,
        user = $scope.global.user;

    var leader = [];

    if (user && user.roles && !jQuery.isEmptyObject(user.roles.leader)) {

        for (var l in user.roles.leader) leader.push(l);

        community_service.getResources(undefined, leader, true)
            .then(function(response) {
                self.resources = response.data;
            });
    }
    else self.resources = {};

    if ($scope.global.community.type == 'cluster' || $scope.global.community.resource && $scope.global.location)
        $scope.global.community = $scope.global.location;

    this.inviteUser = function() {
        self.working = true;

        if (self.form.email_value) {

            var emails = self.form.email_value.split(/\s*,\s*/),
                message = self.form.message_value || '',
                resources = self.form.resources ? Object.keys(self.form.resources) : undefined,
                formdata;

            if (self.form.$valid || emails.length > 0) {

                for (var e in emails) {

                    $scope.global.loaders['sendinvite'] = true;

                    formdata = {
                        'email': emails[e],
                        'message': message,
                        'resources': resources
                    };

                    if (user) {

                        user_service.inviteUser(formdata.email, formdata.message, $scope.global.location.name, $scope.global.location.id, formdata.resources)
                            .then(function(response) {
                                $scope.global.loaders['sendinvite'] = false;
                                self.working = false;
                                self.form = {
                                    submitted: false,
                                    email_value: '',
                                    message_value: '',
                                    resources: {}
                                };

                                if (response.status !== 200) {
                                    self.alert ? self.alert.message += '<br> ' + String(response.data.message) : self.alert = { type: 'danger', message: String(response.data.message || response.message) };
                                }
                                else {
                                    self.alert ? self.alert.message += '<br> ' + String(response.data.message) : self.alert = { type: 'success', message: String(response.data.message || response.message) };
                                }

                                window.mixpanel.track('Sent Invite');
                            })
                            .catch(function(error) {
                                $scope.global.loaders['sendinvite'] = false;
                                self.working = false;
                                self.form = { submitted: false };
                                self.alert = { type: 'danger', message: String(error.data.message) };
                            });
                    }
                    else {
                        user_service.join(formdata.email, formdata.message, $scope.global.location.name, $scope.global.location.id)
                            .then(function(response) {
                                $scope.global.loaders['sendinvite'] = false;
                                self.working = false;
                                self.form = {
                                    submitted: false,
                                    email_value: '',
                                    message_value: ''
                                };

                                if (response.status !== 200) {
                                    self.alert = { type: 'danger', message: String(response.data.message) };
                                }
                                else {
                                    self.alert = { type: 'success', message: response.data.message };
                                }

                                window.mixpanel.track('Sent Invite');
                            })
                            .catch(function(error) {
                                $scope.global.loaders['sendinvite'] = false;
                                self.working = false;
                                self.form = { submitted: false };
                                self.alert = { type: 'danger', message: String(error.data.message) };
                            });
                    }

                }

            }
            else {
                $scope.global.loaders['sendinvite'] = false;
                self.working = false;
                self.form.submitted = true;
            }
        }
        else {
            $scope.global.loaders['sendinvite'] = false;
            self.working = false;
            self.form.submitted = true;
        }

    };

    this.working = false;

}
