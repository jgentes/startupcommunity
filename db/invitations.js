/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('invitations', {
    id: {
      type: DataTypes.INTE(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    home: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    invitor_email: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    invite_communities: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }, {
    tableName: 'invitations',
    timestamps: false
  });
};
