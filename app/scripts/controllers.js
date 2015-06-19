angular
    .module('startupcommunity')
    .controller('mainCtrl', mainCtrl)
    .controller('PeopleController', PeopleController)
    .controller('LoginCtrl', LoginCtrl)
    .controller('InvitePeopleController', InvitePeopleController)
    .controller('ProfileController', ProfileController)
    .controller('ErrorPageController', ErrorPageController);

function mainCtrl($scope, $state, $location, $auth, userApi, communityApi, resultApi, $mixpanel) {

    $scope.global = { alert: {}, community: {}, context: {}};
    window.$scope = $scope; // for console testing to avoid $scope = $('body').scope()

    $scope.global.logout = function(error) {
        $auth.logout()
            .then(function() {
                $scope.global.user = undefined;
                if (error) {
                    (error.msg == 'undefined' || error.msg) ? $scope.global.alert = undefined : $scope.global.alert = error
                }
                $location.path('/login');
            });
    };

    $scope.isAuthenticated = function() {
        return $auth.isAuthenticated(); //returns true or false based on browser local storage token
    };

    $scope.search = function(query) {
        $scope.global.search.tag = query;
        $scope.global.search.results = undefined;
        userApi.earch($scope.global.user.context, query)
            .then(function(response) {
                $scope.global.search = resultApi.setPage(response.data);
                $scope.global.search.lastQuery = query;
                $location.path('/search');
            });
    };

    $scope.editProfile = function() {
        $state.go('user.profile', { user: $scope.global.user });
    };

    $scope.closeAlert = function() {
        $scope.global.alert = undefined;
    };

    $scope.global.findKey = function(obj, key, values, results, parent) {
        if (!obj) { return results; }

        var keys = Object.keys(obj),
            name = null,
            subkeys = null,
            parent,
            i = 0,
            j = 0,
            k = 0;

        for (i in keys) {
            name = keys[i];
            subkeys = obj[name];

            if (typeof subkeys === 'object') {
                if (name === key) {
                    if (values) {
                        for (j in subkeys) {
                            for (k in values) {
                                if (subkeys[j] == values[k]) {
                                    results.push({ value : values[k], key : parent});
                                }
                            }
                        }
                    } else {
                        results.push(subkeys);
                    }
                }

                parent = name;
                $scope.global.findKey(subkeys, key, values, results, parent);

            } else {

                if (name === key) {
                    if (results.indexOf(subkeys) === -1) {
                        if (values) {
                            for (k in values) {
                                if (obj[name] == value) {
                                    results.push(obj);
                                }
                            }
                        } else results.push(obj);
                    }
                }
            }
        }
        return results;
    };

    var broadcast = function() {
        $scope.$broadcast('sessionReady', true);
        //$location.path('/people');

        if ($scope.global.user.key) {
            $mixpanel.people.set({
                "$name": $scope.global.user.profile.name,
                "$email": $scope.global.user.profile.email
            });
            UserVoice.push(['identify', {
                id: $scope.global.user.key,
                name: $scope.global.user.profile.name,
                email: $scope.global.user.profile.email
            }]);
        }
    };

    // Get and set user and location data
    $scope.global.sessionReady = function() {
        if (!$scope.global.user || $scope.global.community == {} || $scope.global.context == {}) {
            userApi.getProfile()
                .success(function(response) {
                    if (!response.message) {
                        $scope.global.user = response;

                        var community = $scope.global.user.context.community || undefined;
                        var location = $scope.global.user.context.location || undefined;

                        if (!community && !location) { location = $scope.global.user.profile.linkedin.location.country.code || 'us'} //TODO does private/private block location in linkedin api?

                        communityApi.getCommunity(location, community)
                            .success(function(response) {
                                if (response) {
                                    $scope.global.community = response;
                                    $scope.global.context.community = community;
                                    $scope.global.context.location = location;

                                    broadcast();
                                } else {
                                    $scope.global.logout({ type: 'danger', msg: String(response.message) });
                                }
                            })
                            .error(function(response) {
                                $scope.global.alert = { type: 'danger', msg: String(response.message) };
                            });
                    } else {
                        $scope.global.logout({ type: 'danger', msg: String(response.message) });
                    }
                })
                .error(function(response) {
                    $scope.global.logout({ type: 'danger', msg: String(response.message) });
                });
        } else broadcast();

    };

    if ($scope.global.alert) {
        if ($scope.global.alert.msg == 'undefined' || !$scope.global.alert.msg) { $scope.global.alert = undefined }
    }

    $scope.global.sessionReady();

}

