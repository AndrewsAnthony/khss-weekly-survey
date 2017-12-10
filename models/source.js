'use strict';
module.exports = function(sequelize, DataTypes) {
  var Source = sequelize.define('Source', {
    name: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    }
  });

  Source.associate = function(models) {

    // Source -> ItemTask
    Source.hasMany(models.ItemTask, {
      foreignKey: 'taskable_id',
      scope: {
        taskable: 'source'
      },
      constraints: false
    });

  }

  return Source;
};