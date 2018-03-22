const
  Sequelize = require('sequelize'),
  sequelize = new Sequelize('otcktbzgpblfpu07', 'cd8do5g1qfary77u', 'bix38gi0i1nsf9gx', {
    host: 'otwsl2e23jrxcqvx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    dialect: 'mysql',
    operatorsAliases: false,
    query: {
      raw: false
    }
  }),
  cls = require('continuation-local-storage'),
  cdb = sequelize.import("communities"),
  idb = sequelize.import("invitations"),
  mdb = sequelize.import("messages"),
  Op = Sequelize.Op;

Sequelize.useCLS(cls.createNamespace('startupcommunity'));

cdb.prototype.getArray = val => val ? JSON.parse(val) : val;
cdb.prototype.setArray = maybeArray => !!(maybeArray && typeof maybeArray == 'object' && maybeArray instanceof Array) ? JSON.stringify(maybeArray) : maybeArray;

// can't use simple object notation here, not sure why
exports.sequelize = sequelize;
exports.Sequelize = Sequelize;
exports.cdb = cdb;
exports.idb = idb;
exports.mdb = mdb;
exports.Op = Op;

/* -------------- USE BELOW FOR TESTING ---------------------- */

/* SENDGRID */
/*
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
const msg = {
      templateId: '9a576524-4b67-43e5-9b86-49ff2f8ef970',
      to: 'jgentes@gmail.com',
      from: 'james@startupcommunity.org',
      subject: 'James has accepted your invitatino.',
      html: '<strong>Congrats!</strong> James accepted your invitation to join the community.',
    };
sgMail.send(msg);*/


/*db.create({id: 'test6', type: 'test', name: 'testing'}).then(a => {
  console.log(a.id)
  // returns { id: 575, id: 'test6', type: 'test', name: 'testing' }
  db.update({id: 'test7'}, {where: {id: 'test6'}}).then(b => {
    //console.log(b)
    db.destroy({where: {id: a.id}});
  })
  
});*/
/*
(async () => {
  const f = await cdb.findAll({where: {id: 496}});
  //cdb.update({name: f.name}, {where: {id: 496}})
})()
*/
//db.findOne({where: {"linkedin.id": "yc-B7Uvuxf"}}).then(u => console.log(u));
/*db.findAll({
  where: {roles: {"keys-rock": {[Op.ne]:null}}
  }
}).then(u => {
  if (u) u.forEach(ul => console.log(ul.name));
})*/
/*
sequelize
  .query(
    "SELECT `id`, `type`, `name`, `home`, `parents`, `communities`, `community_profiles`, `icon`, `email`, `avatar`, `linkedin`, `api_key`, `headline`, `summary`, `skills`, `roles`, `country`, `state`, `county`, `city`, `description`, `sc_logo`, `embed`, `resource`, `resource_types`, `industries`, `website`, `street`, `angellist`, `logo`, `token`, `newsletter`, `stage` FROM `communities` AS `communities` WHERE (NOT ((`communities`.`type` = 'user' OR `communities`.`type` = 'company' OR `communities`.`id` = 'bend-or')) AND (`communities`.`communities` LIKE '%\"bend-or\"%' OR `communities`.`parents` LIKE '%\"bend-or\"%'))",
    { model: cdb}
  ).then(result => {
    console.log(result.length)
  })
  */
/*
sequelize
  .query(
    'SELECT id, roles FROM communities WHERE JSON_CONTAINS(roles->>\'$.*."bend-or"\', \'["bend-or"]\')',
    { model: cdb}
  ).then(result => {
    console.log(result)
  })
*/
//SELECT id, roles FROM communities WHERE JSON_CONTAINS(roles->>'$.leader."bend-or"', \'["bend-or"]\')
//SELECT id, communities FROM communities WHERE JSON_CONTAINS(communities, \'["bendtech"]\')
/*const test = ["bendtech", "bend-or"];
const buildQuery = vals => {
  let q = '';
  vals.forEach((v,i) => {
    q += ' JSON_CONTAINS(invite_communities, \'["' + v + '"]\')';
    if (vals.length > 1 && i < vals.length-1) q += ' OR';
  })
  return q;
};
console.log(buildQuery(test));
sequelize
  .query(
    'SELECT * FROM invitations WHERE' + buildQuery(test),
    { model: idb}
  ).then(u => {
  if (u) u.forEach(ul => console.log(ul.id));
  })*/
/*db.findOne({where: {'roles.leader.bend-or': {[Op.ne]: null}}})
  .then(u => {
    if (u) console.log(u.id);
  })*/
  /*
idb.findOne({where: {'invite_communities': {[Op.contains]: ["bendtech"]}}})
  .then(u => {
    if (u) console.log(u.id);
  })
  */
/*sequelize.query(
  "SELECT `id`, `type`, `name`, `home`, `parents`, `communities`, `community_profiles`, `icon`, `email`, `avatar`, `linkedin`, `api_key`, `headline`, `summary`, `skills`, `roles`, `country`, `state`, `county`, `city`, `description`, `sc_logo`, `embed`, `resource`, `resource_types`, `industries`, `website`, `street`, `angellist`, `logo`, `token`, `newsletter`, `stage` FROM `communities` AS `communities` WHERE (`communities`.`type` = 'company' AND `communities`.`resource` IS NOT true AND (`communities`.`home` LIKE '%-or'))", {model: cdb})
  .then(results => {
    console.log('results: ', results)
  }
);*/

// FULL TEXT SEARCH
/*
sequelize.query('SELECT * FROM communities WHERE MATCH (name, headline, summary, skills, description) AGAINST ("energies" IN NATURAL LANGUAGE MODE)', { model: cdb})
.then(results => console.log(results.length));
*/
// LIKE OPERATOR - use quotes for exact match '%"prhase"%' or partial '%phrase%'
/*
cdb.findOne({where: {skills: {[Op.like]: '%energies%'}}}).then(u => console.log(u && u.skills));
*/
/*var go = async() => {
  var three = await cdb.findAll({where: {skills: {[Op.like]: '%energy%'}}});
  var query = await sequelize.query('SELECT * FROM communities WHERE MATCH (name, headline, summary, skills, description) AGAINST ("energies" IN NATURAL LANGUAGE MODE)', { model: cdb});
  var done = three.concat(query);
  console.log('DONE: ', three.length, query.length, done.length);
};
go()*/