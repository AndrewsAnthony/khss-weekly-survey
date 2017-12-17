'use strict';
var passportLocalSequelize = require('passport-local-sequelize');
module.exports = function(sequelize, DataTypes) {
  
  var Authorization = sequelize.define('Authorization', {
    email: DataTypes.STRING,
    hashsum: DataTypes.STRING(1024),
    salt: DataTypes.STRING
  });

  passportLocalSequelize.attachToUser(Authorization, {
    usernameField: 'email',
    hashField: 'hashsum',
    saltField: 'salt',
    usernameLowerCase: true,
    incorrectPasswordError: 'Неверный пароль',
    incorrectUsernameError: 'Неверное имя пользователя',
    missingUsernameError: 'Поле %s не задано',
    missingFieldError: 'Поле %s не задано',
    missingPasswordError: 'Не задан аргумент пароля!',
    userExistsError: 'Пользователь уже существует с %s'
  });

  Authorization.associate = function(models) {
    Authorization.hasOne(models.User)
  }

  return Authorization;
};