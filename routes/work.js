
const models     = require('../models');
const Op         = models.sequelize.Op

const express    = require('express');
const formidable = require('formidable');
const fse        = require('fs-extra')
const mkdirp     = require('mkdirp-promise');
const Jimp       = require("jimp");
const getSlug    = require('speakingurl');
const moment     = require('moment');
const slash      = require('slash');
const router     = express.Router();

router.get('/', function(req, res) {

  const promiseArr = []

  promiseArr.push( models.Problem.findAll() );
  promiseArr.push( models.Schedule.findAll() );
  promiseArr.push( models.Authority.findAll() );
  promiseArr.push( models.Program.findAll() );
  promiseArr.push( models.Protocol.findAll() );


  Promise.all(promiseArr)
  .then(function([problems, schedules, authorities, programs, protocols]){

    res.render('work', {
      title: 'Список работ на 2017г.',
      problems,
      schedules,
      authorities,
      programs,
      protocols
    })

  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/authority/:id/house', function(req, res, next) {

  if(!req.body.houselist) {
    req.body.houselist = []
  }

  if(typeof req.body.houselist == 'string') {
    req.body.houselist = [req.body.houselist]
  }

  req.body.houselist = req.body.houselist.filter(Boolean);

  if(req.body.houselist.length){
    models.sequelize.transaction(function (t) {
      return models.Authority.findById(req.params.id, {transaction: t})
            .then(authority => {
              return authority.setHouses(req.body.houselist)
            })
    })
    .then(() => res.redirect('/work/authority/' + req.params.id))
    .catch((err) => next(new Error('Ошибки при добавлении в базу данных')))
  } else {
    next(new Error('Пустой список данных или неверные входные данные'))
  }

})


router.post('/authority', function(req, res, next) {

  models.sequelize.transaction(function (t) {

    return models.Authority.findOne({
      where: {
        name: req.body.nameauthority,
        date: new Date(req.body.dateauthority)
      }
    }, {transaction: t})
    .then(authority => {

      if (authority === null) {
        return models.Authority.create({
                name: req.body.nameauthority,
                date: req.body.dateauthority,
                location: req.body.locationauthority
              }, {transaction: t})
      }
      return Promise.reject(new Error('Данный запрос создан или неверные входные данные'))
    })

  })
  .then(() => res.redirect('/work'))
  .catch(err => { console.log(err.message); err.status = 404; next(err) })

});

router.get('/authority/:id', function(req, res, next) {

  const id = parseInt(req.params.id, 10)

  models.Authority.findById(id, { include: [{
    model: models.House, include: [{ model: models.ItemTask, include:['Inbox', 'Implementer', models.Problem,'TaskType', {model: models.File, include: [models.FileDescription]}]}]
  }]})
  .then(authority => {
    res.render('work/authority', {
      authority
    })
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});


router.post('/addoptions', function(req, res){

  var street = req.body.street
  var sector = req.body.sector

  if (street) {
    street = '%' + street + '%'
    console.log("street", street);
    models.House.findAll({
      where: {
        [Op.or]: [
          {
            name_rus: {
              [Op.like]: street
            }
          },
          {
            name_new_rus: {
              [Op.like]: street
            }
          }
        ]
      }
    })
    .then(houses => res.json(houses))
    .catch(err => res.status(404).json('Системная ошибка'))
  } else if (sector){
    models.House.findAll({
      where: {
        sector: sector
      }
    })
    .then(houses => res.json(houses))
    .catch(err => res.status(404).json('Системная ошибка'))
  } else {
    res.json({})
  }

});



module.exports = router;
