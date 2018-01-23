'use strict';
module.exports = function(sequelize, DataTypes) {
  var Authority = sequelize.define('Authority', {
    name: DataTypes.STRING,
    date: DataTypes.DATE,
    location: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    }
  });

  Authority.associate = function(models) {

    // Authority -> ItemTask
    Authority.hasMany(models.ItemTask, {
      foreignKey: 'taskable_id',
      scope: {
        taskable: 'authority'
      },
      constraints: false
    });

    // Authority -> File
    Authority.hasMany(models.File, {
      foreignKey: 'fileable_id',
      scope: {
        fileable: 'authority'
      },
      constraints: false
    });

    // Authority -> House
    Authority.belongsToMany(models.House, {
      through: {
        model: models.TableHouse,
        unique: false,
        scope: {
          houseable: 'authority'
        }
      },
      foreignKey: 'houseable_id',
      constraints: false
    });

    // Authority -> FieldTable
    Authority.hasMany(models.FieldTable, {
      foreignKey: 'fieldable_id',
      scope: {
        fieldable: 'authority'
      },
      constraints: false
    });

    // Authority -> HistoryStatus
    Authority.hasMany(models.HistoryStatus, {
      foreignKey: 'statusable_id',
      scope: {
        statusable: 'authority'
      },
      constraints: false
    });

  }

  return Authority;
};