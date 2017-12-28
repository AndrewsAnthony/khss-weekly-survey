'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      defaultValue: "Новый пользователь КП"
    },
    image: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      defaultValue: "noemail@mail.com"
    },
    phone: {
      type: DataTypes.STRING,
      defaultValue: "(999)-999-9999"
    },
  });

  User.associate = function (models) {
    User.belongsTo(models.Depatment);

    User.hasOne(models.User, {as: 'Chief'});

    User.belongsTo(models.Authorization);

    User.hasMany(models.ItemTask, {foreignKey: 'ImplementerId'});

    User.hasMany(models.NoteTask);

    User.belongsToMany(models.Rule, {through: 'UserRule'});
  };

  return User;
};