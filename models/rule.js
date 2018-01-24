'use strict';
module.exports = function(sequelize, DataTypes) {
  var Rule = sequelize.define('Rule', {
    name: DataTypes.STRING,
    description: DataTypes.STRING
  });

  Rule.associate = function (models) {
    Rule.belongsToMany(models.User, {through: 'UserRule'});
  };

  return Rule;
};