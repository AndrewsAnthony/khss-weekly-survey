'use strict';
module.exports = function(sequelize, DataTypes) {
  var FieldTable = sequelize.define('FieldTable', {
    fieldable: {
      type: DataTypes.STRING
    },
    fieldable_id: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    title: DataTypes.STRING,
    description: DataTypes.STRING
  })

  FieldTable.associate = function(models) {

    FieldTable.belongsTo(models.Authority, {
      foreignKey: "fieldable_id",
      constraints: false,
      as: 'Authority'
    });

    FieldTable.belongsTo(models.Schedule, {
      foreignKey: "fieldable_id",
      constraints: false,
      as: 'Schedule'
    });

    FieldTable.belongsTo(models.Protocol, {
      foreignKey: "fieldable_id",
      constraints: false,
      as: 'Protocol'
    });

    FieldTable.belongsTo(models.Program, {
      foreignKey: "fieldable_id",
      constraints: false,
      as: 'Program'
    });

    FieldTable.hasMany(models.ValueTable);

  }

  return FieldTable;
};