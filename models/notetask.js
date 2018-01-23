'use strict';
module.exports = function(sequelize, DataTypes) {
  var NoteTask = sequelize.define('NoteTask', {
    text: DataTypes.STRING
  });

  NoteTask.associate = function(models) {

    // NoteTask -> ItemTask
    NoteTask.belongsTo(models.ItemTask);

    // NoteTask -> User
    NoteTask.belongsTo(models.User);

    // NoteTask -> HistoryStatus
    NoteTask.hasOne(models.HistoryStatus, {
      foreignKey: 'dependence_id',
      scope: {
        dependence: 'notetask'
      },
      constraints: false
    });

  }

  return NoteTask;
};