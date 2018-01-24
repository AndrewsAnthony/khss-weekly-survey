'use strict';
module.exports = function(sequelize, DataTypes) {
  var HistoryStatus = sequelize.define('HistoryStatus', {
    statusable: {
      type: DataTypes.STRING
    },
    statusable_id: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.STRING
    },
    jsondata: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.STRING
    },
    dependence: {
      type: DataTypes.STRING
    },
    dependence_id: {
      type: DataTypes.INTEGER
    }
  })

  HistoryStatus.associate = function(models) {

    HistoryStatus.belongsTo(models.User);

    HistoryStatus.belongsTo(models.ItemTask, {
      foreignKey: 'dependence_id',
      as: 'ItemTask',
      constraints: false
    });

    HistoryStatus.belongsTo(models.ItemTask, {
      foreignKey: 'statusable_id',
      as: 'Task',
      constraints: false
    });

    HistoryStatus.belongsTo(models.Inbox, {
      foreignKey: 'statusable_id',
      as: 'Inbox',
      constraints: false
    });

    HistoryStatus.belongsTo(models.Authority, {
      foreignKey: 'statusable_id',
      as: 'Authority',
      constraints: false
    });

    HistoryStatus.belongsTo(models.Program, {
      foreignKey: 'statusable_id',
      as: 'Program',
      constraints: false
    });

    HistoryStatus.belongsTo(models.Protocol, {
      foreignKey: 'statusable_id',
      as: 'Protocol',
      constraints: false
    });

    HistoryStatus.belongsTo(models.Schedule, {
      foreignKey: 'statusable_id',
      as: 'Schedule',
      constraints: false
    });

    HistoryStatus.belongsTo(models.File, {
      foreignKey: 'dependence_id',
      as: 'File',
      constraints: false
    });

    HistoryStatus.belongsTo(models.NoteTask, {
      foreignKey: 'dependence_id',
      as: 'NoteTask',
      constraints: false
    });

  }

  HistoryStatus.prototype.getItem = function(options) {
    return this['get' + this.get('statusable').substr(0, 1).toUpperCase() + this.get('statusable').substr(1)](options);
  }

  return HistoryStatus;
};