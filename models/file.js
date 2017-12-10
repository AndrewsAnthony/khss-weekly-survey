'use strict';
module.exports = function(sequelize, DataTypes) {
  var File = sequelize.define('File', {
    path: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    type: DataTypes.STRING,
    fileable: DataTypes.STRING,
    fileable_id: DataTypes.INTEGER
  });

  File.associate = function(models) {

    File.belongsTo(models.FileDescription);

    File.belongsTo(models.ItemTask, {
      foreignKey: 'fileable_id',
      constraints: false,
      as: 'Task'
    });

    File.belongsTo(models.Inbox, {
      foreignKey: 'fileable_id',
      constraints: false,
      as: 'Inbox'
    });

    File.belongsTo(models.Program, {
      foreignKey: 'fileable_id',
      constraints: false,
      as: 'Program'
    });

    File.belongsTo(models.Protocol, {
      foreignKey: 'fileable_id',
      constraints: false,
      as: 'Protocol'
    });

    File.belongsTo(models.Schedule, {
      foreignKey: 'fileable_id',
      constraints: false,
      as: 'Schedule'
    });

  }

  File.prototype.getItem = function(options) {
    return this['get' + this.get('fileable').substr(0, 1).toUpperCase() + this.get('fileable').substr(1)](options);
  }

  return File;
};