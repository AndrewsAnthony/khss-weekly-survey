'use strict';
module.exports = function(sequelize, DataTypes) {
  var ValueTable = sequelize.define('ValueTable', {
    status: {
      type: DataTypes.STRING,
      defaultValue: "add"
    },
    value: DataTypes.STRING
  })

  ValueTable.associate = function(models) {
    
    ValueTable.belongsTo(models.House);

    ValueTable.belongsTo(models.FieldTable);

    ValueTable.hasMany(models.HistoryTable);
  
  }

  return ValueTable;
};