const
  Sequelize = require('sequelize'),
  sequelize = new Sequelize('otcktbzgpblfpu07', 'cd8do5g1qfary77u', 'bix38gi0i1nsf9gx', {
    host: 'otwsl2e23jrxcqvx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    dialect: 'mysql',
    operatorsAliases: false
  }),
  cls = require('continuation-local-storage'),
  path = require('path'),
  cdb = sequelize.import(__dirname + "/communities"),
  idb = sequelize.import(__dirname + "/invitations"),
  mdb = sequelize.import(__dirname + "/messages"),
  Op = Sequelize.Op;
  
Sequelize.useCLS(cls.createNamespace('sc-mobile'));

/*db.create({slug: 'test6', type: 'test', name: 'testing'}).then(a => {
  console.log(a.id)
  // returns { id: 575, slug: 'test6', type: 'test', name: 'testing' }
  db.update({slug: 'test7'}, {where: {slug: 'test6'}}).then(b => {
    //console.log(b)
    db.destroy({where: {id: a.id}});
  })
  
});*/

//db.findById(496).then(f => console.log(f));
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
    'SELECT id, roles FROM communities WHERE JSON_CONTAINS(roles->>\'$.*."bend-or"\', \'["bend-or"]\')',
    { model: db}
  ).then(result => {
    console.log(result)
  })*/

//SELECT id, roles FROM communities WHERE JSON_CONTAINS(roles->>'$.leader."bend-or"', \'["bend-or"]\')
//SELECT id, communities FROM communities WHERE JSON_CONTAINS(communities, \'["bendtech"]\')
const test = ["bendtech", "bend-or"];
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
  })
/*db.findOne({where: {'roles.leader.bend-or': {[Op.ne]: null}}})
  .then(u => {
    if (u) console.log(u.id);
  })*/
  /*
idb.findOne({where: {'invite_communities': {[Op.contains]: ["bendtech"]}}})
  .then(u => {
    if (u) console.log(u.id);
  })
  /*
db.execute(
  'SELECT * FROM cities ORDER BY ID_COUNTY',
  (err, results) => {
    if (err) console.log(err);
    console.log(results.length, ' results');
    
  }
);*/

exports = {sequelize, Sequelize, cdb, idb, mdb, Op};