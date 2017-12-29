/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('messages', {
    id: {
      type: DataTypes.INTE(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    from: {
      type: DataTypes.JSON,
      allowNull: false
    },
    to: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    published: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    replies: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }, {
    tableName: 'messages',
    timestamps: false
  });
};
