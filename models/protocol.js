'use strict';
module.exports = function(sequelize, DataTypes) {
  var Protocol = sequelize.define('Protocol', {
    title: DataTypes.STRING,
    location: DataTypes.STRING,
    date: DataTypes.DATE,
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    }
  });

  Protocol.associate = function(models) {

    // Protocol -> ItemTask
    Protocol.hasMany(models.ItemTask, {
      foreignKey: 'taskable_id',
      scope: {
        taskable: 'protocol'
      },
      constraints: false
    });

    // Protocol -> File
    Protocol.hasMany(models.File, {
      foreignKey: 'fileable_id',
      scope: {
        taskable: 'protocol'
      },
      constraints: false
    });

  }

  return Protocol;
};