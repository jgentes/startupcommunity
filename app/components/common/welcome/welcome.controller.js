angular
    .module('startupcommunity')
    .controller('WelcomeController', WelcomeController);

function WelcomeController($auth, $q, $http, $mixpanel, $stateParams, $scope, $filter, community, location, user_service, company_service) {
    var self = this;
    this.location = jQuery.isEmptyObject(location) ? community.profile.name : location.profile.name.split(',')[0];
    this.auth = 1; //set to false
    $state.go('welcome.roles'); //remove
    this.working = false;

    var community_path = $stateParams.community_path ? $stateParams.community_path : $stateParams.location_path;
    this.authenticate = function() {
        self.working = true;
        $auth.authenticate('linkedin', {invite_code: $stateParams.invite_code})
            .then(function(response) {

                if (response.status !== 200) {
                    self.alert = { type: 'danger', message: 'There was a problem: ' + String(response.data.message) };
                } else {
                    self.auth = true;
                    self.user = response.data.user.value;
                    self.user["key"] = response.data.user.path.key;
                    self.user.profile["headline"] = self.user.profile.linkedin.headline;
                    self.user.profile["avatar"] = self.user.profile.linkedin.pictureUrl;
                    self.user.profile["summary"] = self.user.profile.linkedin.summary;

                    $state.go('welcome.roles');
                    // need to update user record with linkedin data now

                    $mixpanel.identify(response.data.user.path.key);
                    $mixpanel.track('Accepted Invite');

                }

            })
            .catch(function(response) {
                console.log(response);
                if (response.error || response.data) {
                    self.alert = {type: 'danger', message: String(response.error || response.data.message)};
                } else self.alert = undefined;
            });
    };

    // for profile pic upload to S3
    this.upload = function (file) {

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

    this.submit = function() {
        if (self.selectedCompany && !self.companyAdded) {
            self.alert = {type: "warning", message: "Warning: " + self.selectedCompany.name + " has been selected but hasn't been added yet."}
        }
        //console.log(self.industries.selected);
        //console.log(self.skills.selected);

    };

    // for typeahead on company search field
    this.getCompanies = function(val) {
        return $http.get('/api/2.1/angel/startups/search?val=' + val)
        .then(function(response){
            return response.data.map(function(item){
                return item;
            });
        });
    };

    // present user with list of roles they selected previously when creating companies
    $scope.$watchCollection("welcome.roles", function(newVal, oldVal) {
        self.selectRoles = [];
        for (r in newVal) {
            if (newVal[r]) { // only true items
                self.selectRoles.push({
                    value: r,
                    text: r[0].toUpperCase() + r.slice(1)
                })
            }
        }
        self.selectedRole = self.selectRoles[0] || {text:'not involved'};
    });

    // used in add company view
    this.showRole = function() {
        var selected = $filter('filter')(self.selectRoles, {value: self.selectedRole});
        return (selected.length) ? selected[0].text : self.selectedRole.text;
    };

    this.addCompany = function() {
        this.working = true;

        company_service.addCompany(self.selectedCompany.id, location.key, community_path)
            .then(function(response) {
                self.working = false;

                if (response.status !== 200) {
                    self.alert = { type: 'danger', message: 'There was a problem: ' + String(response.data.message) };
                } else {
                    self.companyAdded = true;
                    self.alert = { type: 'success', message: 'Congrats, ' + response.data.profile.name + ' has been added to your profile.' };
                }
            });


    };




    this.skills = ['.NET', '3D', '3D Printing', '3D Technology', 'Account Management', 'Accounting', 'ActionScript', 'Active Lifestyle', 'Ad Targeting', 'Adaptive Equipment', 'Adobe', 'Adobe Acrobat', 'Adobe After Effects', 'Adobe Creative Suite', 'Adobe Illustrator', 'Adobe Indesign', 'Adobe Photoshop', 'Adobe Premiere', 'Advanced Materials', 'Adventure Travel', 'Advertising', 'Advertising Exchanges', 'Advertising Networks', 'Advertising Platforms', 'Advice', 'Aerospace', 'Agile', 'Agriculture', 'Air Pollution Control', 'AJAX', 'Algorithms', 'Alternative Medicine', 'Alumni', 'Amazon EC2', 'Amazon Web Services', 'Analytics', 'Android', 'Angels', 'AngularJS', 'Animal Feed', 'Ant', 'Apache', 'APIs', 'APM', 'App Discovery', 'App Marketing', 'App Stores', 'Apple', 'Application Platforms', 'Apps', 'Aquaculture', 'Architecture', 'Archiving', 'Arduino', 'Art', 'Art Direction', 'Artificial Intelligence', 'ASP.NET', 'Assembly Language', 'Asset Management', 'Assisitive Technology', 'Assisted Living', 'Attention to Detail', 'Auctions', 'Audio', 'Audiobooks', 'Augmented Reality', 'Auto', 'Autocad', 'Automated Kiosk', 'Automation', 'Automotive', 'B2B', 'Babies', 'Baby Accessories', 'Baby Boomers', 'Baby Safety', 'Backbone.js', 'Backend Development', 'Banking', 'Bash', 'Batteries', 'Beauty', 'Bicycles', 'Big Data', 'Big Data Analytics', 'Bilingual', 'Billing', 'Bio-Pharm', 'Biofuels', 'Bioinformatics', 'Biometrics', 'Biotechnology', 'Bitcoin', 'Blackberry', 'Blogging', 'Blogging Platforms', 'Bloomberg', 'Bluetooth', 'Boating Industry', 'BPO Services', 'Brand and Identity Design', 'Brand Design and Strategy', 'Brand Development', 'Brand Management', 'Brand Marketing', 'Branding', 'Brewing', 'Bridging Online and Offline', 'Broadcasting', 'Brokers', 'Browser Extensions', 'Budgeting', 'Building Products', 'Business Analysis', 'Business Analytics', 'Business Development', 'Business Information Systems', 'Business Intelligence', 'Business Management', 'Business Model Innovation', 'Business Objects', 'Business Operations', 'Business Planning', 'Business Productivity', 'Business Requirement gathering', 'Business Services', 'Business Strategy', 'Business Travelers', 'Buying', 'C', 'Cable', 'CAD', 'Cadence', 'CakePHP', 'Call Center', 'Cannabis', 'Capital Markets', 'Carbon', 'Career Management', 'Career Planning', 'Cars', 'Cause Marketing', 'Celebrity', 'Certification Test', 'CFO', 'Charity', 'Charter Schools', 'Chat', 'Chef', 'Chemicals', 'Chemistry', 'Child Care', 'China Internet', 'Cisco', 'Citrix', 'Civil Engineers', 'Classifieds', 'Clean Energy', 'Clean Technology', 'Client Relations', 'Clinical Trials', 'Cloud Computing', 'Cloud Data Services', 'Cloud Infrastructure', 'Cloud Management', 'Cloud Security', 'Cloud-Based Music', 'Clustering', 'CMS', 'Coaching', 'Codeigniter', 'Coding', 'Coffee', 'Coffeescript', 'Cold Calling', 'Collaboration', 'Collaborative Consumption', 'Collectibles', 'College Campuses', 'College Recruiting', 'Colleges', 'Comics', 'Commercial Real Estate', 'Commercial Solar', 'Commodities', 'Communication Skills', 'Communications', 'Communications Hardware', 'Communications Infrastructure', 'Communities', 'Community Management', 'Comparison Shopping', 'Compensation and Benefits', 'Competitive Analysis', 'Compliance', 'Composer', 'Computer Vision', 'Computers', 'comScore', 'Concerts', 'Console Gaming', 'Construction', 'Consulting', 'Consumer Behavior', 'Consumer Electronics', 'Consumer Goods', 'Consumer Internet', 'Consumer Lending', 'Consumer Products', 'Consumers', 'Contact Centers', 'Contact Management', 'Content', 'Content Creation', 'Content Creators', 'Content Delivery', 'Content Discovery', 'Content Management', 'Content Marketing', 'Content Strategy', 'Content Syndication', 'Contests', 'Contract Negotiations', 'Control Systems', 'Cooking', 'Copywriting', 'Corporate Finance', 'Corporate IT', 'Corporate Training', 'Corporate Wellness', 'Cosmetic Surgery', 'Cosmetics', 'Coupons', 'Coworking', 'Craft Beer', 'Creative', 'Creative Direction', 'Creative Industries', 'Creative Problem Solving', 'Creative Strategy', 'Creative Writing', 'Credit', 'Credit Cards', 'CRM', 'Cross-Functional Team Leadership', 'Crowdfunding', 'Crowdsourcing', 'CSS', 'Curated Web', 'Custom Retail', 'Customer Acquisition', 'Customer Development', 'Customer Experience', 'Customer Service', 'Customer Support Tools', 'CVS', 'Cyber', 'Cyber Security', 'D3.js', 'Data Analysis', 'Data Center Automation', 'Data Centers', 'DATA ENTRY', 'Data Integration', 'data management', 'Data Mining', 'Data Privacy', 'Data Security', 'Data Visualization', 'Databases', 'DBMS', 'Debian', 'Debt Collecting', 'Debugging', 'Deep Information Technology', 'Defense', 'Demographies', 'Dental', 'Derivatives', 'Design', 'Design Management', 'Design Patterns', 'Design Research', 'Design Strategy', 'Design Thinking', 'Designers', 'Developer APIs', 'Developer Tools', 'Development Platforms', 'DevOps', 'Diabetes', 'Diagnostics', 'Dietary Supplements', 'Digital Entertainment', 'Digital Marketing', 'Digital Media', 'Digital Rights Management', 'Digital Signage', 'Digital Strategy', 'Direct Marketing', 'Direct Sales', 'Discounts', 'Displays', 'Distributed Systems', 'Distribution', 'Distributors', 'DIY', 'Django', 'Doctors', 'Document Management', 'Documentation', 'DOD/Military', 'Domains', 'Drafting', 'Dreamweaver', 'Drones', 'Drupal', 'Due Diligence', 'Early-Stage Technology', 'eBooks', 'Eclipse', 'eCommerce', 'Economics', 'EDA Tools', 'eDiscovery', 'EdTech', 'Education', 'Educational Games', 'Edutainment', 'Elder Care', 'Elderly', 'Electric Vehicles', 'Electrical Distribution', 'Electrical Engineering', 'Electronic Health Records', 'Electronics', 'Email', 'Email Marketing', 'Email Newsletters', 'Embedded Hardware and Software', 'Embedded Systems', 'Ember.js', 'Emerging Markets', 'Employer Benefits Programs', 'Employment', 'Encryption', 'Energy', 'Energy Efficiency', 'Energy IT', 'Energy Management', 'Energy Storage', 'Engineering', 'Engineering Firms', 'English', 'English-Speaking', 'Enterprise 2.0', 'Enterprise Application', 'Enterprise Hardware', 'Enterprise Purchasing', 'Enterprise Resource Planning', 'Enterprise Search', 'Enterprise Security', 'Enterprise Software', 'Enterprises', 'Entertainment', 'Entertainment Industry', 'Entrepreneurship', 'Environmental Innovation', 'Estimation and Quoting', 'Event Management', 'Event Planning', 'Events', 'Executive Management', 'Exercise', 'Experience Design', 'ExpressJs', 'Eyewear', 'Fabrication', 'Face Recognition', 'Facebook Advertising', 'Facebook API', 'Facebook Applications', 'Families', 'Fantasy Sports', 'Farmers Market', 'Farming', 'Fashion', 'Fertility', 'Field Support Services', 'File Sharing', 'Filing', 'Film', 'Film Distribution', 'Film Production', 'Final Cut Pro', 'Finance', 'Finance Technology', 'Financial Analysis', 'Financial Exchanges', 'Financial Management', 'Financial Modeling', 'Financial Reporting', 'Financial Services', 'Financial Statements', 'Firewall', 'Firmware', 'Fitness', 'Flash', 'Flash Sales', 'Flash Storage', 'Fleet Management', 'Flowers', 'Fluent in Spanish', 'Focus', 'Food Processing', 'Forecasting', 'Forums', 'FPGA', 'FramerJS', 'Franchises', 'Fraud', 'Fraud Detection', 'Freelancers', 'Freemium', 'FreetoPlay Gaming', 'French language', 'Front-End Development', 'Fruit', 'Fuels', 'Full-Stack Web Development', 'Fundraising', 'Gadget', 'Gambling', 'Game Design', 'Game Mechanics', 'Games', 'Gamification', 'Gas', 'Gay & Lesbian', 'General Public Worldwide', 'Generation Y-Z', 'Genetic Testing', 'Geospatial', 'German Language', 'Gift Card', 'Gift Exchange', 'Gift Registries', 'Git', 'Github', 'Go to Market Strategy', 'Gold', 'Golf Equipment', 'Google Adwords', 'Google Analytics', 'Google Apps', 'Google Glass', 'Government Innovation', 'Governments', 'Gps', 'Graphic Design', 'Graphics', 'Green', 'Green Building', 'Green Consumer Goods', 'Groceries', 'Group Buying', 'Group SMS', 'Growth Hacking', 'Guide to Nightlife', 'Guides', 'Hadoop', 'Haml', 'Handmade', 'Hardware', 'Hardware + Software', 'Hardware Engineering', 'Health and Insurance', 'Health and Wellness', 'Health Care', 'Health Care IT', 'Health Services Industry', 'Healthcare Services', 'Heavy Industry', 'Hedge Funds', 'Help Desk', 'Heroku', 'Hibernate', 'High School Students', 'High Schools', 'High Tech', 'Highly Organized', 'Hive', 'Home & Garden', 'Home Automation', 'Home Decor', 'Home Owners', 'Home Renovation', 'Homeland Security', 'Homeless Shelter', 'Hospitality', 'Hospitals', 'Hotels', 'HTML', 'HTML/CSS/PHP/MYSQL', 'HTML+CSS', 'HTML5 & CSS3', 'Human Computer Interaction', 'Human Resource Automation', 'Human Resources', 'Humanitarian', 'IaaS', 'IBM DB2', 'IBM Websphere', 'Icon Design', 'ICT', 'Identity', 'Identity Management', 'Illustration', 'Image Processing', 'Image Recognition', 'Impact Investing', 'In-Flight Entertainment', 'Incentives', 'Incubators', 'Independent Music Labels', 'Independent Pharmacies', 'InDesign', 'Indoor Positioning', 'Industrial', 'Industrial Automation', 'Industrial Design', 'Information Architecture', 'Information Security', 'Information Services', 'Information Technology', 'Infrastructure', 'Infrastructure Builders', 'Innovation & Growth', 'Innovation Engineering', 'Innovation Management', 'Inside Sales', 'Insurance', 'Integrity', 'Intellectual Asset Management', 'Intellectual Property', 'Intelligent Systems', 'Interaction Design', 'Interest Graph', 'Interface Design', 'Interior Design', 'International Business', 'Internet', 'Internet Infrastructure', 'Internet Marketing', 'Internet of Things', 'Internet Radio Market', 'Internet Service Providers', 'Internet TV', 'Inventory Management', 'Investment Banking', 'Investment Management', 'iOS', 'iOS Design', 'iOS Development', 'iPad', 'iPhone', 'iPod Touch', 'IT Management', 'ITIL', 'Japanese Language', 'Java', 'Java J2EE', 'Javascript', 'Javascript Frameworks', 'JBoss', 'JDBC', 'Jenkins', 'Jewelry', 'Jira', 'JOOMLA', 'Journalism', 'jQuery', 'jQuery Mobile', 'JSON', 'JUNIT', 'K-12 Education', 'Kanban', 'Kids', 'Kinect', 'Knowledge Management', 'LAMP', 'Landscaping', 'Language Learning', 'Lasers', 'LaTeX', 'Law Enforcement', 'Layout', 'Lead Generation', 'Lead Management', 'Leadership', 'Leadership and Team Inspiration', 'Leadership Development', 'Lean Startups', 'Legal', 'Leisure', 'LESS', 'Licensing', 'Life Sciences', 'Lifestyle', 'Lifestyle Products', 'Lighting', 'Limousines', 'Lingerie', 'Linux', 'Linux System Administration', 'Local', 'Local Advertising', 'Local Based Services', 'Local Businesses', 'Local Commerce', 'Local Coupons', 'Local Search', 'Local Services', 'Location Based Services', 'Logistics', 'Logistics Company', 'Lotteries', 'Lotus Notes', 'Low Bid Auctions', 'Loyalty Programs', 'M2M', 'Mac', 'Mac OS X', 'Machine Learning', 'Made in Italy', 'MAGENTO', 'Management', 'Management Consulting', 'Manufacturing', 'Maps', 'Market Research', 'Marketing', 'Marketing Automation', 'Marketing Communications', 'Marketing Management', 'Marketing Strategy', 'Marketplaces', 'Mass Customization', 'Match-Making', 'Material Science', 'Matlab', 'Maven', 'MBA', 'Mechanical Engineering', 'Mechanical Solutions', 'Media', 'Media Relations', 'Medical', 'Medical Devices', 'Medical Professionals', 'Medication Adherence', 'Meeting Software', 'Mens Specific', 'Merchandising', 'Mergers & Acquisitions', 'Messaging', 'Metrics', 'mHealth', 'MicroBlogging', 'Microsoft', 'Microsoft Access', 'Microsoft Excel', 'Microsoft Exchange', 'Microsoft Office', 'Microsoft Outlook', 'Microsoft Power Point', 'Microsoft PowerPoint', 'Microsoft Project', 'Microsoft SQL Server', 'Microsoft Visio', 'Microsoft Visual Basic', 'Microsoft Visual Studio', 'Microsoft Windows', 'Microsoft Word', 'Middleware', 'Minerals', 'Mining Technologies', 'MMO Games', 'Mobile', 'Mobile Advertising', 'Mobile Analytics', 'Mobile Application Design', 'Mobile Application Development', 'Mobile Commerce', 'Mobile Coupons', 'Mobile Design', 'Mobile Development', 'Mobile Devices', 'Mobile Emergency&Health', 'Mobile Enterprise', 'Mobile Games', 'Mobile Health', 'Mobile Infrastructure', 'Mobile Payments', 'Mobile Search', 'Mobile Security', 'Mobile Shopping', 'Mobile Social', 'Mobile Software Tools', 'Mobile UI Design', 'Mobile User Experience', 'Mobile Video', 'Mobility', 'Monetization', 'Moneymaking', 'MongoDB', 'Mothers', 'Motion Capture', 'Multimedia', 'Music', 'Music Education', 'Music Services', 'Music Venues', 'Musical Instruments', 'Musicians', 'Mvc', 'MySQL', 'Nanotechnology', 'Natural Gas Uses', 'Natural Language Processing', 'Natural Resources', 'Navigation', 'Negotiation', 'Netbeans', 'Network Security', 'Networking', 'Neuroscience', 'New Business Development', 'New Product Development', 'New Technologies', 'News', 'NFC', 'Nginx', 'Niche Specific', 'Nightclubs', 'Nightlife', 'Node.js', 'Non Profit', 'noSQL', 'Nutraceutical', 'Nutrition', 'Objective-C', 'Office Space', 'Offline Businesses', 'Oil', 'Oil & Gas', 'Online Auctions', 'Online Dating', 'Online Gaming', 'Online Identity', 'Online Marketing', 'Online Rental', 'Online Reservations', 'Online Scheduling', 'Online Shopping', 'Online Travel', 'Online Video Advertising', 'Open Source', 'OpenCV', 'OpenGL', 'Operating Systems', 'Operations', 'Operations Management', 'Opinions', 'Optical Communications', 'Optimization', 'Oracle', 'Oracle 10g', 'Organic', 'Organic Food', 'Outdoor Advertising', 'Outdoors', 'Outsourcing', 'P2P Money Transfer', 'PaaS', 'Parenting', 'Parking', 'Payments', 'Payroll', 'PC', 'PC Gaming', 'Peer-to-Peer', 'People Management', 'PeopleSoft', 'Performance Marketing', 'Perl', 'Personal Branding', 'Personal Data', 'Personal Finance', 'Personal Health', 'Personalization', 'Pets', 'Pharmaceuticals', 'Photo Editing', 'Photo Sharing', 'Photography', 'Photoshop', 'PHP', 'Physicians', 'Planning', 'Plumbers', 'Point of Sale', 'Politics', 'Polling', 'Portals', 'Portfolio Management', 'Postal and Courier Services', 'PostgreSQL', 'Predictive Analytics', 'Presentation Skills', 'Presentations', 'Price Comparison', 'Pricing', 'Print Design', 'Printing', 'Privacy', 'Private Equity', 'Private Social Networking', 'Problem Solving', 'Process Improvement', 'Process Management', 'Procurement', 'Product', 'Product Design', 'Product Development', 'Product Launch', 'Product Management', 'Product Marketing', 'Product Search', 'Product Strategy', 'Productivity Software', 'Professional Networking', 'Professional Services', 'Program Management', 'Programming', 'Programming Languages', 'Project Leader', 'Project Management', 'Promotional', 'Property Management', 'Proximity Internet', 'Psychology', 'Public Relations', 'Public Safety', 'Public Speaking', 'Public Transportation', 'Publishing', 'Purchasing', 'Python', 'Q&A', 'QR Codes', 'Quality Assurance', 'Quality Control', 'Quantified Self', 'Quickbooks', 'R', 'Racing', 'Rapid Prototyping', 'RDBMS', 'Real Estate', 'Real Estate Investors', 'Real Time', 'Realtors', 'Recipes', 'Recreation', 'Recruiting', 'Recycling', 'Redhat', 'Redis', 'Registrars', 'Regression Testing', 'Rehabilitation', 'Relational Databases', 'Relationship Building', 'Reliability', 'Religion', 'Remediation', 'Renewable Energies', 'Renewable Tech', 'Rental Housing', 'Reputation', 'Requirements Analysis', 'Research', 'Research and Development', 'Residential Solar', 'Resorts', 'Responsive Design', 'REST', 'REST APIs', 'Restaurants', 'RESTful Services', 'Retail', 'Retail Technology', 'Retirement', 'Reviews and Recommendations', 'RFID', 'RIM', 'Risk Analysis', 'Risk Management', 'Robotics', 'Routers', 'Ruby', 'Ruby on Rails', 'Ruby\Rails', 'Russian language', 'SaaS', 'Sales', 'Sales and Marketing', 'Sales Automation', 'Sales Strategy and Management', 'Sales Support', 'Sales Training', 'Salesforce', 'SalesForce.com', 'SAP', 'SAS', 'Scala', 'Scheduling', 'Scheme', 'Science', 'SCRUM', 'SCSS/Sass', 'SDK', 'SDLC', 'Search', 'Search Engine Marketing (SEM)', 'Search Marketing', 'Security', 'Selenium', 'Self Development', 'Self Storage', 'Semantic Search', 'Semantic Web', 'Semiconductors', 'Senior Citizens', 'Senior Health', 'Sensors', 'SEO', 'SEO/SEM', 'Service Industries', 'Service Providers', 'Servlets', 'SexTech', 'Shared Services', 'SharePoint', 'Shell Scripting', 'Shipping', 'Shoes', 'Shopping', 'Simulation', 'Skill Assessment', 'Small and Medium Businesses', 'Smart Building', 'Smart Grid', 'SMS', 'SNS', 'Soccer', 'Social + Mobile + Local', 'Social Bookmarking', 'Social Business', 'Social Buying', 'Social Commerce', 'Social CRM', 'Social Fundraising', 'Social Games', 'Social Innovation', 'Social Media', 'Social Media Advertising', 'Social Media Agent', 'Social Media Management', 'Social Media Marketing', 'Social Media Monitoring', 'Social Media Platforms', 'Social Media Strategy', 'Social Network Media', 'Social News', 'Social Recruiting', 'Social Search', 'Social Strategy', 'Social Television', 'Social Travel', 'Software', 'Software Architecture', 'Software Compliance', 'Software Design', 'Software Development', 'Software Engineering', 'Software Testing', 'Solar', 'Solidworks', 'Sourcing', 'Space Travel', 'Spanish', 'Spas', 'Specialty Chemicals', 'Specialty Foods', 'Specialty Retail', 'Speech Recognition', 'Sponsorship', 'Sporting Goods', 'Sports', 'Sports Stadiums', 'Spring', 'SPSS', 'SQL', 'SQL Server', 'SQLite', 'Staffing Firms', 'Start-Ups', 'Startup Histrionics', 'Startups', 'Statistical Analysis', 'Statistics', 'Stock Exchanges', 'Storage', 'Strategic Partnerships', 'Strategic Planning', 'Strategy', 'Strong Work Ethic', 'Struts', 'Subscription Businesses', 'Subversion', 'Sunglasses', 'Supply Chain Management', 'Support', 'Surveys', 'Sustainability', 'Svn', 'Swift', 'Swimming', 'Swing', 'Synchronization', 'System Administration', 'System Design', 'Systems', 'Systems Administration', 'Tableau', 'Tablets', 'Talent Acquisition', 'Task Management', 'Taxis', 'TDD', 'Tea', 'Teachers', 'Team Building', 'Team Leadership', 'Team Player', 'Teamwork', 'Tech Field Support', 'Technical Continuing Education', 'Technical Support', 'Technical Writing', 'Technology', 'Teenagers', 'Telecommunications', 'Telephony', 'Television', 'Temporary Staffing', 'Test', 'Test and Measurement', 'Test Automation', 'Test Cases', 'Test Plans', 'Testing', 'Text Analytics', 'Textbooks', 'Textiles', 'TFS', 'Therapeutics', 'Ticketing', 'Tourism', 'Toys', 'Tracking', 'Trading', 'Training', 'Transaction Processing', 'Translation', 'Transportation', 'Travel', 'Travel & Tourism', 'Trusted Networks', 'Tutoring', 'TV Production', 'Twin-Tip Skis', 'Twitter Applications', 'Twitter Bootstrap', 'Ubuntu', 'UI Design', 'UI/UX Design', 'Underserved Children', 'Unifed Communications', 'Unit Testing', 'Unity3D', 'Universities', 'University Students', 'Unix', 'Unix Shell Scripting', 'Unmanned Air Systems', 'Usability', 'Usability Testing', 'Use Cases', 'User Experience Design', 'User Interaction Design', 'User Interface', 'User Interface Design', 'User Research', 'User-Centered Design', 'Utilities', 'Utility Land Vehicles', 'UV LEDs', 'UX Design', 'UX Design and Strategy', 'UX/UI Designer', 'Vacation Rentals', 'Vending and Concessions', 'Vendor Management', 'Venture Capital', 'Venture Fundraising', 'Ventures for Good', 'Verilog', 'Version Control', 'Vertical Search', 'Veterinary', 'VHDL', 'Video', 'Video Chat', 'Video Conferencing', 'Video Editing', 'Video Games', 'Video on Demand', 'Video Processing', 'Video Production', 'Video Streaming', 'Virtual Currency', 'Virtual Goods', 'Virtual Workforces', 'Virtual Worlds', 'Virtualization', 'Visio', 'Visual Basic', 'Visual Design', 'Visual Search', 'Visualization', 'VoIP', 'Waste Management', 'Water', 'Water Purification', 'Wealth Management', 'Web', 'Web Analytics', 'Web Application Design', 'Web Application Frameworks', 'Web Applications', 'Web Browsers', 'Web CMS', 'Web Design', 'Web Development', 'Web Hosting', 'Web Presence Management', 'Web Services', 'Web Tools', 'WebOS', 'Weddings', 'Wholesale', 'Wind', 'Windows', 'Windows Phone 7', 'Wine And Spirits', 'Wireframing', 'Wireless', 'Wireshark', 'Women', 'Wordpress', 'Writers', 'Writing', 'Xcode', 'XHTML', 'XML', 'XSLT', 'Young Adults', 'Zend Framework', 'Zepto'];


}