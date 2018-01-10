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
      unique: true,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    home: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    parents: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    communities: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    community_profiles: {
      type: DataTypes.JSON,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    linkedin: {
      type: DataTypes.JSON,
      allowNull: true
    },
    api_key: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    headline: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    summary: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    skills: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    roles: {
      type: DataTypes.JSON,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    county: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    sc_logo: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    embed: {
      type: DataTypes.JSON,
      allowNull: true
    },
    resource: {
      type: DataTypes.BOOL,
      allowNull: true
    },
    resource_types: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    industries: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    street: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    angellist: {
      type: DataTypes.JSON,
      allowNull: true
    },
    logo: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    token: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    newsletter: {
      type: DataTypes.JSON,
      allowNull: true
    },
    stage: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'communities',
    timestamps: false
  });
};
