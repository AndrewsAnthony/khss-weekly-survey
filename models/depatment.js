'use strict';
module.exports = function(sequelize, DataTypes) {
  var Depatment = sequelize.define('Depatment', {
    name: DataTypes.STRING
  });

  Depatment.associate = function(models) {

    // Depatment -> Inbox
    Depatment.belongsToMany(models.Inbox, {
      through: {
        model: models.ItemDepatment,
        unique: false
      },
      foreignKey: 'depatment_id',
      constraints: false
    });

  };

  return Depatment;
};