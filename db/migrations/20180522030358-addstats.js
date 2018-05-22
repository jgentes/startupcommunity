module.exports = {
  up: function(queryInterface, Sequelize, done) {
    queryInterface.addColumn(
      'communities',
      'stats',
      Sequelize.JSON
    ).then(() => done());
  },
  down: function(queryInterface, done) {
    queryInterface.removeColumn(
      'communities',
      'stats',
    ).then(() => done());
  }
};
