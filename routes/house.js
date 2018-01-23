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
const diff       = require('deep-diff').diff;
const router     = express.Router();


router.post('/typeahead', function(req, res) {

  var address = req.body.address.split(/[^\wа-яА-Я]+/);
  var street = address.shift()
  var number = address.shift()
  if (street && number) {
    models.House.findAll({
      where: {
        [Op.or]: [
          {
            [Op.and]: [
              {
                name_rus: {
                  [Op.like]: `%${street}%`
                }
              },
              {
                building: {
                  [Op.like]: `%${number}%`
                }
              }
            ]
          },
          {
            [Op.and]: [
              {
                name_new_rus: {
                  [Op.like]: `%${street}%`
                }
              },
              {
                building: {
                  [Op.like]: `%${number}%`
                }
              }
            ]
          }
        ]

      }
    })
    .then(function(house) {
      res.json(house)
    })
    .catch(function(err){
      console.log(err)
      res.json("Ошибки при проверке адреса на сервере");
    });
  } else {
    res.status(404).json("Ошибки при проверке адреса на сервере");
  }

})

router.get('/check/inbox', function(req, res) {
  var numberInbox = req.query.numberInbox;

  if (numberInbox) {
    models.Inbox.findOne({
      where: {
        number: numberInbox
      },
      include: [models.House]
    })
    .then(function(inbox) {
      if (inbox) {
        res.json(`Данный номер уже содержится в базе данных по адресу
          <a href='/house/${inbox.House.id}'>
          ${inbox.House.street}, ${inbox.House.number}
          </a>`);
      } else {
        res.json(true);
      }
    })
    .catch(function(err){
      console.log(err)
      res.json("Ошибки при проверке адреса на сервере");
    });
  } else {
    res.redirect('/')
  }

})

router.get('/:id', function(req, res, next) {
  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    var err = new Error('Неверный запрос на сервер');
    err.status = 404;
    next(err)
    return;
  }
  const promiseArr = []

  promiseArr.push(
    models.House.findById(
      req.params.id
      , { include: 
          [ { model: models.Program
          , where: { [Op.or]: [{ status: 'active' }, { status: 'add' }] }
          , required: false }
          , { model: models.Schedule
          , where: { [Op.or]: [{ status: 'active' }, { status: 'add' }] }
          , required: false }
          , { model: models.Authority
          , where: { [Op.or]: [{ status: 'active' }, { status: 'add' }] }
          , required: false }
          , { model: models.Protocol
          , where: { [Op.or]: [{ status: 'active' }, { status: 'add' }] }
          , required: false } ] }
    )
  );

  promiseArr.push( models.Depatment.findAll({ attributes: ['id','name'] }) );
  promiseArr.push( models.User.findAll({include: [models.Depatment] }) );
  promiseArr.push( models.Problem.findAll() );
  promiseArr.push( models.Inbox.findAll({ where: { HouseId: req.params.id },
    include: [models.Problem, models.Depatment, {
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }] }) );
  promiseArr.push( models.ItemTask.findAll({ where: { HouseId: req.params.id },
    include: [models.Problem, 'Implementer', 'TaskType', 'Inbox',
    'Protocol', 'Information', 'Authority',  'Schedule', 'Program', 'Repair',  {
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }, {
      model: models.NoteTask,
      order: [['createdAt','ASC']],
      include: [models.User]
    }] }) );
  promiseArr.push( models.Schedule.findAll({ where: { [Op.or]: [{status: 'active'}, {status: 'add'}] } }) );
  promiseArr.push( models.Program.findAll({ where: { [Op.or]: [{status: 'active'}, {status: 'add'}] } }) );
  promiseArr.push( models.Authority.findAll({ where: { [Op.or]: [{status: 'active'}, {status: 'add'}] } }) );
  promiseArr.push( models.Information.findAll() );
  promiseArr.push( models.Protocol.findAll({ where: { [Op.or]: [{status: 'active'}, {status: 'add'}] } }) );
  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }));


  Promise.all(promiseArr)
  .then(function([house, depatments, users, problems, inboxs, itemtasks, schedule, program, authority, information, protocol, user]){
    if (!house) {
      throw Error('Отсутствует адрес в базе данных')
    }
    res.render('house', {
      user,
      house,
      inboxs,
      users,
      depatments,
      problems,
      itemtasks,
      tasktypes: {schedule, program, authority, information, protocol, inboxs}
    })

  })
  .catch(function(err){
    err.status = 404
    next(err)
  })

});

