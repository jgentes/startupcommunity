const
  Sequelize = require('sequelize'),
  sequelize = new Sequelize('otcktbzgpblfpu07', 'cd8do5g1qfary77u', 'bix38gi0i1nsf9gx', {
    host: 'otwsl2e23jrxcqvx.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    dialect: 'mysql',
    operatorsAliases: false
  }),
  cls = require('continuation-local-storage'),
  path = require('path'),
  db = sequelize.import(__dirname + "/communities"),
  cdb = require(path.join(__dirname, "../db")).communities,
  idb= require(path.join(__dirname, "../db")).invitations,
  mdb = require(path.join(__dirname, "../db")).messages,
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

/*sequelize
  .query(
    'SELECT id, communities FROM communities WHERE JSON_CONTAINS(communities, \'["bendtech"]\')',
    { model: db}
  ).then(u => {
  if (u) u.forEach(ul => console.log(ul.id));
  })*/
/*db.findOne({where: {'roles.leader.bend-or': {[Op.ne]: null}}})
  .then(u => {
    if (u) console.log(u.id);
  })*/
/*
var User = sequelize.define('user', {
  data: Sequelize.DataTypes.JSONB
});

sequelize.sync({
  force: true,
  logging: console.log
})
  .then(() => {
    return User.create({
      data: {
        components: ['abc', 'bca', 'bac']
      }
    })
  })
  .then(() => {
    return User.findAll({
      where : {
        data: {
          '$contains': { components: [ 'abc' ]}
        }
      }
    });
  })
  .then(console.log)
  .finally(() => sequelize.close());
*/
/*db.findOne({where: {'communities': {[Op.contains]: ['bendtech']}}})
  .then(u => {
    if (u) console.log(u.id);
  })*/
  /*
db.execute(
  'SELECT * FROM cities ORDER BY ID_COUNTY',
  (err, results) => {
    if (err) console.log(err);
    console.log(results.length, ' results');
    
  }
);*/

exports = {sequelize, Sequelize, db, cdb, idb, mdb, Op};