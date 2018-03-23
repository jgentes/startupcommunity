const
  Sequelize = require('sequelize'),
  sequelize = new Sequelize('otcktbzgpblfpu07', 'cd8do5g1qfary77u', 'bix38gi0i1nsf9gx', {
    host: 'otwsl2e23jrxcqvx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    dialect: 'mysql',
    operatorsAliases: false
  }),
  cls = require('continuation-local-storage'),
  community_array = require('./communities-dump.json');

Sequelize.useCLS(cls.createNamespace('startupcommunity'));

// Drop Communities Table
//sequelize.query('DROP TABLE `communities`').then(console.log('Table dropped!'));

/*
// Create Communities Table
sequelize.query(
  'CREATE TABLE `communities` ( `id` varchar(50) NOT NULL, `type` varchar(50) NOT NULL, `name` varchar(50) NOT NULL, `home` varchar(50) NOT NULL, `parents` varchar(250) DEFAULT NULL, `communities` varchar(1000) DEFAULT NULL,  `community_profiles` json DEFAULT NULL,  `icon` varchar(250),  `email` varchar(50),  `avatar` varchar(250),  `linkedin` json DEFAULT NULL,  `api_key` varchar(100),  `headline` varchar(250),  `summary` varchar(1000),  `skills` varchar(1000) DEFAULT NULL,  `roles` json DEFAULT NULL,  `country` varchar(50),  `state` varchar(50),  `county` varchar(50),  `city` varchar(50),  `description` varchar(1000),  `sc_logo` varchar(250),  `embed` json DEFAULT NULL,  `resource` BOOL DEFAULT 0,  `resource_types` varchar(250) DEFAULT NULL,  `industries` varchar(1000) DEFAULT NULL,`website` varchar(250),  `street` varchar(250),  `angellist` json DEFAULT NULL,  `logo` varchar(250),  `token` varchar(250),  `newsletter` json DEFAULT NULL,  `stage` varchar(50),  PRIMARY KEY (`id`), FULLTEXT (name, headline, summary, skills, description)) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci').then(console.log('finished'));


/*
// Drop Invitations Table
sequelize.query('DROP TABLE `invitations`').then(console.log('Table dropped!'));
*/
/*
// Create Invitations Table
sequelize.query('CREATE TABLE `invitations` (`id` int(11) NOT NULL AUTO_INCREMENT,`home` varchar(250) NOT NULL, `email` varchar(250) NOT NULL,`invitor_email` varchar(250) NOT NULL,`invite_communities` json NOT NULL,  PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=298 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci').then(console.log('finished'));
*/

// Load communities and invitations from dump of communities db in couchdb

community_array.forEach(async c => {
  /*
  if (c.type == "location") {
    const fields = '(id, type, parents, country, state, county, city, name, description, sc_logo, embed)';
    const values = `('${c._id}', '${c.type}', '${JSON.stringify(c.parents || [])}', '${c.profile.country}', '${c.profile.state}', '${c.profile.county}', '${c.profile.city}', '${c.profile.name}', '${c.profile.description}', '${c.profile.sc_logo}', '${JSON.stringify(c.profile.embed || {})}')`;
    
    await sequelize.query(
      'INSERT INTO communities ' + fields + ' VALUES ' + values,
      (err, results, fields) => {
        if (err) {
          console.log(values);
          throw (err);
        }
        console.log(c.profile.name); // results contains rows returned by server
      });
  }

  if (c.type == "user") {
    const fields = '(id, type, name, home, parents, email, avatar, linkedin, api_key, headline, summary, skills,  communities, roles, token, newsletter)';
    const values = [
      c._id,
      'user',
      c.profile.name || '',
      c.profile.home || '',
      JSON.stringify(c.profile.parents || []),
      c.profile.email || '',
      c.profile.avatar || '',
      JSON.stringify(c.profile.linkedin || {}),
      c.profile.api_key || '',
      c.profile.headline || '',
      c.profile.summary || '',
      JSON.stringify(c.profile.skills || {}),
      JSON.stringify(c.communities || []),
      JSON.stringify(c.roles || {}),
      c.token || '',
      JSON.stringify(c.newsletter || {})
    ];
    await sequelize.query(
      'INSERT INTO communities ' + fields + ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', {replacements: values}).then(console.log(c.profile.name)).catch(err => console.log('***ERROR: ', err));
  }


  if (c.type == "company") {
    const fields = '(id, type, name, icon, logo, home, angellist, parents, headline, stage, industries, avatar, summary, website, street, city, state, communities, community_profiles, resource, resource_types)';
    const values = [
      c._id,
      'company',
      c.profile.name || '',
      c.profile.icon || '',
      c.profile.logo || '',
      c.profile.home || '',
      JSON.stringify(c.profile.angellist || []),
      JSON.stringify(c.profile.parents || []),
      c.profile.headline || '',
      c.profile.stage || '',
      JSON.stringify(c.profile.industries || []),
      c.profile.avatar || '',
      c.profile.summary || '',
      c.profile.website || '',
      c.profile.street || '',
      c.profile.city || '',
      c.profile.state || '',
      JSON.stringify(c.communities || []),
      JSON.stringify(c.community_profiles || {}),
      c.resource ? 1 : 0,
      JSON.stringify(c.resource_types || [])
    ];
    await sequelize.query(
      'INSERT INTO communities ' + fields + ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', {replacements: values}).then(console.log(c.profile.name));
  }

  if (c.type == "cluster") {
    const fields = '(id, type, parents, industries, country, state, county, city, name, description, sc_logo, embed)';
    const values = [
      c._id,
      'cluster',
      JSON.stringify(c.profile.parents || []),
      JSON.stringify(c.profile.industries || []),
      c.profile.country || '',
      c.profile.state || '',
      c.profile.county || '',
      c.profile.city || '',
      c.profile.name || '',
      c.profile.description || '',
      c.profile.sc_logo || '',
      JSON.stringify(c.profile.embed || {})
    ];
    await sequelize.query(
      'INSERT INTO communities ' + fields + ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', {replacements: values}).then(console.log(c.profile.name));
  }

/* 
 if (c.type == "invite") {
    const fields = '(home, email, invitor_email, invite_communities)';
    const values = [
      c.profile.home || '',
      c.profile.email || '',
      c.invitor_email || '',
      JSON.stringify(c.invite_communities || [])
    ];
    await sequelize.query(
      'INSERT INTO invitations ' + fields + ' VALUES (?, ?, ?, ?)', {replacements: values}).then(console.log(c.profile.name));
  }
  */
});
