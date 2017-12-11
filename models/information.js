'use strict';
module.exports = function(sequelize, DataTypes) {
  var Information = sequelize.define('Information', {
    description: DataTypes.STRING,
    source: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    }
  });

  Information.associate = function(models) {

    // Inbox -> ItemTask
    Information.hasMany(models.ItemTask, {
      foreignKey: 'taskable_id',
      scope: {
        taskable: 'information'
      },
      constraints: false
    });

  }

  return Information;
};