/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('communities', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    slug: {
      type: DataTypes.STRING(50),
      unique: true
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    home: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parents: {
      type: DataTypes.JSON,
      allowNull: true
    },
    communities: {
      type: DataTypes.JSON,
      allowNull: true
    },
    community_profiles: {
      type: DataTypes.JSON,
      allowNull: true
    },
    icon: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    linkedin: {
      type: DataTypes.JSON,
      allowNull: true
    },
    api_key: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    headline: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true
    },
    roles: {
      type: DataTypes.JSON,
      allowNull: true
    },
    country: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    state: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    county: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sc_logo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    embed: {
      type: DataTypes.JSON,
      allowNull: true
    },
    resource: {
      type: DataTypes.INTEGER(4),
      allowNull: true
    },
    resource_types: {
      type: DataTypes.JSON,
      allowNull: true
    },
    industries: {
      type: DataTypes.JSON,
      allowNull: true
    },
    website: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    street: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    angellist: {
      type: DataTypes.JSON,
      allowNull: true
    },
    logo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    newsletter: {
      type: DataTypes.JSON,
      allowNull: true
    },
    stage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'communities',
    timestamps: false
  });
};
