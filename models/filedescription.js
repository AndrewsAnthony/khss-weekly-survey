'use strict';
module.exports = function(sequelize, DataTypes) {
  var FileDescription = sequelize.define('FileDescription', {
    description: DataTypes.TEXT,
    note: DataTypes.STRING,
    name: DataTypes.STRING
  });

  FileDescription.associate = function(models) {

    FileDescription.hasMany(models.File);

  }

  return FileDescription;
};