router.get('/', function(req, res, next) {

  Promise.all([models.House.findAll({ offset: 6500, limit: 25 }), models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  })])
  .then(function([houses, user]) {
    res.render('lastcontent', {
      user,
      houses,
      title: 'Список домов'
    });
  })
  .catch(function(err){
    console.log(err)
    next()
  });

});

router.post('/:id/inbox/', function(req, res, next) {

  models.sequelize.transaction(function(t){

    return models.User.findOne({
            where: {
              AuthorizationId: req.user.id
            },
            attributes: ['id'],
            transaction: t
          })
          .then(user => {

                return models.Inbox.create({
                        number: req.body.numberInbox,
                        inboxdate: req.body.dateInbox,
                        term: req.body.termInbox,
                        binding: req.body.bindingInbox
                      }, { transaction: t })
                .then((inbox) => {

                      return inbox.setHouse(req.params.id, { transaction: t })
                            .then((house) => {

                              return inbox.setDepatments(req.body.depatment, { transaction: t })
                                    .then((depatments) => {
                                      if ( !req.body.problem ) {

                                        return models.HistoryStatus.create({
                                                statusable: 'inbox',
                                                statusable_id: inbox.id,
                                                description: 'Добавлено Входящие',
                                                status: 'add',
                                                jsondata: JSON.stringify(inbox),
                                                dependence: null,
                                                dependence_id: null,
                                                UserId: user.id
                                              });
                                      }

                                      return inbox.setProblems(req.body.problem, { transaction: t })
                                            .then(() => {

                                                return models.HistoryStatus.create({
                                                        statusable: 'inbox',
                                                        statusable_id: inbox.id,
                                                        description: 'Добавлено Входящие',
                                                        status: 'add',
                                                        jsondata: JSON.stringify(inbox),
                                                        dependence: null,
                                                        dependence_id: null,
                                                        UserId: user.id
                                                      });
            })
          })
        })
      })
    })


  })
  .then(() => {
    res.redirect('/house/' + req.params.id)
  })
  .catch(err => {
    err.message = 'Проблемы при добавлении в базу данных'
    err.status(500)
    next(err)
  })

});