function PeopleController($scope, $location, userApi, resultApi, $sce) {

    $scope.getUsers = function(alturl) {
        userApi.getUsers($scope.global.context.location, $scope.global.context.community, undefined, undefined, 32, alturl)
            .then(function(response) {
                $scope.users = resultApi.setPage(response.data);
                if ($location.$$path == '/search') {
                    $scope.global.search = resultApi.setPage($scope.users);
                } else { $scope.global.search = undefined }
            });
    };

    function getData() {
        console.log('need to update this variable to account for relative paths: ' + $location.$$path)
        if ($location.$$path == '/people' || $scope.global.search === undefined) {
            $scope.getUsers();
        }
        $scope.global.context.selectedIndustry = ['*'];
        $scope.global.context.selectedRole = ['*'];
        setTitle();
    }

    function setTitle() {
        var item,
            role = '',
            industry = '';
        if ($scope.global.context.selectedRole[0] == '*') {
            role = "People";
        } else {
            for (item in $scope.global.context.selectedRole) {
                role += ($scope.global.context.selectedRole[item] + 's');
                if (item < $scope.global.context.selectedRole.length - 1) {
                    if (item < $scope.global.context.selectedRole.length - 2 ) {
                        role += '</strong>,<strong> ';
                    } else role += ' </strong>&<strong> ';
                }
            }
        }
        if ($scope.global.context.selectedIndustry[0] == '*') {
            industry = $scope.global.community.locations[$scope.global.context.location].profile.name;
        } else {
            item = 0;
            for (item in $scope.global.context.selectedIndustry) {
                industry += $scope.global.context.selectedIndustry[item];
                if (item < $scope.global.context.selectedIndustry.length - 1) {
                    if (item < $scope.global.context.selectedIndustry.length - 2 ) {
                        industry += ', ';
                    } else industry += ' & ';
                }
            }
        }
        $scope.title = '<strong>' + role + '</strong> in ' + industry;

        var pageTitle;

        if ($scope.global.context.community) {
            pageTitle = $scope.global.community.networks[$scope.global.context.community].profile.name;
        } else {
            pageTitle = $scope.global.community.locations[$scope.global.context.location].profile.name;
        }

        if ($scope.global.context.community && $scope.global.context.location) {
            pageTitle += '<br><small>' + $scope.global.community.locations[$scope.global.context.location].profile.name + '</small>';
        } else {
            pageTitle += '<br><small>Welcome ' + ($scope.global.user.profile.name).split(' ')[0] + '!</small>';
        }

        $scope.pageTitle = $sce.trustAsHtml(pageTitle);
    }

    $scope.filterIndustry = function(industry) {
        $scope.loadingIndustry = true;
        if (industry == '*') {
            $scope.global.context.selectedIndustry = ['*'];
        } else {
            if ($scope.global.context.selectedIndustry.indexOf('*') >= 0) {
                $scope.global.context.selectedIndustry.splice($scope.global.context.selectedIndustry.indexOf('*'), 1);
            }
            if ($scope.global.context.selectedIndustry.indexOf(industry) < 0) {
                $scope.global.context.selectedIndustry.push(industry);
            } else $scope.global.context.selectedIndustry.splice($scope.global.context.selectedIndustry.indexOf(industry), 1);
            if ($scope.global.context.selectedIndustry.length === 0) {
                $scope.global.context.selectedIndustry = ['*'];
            }
        }

        userApi.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedRole, 32, undefined)
            .then(function(response) {
                $scope.loadingIndustry = false;
                $scope.users = resultApi.setPage(response.data);
                setTitle();
            });
    };

    $scope.search = function(query) {
        $scope.global.search.tag = query;
        $scope.global.search.results = undefined;
        userApi.search($scope.global.user.context, query)
            .then(function(response) {
                $scope.global.search = resultApi.setPage(response.data);
                $scope.global.search.lastQuery = query;
                $location.path('/search');
            });
    };

    $scope.filterRole = function(role) {
        $scope.loadingRole = true;
        if (role == '*') {
            $scope.global.context.selectedRole = ['*'];
        } else {
            if ($scope.global.context.selectedRole.indexOf('*') >= 0) {
                $scope.global.context.selectedRole.splice($scope.global.context.selectedRole.indexOf('*'), 1);
            }
            if ($scope.global.context.selectedRole.indexOf(role) < 0) {
                $scope.global.context.selectedRole.push(role);
            } else $scope.global.context.selectedRole.splice($scope.global.context.selectedRole.indexOf(role), 1);
            if ($scope.global.context.selectedRole.length === 0) {
                $scope.global.context.selectedRole = ['*'];
            }
        }

        userApi.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedRole, 32, undefined)
            .then(function(response) {
                $scope.loadingRole = false;
                $scope.users = resultApi.setPage(response.data);
                setTitle();
            });
    };

    if (!$scope.global.user) {
        $scope.$on('sessionReady', function(event, status) {
            getData();
        });
    } else getData();

}

