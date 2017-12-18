const models     = require('../models');
const express    = require('express');
const router     = express.Router();


router.get('/', function(req, res, next) {

  models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  })
  .then((user) => {
    res.render('index', {
      title: 'Любить Харьков – работать для людей',
      user
    });
  })
  .catch(err => {
    console.log(err)
    next(err)
  })

})

module.exports = router