router.post('/task/note', function(req, res, next) {

  if (req.body.notetext.length == 0) {
    var err = new Error('Отправлена пустая запись');
    err.status = 500;
    next(err)
    return;
  }

  return models.sequelize.transaction(t => {

        return models.User.findOne({
                where: {
                  AuthorizationId: req.user.id
                },
                attributes: ['id'],
                transaction: t
              })
              .then(user => {

                if (!user) {
                  return Promise.reject(new Error('Отсутствует пользователь в базе данных'))
                }

                return models.ItemTask.update({status: 'add'}, {
                        where: {
                          id: req.body.hiddentaskid
                        }, transaction: t })
                      .then((task) => {

                        if (!task) {
                          return Promise.reject(new Error('Отсутствует задача в базе данных'))
                        }

                        return models.NoteTask.create({
                                text: req.body.notetext,
                                ItemTaskId: req.body.hiddentaskid,
                                UserId: user.id
                              }, { transaction: t })
                                .then(notetask => {

                                    if (!notetask) {
                                      return Promise.reject(new Error('Проблемы при сохранении заметки'))
                                    }

                                    return models.HistoryStatus.create({
                                            statusable: 'task',
                                            statusable_id: req.body.hiddentaskid,
                                            description: 'Добавлена заметка до задачи',
                                            status: 'extra',
                                            jsondata: JSON.stringify(notetask),
                                            dependence: 'notetask',
                                            dependence_id: notetask.id,
                                            UserId: user.id
                                          }, { transaction: t })

                                })

                      })

              })

  })
  .then(() => res.redirect(/house/ + req.body.hiddenhouseid))
  .catch(err => {
    err.message = 'Проблемы при обработки запроса';
    err.status = 500;
    next(err)
  })

})

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

      models.House.findById(fields.objecthouse)
      .then(house => {

        if (!house) {
          return Promise.reject(new Error('Дополнительные переданные данные отсутствуют на сервере'))
        }

        var dbUploadDir = path.join(
            getSlug(`${house.street_rus} ${house.name_rus} ${house.building}`, {lang: 'ru'})
          , fields.object
          , fields.file
        );
        var fileUploadDir = path.join(__dirname, '../public', 'upload', dbUploadDir)
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

            return models.sequelize.transaction(t => {

              return models.User.findOne({
                      where: {
                        AuthorizationId: req.user.id
                      },
                      attributes: ['id'],
                      transaction: t
                    })
                    .then(user => {

                        return models.FileDescription.findOrCreate({
                                where: {
                                  description: fields.filedescription,
                                  note: fields.filenote,
                                  name: fields.filename
                                },  transaction: t })
                              .spread((filedescription, created) => {

                                  return filedescription.createFile({
                                    path: slash(path.join(dbUploadDir, nameFile)),
                                    thumbnail: slash(path.join(dbUploadDir,'thumbnails', nameFile)),
                                    type: fields.file,
                                    fileable: fields.object,
                                    fileable_id: fields.objectid
                                  }, { transaction: t })
                                  .then((file) => {
                                    if (fields.object == 'task'){

                                      return models.ItemTask
                                            .update({status: 'add'}, {where: {id: fields.objectid} , transaction: t })
                                            .then(() => {

                                              return models.HistoryStatus.create({
                                                        statusable: 'task',
                                                        statusable_id: fields.objectid,
                                                        description: 'Добавлена фотография до задачи',
                                                        jsondata: JSON.stringify(file),
                                                        status: 'extra',
                                                        dependence: 'file',
                                                        dependence_id: file.id,
                                                        UserId: user.id
                                                      },{ transaction: t })


                                            })
                                    }
                                    else {

                                      return models.HistoryStatus.create({
                                              statusable: 'inbox',
                                              statusable_id: fields.objectid,
                                              description: 'Добавлена фотография до вхоящего',
                                              jsondata: JSON.stringify(file),
                                              status: 'extra',
                                              dependence: 'file',
                                              dependence_id: file.id,
                                              UserId: user.id
                                            },{ transaction: t })

                                    }
                  })
                })
              })

            })

          })
          .then(() => res.json({}))
          .catch(err => {
            console.log(err)
            res.json({error: `Проблемы при загрузки файла,
             обратитесь к администратору`})
          })
        } else if (fields.file == 'document') {

          fse.ensureDir(fileUploadDir)
          .then(() => fse.move(filePath, newFilePath))
          .then(() => {

            return models.sequelize.transaction(t => {

              return models.User.findOne({
                      where: {
                        AuthorizationId: req.user.id
                      },
                      attributes: ['id'],
                      transaction: t
                    })
                    .then(user => {

                      return models.FileDescription.findOrCreate({
                                where: {
                                  description: fields.filedescription,
                                  note: fields.filenote,
                                  name: fields.filename
                                }, transaction: t })
                              .spread((filedescription, created) => {

                                    return filedescription.createFile({
                                              path: slash(path.join(dbUploadDir, nameFile)),
                                              thumbnail: '',
                                              type: fields.file,
                                              fileable: fields.object,
                                              fileable_id: fields.objectid
                                            }, { transaction: t })
                                            .then((file) => {
                                                if (fields.object == 'task'){

                                                  return models.ItemTask
                                                        .update({status: 'add'}, {where: {id: fields.objectid} , transaction: t })
                                                        .then(() => {

                                                          return models.HistoryStatus.create({
                                                                    statusable: 'task',
                                                                    statusable_id: fields.objectid,
                                                                    description: 'Добавлена документ до задачи',
                                                                    jsondata: JSON.stringify(file),
                                                                    status: 'extra',
                                                                    dependence: 'file',
                                                                    dependence_id: file.id,
                                                                    UserId: user.id
                                                                  },{ transaction: t })


                                                        })
                                                }
                                                else {

                                                  return models.HistoryStatus.create({
                                                          statusable: 'inbox',
                                                          statusable_id: fields.objectid,
                                                          description: 'Добавлен документ до вхоящего',
                                                          jsondata: JSON.stringify(file),
                                                          status: 'extra',
                                                          dependence: 'file',
                                                          dependence_id: file.id,
                                                          UserId: user.id
                                                        },{ transaction: t })

                                                }


                  })
                })
              })

            })

          })
          .then(() => res.json({}))
          .catch(err => {
            console.log(err)
            res.json({error: `Проблемы при загрузки файла,
             обратитесь к администратору`})
          })
        }

      })


    } else {
      res.json({error: `Файл при загрузки не содержит дополнительных полей,
       обратитесь к администратору`})
    }
  })

})

