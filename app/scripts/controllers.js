angular
    .module('startupcommunity')
    .controller('MainController', MainController)
    .controller('NavigationController', NavigationController)
    .controller('PeopleController', PeopleController)
    .controller('LocationController', LocationController)
    .controller('StartupsController', StartupsController)
    .controller('StartupProfileController', StartupProfileController)
    .controller('LoginController', LoginController)
    .controller('InvitePeopleController', InvitePeopleController)
    .controller('PeopleProfileController', PeopleProfileController)
    .controller('ErrorPageController', ErrorPageController);

function MainController($scope, $state, $location, $auth, user_api, community_api, result_api, $mixpanel) {

    $scope.global = { alert: {} };
    window.$scope = $scope; // for console testing to avoid $scope = $('body').scope()

    $scope.global.logout = function(error) {
        $auth.logout()
            .then(function() {
                $scope.global.user = undefined;
                if (error) {
                    (error.msg == 'undefined' || error.msg) ? $scope.global.alert = undefined : $scope.global.alert = error
                }
                $state.go('login');
            });
    };

    $scope.isAuthenticated = function() {
        return $auth.isAuthenticated(); //returns true or false based on browser local storage token
    };

    $scope.search = function(query) {
        $scope.global.search.tag = query;
        $scope.global.search.results = undefined;
        user_api.earch($scope.global.user.context, query)
            .then(function(response) {
                $scope.global.search = result_api.setPage(response.data);
                $scope.global.search.lastQuery = query;
                $location.path('/search');
            });
    };

    $scope.editProfile = function() {
        $state.go('people.profile', { user: $scope.global.user });
    };

    $scope.closeAlert = function() {
        $scope.global.alert = undefined;
    };

    $scope.global.findKey = function(obj, key_to_find, results, key) {

        if (!obj) { return results; }
        if (!results) { results = []; }

        var keys = Object.keys(obj),
            name = null,
            subkeys = null,
            pushme = {},
            i = 0;

        for (i in keys) {
            name = keys[i];
            subkeys = obj[name];

            if (typeof subkeys === 'object') {
                subkeys["key"] = name;
                if (name === key_to_find) {
                    /* This creates an extra key object
                    if (key === undefined) {
                        results.push(obj);
                    } else if (key == obj.key) {
                        pushme[key] = obj;
                        results.push(pushme);
                    } else {
                        pushme[obj.key] = obj;
                        results.push(pushme);
                    }
                    */
                    results.push(obj);
                } else {
                    key = name;
                    $scope.global.findKey(subkeys, key_to_find, results, key);
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
        if (!$scope.global.user || $scope.global.community === undefined || $scope.global.context === undefined) {
            user_api.getProfile()
                .success(function(response) {
                    if (!response.message) {
                        $scope.global.user = response;
                        $scope.global.context = {};

                        var community = $scope.global.user.context.community || undefined;
                        var location = $scope.global.user.context.location || undefined;

                        if (!community && !location) { location = $scope.global.user.profile.linkedin.location.country.code || 'us'} //TODO does private/private block location in linkedin api?

                        community_api.getCommunity(location, community)
                            .success(function(response) {
                                if (response) {
                                    $scope.global.community = response;
                                    $scope.global.context.community = community;
                                    $scope.global.context.location = location;

                                    // for navigation
                                    $scope.global.community.locations = {};
                                    $scope.global.community.industries = {};
                                    $scope.global.community.networks = {};

                                    for (item in $scope.global.community) {

                                        switch ($scope.global.community[item].type) {
                                            case "location":
                                                $scope.global.community.locations[item] = $scope.global.community[item];
                                                break;
                                            case "industry":
                                                $scope.global.community.industries[item] = $scope.global.community[item];
                                                break;
                                            case "network":
                                                $scope.global.community.networks[item] = $scope.global.community[item];
                                                break;
                                        }
                                    }

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
        } else {
            broadcast();
        }

    };

    if ($scope.global.alert) {
        if ($scope.global.alert.msg == 'undefined' || !$scope.global.alert.msg) { $scope.global.alert = undefined }
    }

    $scope.global.sessionReady();

}

function NavigationController($scope) {

    var getNav = function() {
        $scope.maploc = $scope.global.findKey($scope.global.community.locations, $scope.global.context.location)[0][$scope.global.context.location].profile.name;
        $scope.locations = $scope.global.findKey($scope.global.community.locations, $scope.global.context.location);
        $scope.industries = $scope.global.findKey($scope.global.community.industries, $scope.global.context.location);
        $scope.networks = $scope.global.findKey($scope.global.community.networks, $scope.global.context.location);

        var roles = $scope.global.findKey($scope.global.user.communities, "roles"),
            rolelist = [],
            j,
            k,
            role;

        for (j in roles) {
            for (k in roles[j].roles) {
                role = roles[j].roles[k][0].toUpperCase() + roles[j].roles[k].slice(1);
                if (rolelist.indexOf(role) == -1 && role !== "Roles") {
                    rolelist.push(role);
                }
            }
        }

        $scope.global.user.profile["roles"] = rolelist;

    };

    if (!$scope.global.community) {
        $scope.$on('sessionReady', function (event, status) {
            getNav();
        });
    } else getNav();

}

function PeopleController($scope, $location, user_api, result_api, $sce) {

    $scope.getUsers = function(alturl) {
        user_api.getUsers($scope.global.context.location, $scope.global.context.community, undefined, undefined, 30, alturl)
            .then(function(response) {
                $scope.users = result_api.setPage(response.data);
                if ($location.$$path == '/search') {
                    $scope.global.search = result_api.setPage($scope.users);
                } else { $scope.global.search = undefined }
            });
    };

    function getData() {
        if ($location.$$path == '/people' || $scope.global.search === undefined) {
            $scope.getUsers(); // use defaults
        }
        $scope.global.context.selectedIndustry = ['*'];
        $scope.global.context.selectedRole = ['*'];
        $scope.global.context.selectedNetwork = ['*'];
        setTitle();

        $scope.industries = $scope.global.findKey($scope.global.community.industries, $scope.global.context.location);
        $scope.networks = $scope.global.findKey($scope.global.community.networks, $scope.global.context.location);

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
            industry = $scope.global.community[$scope.global.context.location].profile.name;
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
            pageTitle = $scope.global.community[$scope.global.context.community].profile.name;
        } else {
            pageTitle = $scope.global.community[$scope.global.context.location].profile.name;
        }

        if ($scope.global.context.community && $scope.global.context.location) {
            pageTitle += '<br><small>' + $scope.global.community[$scope.global.context.location].profile.name + '</small>';
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

        user_api.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedRole, 30, undefined)
            .then(function(response) {
                $scope.loadingIndustry = false;
                $scope.users = result_api.setPage(response.data);
                setTitle();
            });
    };

    $scope.search = function(query) {
        $scope.global.search.tag = query;
        $scope.global.search.results = undefined;
        user_api.search($scope.global.user.context, query)
            .then(function(response) {
                $scope.global.search = result_api.setPage(response.data);
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

        user_api.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedRole, 30, undefined)
            .then(function(response) {
                $scope.loadingRole = false;
                $scope.users = result_api.setPage(response.data);
                setTitle();
            });
    };

    $scope.skills = {};
    $scope.skills.selected = [];
    $scope.skills.list = ['.NET', 'Account Management', 'Accounting', 'ActionScript', 'Adobe', 'Adobe Acrobat', 'Adobe After Effects', 'Adobe Creative Suite', 'Adobe Illustrator', 'Adobe Indesign', 'Adobe Photoshop', 'Adobe Premiere', 'Advertising', 'Agile', 'Agile Project Management', 'Agile Software Develoment', 'AJAX', 'Algorithms', 'Amazon EC2', 'Amazon Web Services', 'Analytics', 'Android', 'AngularJS', 'Ant', 'Apache', 'Apache Tomcat', 'APIs', 'Apple', 'Architect', 'Arduino', 'Art Direction', 'Artificial Intelligence', 'ASP.NET', 'Assembly Language', 'Asset Management', 'Autocad', 'Automation', 'Automotive', 'Backbone.js', 'Backend Development', 'Bash', 'Big Data', 'Bilingual', 'Billing', 'Blackberry', 'Blogging', 'Bluetooth', 'Brand Management', 'Branding', 'Budgeting', 'Business Analysis', 'Business Development', 'Business Intelligence', 'Business Management', 'Business Model Innovation', 'Business Objects', 'Business Operations', 'Business Planning', 'Business Strategy', 'Buying', 'C', 'C#', 'C++', 'Cadence', 'CakePHP', 'Call Center', 'Capital Markets', 'CFO', 'Chef', 'Chemistry', 'Cisco', 'Citrix', 'Client Relations', 'Cloud Computing', 'Clustering', 'CMS', 'Coaching', 'Codeigniter', 'Coding', 'Coffeescript', 'Cold Calling', 'Communication Skills', 'Communications', 'Community Management', 'Compensation and Benefits', 'Competitive Analysis', 'Compliance', 'Composer', 'Computer Vision', 'comScore', 'Consulting', 'Consumer Electronics', 'Consumer Internet', 'Consumer Products', 'Content Creation', 'Content Management', 'Content Marketing', 'Content Strategy', 'Contract Negotiations', 'Control Systems', 'Copywriting', 'Corporate Finance', 'Creative Direction', 'Creative Problem Solving', 'Creative Strategy', 'Creative Writing', 'CRM', 'Cross-Functional Team Leadership', 'CSS', 'CSS3', 'Customer Acquisition', 'Customer Development', 'Customer Experience', 'Customer Relationship Management', 'Customer Service', 'CVS', 'D3.js', 'Data Analysis', 'Data Entry', 'Data Management', 'Data Mining', 'Data Visualization', 'Databases', 'DBMS', 'Debian', 'Debugging', 'Derivatives', 'Design', 'Design Management', 'Design Patterns', 'Design Research', 'Design Strategy', 'Design Thinking', 'DevOps', 'Digital Marketing', 'Digital Media', 'Digital Strategy', 'Distributed Systems', 'Distribution', 'Django', 'Documentation', 'Drafting', 'Dreamweaver', 'Drupal', 'Due Diligence', 'E-Commerce', 'Eclipse', 'Economics', 'Electrical Engineering', 'Electronics', 'Email', 'Email Marketing', 'Embedded Systems', 'Ember.js', 'Emerging Markets', 'Encryption', 'Engineering', 'English', 'Enterprise Software', 'Entertainment', 'Entrepreneurship', 'Event Management', 'Event Planning', 'Executive Management', 'Experience Design', 'ExpressJs', 'Fabrication', 'Facebook Advertising', 'Facebook API', 'Filing', 'Final Cut Pro', 'Finance', 'Financial Analysis', 'Financial Management', 'Financial Modeling', 'Financial Modelling & Valuation', 'Financial Reporting', 'Financial Services', 'Financial Statements', 'Firewall', 'Firmware', 'Flash', 'Fluent in Spanish', 'Focus', 'Forecasting', 'FPGA', 'FramerJS', 'Fraud', 'French language', 'Front-End Development', 'Full-Stack Web Development', 'Fundraising', 'Game Design', 'German Language', 'Git', 'Github', 'Go to Market Strategy', 'Google Adwords', 'Google Analytics', 'Google Apps', 'Graphic Design', 'Graphic Designer', 'Graphics Design', 'Growth Hacking', 'Hadoop', 'Haml', 'Hardware Engineering', 'Help Desk', 'Heroku', 'Hibernate', 'Highly Organized', 'Hive', 'HTML', 'HTML/CSS/PHP/MYSQL', 'HTML+CSS', 'HTML5 & CSS3', 'Human Resources', 'IBM DB2', 'IBM Websphere', 'Icon Design', 'Illustration', 'Illustrator', 'Image Processing', 'InDesign', 'Industrial Design', 'Information Architecture', 'Information Security', 'Information Technology', 'Infrastructure', 'Innovation & Growth', 'Inside Sales', 'Insurance', 'Integrity', 'Interaction Design', 'Interface Design', 'International Business', 'Internet', 'Internet Marketing', 'Inventory Management', 'Investment Banking', 'Investment Management', 'iOS', 'iOS Design', 'iOS Development', 'iPhone', 'ITIL', 'Japanese Language', 'Java', 'Java J2EE', 'Javascript', 'Javascript Frameworks', 'JBoss', 'JDBC', 'Jenkins', 'Jira', 'JOOMLA', 'jQuery', 'jQuery Mobile', 'JSON', 'JUNIT', 'Kanban', 'LAMP', 'LaTeX', 'Layout', 'Lead Generation', 'Leadership', 'Leadership and Team Inspiration', 'Leadership Development', 'Lean Startups', 'Legal', 'LESS', 'Licensing', 'Linux', 'Linux System Administration', 'Logistics', 'Lotus Notes', 'Mac OS X', 'Machine Learning', 'MAGENTO', 'Management', 'Management Consulting', 'Manufacturing', 'Market Research', 'Marketing', 'Marketing Communications', 'Marketing Management', 'Marketing Strategy', 'Matlab', 'Maven', 'MBA', 'Mechanical Engineering', 'Media Relations', 'Merchandising', 'Mergers & Acquisitions', 'Messaging', 'Metrics', 'Microsoft', 'Microsoft Access', 'Microsoft Excel', 'Microsoft Exchange', 'Microsoft Office', 'Microsoft Outlook', 'Microsoft Power Point', 'Microsoft PowerPoint', 'Microsoft Project', 'Microsoft SQL Server', 'Microsoft Visio', 'Microsoft Visual Basic', 'Microsoft Visual Studio', 'Microsoft Windows', 'Microsoft Word', 'Middleware', 'Mobile', 'Mobile Advertising', 'Mobile Application Design', 'Mobile Application Development', 'Mobile Design', 'Mobile Development', 'Mobile UI Design', 'Mobile User Experience', 'MongoDB', 'Multimedia', 'Mvc', 'MySQL', 'Natural Language Processing', 'Negotiation', 'Netbeans', 'Network Security', 'Networking', 'New Business Development', 'New Product Development', 'Nginx', 'Node.js', 'noSQL', 'Objective C', 'Objective-C', 'Online Marketing', 'OpenCV', 'OpenGL', 'Operating Systems', 'Operations', 'Operations Management', 'Oracle', 'Oracle 10g', 'Outsourcing', 'Payroll', 'PC', 'People Management', 'PeopleSoft', 'Perl', 'Pharmaceutical', 'Photography', 'Photoshop', 'PHP', 'Planning', 'Portfolio Management', 'PostgreSQL', 'Presentation Skills', 'Pricing', 'Print Design', 'Private Equity', 'Problem Solving', 'Process Improvement', 'Process Management', 'Procurement', 'Product', 'Product Design', 'Product Development', 'Product Launch', 'Product Management', 'Product Marketing', 'Product Strategy', 'Professional Services', 'Program Management', 'Program Manager', 'Programming', 'Programming Languages', 'Project Leader', 'Project Management', 'Project Manager', 'Public Relations', 'Public Speaking', 'Publishing', 'Purchasing', 'Python', 'Quality Assurance', 'Quality Control', 'Quickbooks', 'R', 'Rapid Prototyping', 'RDBMS', 'Real Estate', 'Recruiting', 'Redhat', 'Redis', 'Regression Testing', 'Relational Databases', 'Relationship Building', 'Reliability', 'Requirements Analysis', 'Research', 'Research and Development', 'Responsive Design', 'REST', 'REST APIs', 'RESTful Services', 'Retail', 'Risk Analysis', 'Risk Management', 'Robotics', 'Routers', 'Ruby', 'Ruby on Rails', 'Russian language', 'SaaS', 'Sales', 'Sales and Marketing', 'Sales Strategy and Management', 'Sales Support', 'Sales Training', 'Sales/Marketing and Strategic Partnerships', 'Salesforce', 'SalesForce.com', 'SAP', 'SAS', 'Sass', 'Scala', 'Scheduling', 'Scheme', 'Science', 'SCRUM', 'Scrum Master', 'SCSS/Sass', 'SDK', 'SDLC', 'Search Engine Marketing (SEM)', 'Security', 'Selenium', 'SEO', 'SEO/SEM', 'Servlets', 'SharePoint', 'Shell Scripting', 'Social Media', 'Social Media Marketing', 'Social Media Strategy', 'Social Strategy', 'Software', 'Software Architecture', 'Software Design', 'Software Development', 'Software Engineering', 'Software Testing', 'Solidworks', 'Sourcing', 'Spanish', 'Sports', 'Spring', 'SPSS', 'SQL', 'SQL Server', 'SQLite', 'Start-Up CEO', 'Start-Ups', 'Startup Founder', 'Startups', 'Statistical Analysis', 'Statistics', 'Strategic Partnerships', 'Strategic Planning', 'Strategy', 'Strong Work Ethic', 'Struts', 'Subversion', 'Supply Chain Management', 'Support', 'Svn', 'Swift', 'Swing', 'System Administration', 'System Design', 'Systems Administration', 'Tableau', 'Talent Acquisition', 'TDD', 'Team Building', 'Team Leadership', 'Team Player', 'Teamwork', 'Technical Support', 'Technical Writing', 'Technology', 'Telecommunications', 'Test', 'Test Automation', 'Test Cases', 'Test Plans', 'TFS', 'Training', 'Transportation', 'Travel', 'Twitter Bootstrap', 'Ubuntu', 'UI Design', 'UI/UX Design', 'Unit Testing', 'Unity3D', 'Unix', 'Unix Shell Scripting', 'Usability Testing', 'Use Cases', 'User Experience Design', 'User Interaction Design', 'User Interface', 'User Interface Design', 'User Research', 'User-Centered Design', 'Utilities', 'UX Design', 'UX Design and Strategy', 'UX/UI Designer', 'Vendor Management', 'Venture Capital', 'Venture Fundraising', 'Verilog', 'Version Control', 'VHDL', 'Video', 'Video Editing', 'Video Production', 'Visio', 'Visual Basic', 'Visual Design', 'Wealth Management', 'Web', 'Web Analytics', 'Web Application Design', 'Web Application Frameworks', 'Web Applications', 'Web Design', 'Web Development', 'Web Services', 'Wholesale', 'Windows', 'Wireframing', 'Wireless', 'Wireshark', 'Wordpress', 'Writing', 'Xcode', 'XHTML', 'XML', 'XSLT', 'Zend Framework', 'Zepto'];

    if (!$scope.global.user || $scope.global.context === undefined) {
        $scope.$on('sessionReady', function(event, status) {
            getData();
        });
    } else getData();

}

function PeopleProfileController($scope, $state, user_api, community_api, $location, $auth, $mixpanel) {

    $mixpanel.track('Viewed Profile');

    if ($state.params.user.key) {
        $location.path('/' + $state.params.user.key)
    }

    $scope.putProfile = function(userid, profile) {
        user_api.putProfile(userid, profile, function(response) {
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
                user_api.removeProfile(userid, function(response) {
                    $location.path('/people');
                    $scope.global.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    $scope.updateProfile = function() {
        user_api.updateProfile({
            displayName: $scope.global.user.profile.name,
            email: $scope.global.user.profile.email
        }).then(function() {
            $scope.global.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };

    $scope.getKey = function() {
        if (!$scope.global.user.profile.api_key) {
            user_apis.getKey()
                .then(function(response) {
                    $scope.global.user.profile.api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
    };

    var getActivity = function() {

        var activities = $scope.global.findKey($state.params.user.communities, "roles"),
            activity = {};

        for (var j in activities) {
           if (activities[j].roles.indexOf('advisor') > -1) {
               activity.advisor = activity.advisor || {};
               activity.advisor[activities[j].key] = activities[j];
           } else if (activities[j].roles.indexOf('leader') > -1) {
               activity.leader = activity.leader || {};
               activity.leader[activities[j].key] = activities[j];
           } else if (activities[j].roles.indexOf('investor') > -1) {
               activity.investor = activity.investor || {};
               activity.investor[activities[j].key] = activities[j];
           } else if (activities[j].roles.indexOf('founder') > -1) {
               activity.founder = activity.founder || {};
               activity.founder[activities[j].key] = activities[j];
           };
        }

        $state.params.user.profile.activity = activity;
    };

    $scope.isCityAdvisor = function(status) { //todo needs to be reworked
        user_api.setCityAdvisor($state.params.user.key, $scope.global.user.context, 'cityAdvisor', status, function(response, rescode) {
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
        user_api.setRole($state.params.user.key, $scope.global.user.context, cluster, role, status, function(response, rescode) {
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

function LocationController($state, $location, user_api) {

    if ($state.params.community.key) {
        $location.path('/' + $state.params.community.key)
    }

    $scope.charts = {
        people: {},
        startups: {},
        jobs: {}
    };

    $scope.charts.people.labels = ["", "", "", ""];
    $scope.charts.people.series = ['Monthly Growth'];
    $scope.charts.people.data = [[157, 165, 172, 184]];
    $scope.charts.people.colors = ["#97BBCD"];

    $scope.charts.startups.labels = ["", "", "", ""];
    $scope.charts.startups.series = ['Monthly Growth'];
    $scope.charts.startups.data = [[77, 78, 78, 79]];
    $scope.charts.startups.colors = ["#A1BE85"];

    $scope.charts.jobs.labels = ["", "", "", ""];
    $scope.charts.jobs.series = ['Monthly Growth'];
    $scope.charts.jobs.data = [[294, 290, 320, 325]];
    $scope.charts.jobs.colors = ["#FF7D80"];

    $scope.charts.options = {
        scaleShowGridLines: false,
        animation: false,
        showScale: false
    };

    var getLeaders = function() {
        user_api.getUsers($state.params.community.key, undefined, undefined, encodeURIComponent(['Advisor']), 30) //todo change to Leader
        .then( function(result) {
            $scope.leaders = result.data.results;
        })
    };

    getLeaders();
}

function StartupsController($scope, $location, angellist_api, result_api, $sce) {

    $scope.getStartups = function() {

        angellist_api.getStartups(2300) // need to ask for this going forward or figure out how to resolve it automatically
            .then(function(response) {

                $scope.startups = response.data;
                if ($location.$$path == '/search') {
                    $scope.global.search = response.data;
                } else { $scope.global.search = undefined }
            });
    };

    function getData() {
        if ($location.$$path == '/startups' || $scope.global.search === undefined) {
            $scope.getStartups(); // use defaults
        }
        $scope.global.context.selectedIndustry = ['*'];
        $scope.global.context.selectedStage = ['*'];
        $scope.global.context.selectedNetwork = ['*'];
        setTitle();

        $scope.industries = $scope.global.findKey($scope.global.community.industries, $scope.global.context.location);
        $scope.networks = $scope.global.findKey($scope.global.community.networks, $scope.global.context.location);
    }

    function setTitle() {
        var item,
            stage = '',
            industry = '';
        if ($scope.global.context.selectedStage[0] == '*') {
            stage = "Startups";
        } else {
            for (item in $scope.global.context.selectedStage) {
                stage += ($scope.global.context.selectedStage[item] + 's');
                if (item < $scope.global.context.selectedStage.length - 1) {
                    if (item < $scope.global.context.selectedStage.length - 2 ) {
                        stage += '</strong>,<strong> ';
                    } else stage += ' </strong>&<strong> ';
                }
            }
        }
        if ($scope.global.context.selectedIndustry[0] == '*') {
            industry = $scope.global.community[$scope.global.context.location].profile.name;
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
        $scope.title = '<strong>' + stage + '</strong> in ' + industry;

        var pageTitle;

        if ($scope.global.context.community) {
            pageTitle = $scope.global.community[$scope.global.context.community].profile.name;
        } else {
            pageTitle = $scope.global.community[$scope.global.context.location].profile.name;
        }

        if ($scope.global.context.community && $scope.global.context.location) {
            pageTitle += '<br><small>' + $scope.global.community[$scope.global.context.location].profile.name + '</small>';
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

        user_api.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedStage, 30, undefined)
            .then(function(response) {
                $scope.loadingIndustry = false;
                $scope.users = result_api.setPage(response.data);
                setTitle();
            });
    };

    $scope.search = function(query) {
        $scope.global.search.tag = query;
        $scope.global.search.results = undefined;
        user_api.search($scope.global.user.context, query)
            .then(function(response) {
                $scope.global.search = result_api.setPage(response.data);
                $scope.global.search.lastQuery = query;
                $location.path('/search');
            });
    };

    $scope.filterStage = function(stage) {
        $scope.loadingStage = true;
        if (stage == '*') {
            $scope.global.context.selectedStage = ['*'];
        } else {
            if ($scope.global.context.selectedStage.indexOf('*') >= 0) {
                $scope.global.context.selectedStage.splice($scope.global.context.selectedStage.indexOf('*'), 1);
            }
            if ($scope.global.context.selectedStage.indexOf(stage) < 0) {
                $scope.global.context.selectedStage.push(stage);
            } else $scope.global.context.selectedStage.splice($scope.global.context.selectedStage.indexOf(stage), 1);
            if ($scope.global.context.selectedStage.length === 0) {
                $scope.global.context.selectedStage = ['*'];
            }
        }

        user_api.getUsers($scope.global.context.location, $scope.global.context.community, $scope.global.context.selectedIndustry, $scope.global.context.selectedStage, 30, undefined)
            .then(function(response) {
                $scope.loadingStage = false;
                $scope.users = result_api.setPage(response.data);
                setTitle();
            });
    };

    if (!$scope.global.user || $scope.global.context === undefined) {
        $scope.$on('sessionReady', function(event, status) {
            getData();
        });
    } else getData();

}

function StartupProfileController($scope, $state, user_api, community_api, $location, $auth, $mixpanel) {

    $mixpanel.track('Viewed Startup');

    $scope.putProfile = function(userid, profile) {
        user_api.putProfile(userid, profile, function(response) {
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
                user_api.removeProfile(userid, function(response) {
                    $location.path('/people');
                    $scope.global.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    $scope.updateProfile = function() {
        user_api.updateProfile({
            displayName: $scope.global.user.profile.name,
            email: $scope.global.user.profile.email
        }).then(function() {
            $scope.global.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };

    $scope.getKey = function() {
        if (!$scope.global.user.profile.api_key) {
            user_apis.getKey()
                .then(function(response) {
                    $scope.global.user.profile.api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + $scope.global.user.profile.api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + $scope.global.user.profile.api_key + "</pre>"});
    };

    var getActivity = function() {

        var activities = $scope.global.findKey($state.params.user.communities, "roles", ["leader", "advisor", "investor", "founder"], {}),
            list = Object.keys(activities);

        community_api.getActivity(list)
            .then(function(response) {
                var activity = {};
                for (var j in activities) {
                    for (var k in activities[j]) {
                        activity[activities[j][k]] = activity[activities[j][k]] || {}; // create empty object or fill with existing object
                        activity[activities[j][k]][j] = response.data[j]; // append matched object
                    }
                }
                $state.params.user.profile.activity = activity;
            })
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

   // getActivity();

}


function InvitePeopleController($scope, $auth, user_api) {

    $scope.invitePerson = function(url, email, userid) {
        $scope.disabled = true;
        user_api.invitePerson(url, email, userid, function(response) {
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

function LoginController($scope, $auth, $location, $mixpanel) {

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

function ErrorPageController($scope, $location, $window, user_api) {

    $scope.formData = {};

    $scope.search = function(query) {
        try {
            user_api.search($scope.global.user.context, query)
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