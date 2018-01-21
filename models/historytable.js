'use strict';
module.exports = function(sequelize, DataTypes) {
  var HistoryTable = sequelize.define('HistoryTable', {
    status: {
      type: DataTypes.STRING
    },
    oldvalue: DataTypes.STRING
  })

  HistoryTable.associate = function(models) {
    
    HistoryTable.belongsTo(models.ValueTable);

    HistoryTable.belongsTo(models.User);
  
  }

  return HistoryTable;
};