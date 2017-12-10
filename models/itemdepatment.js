'use strict';
module.exports = function(sequelize, DataTypes) {
  var ItemDepatment = sequelize.define('ItemDepatment', {
    depatment_id: DataTypes.INTEGER,
    depatmentable: DataTypes.STRING,
    depatmentable_id: DataTypes.INTEGER
  });


  return ItemDepatment;
};