router.post('/:id/task/', function(req, res, next) {

  models.sequelize.transaction(function(t){

        return models.User.findOne({
          where: {
            AuthorizationId: req.user.id
          },
          attributes: ['id'],
          transaction: t
        })
        .then(user => {

                return models.Task.findOne({
                    where: {
                      name: req.body.maintask,
                      type: (req.body.maintask.split('-')[0] == 'information')
                            ? 'info-information'
                            : req.body[req.body.maintask.replace('-','')]
                    }, transaction: t })
                        .then(tasktype => {

                          if (tasktype.model == 'information') {

                            return models.Information.create({
                                description: (req.body.maintask.split('-')[0] == 'information')
                                            ? req.body[tasktype.type.replace('-','')]
                                            : req.body[req.body[req.body.maintask.replace('-','')].replace('-','')],
                                source: tasktype.name.split('-')[0]
                              }, { transaction: t })
                              .then(info => {

                                  return  models.ItemTask.create({
                                    taskable: tasktype.model,
                                    taskable_id: info.id,
                                    term: req.body.termtask,
                                    binding: req.body.bindingtask,
                                    HouseId: req.params.id,
                                    TaskTypeId: tasktype.id,
                                    ImplementerId: req.body.usertask
                                  }, { transaction: t })
                                  .then(itemtask => {

                                        if (req.body.problemtask) {

                                          return itemtask.setProblems(req.body.problemtask, { transaction: t })
                                                  .then(problems => {

                                                    return models.HistoryStatus.create({
                                                        statusable: tasktype.model,
                                                        statusable_id: info.id,
                                                        description: `Добавлена задача - ${tasktype.description}`,
                                                        status: 'extra',
                                                        jsondata: JSON.stringify(itemtask),
                                                        dependence: 'itemtask',
                                                        dependence_id: itemtask.id,
                                                        UserId: user.id
                                                      }, { transaction: t })
                                                      .then(() => {

                                                          return models.HistoryStatus.create({
                                                                statusable: 'task',
                                                                statusable_id: itemtask.id,
                                                                description: 'Задача создана',
                                                                status: 'add',
                                                                jsondata: JSON.stringify(itemtask),
                                                                dependence: null,
                                                                dependence_id: null,
                                                                UserId: user.id
                                                              }, { transaction: t })

                                                      })

                                                  })

                                        }

                                         return models.HistoryStatus.create({
                                                  statusable: tasktype.model,
                                                  statusable_id: info.id,
                                                  description: `Добавлена задача - ${tasktype.description}`,
                                                  status: 'extra',
                                                  jsondata: JSON.stringify(itemtask),
                                                  dependence: 'itemtask',
                                                  dependence_id: itemtask.id,
                                                  UserId: user.id
                                                }, { transaction: t })
                                                .then(() => {

                                                    return models.HistoryStatus.create({
                                                          statusable: 'task',
                                                          statusable_id: itemtask.id,
                                                          description: 'Задача создана',
                                                          status: 'add',
                                                          jsondata: JSON.stringify(itemtask),
                                                          dependence: null,
                                                          dependence_id: null,
                                                          UserId: user.id
                                                        }, { transaction: t })

                                                })

                              })

                          })

                        }

                          return  models.ItemTask.create({
                                    taskable: tasktype.model,
                                    taskable_id: req.body[tasktype.type.replace('-','')],
                                    term: req.body.termtask,
                                    binding: req.body.bindingtask,
                                    HouseId: req.params.id,
                                    TaskTypeId: tasktype.id,
                                    ImplementerId: req.body.usertask
                                  }, { transaction: t })
                                  .then(itemtask => {

                                        if (req.body.problemtask) {

                                          return itemtask.setProblems(req.body.problemtask, { transaction: t })
                                                  .then(problems => {

                                                    return models.HistoryStatus.create({
                                                        statusable: tasktype.model,
                                                        statusable_id: req.body[tasktype.type.replace('-','')],
                                                        description: `Добавлена задача - ${tasktype.description}`,
                                                        status: 'extra',
                                                        jsondata: JSON.stringify(itemtask),
                                                        dependence: 'itemtask',
                                                        dependence_id: itemtask.id,
                                                        UserId: user.id
                                                      }, { transaction: t })
                                                      .then(() => {

                                                          return models.HistoryStatus.create({
                                                                statusable: 'task',
                                                                statusable_id: itemtask.id,
                                                                description: 'Задача создана',
                                                                status: 'add',
                                                                jsondata: JSON.stringify(itemtask),
                                                                dependence: null,
                                                                dependence_id: null,
                                                                UserId: user.id
                                                              }, { transaction: t })

                                                      })

                                                  })

                                        }

                                        return models.HistoryStatus.create({
                                                statusable: tasktype.model,
                                                statusable_id: req.body[tasktype.type.replace('-','')],
                                                description: `Добавлена задача - ${tasktype.description}`,
                                                status: 'extra',
                                                jsondata: JSON.stringify(itemtask),
                                                dependence: 'itemtask',
                                                dependence_id: itemtask.id,
                                                UserId: user.id
                                              }, { transaction: t })
                                              .then(() => {

                                                  return models.HistoryStatus.create({
                                                        statusable: 'task',
                                                        statusable_id: itemtask.id,
                                                        description: 'Задача создана',
                                                        status: 'add',
                                                        jsondata: JSON.stringify(itemtask),
                                                        dependence: null,
                                                        dependence_id: null,
                                                        UserId: user.id
                                                      }, { transaction: t })

                                                })

                                  })
                        })

        })

  })
  .then(() =>{
    res.redirect('/house/' + req.params.id)
  })
  .catch( err => {
    console.log("err", err);
    err.message = 'Ошибка при обработке данных'
    err.status(500)
    next(err)
  })

});

