/*global angular*/
/*global _*/
/*global jQuery*/
angular
  .module('services', [])

  .factory('newsletter_service', function($http, $httpParamSerializer) {
    return {
      login: function(user) {
        return $http({
          url: 'https://newsletter.startupcommunity.org/includes/login/main.php',
          method: 'POST',
          data: $httpParamSerializer({
            email: user.newsletter.username,
            password: user.newsletter.password,
            redirect: ''
          }),
          withCredentials: true,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      },
      logout: function() {
        return $http({
          url: 'https://newsletter.startupcommunity.org/logout',
          method: 'GET',
          withCredentials: true
        });
      },
      setupNewsletter: function(settings, resource_list, location_id) {
        return $http.post('/api/2.3/newsletter/setup', {
          settings: settings,
          resource_list: resource_list,
          location_id: location_id
        });
      },
      updateNewsletter: function(settings, email, app_id) {
        return $http.post('api/2.3/newsletter/update', {
          settings: settings,
          email: email,
          app_id: app_id
        });
      },
      syncMembers: function(lists, brand_id, location_id) {
        return $http.post('/api/2.3/newsletter/sync', {
          lists: lists,
          brand_id: brand_id,
          location_id: location_id
        });
      }
    };
  })

  .factory('notify_service', function($http) {
    return {
      contact: function(user_id, formdata, location_id) {
        return $http.post('/api/2.1/contact?' + jQuery.param({
          user_id: user_id,
          formdata: formdata,
          location_id: location_id
        }));
      }
    };
  })

  .factory('message_service', function($http) {
    return {
      addMessage: function(type, from, to, content, parent) {
        return $http.post('/api/2.1/messages/add', {
          params: {
            type: type,
            from: from,
            to: to,
            content: content,
            parent: parent
          }
        });
      }
    };
  })

  .factory('user_service', function($http) {
    return {
      search: function(communities, clusters, query, roles, limit, offset) {

        var urlString = '/api/2.1/users?' + jQuery.param({
          communities: communities,
          clusters: clusters,
          roles: roles,
          limit: limit,
          offset: offset,
          query: query || '*'
        });
        return $http.get(urlString);
      },
      updateProfile: function(profile) {
        return $http.post('/api/2.1/profile', {
          params: {
            profile: profile
          }
        });
      },
      getProfile: function(userid) {
        return $http.get(userid ? '/api/2.1/profile/' + userid : '/api/2.1/profile');
      },
      getProfileUrl: function(filename) {
        return $http.get('/api/2.1/profile/url?filename=' + filename);
      },
      inviteUser: function(email, message, location_name, location_id, resources) {
        return $http.post('/api/2.1/invite', {
          params: {
            email: email,
            message: message,
            location_name: location_name,
            location_id: location_id,
            resources: resources
          }
        });
      },
      removeCommunity: function(user_id, community) {
        return $http.post('/api/2.1/remove', {
          params: {
            user_id: user_id,
            community: community
          }
        });
      },
      removeRole: function(role, community_id) {
        return $http.post('/api/2.3/profile/removerole', {
          params: {
            role: role,
            community_id: community_id
          }
        });
      },
      join: function(email, message, location_name, location_id) {
        return $http.post('/api/2.1/join', {
          params: {
            email: email,
            message: message,
            location_name: location_name,
            location_id: location_id
          }
        });
      },
      getId: function() {
        return $http.get('/api/2.1/profile/getId');
      },
      getHelpToken: function() {
        return $http.get('/auth/helpToken');
      },
      feedback: function(data) {
        $http.post('/api/2.1/feedback?data=' + encodeURIComponent(JSON.stringify(data)));
      },
      roles: function() {
        return [{
          value: 'not involved',
          text: 'not involved'
        }, {
          value: 'founder',
          text: 'Founder',
          description: 'You have started or co-founded a business venture.'
        }, {
          value: 'investor',
          text: 'Investor',
          description: 'You are an active investor in startup companies.'
        }, {
          value: 'team',
          text: 'Team Member',
          description: 'You are a current employee or team member of a local company.'
        }, {
          value: 'mentor',
          text: 'Mentor',
          description: 'You are willing to provide guidance to entrepreneurs without compensation - the \'give before you get\' philosophy.'
        }, {
          value: 'provider',
          text: 'Service Provider',
          description: 'You provide services to community members for a fee.'
        }];
      },
      team_panels: function() {
        return [{
            title: 'Leaders',
            name: 'leader',
            icon: 'pe-7s-flag',
            color: 'hred'
          },
          {
            title: 'Investors',
            name: 'investor',
            icon: 'pe-7s-gleam',
            color: 'hgreen'
          },
          {
            title: 'Founders',
            name: 'founder',
            icon: 'pe-7s-paper-plane',
            color: 'hnavyblue'
          },
          {
            title: 'Mentors',
            name: 'mentor',
            icon: 'pe-7s-study',
            color: 'hblue'
          },
          {
            title: 'Team Members',
            name: 'team',
            icon: 'pe-7s-ball',
            color: 'hviolet'
          },
          {
            title: 'Service Providers',
            name: 'provider',
            icon: 'pe-7s-portfolio',
            color: 'hyellow'
          }
        ];
      }
    };
  })

  .factory('community_service', function($http) {
    return {
      sortCommunities: function(community, items) {
        items = Array.isArray(items) ? items : [items];
        items.forEach(item => {
          if (item) {
            // sort communities for use in nav and child dashboard pages

            switch (item.type) {
              case 'location':
                if (!community.locations) community.locations = {};
                community.locations[item.id] = item;
                break;
              case 'cluster':
                if (item.community_profiles && item.community_profiles[community.id] && item.community_profiles[community.id].parents) {
                  if (!community.clusters) community.clusters = {};
                  // this is for navigation
                  var cluster_type;
                  if (item.community_profiles[community.id].parents.length) cluster_type = item.community_profiles[community.id].parents[0];
                  if (!community.clusters[cluster_type]) community.clusters[cluster_type] = {};
                  community.clusters[cluster_type][item.id] = item;
                }
                break;
              case 'company':
                if (item.resource) {
                  if (!community.resources) community.resources = [];
                  community.resources.push(item);
                }

                if (community.type == 'user') {
                  for (var role in community.roles) {
                    if (community.roles[role][item.id]) {

                      if (!community.companies) community.companies = { 'count': {} };
                      if (!community.companies[role]) community.companies[role] = {};
                      if (!community.companies[role][item.id]) community.companies[role][item.id] = item;
                      if (!community.companies.count[role]) community.companies.count[role] = 0;
                      ++community.companies.count[role];
                    }
                  }
                }
                break;
            }
            //community[item.id] = item;
          }
        });
        return community;
      },
      sortcounts: function(counts, newArray) {
        var sorted = _.fromPairs(_.sortBy(_.toPairs(counts), function(a) {
          return a[1];
        }).reverse());
        if (newArray) {
          var countArray = [];
          for (var s in sorted) {
            countArray.push({ value: s, count: sorted[s] });
          }
          return countArray;
        }
        else return sorted;
      },
      getCommunity: async function(comm) {
        if (!comm) return;
        let uberSearch = [];

        let community = await $http.get('/api/2.1/community/' + comm)
          .then(response => response.data);

        if (!community) return;
        if (!community.resource || community.type !== 'location') {

          // pull communities within record
          var comm_items = community.communities || [];

          // grab parents
          if (community.parents && community.parents.length && community.parents[0] != 'us') comm_items.push(community.parents[0]);
          if (community.home && community.communities && community.communities.indexOf(community.home) < 0) comm_items.push(community.home);
          //this.sortCommunities(community, [community]); // sort this community into response as a loc, cluster, etc

          uberSearch = comm_items;

        }
        else if (community.home) uberSearch = [community.home];

        if (uberSearch.length) {
          let uberUrl = '/api/3.0/communities?community=';
          uberSearch.forEach((u, i) => {
            uberUrl += u;
            if (i < uberSearch.length - 1) uberUrl += '&community=';
          });
          community = await $http.get(uberUrl).then(response => this.sortCommunities(community, response.data));
        }

        if (community.type == 'location') community = await $http.get('/api/3.0/neighbors/' + comm).then(response => this.sortCommunities(community, response.data));

        if (community.resources && community.resources.length) {
          community.resources = community.resources.sort(function(a, b) {
            var x = a.id;
            var y = b.id;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
          });
        }

        // get messages for users
        if (community.type == 'user') {
          const messages = await $http.get('/api/3.0/messages/' + comm).then(response => response.data);
          community.messages = {};
          for (var mes in messages) {
            community.messages[mes.id] = mes;
          }
        }
        else if (community.type == 'company') {
          /*
          // get team
          const teamresponse = {};
          const count = {};
          let team = await $http.get('/api/3.0/team/' + community.id + '?location=' + community.home).then(response => response.data);

          team.forEach(member => {
            // sort roles
            for (var role in member.roles) {
              for (var item in role) {
                if (item == community.id) {
                  if (!teamresponse[role]) teamresponse[role] = [];
                  if (!count[role]) count[role] = 0;
                  teamresponse[role].push(member);
                  ++count[role];
                }
              }
            }
          });

          community['team'] = {
            count: count
          };

          for (var r in teamresponse) {
            community.team[r] = teamresponse[r].slice(0, 4); // cut the array down
          }
          */
        }

        return community;
      },
      getResources: function(location_id, resources, clusters) {
        return $http.post('/api/2.3/resources', {
          location_id: location_id,
          resources: resources,
          clusters: !!clusters
        });
      },
      getId: function(id) {
        return $http.get('/api/2.1/id/' + id);
      },
      getNav: async(location_id, community_id) => {
        return await $http.get('/api/3.0/industries?location=' + location_id + (community_id ? '&community=' + community_id : '')).then(response => response.data);
      },
      getTop: function(location_id, community_id, community) {

        // Prep to send to API
        var industry_ids = [];

        if (community && community.type == 'cluster') {
          // check to see if this is a root cluster or within a location
          if (community_id) {
            if (community.community_profiles && community.community_profiles[location_id] && community.community_profiles[location_id].industries) {
              industry_ids = community.community_profiles[location_id].industries;
            }
            else if (community.industries) {
              industry_ids = community.industries;
            }
          }
          else {
            for (var i in community.community_profiles) {
              for (var ii in community.community_profiles[i].industries) {
                if (industry_ids.indexOf(community.community_profiles[i].industries[ii]) == -1) {
                  industry_ids.push(community.community_profiles[i].industries[ii]);
                }
              }
            }

            location_id = '*'; // needed to avoid communities search for cluster (companies aren't tied to the cluster via community array)
          }

          var cluster_id = community.id;
        }

        var params = { community_id, location_id };
        if (cluster_id) params.cluster_id = cluster_id;
        if (industry_ids.length) params.industry_ids = industry_ids;

        // trigger getstats
        return $http.post('/api/3.0/stats', { params });
      },
      setSettings: function(embed, location_id, community_id) {
        return $http.put('/api/2.1/settings', {
          params: {
            embed: embed,
            location_id: location_id,
            community_id: community_id
          }
        });
      },
      editCommunity: function(community, location_id) {
        return $http.post('/api/2.1/community/edit', {
          params: {
            community: community,
            location_id: location_id
          }
        });
      },
      deleteCommunity: function(community, location_id, new_community_id) {
        return $http.post('/api/2.1/community/delete', {
          params: {
            community: community,
            location_id: location_id,
            new_community_id: new_community_id
          }
        });
      },
      parents: function() {
        return ['All', 'Agriculture', 'Art', 'Construction', 'Consumer-Goods', 'Corporate', 'Education', 'Finance', 'Government', 'Healthcare', 'Legal', 'Manufacturing', 'Medical', 'Non-Profit', 'Recreation', 'Services', 'Tech', 'Transportation'];
      },
      industries: function() {
        return ['.NET', '3D', '3D Printing', '3D Technology', 'Account Management', 'Accounting', 'ActionScript', 'Active Lifestyle', 'Ad Targeting', 'Adaptive Equipment', 'Adobe', 'Adobe Acrobat', 'Adobe After Effects', 'Adobe Creative Suite', 'Adobe Illustrator', 'Adobe Indesign', 'Adobe Photoshop', 'Adobe Premiere', 'Advanced Materials', 'Adventure Travel', 'Advertising', 'Advertising Exchanges', 'Advertising Networks', 'Advertising Platforms', 'Advice', 'Aerospace', 'Agile', 'Agriculture', 'Air Pollution Control', 'AJAX', 'Algorithms', 'Alternative Medicine', 'Alumni', 'Amazon EC2', 'Amazon Web Services', 'Analytics', 'Android', 'Angels', 'AngularJS', 'Animal Feed', 'Ant', 'Apache', 'APIs', 'APM', 'App Discovery', 'App Marketing', 'App Stores', 'Apple', 'Application Platforms', 'Apps', 'Aquaculture', 'Architecture', 'Archiving', 'Arduino', 'Art', 'Art Direction', 'Artificial Intelligence', 'ASP.NET', 'Assembly Language', 'Asset Management', 'Assisitive Technology', 'Assisted Living', 'Attention to Detail', 'Auctions', 'Audio', 'Audiobooks', 'Augmented Reality', 'Auto', 'Autocad', 'Automated Kiosk', 'Automation', 'Automotive', 'B2B', 'Babies', 'Baby Accessories', 'Baby Boomers', 'Baby Safety', 'Backbone.js', 'Backend Development', 'Banking', 'Bash', 'Batteries', 'Beauty', 'Bicycles', 'Big Data', 'Big Data Analytics', 'Bilingual', 'Billing', 'Bio-Pharm', 'Biofuels', 'Bioinformatics', 'Biometrics', 'Biotechnology', 'Bitcoin', 'Blackberry', 'Blogging', 'Blogging Platforms', 'Bloomberg', 'Bluetooth', 'Boating Industry', 'BPO Services', 'Brand and Identity Design', 'Brand Design and Strategy', 'Brand Development', 'Brand Management', 'Brand Marketing', 'Branding', 'Brewing', 'Bridging Online and Offline', 'Broadcasting', 'Brokers', 'Browser Extensions', 'Budgeting', 'Building Products', 'Business Analysis', 'Business Analytics', 'Business Development', 'Business Information Systems', 'Business Intelligence', 'Business Management', 'Business Model Innovation', 'Business Objects', 'Business Operations', 'Business Planning', 'Business Productivity', 'Business Requirement gathering', 'Business Services', 'Business Strategy', 'Business Travelers', 'Buying', 'C', 'Cable', 'CAD', 'Cadence', 'CakePHP', 'Call Center', 'Cannabis', 'Capital Markets', 'Carbon', 'Career Management', 'Career Planning', 'Cars', 'Cause Marketing', 'Celebrity', 'Certification Test', 'CFO', 'Charity', 'Charter Schools', 'Chat', 'Chef', 'Chemicals', 'Chemistry', 'Child Care', 'China Internet', 'Cisco', 'Citrix', 'Civil Engineers', 'Classifieds', 'Clean Energy', 'Clean Technology', 'Client Relations', 'Clinical Trials', 'Cloud Computing', 'Cloud Data Services', 'Cloud Infrastructure', 'Cloud Management', 'Cloud Security', 'Cloud-Based Music', 'Clustering', 'CMS', 'Coaching', 'Codeigniter', 'Coding', 'Coffee', 'Coffeescript', 'Cold Calling', 'Collaboration', 'Collaborative Consumption', 'Collectibles', 'College Campuses', 'College Recruiting', 'Colleges', 'Comics', 'Commercial Real Estate', 'Commercial Solar', 'Commodities', 'Communication Skills', 'Communications', 'Communications Hardware', 'Communications Infrastructure', 'Communities', 'Community Management', 'Comparison Shopping', 'Compensation and Benefits', 'Competitive Analysis', 'Compliance', 'Composer', 'Computer Vision', 'Computers', 'comScore', 'Concerts', 'Console Gaming', 'Construction', 'Consulting', 'Consumer Behavior', 'Consumer Electronics', 'Consumer-Goods', 'Consumer Internet', 'Consumer Lending', 'Consumer Products', 'Consumers', 'Contact Centers', 'Contact Management', 'Content', 'Content Creation', 'Content Creators', 'Content Delivery', 'Content Discovery', 'Content Management', 'Content Marketing', 'Content Strategy', 'Content Syndication', 'Contests', 'Contract Negotiations', 'Control Systems', 'Cooking', 'Copywriting', 'Corporate Finance', 'Corporate IT', 'Corporate Training', 'Corporate Wellness', 'Cosmetic Surgery', 'Cosmetics', 'Coupons', 'Coworking', 'Craft Beer', 'Creative', 'Creative Direction', 'Creative Industries', 'Creative Problem Solving', 'Creative Strategy', 'Creative Writing', 'Credit', 'Credit Cards', 'CRM', 'Cross-Functional Team Leadership', 'Crowdfunding', 'Crowdsourcing', 'CSS', 'Curated Web', 'Custom Retail', 'Customer Acquisition', 'Customer Development', 'Customer Experience', 'Customer Service', 'Customer Support Tools', 'CVS', 'Cyber', 'Cyber Security', 'D3.js', 'Data Analysis', 'Data Center Automation', 'Data Centers', 'DATA ENTRY', 'Data Integration', 'data management', 'Data Mining', 'Data Privacy', 'Data Security', 'Data Visualization', 'Databases', 'DBMS', 'Debian', 'Debt Collecting', 'Debugging', 'Deep Information Technology', 'Defense', 'Demographies', 'Dental', 'Derivatives', 'Design', 'Design Management', 'Design Patterns', 'Design Research', 'Design Strategy', 'Design Thinking', 'Designers', 'Developer APIs', 'Developer Tools', 'Development Platforms', 'DevOps', 'Diabetes', 'Diagnostics', 'Dietary Supplements', 'Digital Entertainment', 'Digital Marketing', 'Digital Media', 'Digital Rights Management', 'Digital Signage', 'Digital Strategy', 'Direct Marketing', 'Direct Sales', 'Discounts', 'Displays', 'Distributed Systems', 'Distribution', 'Distributors', 'DIY', 'Django', 'Doctors', 'Document Management', 'Documentation', 'DOD/Military', 'Domains', 'Drafting', 'Dreamweaver', 'Drones', 'Drupal', 'Due Diligence', 'Early-Stage Technology', 'eBooks', 'Eclipse', 'eCommerce', 'Economics', 'EDA Tools', 'eDiscovery', 'EdTech', 'Education', 'Educational Games', 'Edutainment', 'Elder Care', 'Elderly', 'Electric Vehicles', 'Electrical Distribution', 'Electrical Engineering', 'Electronic Health Records', 'Electronics', 'Email', 'Email Marketing', 'Email Newsletters', 'Embedded Hardware and Software', 'Embedded Systems', 'Ember.js', 'Emerging Markets', 'Employer Benefits Programs', 'Employment', 'Encryption', 'Energy', 'Energy Efficiency', 'Energy IT', 'Energy Management', 'Energy Storage', 'Engineering', 'Engineering Firms', 'English', 'English-Speaking', 'Enterprise 2.0', 'Enterprise Application', 'Enterprise Hardware', 'Enterprise Purchasing', 'Enterprise Resource Planning', 'Enterprise Search', 'Enterprise Security', 'Enterprise Software', 'Enterprises', 'Entertainment', 'Entertainment Industry', 'Entrepreneurship', 'Environmental Innovation', 'Estimation and Quoting', 'Event Management', 'Event Planning', 'Events', 'Executive Management', 'Exercise', 'Experience Design', 'ExpressJs', 'Eyewear', 'Fabrication', 'Face Recognition', 'Facebook Advertising', 'Facebook API', 'Facebook Applications', 'Families', 'Fantasy Sports', 'Farmers Market', 'Farming', 'Fashion', 'Fertility', 'Field Support Services', 'File Sharing', 'Filing', 'Film', 'Film Distribution', 'Film Production', 'Final Cut Pro', 'Finance', 'Finance Technology', 'Financial Analysis', 'Financial Exchanges', 'Financial Management', 'Financial Modeling', 'Financial Reporting', 'Financial Services', 'Financial Statements', 'Firewall', 'Firmware', 'Fitness', 'Flash', 'Flash Sales', 'Flash Storage', 'Fleet Management', 'Flowers', 'Fluent in Spanish', 'Focus', 'Food Processing', 'Forecasting', 'Forums', 'FPGA', 'FramerJS', 'Franchises', 'Fraud', 'Fraud Detection', 'Freelancers', 'Freemium', 'FreetoPlay Gaming', 'French language', 'Front-End Development', 'Fruit', 'Fuels', 'Full-Stack Web Development', 'Fundraising', 'Gadget', 'Gambling', 'Game Design', 'Game Mechanics', 'Games', 'Gamification', 'Gas', 'Gay & Lesbian', 'General Public Worldwide', 'Generation Y-Z', 'Genetic Testing', 'Geospatial', 'German Language', 'Gift Card', 'Gift Exchange', 'Gift Registries', 'Git', 'Github', 'Go to Market Strategy', 'Gold', 'Golf Equipment', 'Google Adwords', 'Google Analytics', 'Google Apps', 'Google Glass', 'Government Innovation', 'Governments', 'Gps', 'Graphic Design', 'Graphics', 'Green', 'Green Building', 'Green Consumer Goods', 'Groceries', 'Group Buying', 'Group SMS', 'Growth Hacking', 'Guide to Nightlife', 'Guides', 'Hadoop', 'Haml', 'Handmade', 'Hardware', 'Hardware + Software', 'Hardware Engineering', 'Health and Insurance', 'Health and Wellness', 'Health Care', 'Health Care IT', 'Health Services Industry', 'Healthcare Services', 'Heavy Industry', 'Hedge Funds', 'Help Desk', 'Heroku', 'Hibernate', 'High School Students', 'High Schools', 'High Tech', 'Highly Organized', 'Hive', 'Home & Garden', 'Home Automation', 'Home Decor', 'Home Owners', 'Home Renovation', 'Homeland Security', 'Homeless Shelter', 'Hospitality', 'Hospitals', 'Hotels', 'HTML', 'HTML/CSS/PHP/MYSQL', 'HTML+CSS', 'HTML5 & CSS3', 'Human Computer Interaction', 'Human Resource Automation', 'Human Resources', 'Humanitarian', 'IaaS', 'IBM DB2', 'IBM Websphere', 'Icon Design', 'ICT', 'Identity', 'Identity Management', 'Illustration', 'Image Processing', 'Image Recognition', 'Impact Investing', 'In-Flight Entertainment', 'Incentives', 'Incubators', 'Independent Music Labels', 'Independent Pharmacies', 'InDesign', 'Indoor Positioning', 'Industrial', 'Industrial Automation', 'Industrial Design', 'Information Architecture', 'Information Security', 'Information Services', 'Information Technology', 'Infrastructure', 'Infrastructure Builders', 'Innovation & Growth', 'Innovation Engineering', 'Innovation Management', 'Inside Sales', 'Insurance', 'Integrity', 'Intellectual Asset Management', 'Intellectual Property', 'Intelligent Systems', 'Interaction Design', 'Interest Graph', 'Interface Design', 'Interior Design', 'International Business', 'Internet', 'Internet Infrastructure', 'Internet Marketing', 'Internet of Things', 'Internet Radio Market', 'Internet Service Providers', 'Internet TV', 'Inventory Management', 'Investment Banking', 'Investment Management', 'iOS', 'iOS Design', 'iOS Development', 'iPad', 'iPhone', 'iPod Touch', 'IT Management', 'ITIL', 'Japanese Language', 'Java', 'Java J2EE', 'Javascript', 'Javascript Frameworks', 'JBoss', 'JDBC', 'Jenkins', 'Jewelry', 'Jira', 'JOOMLA', 'Journalism', 'jQuery', 'jQuery Mobile', 'JSON', 'JUNIT', 'K-12 Education', 'Kanban', 'Kids', 'Kinect', 'Knowledge Management', 'LAMP', 'Landscaping', 'Language Learning', 'Lasers', 'LaTeX', 'Law Enforcement', 'Layout', 'Lead Generation', 'Lead Management', 'Leadership', 'Leadership and Team Inspiration', 'Leadership Development', 'Lean Startups', 'Legal', 'Leisure', 'LESS', 'Licensing', 'Life Sciences', 'Lifestyle', 'Lifestyle Products', 'Lighting', 'Limousines', 'Lingerie', 'Linux', 'Linux System Administration', 'Local', 'Local Advertising', 'Local Based Services', 'Local Businesses', 'Local Commerce', 'Local Coupons', 'Local Search', 'Local Services', 'Location Based Services', 'Logistics', 'Logistics Company', 'Lotteries', 'Lotus Notes', 'Low Bid Auctions', 'Loyalty Programs', 'M2M', 'Mac', 'Mac OS X', 'Machine Learning', 'Made in Italy', 'MAGENTO', 'Management', 'Management Consulting', 'Manufacturing', 'Maps', 'Market Research', 'Marketing', 'Marketing Automation', 'Marketing Communications', 'Marketing Management', 'Marketing Strategy', 'Marketplaces', 'Mass Customization', 'Match-Making', 'Material Science', 'Matlab', 'Maven', 'MBA', 'Mechanical Engineering', 'Mechanical Solutions', 'Media', 'Media Relations', 'Medical', 'Medical Devices', 'Medical Professionals', 'Medication Adherence', 'Meeting Software', 'Mens Specific', 'Merchandising', 'Mergers & Acquisitions', 'Messaging', 'Metrics', 'mHealth', 'MicroBlogging', 'Microsoft', 'Microsoft Access', 'Microsoft Excel', 'Microsoft Exchange', 'Microsoft Office', 'Microsoft Outlook', 'Microsoft Power Point', 'Microsoft PowerPoint', 'Microsoft Project', 'Microsoft SQL Server', 'Microsoft Visio', 'Microsoft Visual Basic', 'Microsoft Visual Studio', 'Microsoft Windows', 'Microsoft Word', 'Middleware', 'Minerals', 'Mining Technologies', 'MMO Games', 'Mobile', 'Mobile Advertising', 'Mobile Analytics', 'Mobile Application Design', 'Mobile Application Development', 'Mobile Commerce', 'Mobile Coupons', 'Mobile Design', 'Mobile Development', 'Mobile Devices', 'Mobile Emergency&Health', 'Mobile Enterprise', 'Mobile Games', 'Mobile Health', 'Mobile Infrastructure', 'Mobile Payments', 'Mobile Search', 'Mobile Security', 'Mobile Shopping', 'Mobile Social', 'Mobile Software Tools', 'Mobile UI Design', 'Mobile User Experience', 'Mobile Video', 'Mobility', 'Monetization', 'Moneymaking', 'MongoDB', 'Mothers', 'Motion Capture', 'Multimedia', 'Music', 'Music Education', 'Music Services', 'Music Venues', 'Musical Instruments', 'Musicians', 'Mvc', 'MySQL', 'Nanotechnology', 'Natural Gas Uses', 'Natural Language Processing', 'Natural Resources', 'Navigation', 'Negotiation', 'Netbeans', 'Network Security', 'Networking', 'Neuroscience', 'New Business Development', 'New Product Development', 'New Technologies', 'News', 'NFC', 'Nginx', 'Niche Specific', 'Nightclubs', 'Nightlife', 'Node.js', 'Non Profit', 'noSQL', 'Nutraceutical', 'Nutrition', 'Objective-C', 'Office Space', 'Offline Businesses', 'Oil', 'Oil & Gas', 'Online Auctions', 'Online Dating', 'Online Gaming', 'Online Identity', 'Online Marketing', 'Online Rental', 'Online Reservations', 'Online Scheduling', 'Online Shopping', 'Online Travel', 'Online Video Advertising', 'Open Source', 'OpenCV', 'OpenGL', 'Operating Systems', 'Operations', 'Operations Management', 'Opinions', 'Optical Communications', 'Optimization', 'Oracle', 'Oracle 10g', 'Organic', 'Organic Food', 'Outdoor Advertising', 'Outdoors', 'Outsourcing', 'P2P Money Transfer', 'PaaS', 'Parenting', 'Parking', 'Payments', 'Payroll', 'PC', 'PC Gaming', 'Peer-to-Peer', 'People Management', 'PeopleSoft', 'Performance Marketing', 'Perl', 'Personal Branding', 'Personal Data', 'Personal Finance', 'Personal Health', 'Personalization', 'Pets', 'Pharmaceuticals', 'Photo Editing', 'Photo Sharing', 'Photography', 'Photoshop', 'PHP', 'Physicians', 'Planning', 'Plumbers', 'Point of Sale', 'Politics', 'Polling', 'Portals', 'Portfolio Management', 'Postal and Courier Services', 'PostgreSQL', 'Predictive Analytics', 'Presentation Skills', 'Presentations', 'Price Comparison', 'Pricing', 'Print Design', 'Printing', 'Privacy', 'Private Equity', 'Private Social Networking', 'Problem Solving', 'Process Improvement', 'Process Management', 'Procurement', 'Product', 'Product Design', 'Product Development', 'Product Launch', 'Product Management', 'Product Marketing', 'Product Search', 'Product Strategy', 'Productivity Software', 'Professional Networking', 'Professional Services', 'Program Management', 'Programming', 'Programming Languages', 'Project Leader', 'Project Management', 'Promotional', 'Property Management', 'Proximity Internet', 'Psychology', 'Public Relations', 'Public Safety', 'Public Speaking', 'Public Transportation', 'Publishing', 'Purchasing', 'Python', 'Q&A', 'QR Codes', 'Quality Assurance', 'Quality Control', 'Quantified Self', 'Quickbooks', 'R', 'Racing', 'Rapid Prototyping', 'RDBMS', 'Real Estate', 'Real Estate Investors', 'Real Time', 'Realtors', 'Recipes', 'Recreation', 'Recruiting', 'Recycling', 'Redhat', 'Redis', 'Registrars', 'Regression Testing', 'Rehabilitation', 'Relational Databases', 'Relationship Building', 'Reliability', 'Religion', 'Remediation', 'Renewable Energies', 'Renewable Tech', 'Rental Housing', 'Reputation', 'Requirements Analysis', 'Research', 'Research and Development', 'Residential Solar', 'Resorts', 'Responsive Design', 'REST', 'REST APIs', 'Restaurants', 'RESTful Services', 'Retail', 'Retail Technology', 'Retirement', 'Reviews and Recommendations', 'RFID', 'RIM', 'Risk Analysis', 'Risk Management', 'Robotics', 'Routers', 'Ruby', 'Ruby on Rails', 'Ruby\Rails', 'Russian language', 'SaaS', 'Sales', 'Sales and Marketing', 'Sales Automation', 'Sales Strategy and Management', 'Sales Support', 'Sales Training', 'Salesforce', 'SalesForce.com', 'SAP', 'SAS', 'Scala', 'Scheduling', 'Scheme', 'Science', 'SCRUM', 'SCSS/Sass', 'SDK', 'SDLC', 'Search', 'Search Engine Marketing (SEM)', 'Search Marketing', 'Security', 'Selenium', 'Self Development', 'Self Storage', 'Semantic Search', 'Semantic Web', 'Semiconductors', 'Senior Citizens', 'Senior Health', 'Sensors', 'SEO', 'SEO/SEM', 'Service Industries', 'Service Providers', 'Servlets', 'SexTech', 'Shared Services', 'SharePoint', 'Shell Scripting', 'Shipping', 'Shoes', 'Shopping', 'Simulation', 'Skill Assessment', 'Small and Medium Businesses', 'Smart Building', 'Smart Grid', 'SMS', 'SNS', 'Soccer', 'Social + Mobile + Local', 'Social Bookmarking', 'Social Business', 'Social Buying', 'Social Commerce', 'Social CRM', 'Social Fundraising', 'Social Games', 'Social Innovation', 'Social Media', 'Social Media Advertising', 'Social Media Agent', 'Social Media Management', 'Social Media Marketing', 'Social Media Monitoring', 'Social Media Platforms', 'Social Media Strategy', 'Social Network Media', 'Social News', 'Social Recruiting', 'Social Search', 'Social Strategy', 'Social Television', 'Social Travel', 'Software', 'Software Architecture', 'Software Compliance', 'Software Design', 'Software Development', 'Software Engineering', 'Software Testing', 'Solar', 'Solidworks', 'Sourcing', 'Space Travel', 'Spanish', 'Spas', 'Specialty Chemicals', 'Specialty Foods', 'Specialty Retail', 'Speech Recognition', 'Sponsorship', 'Sporting Goods', 'Sports', 'Sports Stadiums', 'Spring', 'SPSS', 'SQL', 'SQL Server', 'SQLite', 'Staffing Firms', 'Start-Ups', 'Startup Histrionics', 'Startups', 'Statistical Analysis', 'Statistics', 'Stock Exchanges', 'Storage', 'Strategic Partnerships', 'Strategic Planning', 'Strategy', 'Strong Work Ethic', 'Struts', 'Subscription Businesses', 'Subversion', 'Sunglasses', 'Supply Chain Management', 'Support', 'Surveys', 'Sustainability', 'Svn', 'Swift', 'Swimming', 'Swing', 'Synchronization', 'System Administration', 'System Design', 'Systems', 'Systems Administration', 'Tableau', 'Tablets', 'Talent Acquisition', 'Task Management', 'Taxis', 'TDD', 'Tea', 'Teachers', 'Team Building', 'Team Leadership', 'Team Player', 'Teamwork', 'Tech Field Support', 'Technical Continuing Education', 'Technical Support', 'Technical Writing', 'Technology', 'Teenagers', 'Telecommunications', 'Telephony', 'Television', 'Temporary Staffing', 'Test', 'Test and Measurement', 'Test Automation', 'Test Cases', 'Test Plans', 'Testing', 'Text Analytics', 'Textbooks', 'Textiles', 'TFS', 'Therapeutics', 'Ticketing', 'Tourism', 'Toys', 'Tracking', 'Trading', 'Training', 'Transaction Processing', 'Translation', 'Transportation', 'Travel', 'Travel & Tourism', 'Trusted Networks', 'Tutoring', 'TV Production', 'Twin-Tip Skis', 'Twitter Applications', 'Twitter Bootstrap', 'Ubuntu', 'UI Design', 'UI/UX Design', 'Underserved Children', 'Unifed Communications', 'Unit Testing', 'Unity3D', 'Universities', 'University Students', 'Unix', 'Unix Shell Scripting', 'Unmanned Air Systems', 'Usability', 'Usability Testing', 'Use Cases', 'User Experience Design', 'User Interaction Design', 'User Interface', 'User Interface Design', 'User Research', 'User-Centered Design', 'Utilities', 'Utility Land Vehicles', 'UV LEDs', 'UX Design', 'UX Design and Strategy', 'UX/UI Designer', 'Vacation Rentals', 'Vending and Concessions', 'Vendor Management', 'Venture Capital', 'Venture Fundraising', 'Ventures for Good', 'Verilog', 'Version Control', 'Vertical Search', 'Veterinary', 'VHDL', 'Video', 'Video Chat', 'Video Conferencing', 'Video Editing', 'Video Games', 'Video on Demand', 'Video Processing', 'Video Production', 'Video Streaming', 'Virtual Currency', 'Virtual Goods', 'Virtual Workforces', 'Virtual Worlds', 'Virtualization', 'Visio', 'Visual Basic', 'Visual Design', 'Visual Search', 'Visualization', 'VoIP', 'Waste Management', 'Water', 'Water Purification', 'Wealth Management', 'Web', 'Web Analytics', 'Web Application Design', 'Web Application Frameworks', 'Web Applications', 'Web Browsers', 'Web CMS', 'Web Design', 'Web Development', 'Web Hosting', 'Web Presence Management', 'Web Services', 'Web Tools', 'WebOS', 'Weddings', 'Wholesale', 'Wind', 'Windows', 'Windows Phone 7', 'Wine And Spirits', 'Wireframing', 'Wireless', 'Wireshark', 'Women', 'Wordpress', 'Writers', 'Writing', 'Xcode', 'XHTML', 'XML', 'XSLT', 'Young Adults', 'Zend Framework', 'Zepto'];
      }
    };
  })
  .factory('company_service', function($http) {
    return {
      search: function(communities, clusters, query, stages, types, limit, get_resources, offset) {
        var urlString = '/api/2.1/companies?' + jQuery.param({
          communities: communities,
          clusters: clusters,
          stages: stages,
          types: types,
          limit: limit,
          offset: offset,
          query: query || '*',
          get_resources: get_resources
        });
        return $http.get(urlString);
      },
      addCompany: function(profile, role, location_id, community_id, company_id) {
        return $http.post('/api/2.1/companies/add', {
          params: {
            profile: profile,
            role: role,
            location_id: location_id,
            community_id: community_id,
            id: company_id
          }
        });
      },
      deleteCompany: function(company_id) {
        return $http.post('/api/2.2/companies/delete', {
          params: {
            company_id: company_id
          }
        });
      },
      getLogoUrl: function(file, company_name) {
        return $http.get('/api/2.1/companies/url?filename=' + file + '&company_name=' + company_name);
      },
      checkUrl: function(website) {
        return $http.post('/api/2.3/companies/checkurl', {
          params: {
            website: website
          }
        });
      },
      resource_types: function() {
        return ['Accelerator', 'Angel Fund', 'Association', 'Conference', 'Coworking', 'Education', 'Event', 'Foundation', 'Finance', 'Government', 'Incubator', 'Industry', 'Maker Space', 'Media', 'Meetup', 'Network', 'Resource', 'Support Org', 'Talent', 'VC Fund'];
      }
    };
  })
  .factory('angellist_service', function($http) {
    return {
      getStartups: function(id) {
        return $http.get('/api/2.1/angel/startups?id=' + id);
      },
      getStartup: function(id) {
        return $http.get('/api/2.1/angel/startup?id=' + id);
      }
    };
  })
  .factory('auth_service', function($http) {
    return {
      getAuth: function(code, redirect_uri) {
        return $http.post('/auth/linkedin', {code, redirect_uri})
      }
    };
  });
