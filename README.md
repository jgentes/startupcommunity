StartupCommunity.org 
====================

Production: [![Circle CI](https://circleci.com/gh/jgentes/startupcommunity/tree/master.svg?style=svg&circle-token=c570d1083fad4150fd608147bc0fb5412d14d6f0)](https://circleci.com/gh/jgentes/startupcommunity/tree/master)

Dev: [![Circle CI](https://circleci.com/gh/jgentes/startupcommunity/tree/dev.svg?style=svg&circle-token=c570d1083fad4150fd608147bc0fb5412d14d6f0)](https://circleci.com/gh/jgentes/startupcommunity/tree/dev)

For Local:
 
 Set NODE_ENV = local
 
 Run C:\Dev\memcached\memcache.bat prior to launch, which includes:
 
* taskkill /FI "WINDOWTITLE EQ memcache" /f /t

* timeout /t 2

* start "memcache" /min memcached.exe -vv

Backup of search indexes for Cloudant:

communitySearch:

```
function (doc) {
  var i;
  
  index("key", doc._id, {"store": true});
  
  if (doc.type) index("type", doc.type, {"store": true})
  
  if (doc.resource) index("resource", doc.resource, {"store": true})
  
  if (doc.communities && doc.communities.length) {
    for (i=0; i<doc.communities.length; i++) {
      index("communities", doc.communities[i], {"store": true})
    }
  }
  
  if (doc.invite_communities && doc.invite_communities.length) {
    for (i=0; i<doc.invite_communities.length; i++) {
      index("invite_communities", doc.invite_communities[i], {"store": true})
    }
  }
  
  if (doc.roles && doc.roles.length) {
    for (i=0; i<doc.roles.length; i++) {
      index("roles", doc.roles[i], {"store": true})
    }
  }
  
  if (doc.parents && doc.parents.length) {
    for (i=0; i<doc.parents.length; i++) {
      index("parents", doc.parents[i], {"store": true})
    }
  }
  
  if (doc.profile) {
    if (doc.profile.name) index("profile", doc.profile.name, {"store": true})
    if (doc.profile.headline) index("profile", doc.profile.headline, {"store": true})
    if (doc.profile.summary) index("profile", doc.profile.summary, {"store": true})
    if (doc.profile.home) index("profile.home", doc.profile.home, {"store": true})
    
    if (doc.profile.parents && doc.profile.parents.length) {
      for (i=0; i<doc.profile.parents.length; i++) {
        index("profile.parents", doc.profile.parents[i], {"store": true})
      }
    }
    if (doc.profile.industries && doc.profile.industries.length) {
      for (i=0; i<doc.profile.industries.length; i++) {
        index("profile.industries", doc.profile.industries[i], {"store": true})
      }
    }
    if (doc.profile.skills && doc.profile.skills.length) {
      for (i=0; i<doc.profile.skills.length; i++) {
        index("profile.skills", doc.profile.skills[i], {"store": true})
      }
    }
  }
}
```

companyTop:
```
function (doc) {
    var i;

    if (doc.profile &&
      doc.profile.parents &&
      doc.profile.industries
    ) {
      if (doc.profile.name) index("profile", doc.profile.name, {"store": true})
      if (doc.profile.headline) index("profile", doc.profile.headline, {"store": true})
      if (doc.profile.summary) index("profile", doc.profile.summary, {"store": true})
      if (doc.profile.home) index("profile.home", doc.profile.home, {"store": true})

      if (doc.profile.parents && doc.profile.parents.length) {
        for (i = 0; i < doc.profile.parents.length; i++) {
          index("profile.parents", doc.profile.parents[i], {"store": true, "facet": true})
        }
      }
      if (doc.profile.industries && doc.profile.industries.length) {
        for (i = 0; i < doc.profile.industries.length; i++) {
          index("profile.industries", doc.profile.industries[i], {"store": true, "facet": true})
        }
      }
      if (doc.profile.skills && doc.profile.skills.length) {
        for (i = 0; i < doc.profile.skills.length; i++) {
          index("profile.skills", doc.profile.skills[i], {"store": true})
        }
      }

      index("key", doc._id, {"store": true});

      if (doc.type) index("type", doc.type, {"store": true})

      if (doc.resource) index("resource", doc.resource, {"store": true})

      if (doc.communities && doc.communities.length) {
        for (i = 0; i < doc.communities.length; i++) {
          index("communities", doc.communities[i], {"store": true})
        }
      }

      if (doc.invite_communities && doc.invite_communities.length) {
        for (i = 0; i < doc.invite_communities.length; i++) {
          index("invite_communities", doc.invite_communities[i], {"store": true})
        }
      }

      if (doc.roles && doc.roles.length) {
        for (i = 0; i < doc.roles.length; i++) {
          index("roles", doc.roles[i], {"store": true})
        }
      }

      if (doc.parents && doc.parents.length) {
        for (i = 0; i < doc.parents.length; i++) {
          index("parents", doc.parents[i], {"store": true})
        }
      }
    }

  }
  ```
  
peopleTop:

```
function (doc) {
  var i;
  
  if (doc.profile && doc.profile.parents && doc.profile.skills) {
    if (doc.profile.name) index("profile", doc.profile.name, {"store": true})
    if (doc.profile.headline) index("profile", doc.profile.headline, {"store": true})
    if (doc.profile.summary) index("profile", doc.profile.summary, {"store": true})
    if (doc.profile.home) index("profile.home", doc.profile.home, {"store": true})
    
    if (doc.profile.parents && doc.profile.parents.length) {
      for (i=0; i<doc.profile.parents.length; i++) {
        index("profile.parents", doc.profile.parents[i], {"store": true, "facet": true})
      }
    }
    if (doc.profile.industries && doc.profile.industries.length) {
      for (i=0; i<doc.profile.industries.length; i++) {
        index("profile.industries", doc.profile.industries[i], {"store": true})
      }
    }
    if (doc.profile.skills && doc.profile.skills.length) {
      for (i=0; i<doc.profile.skills.length; i++) {
        index("profile.skills", doc.profile.skills[i], {"store": true, "facet": true})
      }
    }  
  
	  index("key", doc._id, {"store": true});
	  
	  if (doc.type) index("type", doc.type, {"store": true})
	  
	  if (doc.resource) index("resource", doc.resource, {"store": true})
	  
	  if (doc.communities && doc.communities.length) {
		for (i=0; i<doc.communities.length; i++) {
		  index("communities", doc.communities[i], {"store": true})
		}
	  }
	  
	  if (doc.invite_communities && doc.invite_communities.length) {
		for (i=0; i<doc.invite_communities.length; i++) {
		  index("invite_communities", doc.invite_communities[i], {"store": true})
		}
	  }
	  
	  if (doc.roles && doc.roles.length) {
		for (i=0; i<doc.roles.length; i++) {
		  index("roles", doc.roles[i], {"store": true})
		}
	  }
	  
	  if (doc.parents && doc.parents.length) {
		for (i=0; i<doc.parents.length; i++) {
		  index("parents", doc.parents[i], {"store": true})
		}
	  }
  }
 
}
```

import script:
```
var couchimport = require('couchimport');

// cast lat/long to numbers and live to boolean
var transformer = function(json) {
  if (json.path && json.path.collection == 'communities') {
    var newrecord = json.value;
	if (json.value && json.value.type) newrecord.type = json.value.type;
	if (json.value && json.value.type == 'user') {
		if (json.value.profile) {
			if (!json.value.profile.skills) newrecord.profile['skills'] = ['Consulting'];
			if (!json.value.profile.parents) newrecord.profile['parents'] = ['All'];
		} else console.log('PROBLEM')
	}
    newrecord['_id'] = json.path.key;
    return newrecord;
  }
};

// connection options
var opts = { COUCH_URL: "https://2001b05d-38e3-44f7-b569-b13a66a81b70-bluemix.cloudant.com", COUCH_DATABASE: "communities-dev", COUCH_FILETYPE: 'jsonl', COUCH_TRANSFORM: transformer};

// import the data
couchimport.importFile('orchestrate_dump_feb21.json', opts, function(err,data) {
       console.log("done",err);
	   //console.log(data);
    }).on("written", function(data) {
		console.log('written');
		//console.log(data);
}).on("writeerror", function(data) {
		console.log('writteerr');
		//console.log(data);
}).on("writefail", function(data) {
		//console.log('writtefail');
		//console.log(data);
})
```

Update communities: * to communities: [a* TO z*]
Update profile.*: to profile: 
Create messages search index, update at community api
Rework roles, community api line 225, use .find? or index all roles.. that's it.
replace result.body.results with result.rows
path.key = .id
.value = .doc
replace .fail with .catch

NEXT: PRINT OUT ALL 'TYPES' OF RECORDS TO CATCH ANYTHING ELSE IN ADDITION TO 'CONTACT_REQUEST'

cdb.search('communities', 'communitySearch', {q: usersearch, include_docs: true})