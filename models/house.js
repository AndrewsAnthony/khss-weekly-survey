'use strict';
module.exports = function(sequelize, DataTypes) {
  var House = sequelize.define('House', {
    district: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sector: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    street_rus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name_rus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    street_ukr: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name_ukr: {
      type: DataTypes.STRING,
      allowNull: true
    },
    street_new_rus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name_new_rus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    house_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    building: {
      type: DataTypes.STRING,
      allowNull: true
    },
    section: {
      type: DataTypes.STRING,
      allowNull: true
    },
    year: {
      type: "YEAR",
      allowNull: true
    },
    house_area: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    building_area: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    entrances: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    floar: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    residents: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    apartments: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    apartment_area: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    roof_material: {
      type: DataTypes.STRING,
      allowNull: true
    },
    roof_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    roof_area: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    adopted_at_the_balance: {
      type: "YEAR(4)",
      allowNull: true
    }
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