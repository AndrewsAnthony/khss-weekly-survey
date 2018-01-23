'use strict';
module.exports = function(sequelize, DataTypes) {
  var Schedule = sequelize.define('Schedule', {
    title: DataTypes.STRING,
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

    // Schedule -> House
    Schedule.belongsToMany(models.House, {
      through: {
        model: models.TableHouse,
        unique: false,
        scope: {
          houseable: 'schedule'
        }
      },
      foreignKey: 'houseable_id',
      constraints: false
    });

    // Schedule -> FieldTable
    Schedule.hasMany(models.FieldTable, {
      foreignKey: 'fieldable_id',
      scope: {
        fieldable: 'schedule'
      },
      constraints: false
    });

    // Schedule -> HistoryStatus
    Schedule.hasMany(models.HistoryStatus, {
      foreignKey: 'statusable_id',
      scope: {
        statusable: 'schedule'
      },
      constraints: false
    });

  }

  return Schedule;
};