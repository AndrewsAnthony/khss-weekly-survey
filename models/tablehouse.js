'use strict';
module.exports = function(sequelize, DataTypes) {
  var TableHouse = sequelize.define('TableHouse', {
    house_id: {
      type: DataTypes.INTEGER
    },
    houseable: {
      type: DataTypes.STRING
    },
    houseable_id: {
      type: DataTypes.INTEGER
    }
  });

  return TableHouse;
};