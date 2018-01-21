const models     = require('../models');
const Op         = models.sequelize.Op;
const express    = require('express');
const path       = require('path');
const formidable = require('formidable');
const fse        = require('fs-extra');
const mkdirp     = require('mkdirp-promise');
const Jimp       = require("jimp");
const getSlug    = require('speakingurl');
const moment     = require('moment');
const slash      = require('slash');
const router     = express.Router();


//================== main         ======================

router.get('/', function(req, res) {

});

//================== authority  ======================


router.get('/authority/:id/', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  const promiseArr = []
                                                                                                                  
  promiseArr.push( 
    models.Authority.findById(
        req.params.id
      , { include: [ { model: models.FieldTable } ] }
    )
  )

  promiseArr.push( 
    models.Authority.findById(
        req.params.id
      , { include:
            [ { model: models.House
            , include:
                [ { model: models.ValueTable 
                , include: [  models.FieldTable ] } ]
            } ] }
    )
  )

  promiseArr.push(
    models.User.findOne({
      where: {
        AuthorizationId: req.user.id
      },
      include: [models.Rule]
    })
  )

  Promise.all(promiseArr)
  .then(function([authorityFiels, authorityValueHouse, user]){
    res.render('table/table', { authorityValueHouse, authorityFiels, user })
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});


//================== field  ======================

router.post('/field/add', function(req, res, next) {

  if (req.body.id !== 'add') {
    res.status(404).json( { error: 'Вы не создаете поле' } )
    return;
  }

  models.sequelize.transaction(function (t) {

    return models.FieldTable.create({
            fieldable: req.body.model,
            fieldable_id: req.body.modelid,
            status: 'add',
            name: getSlug( req.body.title , {lang: 'ru'} ),
            type: req.body.type,
            title: req.body.title,
            description: req.body.description
          }, {transaction: t})  
  
  })
  .then((field) => res.json(field))
  .catch(err => { console.log(err.message); err.status = 404; next(err) })

});

router.post('/field/change', function(req, res, next) {

  models.sequelize.transaction(function (t) {

    return models.FieldTable.update({
            name: getSlug( req.body.title , {lang: 'ru'} ),
            type: req.body.type,
            title: req.body.title,
            description: req.body.description
           }, { where: {id: req.body.id}
             , transaction: t
             , limit: 1
             , field: ['name', 'type', 'title', 'description'] })
           .then(() => {
             return models.FieldTable.findById(req.body.id, { transaction: t })
           }) 
  
  })
  .then((field) => res.json(field))
  .catch(err => { console.log(err.message); err.status = 404; next(err) })

});

router.post('/field/delete', function(req, res, next) {

  models.sequelize.transaction(function (t) {

    return models.FieldTable.update({
              status: ((req.body.status == 'delete') ? 'change' : 'delete')
             }, { where: {id: req.body.id}
               , transaction: t
               , limit: 1
               , field: ['status'] })
             .then(() => {
               return models.FieldTable.findById(req.body.id, { transaction: t })
             }) 

  })
  .then((field) => res.json(field))
  .catch(err => { console.log(err.message); err.status = 404; next(err) })

});

//================== value  ======================

router.post('/value', function(req, res, next) {

  const houseid = parseInt(req.body.houseid, 10);
  const pairs = R.compose(R.map(arr => {arr[0] = arr[0].slice(9); return arr}), R.toPairs, R.omit(['houseid']))(req.body);

  let userid = null;

  

  if (isNaN(houseid) && pairs.length) {
    res.status(404).json( { error: 'Отсутсвуют входные данные' } )
    return;
  }

  models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    attributes: ['id']
  })
  .then(user => {
    
    return models.sequelize.transaction(function (t) {
  
            return models.sequelize.Promise.map(pairs, function(field) {    
                console.log("field - value", field[1]);

                    return models.ValueTable.findOrCreate({ where: {
                            FieldTableId: field[0],
                            HouseId: houseid
                          }, transaction: t })
                          .spread((fields, created) => {
                            
                            if(created) {
                              fields.value = field[1];
                              return fields.save({ transaction: t })
                                      .then(() => {
                                          return models.HistoryTable.create({
                                            oldvalue: moment().format('YYYY-MM-DD hh:mm:ss'),
                                            status: 'add',
                                            ValueTableId: fields.id,
                                            UserId: user.id
                                          }, { transaction: t })
                                      })
                            }
                            
                            else { 
                              
                              if (fields.value == field[1]) {
                                return Promise.resolve()
                              }

                              fields.value = field[1];
                              fields.status = 'change';

                              return fields.save({ transaction: t })
                                      .then(() => {
                                          return models.HistoryTable.create({
                                          oldvalue: fields.value,
                                          status: 'change',
                                          ValueTableId: fields.id,
                                          UserId: user.id
                                        }, { transaction: t })
                                      })
                            }
                            
                          })
              
                  })

  })
  .then(() => res.json(req.body))
  .catch(err => { console.log(err.message); err.status = 404; next(err) })



  })

  


});


module.exports = router;