router.get('/inbox/:id/edit/', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    var err = new Error('Неверный запрос на сервер')
    err.status(404)
    next(err)
    return;
  }

  const promiseArr = []

  promiseArr.push( models.Inbox.findById(req.params.id, { include: [models.Problem, models.Depatment] }) );
  promiseArr.push( models.Depatment.findAll({ attributes: ['id','name'] }) );
  promiseArr.push( models.Problem.findAll() );
  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }));

  Promise.all(promiseArr)
  .then(function([inbox, depatments, problems, user]){
    inbox
      ? res.render('edit/inbox', { inbox, depatments, problems, user })
      : res.status(500).send('Отсутствует данное письмо')
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/inbox/:id/edit/', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    var err = new Error('Неверный запрос на сервер')
    err.status(404)
    next(err)
    return;
  }

  models.sequelize.transaction(t => {

    return models.User.findOne({
            where: {
              AuthorizationId: req.user.id
            },
            attributes: ['id'],
            transaction: t
          })
          .then(user => {

              return models.Inbox.findById(req.params.id, { transaction: t, plain: true })
                    .then(editableinbox => {

                          return models.Inbox.update({
                                number: req.body.numberinbox,
                                inboxdate: req.body.dateinbox,
                                term: req.body.term,
                                binding: req.body.binding,
                                status: req.body.status
                              }, {
                                where: {
                                  id: req.params.id
                                },
                                limit: 1,
                                transaction: t
                              })
                              .then(() => {

                                    return models.Inbox.findById(req.params.id, { transaction: t, plain: true })
                                      .then(inbox => {

                                            return Promise.all([
                                                    inbox.setProblems((req.body.problems ? req.body.problems : null), { transaction: t }),
                                                    inbox.setDepatments(req.body.depatments, { transaction: t })
                                                  ])
                                                  .then(() => {

                                                    const differences = diff(editableinbox, inbox);

                                                    if (differences.length == 2) {
                                                      throw new Error('Никакие параметры не изменялись')
                                                    }

                                                    if (R.find(diff => {return (R.equals('E', diff.kind) && (R.equals(['dataValues', 'status'], diff.path)))} , differences))
                                                    {

                                                      return Promise.all([
                                                        models.HistoryStatus.create({
                                                              statusable: 'inbox',
                                                              statusable_id: inbox.id,
                                                              description: 'Входящие отредактировано',
                                                              jsondata: JSON.stringify(differences),
                                                              status: 'change',
                                                              dependence: null,
                                                              dependence_id: null,
                                                              UserId: user.id
                                                            },{ transaction: t }),

                                                        models.HistoryStatus.create({
                                                              statusable: 'inbox',
                                                              statusable_id: inbox.id,
                                                              description: 'Входящие изменила статус',
                                                              jsondata: JSON.stringify(differences),
                                                              status: 'status',
                                                              dependence: null,
                                                              dependence_id: null,
                                                              UserId: user.id
                                                            },{ transaction: t })
                                                      ])

                                                    }

                                                    return models.HistoryStatus.create({
                                                              statusable: 'inbox',
                                                              statusable_id: inbox.id,
                                                              description: 'Входящие отредактировано',
                                                              jsondata: JSON.stringify(differences),
                                                              status: 'change',
                                                              dependence: null,
                                                              dependence_id: null,
                                                              UserId: user.id
                                                            },{ transaction: t })






            })
          })
        })
      })
    })

  })
  .then(() => {
    res.redirect('/')
  })
  .catch(err => {
    err.status = 404
    next(err)
    return;
  })

});

