'use strict';
module.exports = function(sequelize, DataTypes) {
  var ItemTask = sequelize.define('ItemTask', {
    taskable: {
      type: DataTypes.STRING
    },
    taskable_id: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    },
    binding: DataTypes.STRING,
    term: {
      type: DataTypes.DATE
    }
  })

  ItemTask.associate = function(models) {
    ItemTask.belongsTo(models.House);

    ItemTask.belongsTo(models.Inbox, {
      foreignKey: "taskable_id",
      constraints: false,
      as: 'Inbox'
    });

    ItemTask.belongsTo(models.Authority, {
      foreignKey: "taskable_id",
      constraints: false,
      as: 'Authority'
    });

    ItemTask.belongsTo(models.Information, {
      foreignKey: "taskable_id",
      constraints: false,
      as: 'Information'
    });

    ItemTask.belongsTo(models.Schedule, {
      foreignKey: "taskable_id",
      constraints: false,
      as: 'Schedule'
    });

    ItemTask.belongsTo(models.Protocol, {
      foreignKey: "taskable_id",
      constraints: false,
      as: 'Protocol'
    });

    ItemTask.belongsTo(models.Program, {
      foreignKey: "taskable_id",
      constraints: false,
      as: 'Program'
    });

    ItemTask.belongsTo(models.Problem, {
      foreignKey: "taskable_id",
      constraints: false,
      as: 'Repair'
    });

    ItemTask.belongsTo(models.Task, {as: "TaskType"});

    ItemTask.belongsTo(models.User, {as: 'Implementer'});

    ItemTask.belongsToMany(models.Problem, {
      through: {
        model: models.ItemProblem,
        unique: false,
        scope: {
          problemable: 'task'
        }
      },
      foreignKey: 'problemable_id',
      constraints: false
    });

    // ItemTask -> File
    ItemTask.hasMany(models.File, {
      foreignKey: 'fileable_id',
      scope: {
        fileable: 'task'
      },
      constraints: false
    });

    // ItemTask -> NoteTask
    ItemTask.hasMany(models.NoteTask)

  }

  return ItemTask;
};