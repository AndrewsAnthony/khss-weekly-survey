const models  = require('../models');
const express = require('express');
const router  = express.Router();


router.get('/:id', function(req, res, next) {

  req.params.id = parseInt(req.params.id, '10')
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  function displayChief(chief){
    models.User.findAll({
      where: {
        ChiefId: chief.id
      },
      include: [
        models.Rule,
        {
          model: models.ItemTask,
          include: [
            models.House, models.Problem, 'Implementer', 'TaskType', 'Inbox',
            'Protocol', 'Information', 'Authority', 'Schedule', 'Program', 'Repair', {
            model: models.File,
            include: [models.FileDescription]
          }, 
          {
            model: models.NoteTask,
            include: [models.User]
          }]
        },
        {
          model: models.Depatment,
          include: [{
            model: models.Inbox,
            include: [models.House, models.Problem, {model: models.File, include: [models.FileDescription]}]
          }]
        }
      ]
    })
    .then(users => {
      res.render('user', {
        user: users.find(user => user.id == chief.id),
        users
      });
    })
    .catch(err => {
      console.log(err)
      next(err)
    })
  }

  function displayUser(user){
    
    models.User.findOne({
      where: {
        AuthorizationId: user.id
      },
      include: [
        models.Rule,
        {
          model: models.ItemTask,
          include: [models.House, models.Problem, 'Implementer', 'TaskType', 'Inbox',
      'Protocol', 'Information', 'Authority', 'Schedule', 'Program', 'Repair', {
          model: models.File,
          include: [models.FileDescription]
      }, {
        model: models.NoteTask,
        include: [models.User]
      }]
        },
        {
          model: models.Depatment,
          include: [{
            model: models.Inbox,
            include: [models.House, models.Problem, {model: models.File, include: [models.FileDescription]}]
          }]
        }
        ]}
    )
    .then(user => {
      res.render('user', {
        user
      });
    })
    .catch(err => {
      console.log(err)
      next(err)
    })
  }

  models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    }
  })
  .then(user => {
    
    if (req.params.id !== user.id)
      next(new Error('Перейдите в свой профайл'))
    else (user.id == user.ChiefId)
          ? displayChief(user)
          : displayUser(user)   
  })
  .catch(err => {
    console.log(err)
    next(err)
  })

})

module.exports = router