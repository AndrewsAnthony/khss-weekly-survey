'use strict';
module.exports = function(sequelize, DataTypes) {
  var House = sequelize.define('House', {
    street: DataTypes.STRING,
    district: DataTypes.STRING,
    number: DataTypes.STRING,
    roof: DataTypes.STRING,
    roofarea: DataTypes.DECIMAL
  });

  House.associate = function(models) {
    House.hasMany(models.Inbox);

    House.hasMany(models.ItemTask);

    // Authority -> House
    House.belongsToMany(models.Authority, {
      through: {
        model: models.TableHouse,
        unique: false
      },
      foreignKey: 'house_id',
      constraints: false
    });
  }

  return House;
};