function ProfileController($scope, $state, userApi, communityApi, $location, $auth, $mixpanel) {

    $mixpanel.track('Viewed Profile');

    $scope.putProfile = function(userid, profile) {
        userApi.putProfile(userid, profile, function(response) {
            if (response.status !== 200) {
                $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: " +  response.message);
            } else {
                $scope.profile = response.data; // may need to tell angular to refresh view
                $scope.global.alert = { type: 'success', msg: 'Person updated! ' + response.data.name + ' is good to go.' };
            }
        });
    };

    $scope.removeProfile = function(userid, name) {
        notify("Are you sure you want to remove " + name + "?", function(result) { //todo fix notify maybe with sweetalert
            if (result) {
                userApi.removeProfile(userid, function(response) {
                    $location.path('/people');
                    $scope.global.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    $scope.updateProfile = function() {
        userApi.updateProfile({
            displayName: $scope.global.user.profile.name,
            email: $scope.global.user.profile.email
        }).then(function() {
            $scope.global.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };

    $scope.getKey = function() {
        if (!$scope.global.user.profile.api_key) {
            userApi.getKey()
                .then(function(response) {
                    $scope.global.user.profile.api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
    };

    var getActivity = function() {
        var activities = $scope.global.findKey($state.params.user.communities, "roles", ["leader", "advisor", "investor", "founder"], []),
            search = [];

        for (i in activities) {
            search.push(activities[i].key);
        }

        communityApi.getActivity(search)
            .then(function(response) {
                var activity = {};
                for (j in activities) {
                    activity[activities[j].value] = activity[activities[j].value] || {};
                    activity[activities[j].value][activities[j].key] = response.data[activities[j].key];
                }

                $state.params.user.profile.activity = activity;
            })
    };

    $scope.isCityAdvisor = function(status) { //todo needs to be reworked
        userApi.setCityAdvisor($state.params.user.key, $scope.global.user.context, 'cityAdvisor', status, function(response, rescode) {
            var sameuser = false;
            var cluster;
            if (rescode == 201) {
                if ($state.params.user.key == $scope.global.user.key) { sameuser = true; }
                if ($state.params.user.cities[$scope.global.user.context].cityAdvisor === undefined) { //need to create key
                    $state.params.user.cities[$scope.global.user.context]['cityAdvisor'] = false;
                }

                $state.params.user.cities[$scope.global.user.context].cityAdvisor = status;

                for (cluster in $scope.global.community.location.clusters) {
                    if (status === true) {
                        if ($state.params.user.cities[$scope.global.user.context].clusters[cluster]) {
                            $state.params.user.cities[$scope.global.user.context].clusters[cluster].advisorStatus = true;
                        }
                    } else {
                        if (!$state.params.user.cities[$scope.global.user.context].clusters[cluster].roles || ($state.params.user.cities[$scope.global.user.context].clusters[cluster].roles.indexOf("Advisor") < 0)) {
                            $state.params.user.cities[$scope.global.user.context].clusters[cluster].advisorStatus = false;
                        } else {
                            $state.params.user.cities[$scope.global.user.context].clusters[cluster].advisorStatus = true;
                        }
                    }
                }

                if (sameuser) {
                    $scope.global.user.cities[$scope.global.user.context].cityAdvisor = status;
                }
            } else {
                $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: " +  response.message);
            }
        });
    };

    $scope.setRole = function(cluster, role, status) { //todo needs to be reworked
        userApi.setRole($state.params.user.key, $scope.global.user.context, cluster, role, status, function(response, rescode) {
            var sameuser = false;
            if (rescode == 201) {
                if ($state.params.user.key == $scope.global.user.key) { sameuser = true; }
                if ($state.params.user.cities[$scope.global.user.context].clusters === undefined) { //need to create clusters key
                    $state.params.user.cities[$scope.global.user.context]['clusters'] = {};
                }
                if ($state.params.user.cities[$scope.global.user.context].clusters[cluster] === undefined) { //need to create the cluster in user profile
                    $state.params.user.cities[$scope.global.user.context].clusters[cluster] = { "roles": [] };
                }
                if ($state.params.user.cities[$scope.global.user.context].clusters[cluster].roles === undefined) { //this can happen due to temp local scope variables
                    $state.params.user.cities[$scope.global.user.context].clusters[cluster].roles = [];
                }
                var thiscluster = $state.params.user.cities[$scope.global.user.context].clusters[cluster];

                if (status === true) {
                    if (thiscluster.roles.indexOf(role) < 0) {
                        thiscluster.roles.push(role);
                    } // else they already have the role, no action needed
                } else {
                    if (thiscluster.roles.indexOf(role) >= 0) {
                        thiscluster.roles.splice(thiscluster.roles.indexOf(role), 1);
                    } // else they do not have the role, no action needed
                }

                $state.params.user.cities[$scope.global.user.context].clusters[cluster] = thiscluster;
                if (sameuser) { $scope.global.user.cities[$scope.global.user.context].clusters[cluster] = thiscluster; }

            } else {
                $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
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
                $scope.global.alert ={ type: 'success', msg: 'Well done. You have successfully linked your ' + provider + ' account'};
            })
            .then(function() {
                $scope.getProfile();
            })
            .catch(function(response) {
                $scope.global.alert ={ type: 'danger', msg: 'Sorry, but we ran into this error: ' + response.data.message};
            });
    };

    /**
     * Unlink third-party provider.
     */
    $scope.unlink = function(provider) {
        $auth.unlink(provider)
            .then(function() {
                $scope.global.alert = { type: 'success', msg: 'Bam. You have successfully unlinked your ' + provider + ' account'};
            })
            .then(function() {
                $scope.getProfile();
            })
            .catch(function(response) {
                $scope.global.alert = { type: 'danger', msg: 'Aww, shucks. We ran into this error while unlinking your ' + provider + ' account: ' + response.data.message};
            });
    };

   getActivity();

}

function InvitePeopleController($scope, $auth, userApi) {

    $scope.invitePerson = function(url, email, userid) {
        $scope.disabled = true;
        userApi.invitePerson(url, email, userid, function(response) {
            $scope.disabled = false;
            if (response.status !== 200) {
                $scope.global.alert = { type: 'danger', msg: 'There was a problem: ' + String(response.message) };
                console.warn("WARNING: ");
                console.log(response);
            } else {
                $scope.global.alert = { type: 'success', msg: 'Person imported! ' + response.data.name + ' is good to go.' };
            }
        });
    };

    $scope.disabled = false;

}

function LoginCtrl($scope, $auth, $location, $mixpanel) {

    $scope.isAuthenticated = function() {
        return $auth.isAuthenticated();
    };

    $scope.login = function() {
        $auth.login({ email: $scope.email, password: $scope.password })
            .then(function(response) {
                $scope.global.user = response.data.user;
                $scope.global.alert = undefined;
                $scope.global.sessionReady();
                $location.path('/app');
                console.log('Logged in!');
                $mixpanel.identify($scope.global.user.key);
                $mixpanel.track('Logged in');
            })
            .catch(function(response) {
                if (response.data.message && response.data.message !== 'undefined') {
                    $scope.global.alert = {type: 'danger', msg: String(response.data.message)};
                } else $scope.global.alert = undefined;
                console.warn("WARNING:");
                console.log(response);
            });
    };
    $scope.authenticate = function(provider) {
        $auth.authenticate(provider)
            .then(function(response) {
                $scope.global.user = response.data.user;
                $scope.global.alert = undefined;
                $scope.global.sessionReady();
                $mixpanel.identify($scope.global.user.key);
                $mixpanel.track('Logged in');
                $location.path('/app');
                //$route.reload(); remove if not needed
            })
            .catch(function(response) {
                console.warn("WARNING:");
                console.log(response);
                if (response.data.profile) {
                    $mixpanel.people.set({
                        "$name": response.data.profile.firstName + ' ' + response.data.profile.lastName,
                        "$email": response.data.profile.emailAddress
                    });
                    $mixpanel.track('Attempted Login');
                    UserVoice.push(['identify', {
                        name: response.data.profile.firstName + ' ' + response.data.profile.lastName,
                        email: response.data.profile.emailAddress
                    }]);
                }
                if (response.data.message && response.data.message !== 'undefined') {
                    $scope.global.alert = {type: 'danger', msg: String(response.data.message)};
                } else $scope.global.alert = undefined;
            });
    };
}

function ErrorPageController($scope, $location, $window, userApi) {

    $scope.formData = {};

    $scope.search = function(query) {
        try {
            userApi.search($scope.global.user.context, query)
                .then(function(results) {
                    $scope.global.search = results.data;
                    $location.path('/search');
                });
        } catch (err) {
            $scope.global.alert = {type: 'danger', msg: 'Whoops, we need you to login first.'};
        }
    };

    $scope.goBack = function() {
        $window.history.back();
    };

}