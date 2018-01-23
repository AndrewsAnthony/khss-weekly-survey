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

  const promiseArr = []

  promiseArr.push( models.Problem.findAll() );
  promiseArr.push( models.Schedule.findAll({ include: [{
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }] }) );
  promiseArr.push( models.Authority.findAll({ include: [{
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }] }) );
  promiseArr.push( models.Program.findAll({ include: [{
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }] }) );
  promiseArr.push( models.Protocol.findAll({ include: [{
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }] }) );
  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }) );


  Promise.all(promiseArr)
  .then(function([problems, schedules, authorities, programs, protocols, user]){

    res.render('work', {
      user,
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

//================== authority  ======================

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

router.get('/authority/:id/edit', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  const promiseArr = []

  promiseArr.push( models.Authority.findById(req.params.id) )
  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }));

  Promise.all(promiseArr)
  .then(function([authority, user]){
    authority
      ? res.render('edit/authority', { authority, user })
      : res.status(500).send('Отсутствует данный прием')
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/authority/:id/edit', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  models.sequelize.transaction(t => {
    return models.Authority.update({
      name: req.body.nameauthority,
      date: req.body.dateauthority,
      location: req.body.locationauthority,
      status: req.body.status
    }, {
      where: {
        id: req.params.id
      },
      limit: 1,
      returning: true,
      transaction: t
    })
  })
  .then(function(){
    res.redirect('/work/authority/' + req.params.id)
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки при записи')
  })

});

router.get('/authority/:id', function(req, res, next) {

  const id = parseInt(req.params.id, 10)

  Promise.all([
    models.Authority.findById(id, { include: [{
      model: models.House, include: [{ model: models.ItemTask, include:['Inbox','Authority','Program','Protocol','Schedule','Repair','Information','Implementer', models.Problem,'TaskType', {model: models.File, include: [models.FileDescription]},{model: models.NoteTask, order: [['createdAt','ASC']], include: [models.User]}]}]
    }]
    }),
    models.User.findOne({
      where: {
        AuthorizationId: req.user.id
      },
      include: [models.Rule]
    }),
    models.User.findAll({include: [models.Depatment] })
    ])
  .then(([authority, user, users]) => {
    res.render('work/authority', {
      authority,
      user,
      users
    })
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

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

//================== schedule    ======================

router.post('/schedule/:id/house', function(req, res, next) {

  if(!req.body.houselist) {
    req.body.houselist = []
  }

  if(typeof req.body.houselist == 'string') {
    req.body.houselist = [req.body.houselist]
  }

  req.body.houselist = req.body.houselist.filter(Boolean);

  if(req.body.houselist.length){
    models.sequelize.transaction(function (t) {
      return models.Schedule.findById(req.params.id, {transaction: t})
            .then(schedule => {
              return schedule.setHouses(req.body.houselist)
            })
    })
    .then(() => res.redirect('/work/schedule/' + req.params.id))
    .catch((err) => next(new Error('Ошибки при добавлении в базу данных')))
  } else {
    next(new Error('Пустой список данных или неверные входные данные'))
  }

})

router.get('/schedule/:id/edit', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  const promiseArr = []

  promiseArr.push( models.Schedule.findById(req.params.id) )
  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }));

  Promise.all(promiseArr)
  .then(function([schedule, user]){
    schedule
      ? res.render('edit/schedule', { schedule, user })
      : res.status(500).send('Отсутствует данный прием')
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/schedule/:id/edit', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  models.sequelize.transaction(t => {
    return models.Schedule.update({
      title: req.body.titleschedule,
      year: req.body.yearschedule,
      status: req.body.status
    }, {
      where: {
        id: req.params.id
      },
      limit: 1,
      returning: true,
      transaction: t
    })
  })
  .then(function(){
    res.redirect('/work/schedule/' + req.params.id)
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки при записи')
  })

});

