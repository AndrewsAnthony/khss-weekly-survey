'use strict';
module.exports = function(sequelize, DataTypes) {
  var Schedule = sequelize.define('Schedule', {
    title: DataTypes.STRING,
    type: DataTypes.STRING,
    year: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    }
  });

  Schedule.associate = function(models) {

    // Schedule -> ItemTask
    Schedule.hasMany(models.ItemTask, {
      foreignKey: 'taskable_id',
      scope: {
        taskable: 'schedule'
      },
      constraints: false
    });

    // Schedule -> File
    Schedule.hasMany(models.File, {
      foreignKey: 'fileable_id',
      scope: {
        fileable: 'schedule'
      },
      constraints: false
    });

  }

  return Schedule;
};