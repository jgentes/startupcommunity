angular
    .module('startupcommunity')
    .controller('UserController', UserController)
    .controller('UserProfileController', UserProfileController)
    .controller('InviteUserController', InviteUserController)
    .controller('ContactUserController', ContactUserController);

function UserController($stateParams, $location, user_service, result_service, $sce, community, communities) {
    //todo usercontroller and company controller are dups, need to be consolidated
    this.community = community;
    this.communities = communities;
    this.selectedClusters = [];
    this.selectedResources = [];
    this.selectedRole = ['*'];

    var self = this; // for accessing 'this' in child functions
    var query;
    var communityFilter = [$stateParams.location_path];

    if (this.community.type == 'cluster') {
        if (this.community.community_profiles[$stateParams.location_path]) {
            var clusterFilter = this.community.community_profiles[$stateParams.location_path].industries;
        } else clusterFilter = this.community.profile.industries;
    } else {
        clusterFilter = [];
        if ($stateParams.community_path && $stateParams.community_path !== $stateParams.location_path) communityFilter.push($stateParams.community_path);
    }

    $stateParams.query ? query = $stateParams.query : query = '*';

    this.url = $stateParams.community_path && $stateParams.location_path ?
        "({community_path: val, community: users.communities[val], query: '*'})" :
        "({location_path: val, community: users.communities[val], query: '*'})";

    // THIS IS A DUPLICATE OF NAV.EMBEDDED, SHOULD MOVE TO A SERVICE AND INJECT IN NAV AND USER CONTROLLERS
    try {
        this.embedded = window.self !== window.top;
    } catch (e) {
        this.embedded = true;
    }
    this.usercount = this.embedded ? 8 : 16;

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
            if (self.community.community_profiles && self.community.community_profiles[$stateParams.location_path]) {
                self.selection = self.community.community_profiles[$stateParams.location_path].name;
            } else self.selection = self.community.profile.name;
        } else {
            self.selection = "";
            var selectedCommunities = self.selectedClusters.concat(self.selectedResources);
            for (item in selectedCommunities) {
                self.selection += self.communities[selectedCommunities[item]].profile.name;
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
                if (self.community.community_profiles && self.community.community_profiles[$stateParams.location_path]) {
                    self.title += self.community.community_profiles[$stateParams.location_path].name +'</strong>';
                } else self.title += self.community.profile.name +'</strong>';
            } else self.title += self.communities[$stateParams.location_path].profile.name + '</strong>';
        }

        var pageTitle = '<br><small>' + self.community.profile.name + '</small>';
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

function ContactUserController($uibModalInstance, notify_service, sweet, community_key, location_key, user){

    this.user = user; //used in view
    var self = this;

    this.send = function () {

        if (self.form.$valid) {
            var formdata = {
                "name" : self.form.name_value,
                "email" : self.form.email_value,
                "company" : self.form.company_value,
                "reason" : self.form.reason_value
            };

            notify_service.contact(user.key, formdata, community_key, location_key)
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

function UserProfileController($stateParams, $http, $uibModal, $mixpanel, user, user_service, message_service, community, communities) {

    if (!jQuery.isEmptyObject($stateParams.profile)) {
        this.user = $stateParams.profile;
    } else if (community && community.type == "user") {
        this.user = community;
    } else this.user = user;

    this.loggedin = !!user;

    var self = this;
    this.community = community;
    this.communities = communities;
    this.location = communities[this.community.profile.home];
    this.reply = {};

    this.companies = { "count" : {}};

    this.team_panels = user_service.team_panels();        
    
    for (role in this.user.roles) {
        for (comm in this.user.roles[role]) {
            if (this.communities[comm] && this.communities[comm].type == 'company') {
                if (!this.companies[role]) this.companies[role] = {};
                if (!this.companies.count[role]) this.companies.count[role] = 0;
                this.companies[role][comm] = {
                    "path": {
                        "key": comm
                    },
                    "value" : this.communities[comm]
                };
                ++ this.companies.count[role];
            }
        }
    }

    $mixpanel.track('Viewed Profile');

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
                    return self.location.key;
                }
            }
        });
    };

    this.getKey = function() {
        if (!user.profile.api_key) {
            user_service.getKey()
                .then(function(response) {
                    var api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
    };

    this.askQuestion = function() {
        self.working = true;

        if (self.question && user) {
            // update user profile

            message_service.addMessage('question', user, self.user, self.question)
                .then(function (response) {
                    self.question = undefined;

                    if (response.status !== 200) {
                        self.alert = {type: 'danger', message: String(response.data.message)};
                    } else {
                        self.working = false;
                        if (!self.communities.newmessages) self.communities.newmessages = {};
                        self.communities.newmessages[response.data.key] = response.data;
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

    this.working = false;

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
                        if (self.communities.messages[parent.key]) {
                            self.communities.messages[parent.key].replies.push(response.data);
                        } else self.communities.newmessages[parent.key].replies.push(response.data);
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

function InviteUserController($mixpanel, user, user_service, community_service, community, communities, location) {
    var self = this;
    this.user = user;
    this.community = community;
    this.communities = communities;
    this.location = location;

    var leader = [];

    if (user && user.roles && !jQuery.isEmptyObject(user.roles.leader)) for (l in user.roles.leader) leader.push(l);

    community_service.getResources(undefined, leader)
        .then(function(response) {
            self.resources = response.data;
        });

    if (this.community.type == 'cluster' || this.community.resource && location) this.community = location;

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

                    if (user) {

                        user_service.inviteUser(formdata.email, formdata.message, location.profile.name, location.key, formdata.resources)
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
                        user_service.join(formdata.email, formdata.message, location.profile.name, location.key)
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
