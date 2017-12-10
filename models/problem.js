'use strict';
module.exports = function(sequelize, DataTypes) {
  var Problem = sequelize.define('Problem', {
    name: DataTypes.STRING
  });

  Problem.associate = function(models) {

    Problem.belongsToMany(models.Inbox, {
      through: {
        model: models.ItemProblem,
        unique: false
      },
      foreignKey: 'problem_id',
      constraints: false
    });

    Problem.belongsToMany(models.ItemTask, {
      through: {
        model: models.ItemProblem,
        unique: false
      },
      foreignKey: 'problem_id',
      constraints: false
    });

    Problem.hasMany(models.ItemTask, {
      foreignKey: 'taskable_id',
      scope: {
        taskable: 'repair'
      },
      constraints: false
    });

  }


  return Problem;
};