router.get('/schedule/:id', function(req, res, next) {

  const id = parseInt(req.params.id, 10)

  Promise.all([
    models.Schedule.findById(id, { include: [{
      model: models.House, include: [{ model: models.ItemTask, include:['Inbox','Authority','Program','Protocol','Schedule','Repair','Information','Implementer', models.Problem,'TaskType', {model: models.File, include: [models.FileDescription]},{model: models.NoteTask, order: [['createdAt','ASC']], include: [models.User]}]}]
    }]
    }),
    models.User.findOne({
      where: {
        AuthorizationId: req.user.id
      },
      include: [models.Rule]
    })
    ])
  .then(([schedule, user]) => {
    res.render('work/schedule', {
      schedule,
      user
    })
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/schedule', function(req, res, next) {

  models.sequelize.transaction(function (t) {

    return models.Schedule.findOne({
      where: {
        title: req.body.titleschedule
      }
    }, {transaction: t})
    .then(schedule => {

      if (schedule === null) {
        return models.Schedule.create({
                title: req.body.titleschedule,
                year: req.body.yearschedule
              }, {transaction: t})
      }
      return Promise.reject(new Error('Данный запрос создан или неверные входные данные'))
    })

  })
  .then(() => res.redirect('/work'))
  .catch(err => { console.log(err.message); err.status = 404; next(err) })

});


//================== protocol    ======================

router.post('/protocol/:id/house', function(req, res, next) {

  if(!req.body.houselist) {
    req.body.houselist = []
  }

  if(typeof req.body.houselist == 'string') {
    req.body.houselist = [req.body.houselist]
  }

  req.body.houselist = req.body.houselist.filter(Boolean);

  if(req.body.houselist.length){
    models.sequelize.transaction(function (t) {
      return models.Protocol.findById(req.params.id, {transaction: t})
            .then(protocol => {
              return protocol.setHouses(req.body.houselist)
            })
    })
    .then(() => res.redirect('/work/protocol/' + req.params.id))
    .catch((err) => next(new Error('Ошибки при добавлении в базу данных')))
  } else {
    next(new Error('Пустой список данных или неверные входные данные'))
  }

})

router.get('/protocol/:id/edit', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  const promiseArr = []

  promiseArr.push( models.Protocol.findById(req.params.id) )
  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }));

  Promise.all(promiseArr)
  .then(function([protocol, user]){
    protocol
      ? res.render('edit/protocol', { protocol, user })
      : res.status(500).send('Отсутствует данный прием')
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/protocol/:id/edit', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  models.sequelize.transaction(t => {
    return models.Protocol.update({
      title: req.body.titleprotocol,
      date: req.body.dateprotocol,
      location: req.body.locationprotocol,
      status: req.body.status
    }, {
      where: {
        id: req.params.id
      },
      limit: 1,
      returning: true,
      transaction: t
    })
  })
  .then(function(){
    res.redirect('/work/protocol/' + req.params.id)
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки при записи')
  })

});

