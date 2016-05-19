angular
    .module('startupcommunity')
    .controller('UserController', UserController)
    .controller('UserProfileController', UserProfileController)
    .controller('InviteUserController', InviteUserController)
    .controller('ContactUserController', ContactUserController);

function UserController($rootScope, $stateParams, $location, user_service, result_service, $sce) {
    //todo usercontroller and company controller are dups, need to be consolidated

    this.selectedClusters = [];
    this.selectedResources = [];
    this.selectedRole = ['*'];

    var self = this; // for accessing 'this' in child functions
    var query;

    $stateParams.query ? query = $stateParams.query : query = '*';

    this.url = $stateParams.community_path && $stateParams.location_path ?
        "({community_path: val})" :
        "({location_path: val})";

    // THIS IS A DUPLICATE OF NAV.EMBEDDED, SHOULD MOVE TO A SERVICE AND INJECT IN NAV AND USER CONTROLLERS
    try {
        this.embedded = window.self !== window.top;
    } catch (e) {
        this.embedded = true;
    }
    this.usercount = 16;

    this.searchUsers = function(alturl) {
        self.loadingUser = true;

        // remove random sort
        if (alturl) alturl = alturl.replace(/([&\?]sort=_random*$|sort=_random&|[?&]sort=_random(?=#))/, '');

        if (query !== '*') {
            self.tag = query;
        } else self.tag = undefined;

        var limit = $location.search().limit;

        user_service.search(communityFilter, clusterFilter, query, undefined, limit || self.usercount, alturl)
            .then(function (response) {
                self.tag = undefined;
                self.users = result_service.setPage(response.data);
                self.loadingUser = false;
                self.lastQuery = query;
            });
    };

    this.searchUsers();

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
            if ($rootScope.global.community.community_profiles && $rootScope.global.community.community_profiles[$stateParams.location_path]) {
                self.selection = $rootScope.global.community.community_profiles[$stateParams.location_path].name;
            } else self.selection = $rootScope.global.community.profile.name;
        } else {
            self.selection = "";
            var selectedCommunities = self.selectedClusters.concat(self.selectedResources);
            for (item in selectedCommunities) {
                self.selection += $rootScope.global.community[selectedCommunities[item]].profile.name;
                if (item < selectedCommunities.length - 1) {
                    if (item < selectedCommunities.length - 2 ) {
                        self.selection += ', ';
                    } else self.selection += ' & ';
                }
            }
        }

        if (query == "*") {
            self.title = '<strong>' + self.role + '</strong> in ' + self.selection;
        } else {
            self.title = 'People matching <strong>"' + query + '"</strong> ';
            self.title += 'in <strong>';
            if ($stateParams.community_path && $stateParams.location_path) {
                if ($rootScope.global.community.community_profiles && $rootScope.global.community.community_profiles[$stateParams.location_path]) {
                    self.title += $rootScope.global.community.community_profiles[$stateParams.location_path].name +'</strong>';
                } else self.title += $rootScope.global.community.profile.name +'</strong>';
            } else self.title += $rootScope.global.community[$stateParams.location_path].profile.name + '</strong>';
        }

        var pageTitle = '<br><small>' + $rootScope.global.community.profile.name + '</small>';
        self.pageTitle = $sce.trustAsHtml(pageTitle);
    };

    setTitle();

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

        user_service.search(communityFilter, clusterFilter, '*', self.selectedRole, 20, undefined)
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

        user_service.search(communityFilter, self.selectedClusters, '*', self.selectedRole, 30, undefined)
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

        communityFilter = communityFilter.concat(self.selectedResources);

        user_service.search(communityFilter, clusterFilter, '*', self.selectedRole, 20, undefined)
            .then(function(response) {
                self.loadingCluster = false;
                self.loadingResource = false;
                self.users = result_service.setPage(response.data);
                setTitle();
            });
    };
}

