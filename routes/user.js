const models     = require('../models');
const express    = require('express');
const router     = express.Router();


router.get('/:id', function(req, res, next) {

  req.params.id = parseInt(req.params.id, '10')
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }
  const promiseArr = [];

  if ( req.user.id == req.params.id ) {

    models.User.findById(req.user.id, {include: [
      models.Rule,
      {
        model: models.ItemTask,
        include: [models.House, models.Problem, 'Implementer', 'TaskType', 'Inbox',
    'Protocol', 'Information', 'Authority', 'Schedule', 'Program', 'Repair', {
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }, {
      model: models.NoteTask,
      order: [['createdAt','ASC']],
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

  } else {
    res.redirect('/')
  }

})

module.exports = router