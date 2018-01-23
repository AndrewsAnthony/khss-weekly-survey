'use strict';
module.exports = function(sequelize, DataTypes) {
  var Program = sequelize.define('Program', {
    title: DataTypes.STRING,
    year: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    }
  });

  Program.associate = function(models) {

    // Program -> ItemTask
    Program.hasMany(models.ItemTask, {
      foreignKey: 'taskable_id',
      scope: {
        taskable: 'program'
      },
      constraints: false
    });

    // Program -> File
    Program.hasMany(models.File, {
      foreignKey: 'fileable_id',
      scope: {
        fileable: 'program'
      },
      constraints: false
    });

    // Program -> House
    Program.belongsToMany(models.House, {
      through: {
        model: models.TableHouse,
        unique: false,
        scope: {
          houseable: 'program'
        }
      },
      foreignKey: 'houseable_id',
      constraints: false
    });

    // Program -> FieldTable
    Program.hasMany(models.FieldTable, {
      foreignKey: 'fieldable_id',
      scope: {
        fieldable: 'program'
      },
      constraints: false
    });

    // Program -> HistoryStatus
    Program.hasMany(models.HistoryStatus, {
      foreignKey: 'statusable_id',
      scope: {
        statusable: 'program'
      },
      constraints: false
    });

  }

  return Program;
};