function ContactUserController($uibModalInstance, notify_service, sweet, community_key, location_key){

    this.user = $rootScope.global.user; //used in view
    var self = this;

    this.send = function () {

        if (self.form.$valid) {
            var formdata = {
                "name" : self.form.name_value,
                "email" : self.form.email_value,
                "company" : self.form.company_value,
                "reason" : self.form.reason_value
            };

            notify_service.contact($rootScope.global.user.key, formdata, community_key, location_key)
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

function UserProfileController($rootScope, $stateParams, $http, $uibModal, $mixpanel, user_service, community_service, message_service) {

    var self = this;

    if (!jQuery.isEmptyObject($stateParams.profile)) this.user = $stateParams.profile; // set basic profile details while pulling the rest

    var loadCompanies = function () {

        for (role in self.user.roles) {
            for (comm in self.user.roles[role]) {
                if (self.user[comm] && self.user[comm].type == 'company') {
                    if (!self.companies[role]) self.companies[role] = {};
                    if (!self.companies.count[role]) self.companies.count[role] = 0;
                    self.companies[role][comm] = {
                        "path": {
                            "key": comm
                        },
                        "value" : self.user[comm]
                    };
                    ++ self.companies.count[role];
                }
            }
        }
    };

    this.loggedin = !!$rootScope.global.user;
    this.reply = {};
    this.companies = { "count" : {}};
    this.team_panels = user_service.team_panels();
    this.working = false;
    $mixpanel.track('Viewed Profile');

    if ($rootScope.global.community && $rootScope.global.community.type == "user" && $rootScope.global.community.companies) {
        // if directly accessed via url
        this.user = $rootScope.global.community;
        loadCompanies();
    } else
        var userkey = (this.user && this.user.key) ?
            this.user.key :
            $stateParams.community_path ?
                $stateParams.community_path :
                $stateParams.location_path;

    community_service.getCommunity(userkey)
        .then(function(response) {
            self.user = response.data;
            loadCompanies();
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
                    return $rootScope.global.location.key;
                }
            }
        });
    };

    this.getKey = function() {
        if (!$rootScope.global.user.profile.api_key) {
            user_service.getKey()
                .then(function(response) {
                    var api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
    };

    this.askQuestion = function() {
        self.working = true;

        if (self.question && $rootScope.global.user) {
            // update user profile

            message_service.addMessage('question', $rootScope.global.user, self.user, self.question)
                .then(function (response) {
                    self.question = undefined;

                    if (response.status !== 200) {
                        self.alert = {type: 'danger', message: String(response.data.message)};
                    } else {
                        self.working = false;
                        if (!$rootScope.global.community.newmessages) $rootScope.global.community.newmessages = {};
                        $rootScope.global.community.newmessages[response.data.key] = response.data;
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
        $('#ask_li').addClass('active');
        $('#profile_li').removeClass('active');
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
                        if ($rootScope.global.community.messages[parent.key]) {
                            $rootScope.global.community.messages[parent.key].replies.push(response.data);
                        } else $rootScope.global.community.newmessages[parent.key].replies.push(response.data);
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

function InviteUserController($rootScope, $mixpanel, user_service, community_service) {
    var self = this;
    this.user = $rootScope.global.user;

    var leader = [];

    if (this.user && this.user.roles && !jQuery.isEmptyObject(this.user.roles.leader)) {

        for (l in this.user.roles.leader) leader.push(l);

        community_service.getResources(undefined, leader)
            .then(function(response) {
                self.resources = response.data;
            });
    } else self.resources = {};

    if ($rootScope.global.community.type == 'cluster' || $rootScope.global.community.resource && $rootScope.global.location) $rootScope.global.community = $rootScope.global.location;

    this.inviteUser = function() {

        if (self.form.email_value) {

            var emails = self.form.email_value.split(/\s*,\s*/),
                message = self.form.message_value || "",
                resources = self.form.resources ? Object.keys(self.form.resources) : undefined,
                formdata;



            if (self.form.$valid || emails.length > 0) {

                for (e in emails) {

                    self.working = true;

                    formdata = {
                        "email" : emails[e],
                        "message" : message,
                        "resources" : resources
                    };

                    if (self.user) {

                        user_service.inviteUser(formdata.email, formdata.message, $rootScope.global.location.profile.name, $rootScope.global.location.key, formdata.resources)
                            .then(function(response) {
                                self.working = false;
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
                                self.working = false;
                                self.form = { submitted: false };
                                self.alert = { type: 'danger', message: String(error.data.message) };
                            })
                    } else {
                        user_service.join(formdata.email, formdata.message, $rootScope.global.location.profile.name, $rootScope.global.location.key)
                            .then(function(response) {
                                self.working = false;
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
                                self.working = false;
                                self.form = { submitted: false };
                                self.alert = { type: 'danger', message: String(error.data.message) };
                            })
                    }

                }

            } else {
                self.working = false;
                self.form.submitted = true;
            }
        } else {
            self.working = false;
            self.form.submitted = true;
        }

    };

    this.working = false;

}
