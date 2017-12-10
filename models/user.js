'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    password: DataTypes.STRING
  });

  User.associate = function (models) {
    User.belongsTo(models.Depatment);

    User.hasMany(models.ItemTask, {foreignKey: 'ImplementerId'});
  };

  return User;
};