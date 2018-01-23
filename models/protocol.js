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
        fileable: 'protocol'
      },
      constraints: false
    });

    // Protocol -> House
    Protocol.belongsToMany(models.House, {
      through: {
        model: models.TableHouse,
        unique: false,
        scope: {
          houseable: 'protocol'
        }
      },
      foreignKey: 'houseable_id',
      constraints: false
    });

    // Protocol -> FieldTable
    Protocol.hasMany(models.FieldTable, {
      foreignKey: 'fieldable_id',
      scope: {
        fieldable: 'protocol'
      },
      constraints: false
    });

    // Protocol -> HistoryStatus
    Protocol.hasMany(models.HistoryStatus, {
      foreignKey: 'statusable_id',
      scope: {
        statusable: 'protocol'
      },
      constraints: false
    });

  }

  return Protocol;
};