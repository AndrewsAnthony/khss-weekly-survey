'use strict';
module.exports = function(sequelize, DataTypes) {
  var Photo = sequelize.define('Photo', {
    path: DataTypes.STRING,
    photoable: DataTypes.STRING,
    photoable_id: DataTypes.INTEGER,
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {

        Photo.belongsTo(models.Inbox, {
          foreignKey: 'photoable_id',
          constraints: false,
          as: 'inbox'
        });

      },
      getItem: function(options) {
        return this['get' + this.get('photoable').substr(0, 1).toUpperCase() + this.get('photoable').substr(1)](options);
      }
    }
  });
  return Photo;
};