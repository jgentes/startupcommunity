const
  Sequelize = require('sequelize'),
  sequelize = new Sequelize(process.env.JAWSDB_URL, {
    dialect: 'mysql',
    operatorsAliases: false
  }),
  cls = require('continuation-local-storage'),
  messages = require('./messages-dump.json');

Sequelize.useCLS(cls.createNamespace('startupcommunity'));
/*
sequelize.query('CREATE TABLE `messages` (`id` int(11) NOT NULL AUTO_INCREMENT, `from` json NOT NULL, `to` tinytext COLLATE utf8_unicode_ci NOT NULL, `published` bigint(20) NOT NULL, `content` text COLLATE utf8_unicode_ci NOT NULL, `replies` json NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci').then(console.log('created table'));
*/
const fields = '(id, from2, to2, published, content, replies)';
/*
messages.forEach(c => {
  const values = [
    c._id,
    JSON.stringify(c.from || {}),
    c.to || '',
    c.published,
    c.content,
    JSON.stringify(c.replies || [])
  ];
  if (c.published) sequelize.query(
    'INSERT INTO messages ' + fields + ' VALUES (?, ?, ?, ?, ?, ?)', values,
    err => {
      if (err) {
        console.log(values);
        throw (err);
      }
      else console.log(c.content);
    }
  );
})
*/