router.get('/protocol/:id', function(req, res, next) {

  const id = parseInt(req.params.id, 10)

  Promise.all([
    models.Protocol.findById(id, { include: [{
      model: models.House, include: [{ model: models.ItemTask, include:['Inbox','Authority','Program','Protocol','Schedule','Repair','Information','Implementer', models.Problem,'TaskType', {model: models.File, include: [models.FileDescription]},{model: models.NoteTask, order: [['createdAt','ASC']], include: [models.User]}]}]
    }]
    }),
    models.User.findOne({
      where: {
        AuthorizationId: req.user.id
      },
      include: [models.Rule]
    })
    ])
  .then(([protocol, user]) => {
    res.render('work/protocol', {
      protocol,
      user
    })
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/protocol', function(req, res, next) {

  models.sequelize.transaction(function (t) {

    return models.Protocol.findOne({
      where: {
        title: req.body.titleprotocol,
        date: new Date(req.body.dateprotocol)
      }
    }, {transaction: t})
    .then(protocol => {

      if (protocol === null) {
        return models.Protocol.create({
                title: req.body.titleprotocol,
                date: req.body.dateprotocol,
                location: req.body.locationprotocol
              }, {transaction: t})
      }
      return Promise.reject(new Error('Данный запрос создан или неверные входные данные'))
    })

  })
  .then(() => res.redirect('/work'))
  .catch(err => { console.log(err.message); err.status = 404; next(err) })

});


//================== program      ======================

router.post('/program/:id/house', function(req, res, next) {

  if(!req.body.houselist) {
    req.body.houselist = []
  }

  if(typeof req.body.houselist == 'string') {
    req.body.houselist = [req.body.houselist]
  }

  req.body.houselist = req.body.houselist.filter(Boolean);

  if(req.body.houselist.length){
    models.sequelize.transaction(function (t) {
      return models.Program.findById(req.params.id, {transaction: t})
            .then(program => {
              return program.setHouses(req.body.houselist)
            })
    })
    .then(() => res.redirect('/work/program/' + req.params.id))
    .catch((err) => next(new Error('Ошибки при добавлении в базу данных')))
  } else {
    next(new Error('Пустой список данных или неверные входные данные'))
  }

})

router.get('/program/:id/edit', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  const promiseArr = []

  promiseArr.push( models.Program.findById(req.params.id) )
  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }));

  Promise.all(promiseArr)
  .then(function([program, user]){
    program
      ? res.render('edit/program', { program, user })
      : res.status(500).send('Отсутствует данный прием')
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/program/:id/edit', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
    return;
  }

  models.sequelize.transaction(t => {
    return models.Program.update({
      title: req.body.titleprogram,
      year: req.body.yearprogram,
      status: req.body.status
    }, {
      where: {
        id: req.params.id
      },
      limit: 1,
      returning: true,
      transaction: t
    })
  })
  .then(function(){
    res.redirect('/work/program/' + req.params.id)
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки при записи')
  })

});

