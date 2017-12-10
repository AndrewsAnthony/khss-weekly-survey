'use strict';
module.exports = function(sequelize, DataTypes) {
  var Task = sequelize.define('Task', {
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    model: DataTypes.STRING,
    description: DataTypes.STRING
  });

  Task.associate = function(models) {

    // Task -> ItemTask
    Task.hasMany(models.ItemTask, {foreignKey: 'TaskTypeId'});

  };

  return Task;
};