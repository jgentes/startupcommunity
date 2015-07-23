angular
    .module('startupcommunity')
    .controller('PeopleController', PeopleController)
    .controller('PeopleProfileController', PeopleProfileController)
    .controller('InvitePeopleController', InvitePeopleController);

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

        $scope.industries = findKey($scope.global.community.industries, $scope.global.context.location);
        $scope.networks = findKey($scope.global.community.networks, $scope.global.context.location);

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
            industry = $scope.global.community.profile.name;
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
            pageTitle = $scope.global.community.profile.name;
        } else {
            pageTitle = $scope.global.community.profile.name;
        }

        if ($scope.global.context.community && $scope.global.context.location) {
            pageTitle += '<br><small>' + $scope.global.community.profile.name + '</small>';
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

function PeopleProfileController($scope, $location, $auth, $mixpanel, user, user_api) {

    this.user = user.data;

    $mixpanel.track('Viewed Profile');
    /* THIS CAUSES DUPLICATE ROUTES
    if (this.user.key) {
        $location.path('/' + this.user.key)
    }
    */
    this.putProfile = function(userid, profile) {
        user_api.putProfile(userid, profile, function(response) {
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
                user_api.removeProfile(userid, function(response) {
                    $location.path('/people');
                    this.alert = { type: 'success', msg: "Person removed. Hopefully they'll return some day." };
                });
            }
        });
    };

    this.updateProfile = function() {
        user_api.updateProfile({
            displayName: user.profile.name,
            email: user.profile.email
        }).then(function() {
            this.alert = { type: 'success', msg: "Great news. Your profile has been updated."};
        });
    };

    this.getKey = function() {
        if (!user.profile.api_key) {
            user_apis.getKey()
                .then(function(response) {
                    var api_key = response.data;
                    notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
                });
        } else notify({title: "See our <a href='http://startupcommunity.readme.io?appkey=" + api_key + "' target='_blank'>API documentation</a> for help using your key:", message: "<pre>" + api_key + "</pre>"});
    };

    var activities = findKey(this.user.communities, "roles"),
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

    this.activity = activity;

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