router.get('/task/:id/edit/', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    var err = new Error('Неверный запрос на сервер');
    err.status = 404;
    next(err)
    return;
  }

  const promiseArr = []

  promiseArr.push( models.ItemTask.findById(req.params.id, { include: [models.Problem, 'Implementer', 'TaskType', 'Inbox','Protocol', 'Information', 'Authority',  'Schedule', 'Program', 'Repair'] }) );
  promiseArr.push( models.Problem.findAll() );
  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }));
  promiseArr.push( models.User.findAll({ include: [models.Depatment]}) );
  promiseArr.push(
    models.ItemTask.findById(req.params.id)
    .then(itemtask => {
      return models.Inbox.findAll({where: { HouseId: itemtask.HouseId }})
    })
  )
  promiseArr.push( models.Schedule.findAll() );
  promiseArr.push( models.Program.findAll() );
  promiseArr.push( models.Authority.findAll() );
  promiseArr.push( models.Information.findAll() );
  promiseArr.push( models.Protocol.findAll() );

  Promise.all(promiseArr)
  .then(function([task, problems, user, users, currentInboxes, currentSchedules, currentPrograms, currentAuthorities, currentInformations, currentProtocols]){
    task
      ? res.render('edit/task', { task, problems, user, users, currentInboxes, currentSchedules, currentPrograms, currentAuthorities, currentInformations, currentProtocols })
      : res.status(500).send('Отсутствует задание')
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.post('/task/:id/edit/', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    var err = new Error('Неверный запрос на сервер');
    err.status = 404;
    next(err)
    return;
  }

  models.sequelize.transaction(t => {

    return models.User.findOne({
            where: {
              AuthorizationId: req.user.id
            },
            attributes: ['id'],
            transaction: t
          })
          .then(user => {

              return models.Task.findOne({
                      where: {
                        name: req.body.maintask,
                        type: (req.body.maintask.split('-')[0] == 'information') ? 'info-information' : req.body[req.body.maintask.replace('-','')]
                      },
                      transaction: t
                    })
                    .then(posttasktype => {

                      return models.ItemTask.findById(req.params.id, { transaction: t} )
                            .then(currentItemTask => {

                              if (posttasktype.model == 'information' && currentItemTask.taskable == posttasktype.model) {
                                
                                    return models.Information.update({
                                      description: (req.body.maintask.split('-')[0] == 'information') ? req.body[posttasktype.type.replace('-','')] : req.body[req.body[req.body.maintask.replace('-','')].replace('-','')],
                                      source: posttasktype.name.split('-')[0] },
                                      {
                                        where: {
                                          id: currentItemTask.taskable_id
                                        },
                                        limit: 1,
                                        returning: true,
                                        transaction: t
                                      })
                                      .then(info => {

                                            return models.ItemTask.update({
                                                  taskable: posttasktype.model,
                                                  taskable_id: currentItemTask.taskable_id,
                                                  term: req.body.termtask,
                                                  binding: req.body.bindingtask,
                                                  TaskTypeId: posttasktype.id,
                                                  ImplementerId: req.body.usertask,
                                                  status: req.body.status
                                                }, {
                                                    where: {
                                                      id: req.params.id
                                                    },
                                                    limit: 1,
                                                    returning: true,
                                                    transaction: t
                                                })
                                                .then(() => {

                                                    console.log("req.body.problemtask 1", req.body.problemtask);
                                                    if (Array.isArray(req.body.problemtask) || req.body.problemtask) {
                                                  
                                                      return models.ItemTask.findById(req.params.id, { transaction: t })
                                                            .then(itemtask => {
                                                              
                                                                  return itemtask.setProblems(req.body.problemtask, { transaction: t })

                                                            })

                                                    }

                                                })

                                      })

                              }

                              if (posttasktype.model == 'information' && currentItemTask.taskable !== posttasktype.model) {

                                      return models.Information.create({
                                        description: (req.body.maintask.split('-')[0] == 'information') ? req.body[posttasktype.type.replace('-','')] : req.body[req.body[req.body.maintask.replace('-','')].replace('-','')],
                                        source: posttasktype.name.split('-')[0] },
                                            {
                                              transaction: t
                                            })
                                            .then(info => {

                                                  return models.ItemTask.update({
                                                        taskable: posttasktype.model,
                                                        taskable_id: info.id,
                                                        term: req.body.termtask,
                                                        binding: req.body.bindingtask,
                                                        TaskTypeId: posttasktype.id,
                                                        ImplementerId: req.body.usertask,
                                                        status: req.body.status
                                                      }, {
                                                          where: {
                                                            id: req.params.id
                                                          },
                                                          limit: 1,
                                                          returning: true,
                                                          transaction: t
                                                      })
                                                      .then(() => {

                                                          console.log("req.body.problemtask 2", req.body.problemtask);
                                                          if (Array.isArray(req.body.problemtask) || req.body.problemtask) {
                                                  
                                                            return models.ItemTask.findById(req.params.id, { transaction: t })
                                                                  .then(itemtask => {
                                                                    
                                                                        return itemtask.setProblems(req.body.problemtask, { transaction: t })
                                                                    
                                                                  })

                                                          }

                                                      })

                                            })

                              }

                              return models.ItemTask.update({
                                      taskable: posttasktype.model,
                                      taskable_id: req.body[posttasktype.type.replace('-','')],
                                      term: req.body.termtask,
                                      binding: req.body.bindingtask,
                                      TaskTypeId: posttasktype.id,
                                      ImplementerId: req.body.usertask,
                                      status: req.body.status
                                    }, {
                                        where: {
                                          id: req.params.id
                                        },
                                        limit: 1,
                                        returning: true,
                                        transaction: t
                                    })
                                    .then(() => {

                                        console.log("req.body.problemtask 3", req.body.problemtask);
                                        if (Array.isArray(req.body.problemtask) || req.body.problemtask) {
                                      
                                          return models.ItemTask.findById(req.params.id, { transaction: t })
                                                .then(itemtask => {
                                                  
                                                        return itemtask.setProblems(req.body.problemtask, { transaction: t })
                                                  
                                                })

                                        }

                                    })

                            })

                    })

          })

  })
  .then(function(){
    res.redirect('/')
  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки при записи')
  })

})

module.exports = router;