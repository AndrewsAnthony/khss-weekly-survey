'use strict';
module.exports = function(sequelize, DataTypes) {
  var UserRule = sequelize.define('UserRule');

  return UserRule;
};