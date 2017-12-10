'use strict';
module.exports = function(sequelize, DataTypes) {
  var Register = sequelize.define('Register', {
    name: DataTypes.STRING,
    typerepair: DataTypes.STRING,
    date: DataTypes.DATE,
    status: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // Register -> Task
        // Register.belongsToMany(models.Task, {
        //   through: {
        //     model: models.ItemTask,
        //     unique: false,
        //     scope: {
        //       taskable: 'register'
        //     }
        //   },
        //   foreignKey: 'taskable_id',
        //   constraints: false
        // });

       
      }
    }
  });

  return Register;
};