angular
    .module('startupcommunity')
    .controller('UserController', UserController)
    .controller('UserProfileController', UserProfileController)
    .controller('InviteUserController', InviteUserController)
    .controller('ContactUserController', ContactUserController);

function UserController($stateParams, user_service, result_service, $sce, $modal, community, communities) {

    this.community = community;
    this.communities = communities.data;
    this.selectedIndustries = [];
    this.selectedNetworks = [];
    this.selectedRole = ['*'];

    var self = this; // for accessing 'this' in child functions

    var communityFilter = [$stateParams.location_path];
    if ($stateParams.community_path) communityFilter.push($stateParams.community_path);

    this.searchUsers = function(alturl) {
        self.loadingUser = true;
        if ($stateParams.query !== '*') {
            self.tag = $stateParams.query;
        } else self.tag = undefined;

        user_service.search(communityFilter, $stateParams.query, undefined, 16, alturl)
            .then(function (response) {
                self.tag = undefined;
                self.users = result_service.setPage(response.data);
                self.loadingUser = false;
                self.lastQuery = $stateParams.query;
            });
    };

    this.searchUsers();

    // Title of list box changes based on context
    var setTitle = function(){
        var item;
        self.role = '';
        self.industry = '';

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

        if (self.selectedIndustries.length == 0 && self.selectedNetworks.length == 0) {
            if (self.community.community_profiles && self.community.community_profiles[$stateParams.location_path]) {
                self.selection = self.community.community_profiles[$stateParams.location_path].name;
            } else self.selection = self.community.profile.name;
        } else {
            self.selection = "";
            var selectedCommunities = self.selectedIndustries.concat(self.selectedNetworks);
            for (item in selectedCommunities) {
                self.selection += self.communities[selectedCommunities[item]].profile.name;
                if (item < selectedCommunities.length - 1) {
                    if (item < selectedCommunities.length - 2 ) {
                        self.selection += ', ';
                    } else self.selection += ' & ';
                }
            }
        }

        if ($stateParams.query == "*") {
            self.title = '<strong>' + self.role + '</strong> in ' + self.selection;
        } else {
            self.title = 'People matching <strong>"' + $stateParams.query + '"</strong> ';
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

        user_service.search(communityFilter, '*', self.selectedRole, 20, undefined)
            .then(function(response) {
                self.loadingRole = false;
                self.users = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.filterIndustries = function(selection) {
        if (selection == undefined) {
            self.selectedIndustries = [];
        } else {
            if (self.selectedIndustries.indexOf(selection) < 0) {
                self.selectedIndustries.push(selection);
            } else self.selectedIndustries.splice(self.selectedIndustries.indexOf(selection), 1);
            if (self.selectedIndustries.length == 0) self.allIndustries = true;
        }

        user_service.search(communityFilter.concat(self.selectedIndustries), '*', self.selectedRole, 30, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
                self.loadingNetwork = false;
                self.users = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.filterNetworks = function(selection) {
        if (selection == undefined) {
            self.selectedNetworks = [];
        } else {
            if (self.selectedNetworks.indexOf(selection) < 0) {
                self.selectedNetworks.push(selection);
            } else self.selectedNetworks.splice(self.selectedNetworks.indexOf(selection), 1);
            if (self.selectedNetworks.length == 0) self.allNetworks = true;
        }

        user_service.search(communityFilter.concat(self.selectedNetworks), '*', self.selectedRole, 20, undefined)
            .then(function(response) {
                self.loadingIndustry = false;
                self.loadingNetwork = false;
                self.users = result_service.setPage(response.data);
                setTitle();
            });
    };

    this.contact = function(user) {
        var modalInstance = $modal.open({
            template: '<div class="inmodal"><div class="color-line"></div><div class="modal-header"><h4 class="modal-title">Contact {{contact.user.profile.name}}</h4><p class="font-bold">Before we connect you, we will need to know a few things:</p></div><div class="modal-body"><form role="form" name="contact.form" novalidate ng-submit="contact.send()"><div class="form-group"><input type="text" placeholder="Your name.." class="form-control input-lg" required name="name" ng-model="contact.form.name_value"><div class="m-t-xs" ng-show="contact.form.name.$invalid && contact.form.submitted"><span class="text-danger" ng-show="contact.form.name.$error">&nbsp;&nbsp;<i class="fa fa-exclamation-triangle"></i> You forgot your name!</span></div></div><div class="form-group"><input type="email" placeholder="Your email.." class="form-control input-lg" required name="email" ng-model="contact.form.email_value"><div class="m-t-xs" ng-show="contact.form.email.$invalid && contact.form.submitted"> <span class="text-danger" ng-show="contact.form.email.$error">&nbsp;&nbsp;<i class="fa fa-exclamation-triangle"></i> Please input a valid email address</span></div></div><div class="form-group"><input type="text" placeholder="Your company.." class="form-control input-lg" name="company" ng-model="contact.form.company_value"></div><div class="form-group"><input type="text" placeholder="Reason for contact.." class="form-control input-lg" required name="reason" ng-model="contact.form.reason_value"><div class="m-t-xs" ng-show="contact.form.reason.$invalid && contact.form.submitted"><span class="text-danger" ng-show="contact.form.reason.$error">&nbsp;&nbsp;<i class="fa fa-exclamation-triangle"></i> Please tell us why you would like to get in touch with {{contact.user.profile.name.split(" ")[0]}}.</span></div></div></form></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="contact.cancel()">Cancel</button><button type="button" class="btn btn-primary" ng-click="contact.send()">Send Message</button></div></div>',
            //templateUrl: 'user.contact.html',
            controller: ContactUserController,
            controllerAs: 'contact',
            windowClass: "hmodal-warning",
            resolve: {
                user: function() {
                    return user;
                }
            }
        });
    };
}

function ContactUserController($modalInstance, user){
    this.user = user;
    var self = this;

    this.send = function () {
        if (self.form.$valid) {
            console.log(self.form.email_value);
            $modalInstance.close();
        } else {
            self.form.submitted = true;
        }

    };

    this.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function InviteUserController($stateParams, user, user_service, community, communities) {



}

function UserProfileController($scope, $stateParams, $location, $auth, $mixpanel, user, user_service, community, communities) {

    if (!jQuery.isEmptyObject($stateParams.profile)) {
        this.user = $stateParams.profile;
    } else if (community && community.type == "user") {
        this.user = community;
    } else this.user = user.data.value;

    var self = this;
    this.communities = communities.data;

    $mixpanel.track('Viewed Profile');

    this.putProfile = function(userid, profile) {
        user_service.putProfile(userid, profile, function(response) {
            if (response.status !== 200) {
                this.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: " +  response.message);
            } else {
                this.profile = response.data; // may need to tell angular to refresh view
                this.alert = { type: 'success', msg: 'Person updated! ' + response.data.name + ' is good to go.' };
            }
        });
    };

    this.removeProfile = function(userid, name) {
        notify("Are you sure you want to remove " + name + "?", function(result) { //todo fix notify maybe with sweetalert
            if (result) {
                user_service.removeProfile(userid, function(response) {
                    $location.path('/people');
                    this.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    this.updateProfile = function() {
        user_service.updateProfile({
            displayName: user.profile.name,
            email: user.profile.email
        }).then(function() {
            this.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };

    this.getKey = function() {
        if (!user.profile.api_key) {
            user_services.getKey()
                .then(function(response) {
                    var api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
    };

    $scope.isCityAdvisor = function(status) { //todo needs to be reworked
        user_service.setCityAdvisor($state.params.user.key, self.user.context, 'cityAdvisor', status, function(response, rescode) {
            var sameuser = false;
            var cluster;
            if (rescode == 201) {
                if ($state.params.user.key == self.user.key) { sameuser = true; }
                if ($state.params.user.cities[self.user.context].cityAdvisor === undefined) { //need to create key
                    $state.params.user.cities[self.user.context]['cityAdvisor'] = false;
                }

                $state.params.user.cities[self.user.context].cityAdvisor = status;

                for (cluster in self.community.location.clusters) {
                    if (status === true) {
                        if ($state.params.user.cities[self.user.context].clusters[cluster]) {
                            $state.params.user.cities[self.user.context].clusters[cluster].advisorStatus = true;
                        }
                    } else {
                        if (!$state.params.user.cities[self.user.context].clusters[cluster].roles || ($state.params.user.cities[self.user.context].clusters[cluster].roles.indexOf("Advisor") < 0)) {
                            $state.params.user.cities[self.user.context].clusters[cluster].advisorStatus = false;
                        } else {
                            $state.params.user.cities[self.user.context].clusters[cluster].advisorStatus = true;
                        }
                    }
                }

                if (sameuser) {
                    self.user.cities[self.user.context].cityAdvisor = status;
                }
            } else {
                self.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: " +  response.message);
            }
        });
    };

    $scope.setRole = function(cluster, role, status) { //todo needs to be reworked
        user_service.setRole($state.params.user.key, self.user.context, cluster, role, status, function(response, rescode) {
            var sameuser = false;
            if (rescode == 201) {
                if ($state.params.user.key == self.user.key) { sameuser = true; }
                if ($state.params.user.cities[self.user.context].clusters === undefined) { //need to create clusters key
                    $state.params.user.cities[self.user.context]['clusters'] = {};
                }
                if ($state.params.user.cities[self.user.context].clusters[cluster] === undefined) { //need to create the cluster in user profile
                    $state.params.user.cities[self.user.context].clusters[cluster] = { "roles": [] };
                }
                if ($state.params.user.cities[self.user.context].clusters[cluster].roles === undefined) { //this can happen due to temp local scope variables
                    $state.params.user.cities[self.user.context].clusters[cluster].roles = [];
                }
                var thiscluster = $state.params.user.cities[self.user.context].clusters[cluster];

                if (status === true) {
                    if (thiscluster.roles.indexOf(role) < 0) {
                        thiscluster.roles.push(role);
                    } // else they already have the role, no action needed
                } else {
                    if (thiscluster.roles.indexOf(role) >= 0) {
                        thiscluster.roles.splice(thiscluster.roles.indexOf(role), 1);
                    } // else they do not have the role, no action needed
                }

                $state.params.user.cities[self.user.context].clusters[cluster] = thiscluster;
                if (sameuser) { self.user.cities[self.user.context].clusters[cluster] = thiscluster; }

            } else {
                self.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: " +  response.message);

            }
        });
    };

    /**
     * Link third-party provider.
     */
    $scope.link = function(provider) {
        $auth.link(provider)
            .then(function() {
                self.alert ={ type: 'success', msg: 'Well done. You have successfully linked your ' + provider + ' account'};
            })
            .then(function() {
                $scope.getProfile();
            })
            .catch(function(response) {
                self.alert ={ type: 'danger', msg: 'Sorry, but we ran into this error: ' + response.data.message};
            });
    };

    /**
     * Unlink third-party provider.
     */
    $scope.unlink = function(provider) {
        $auth.unlink(provider)
            .then(function() {
                self.alert = { type: 'success', msg: 'Bam. You have successfully unlinked your ' + provider + ' account'};
            })
            .then(function() {
                $scope.getProfile();
            })
            .catch(function(response) {
                self.alert = { type: 'danger', msg: 'Aww, shucks. We ran into this error while unlinking your ' + provider + ' account: ' + response.data.message};
            });
    };

}

function InviteUserController($scope, user_service) {
    var self = this;

    $scope.invitePerson = function(url, email, userid) {
        $scope.disabled = true;
        user_service.invitePerson(url, email, userid, function(response) {
            $scope.disabled = false;
            if (response.status !== 200) {
                self.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: ");
                console.log(response);
            } else {
                self.alert = { type: 'success', msg: 'Person imported! ' + response.data.name + ' is good to go.' };
            }
        });
    };

    $scope.disabled = false;

}