router.get('/program/:id', function(req, res, next) {

  const id = parseInt(req.params.id, 10)

  Promise.all([
    models.Program.findById(id, { include: [{
      model: models.House, include: [{ model: models.ItemTask, include:['Inbox','Authority','Program','Protocol','Schedule','Repair','Information','Implementer', models.Problem,'TaskType', {model: models.File, include: [models.FileDescription]},{model: models.NoteTask, order: [['createdAt','ASC']], include: [models.User]}]}]
    }]
    }),
    models.User.findOne({
      where: {
        AuthorizationId: req.user.id
      },
      include: [models.Rule]
    })
    ])
  .then(([program, user]) => {
    res.render('work/program', {
      program,
      user
    })
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/program', function(req, res, next) {

  models.sequelize.transaction(function (t) {

    return models.Program.findOne({
      where: {
        title: req.body.titleprogram,
        year: new Date(req.body.yearprogram)
      }
    }, {transaction: t})
    .then(program => {

      if (program === null) {
        return models.Program.create({
                title: req.body.titleprogram,
                year: req.body.yearprogram
              }, {transaction: t})
      }
      return Promise.reject(new Error('Данный запрос создан или неверные входные данные'))
    })

  })
  .then(() => res.redirect('/work'))
  .catch(err => { console.log(err.message); err.status = 404; next(err) })

});

//================== addoptions   ======================

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

//================== uploadfiles   ======================

router.post('/file/upload', function(req, res) {

  var form = new formidable.IncomingForm();

  form.multiples = false;
  form.uploadDir = path.join(__dirname, '../uploadfiles');

  form.parse(req, function(err, fields, files){

    if( err ){
      console.log(err);
      res.json({error: `Файл не загрузился. Проблемы при загрузки файла,
       обратитесь к администратору`})
      return;
    }

    if ( fields && files.inputfile ) {

      var dbUploadDir = path.join(
          fields.object
        , fields.file
      );
      var fileUploadDir = path.join(__dirname, '../public', 'upload-official', dbUploadDir)
      var filePath = files.inputfile.path;
      var nameFile = moment().format('YYYY-MM-DD') + '_' + files.inputfile.path.substr(-32) + path.extname(files.inputfile.name)
      var newFilePath = path.join(fileUploadDir, nameFile);

      if (fields.file == 'photo') {

        fse.ensureDir(fileUploadDir)
        .then(() => fse.move(filePath, newFilePath))
        .then(() => fse.ensureDir(path.join(fileUploadDir,'thumbnails')))
        .then(() => Jimp.read(newFilePath))
        .then((currentFile) => {
            return currentFile
                  .resize(420, Jimp.AUTO)
                  .write(path.join(fileUploadDir,'thumbnails', nameFile));
        })
        .then(() => {

          return models.FileDescription.findOrCreate({
            where: {
              description: fields.filedescription,
              note: fields.filenote,
              name: fields.filename
            }
          })
          .spread((filedescription, created) => {
            return filedescription.createFile({
              path: slash(path.join(dbUploadDir, nameFile)),
              thumbnail: slash(path.join(dbUploadDir,'thumbnails', nameFile)),
              type: fields.file,
              fileable: fields.object,
              fileable_id: fields.objectid
            })
            .then(() => {
              if (fields.object == 'task'){
                return models.ItemTask
                      .update({status: 'add'}, {where: {id: fields.objectid}})
                      .catch(err => {
                        console.log(err)
                        res.json({error: `Проблемы при загрузки файла,
                         обратитесь к администратору`})
                      })
              }
              else {
                return Promise.resolve()
              }
            })
            .catch(err => {
              console.log(err)
              res.json({error: `Проблемы при загрузки файла,
               обратитесь к администратору`})
            })
          })
          .then(() => res.json({}))
          .catch(err => {
            console.log(err)
            res.json({error: `Проблемы при загрузки файла,
             обратитесь к администратору`})
          })
        })
        .catch(err => {
          console.log(err)
          res.json({error: `Проблемы при загрузки файла,
           обратитесь к администратору`})
        })

      } else if (fields.file == 'document') {

        fse.ensureDir(fileUploadDir)
        .then(() => fse.move(filePath, newFilePath))
        .then(() => {

          return models.FileDescription.findOrCreate({
            where: {
              description: fields.filedescription,
              note: fields.filenote,
              name: fields.filename
            }
          })
          .spread((filedescription, created) => {
            return filedescription.createFile({
              path: slash(path.join(dbUploadDir, nameFile)),
              thumbnail: '',
              type: fields.file,
              fileable: fields.object,
              fileable_id: fields.objectid
            })
          })
          .then(() => res.json({}))
          .catch(err => {
            console.log(err)
            res.json({error: `Проблемы при загрузки файла,
             обратитесь к администратору`})
          })

        })
      }

    } else {
      res.json({error: `Файл при загрузки не содержит дополнительных полей,
       обратитесь к администратору`})
    }

  })

})

router.post('/task/list', function(req, res, next) {

  if (!(req.body.houselist && req.body.houselist.length) || isNaN(parseInt(req.body.usertask, 10)) || !req.body.termtask) {
    var err = new Error('Пустые входные данные')
    err.status = 404
    next( err )
    return;
  }

  if (typeof req.body.houselist == 'string') {
    req.body.houselist = [req.body.houselist]
  }

  models.Task.findOne({
    where: {
      name: 'photoreport-type',
      type: req.body.modeltype + '-photoreport'
    },
    attributes: ['id']
  })
  .then(tasktype => {
    if(tasktype) {
      return models.sequelize.transaction(function (t) {

            return models.sequelize.Promise.map(req.body.houselist, function(house) {

                    return  models.ItemTask.create({
                              taskable: req.body.modeltype,
                              taskable_id: req.body.modelid,
                              term: req.body.termtask,
                              HouseId: house,
                              TaskTypeId: tasktype.id,
                              ImplementerId: req.body.usertask
                            }, { transaction: t })

                  })

      })
      .then(() => res.redirect(`/work/${req.body.modeltype}/${req.body.modelid}`))
      .catch(err => { console.log(err.message); err.status = 404; next(err) })

    }

  })
  .catch(err => { console.log(err.message); err.status = 404; next(err) })

});



module.exports = router;
