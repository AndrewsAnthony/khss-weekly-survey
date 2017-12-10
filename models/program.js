'use strict';
module.exports = function(sequelize, DataTypes) {
  var Program = sequelize.define('Program', {
    title: DataTypes.STRING,
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
        taskable: 'program'
      },
      constraints: false
    });

  }

  return Program;
};