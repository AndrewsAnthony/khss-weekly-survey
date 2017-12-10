'use strict';
module.exports = function(sequelize, DataTypes) {
  var Inbox = sequelize.define('Inbox', {
    number: DataTypes.STRING,
    inboxdate: DataTypes.DATE,
    term: DataTypes.DATE,
    binding: DataTypes.STRING,
    status: {
      type: DataTypes.STRING,
      defaultValue: "active"
    }
  });

  Inbox.associate = function(models) {
    // Inbox -> House
    Inbox.belongsTo(models.House);

    // Inbox -> Problem
    Inbox.belongsToMany(models.Problem, {
      through: {
        model: models.ItemProblem,
        unique: false,
        scope: {
          problemable: 'inbox'
        }
      },
      foreignKey: 'problemable_id',
      constraints: false
    });

    // Inbox -> Depatment
    Inbox.belongsToMany(models.Depatment, {
      through: {
        model: models.ItemDepatment,
        unique: false,
        scope: {
          depatmentable: 'inbox'
        }
      },
      foreignKey: 'depatmentable_id',
      constraints: false
    });

    // Inbox -> ItemTask
    Inbox.hasMany(models.ItemTask, {
      foreignKey: 'taskable_id',
      scope: {
        taskable: 'inbox'
      },
      constraints: false
    });

    // Authority -> File
    Inbox.hasMany(models.File, {
      foreignKey: 'fileable_id',
      scope: {
        fileable: 'inbox'
      },
      constraints: false
    });
  }

  return Inbox;
};