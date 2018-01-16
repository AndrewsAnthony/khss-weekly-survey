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
      as: 'Task',
      constraints: false
    });

    File.belongsTo(models.Inbox, {
      foreignKey: 'fileable_id',
      as: 'Inbox',
      constraints: false
    });

    File.belongsTo(models.Authority, {
      foreignKey: 'fileable_id',
      as: 'Authority',
      constraints: false
    });

    File.belongsTo(models.Program, {
      foreignKey: 'fileable_id',
      as: 'Program',
      constraints: false
    });

    File.belongsTo(models.Protocol, {
      foreignKey: 'fileable_id',
      as: 'Protocol',
      constraints: false
    });

    File.belongsTo(models.Schedule, {
      foreignKey: 'fileable_id',
      as: 'Schedule',
      constraints: false
    });

  }

  File.prototype.getItem = function(options) {
    return this['get' + this.get('fileable').substr(0, 1).toUpperCase() + this.get('fileable').substr(1)](options);
  }

  return File;
};