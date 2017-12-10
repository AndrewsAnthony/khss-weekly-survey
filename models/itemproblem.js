'use strict';
module.exports = function(sequelize, DataTypes) {
  var ItemProblem = sequelize.define('ItemProblem', {
    problem_id: {
      type: DataTypes.INTEGER
      // unique: 'item_problem_problemable'
    },
    problemable: {
      type: DataTypes.STRING
      // unique: 'item_problem_problemable'
    },
    problemable_id: {
      type: DataTypes.INTEGER
      // unique: 'item_problem_prablemable',
      // references: null
    }
  });


  return ItemProblem;
};