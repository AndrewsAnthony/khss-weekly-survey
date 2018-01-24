const models     = require('../models');
const Op         = models.sequelize.Op;
const express    = require('express');
const path       = require('path');
const formidable = require('formidable');
const fse        = require('fs-extra');
const mkdirp     = require('mkdirp-promise');
const Jimp       = require("jimp");
const moment     = require('moment');
const router     = express.Router();


router.get('/enterprise', function(req, res, next) {
  
  const promiseArr = [];

  promiseArr.push( models.User.findAll({
    include: [models.Depatment, models.Rule, { model: models.Authorization, attributes: ['email']}]
  }) );


  promiseArr.push( models.User.findOne({
    where: {
      AuthorizationId: req.user.id
    },
    include: [models.Rule]
  }) );

  promiseArr.push( models.Rule.findAll() );

  Promise.all(promiseArr)
  .then(([users, user, rules]) => {
    res.render('enterprise', {
      user, users, rules, title : 'Страница сотрудников предприятия'
    })

  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

})

router.get('/:id', function(req, res, next) {

  req.params.id = parseInt(req.params.id, 10)
  if (isNaN(req.params.id)) {
    var err = new Error('Неверный запрос на сервер');
    err.status = 404;
    next(err);
    return;
  }

  const promiseArr = []

  function displayChief(chief){

    promiseArr.push(
      models.User.findAll(
        { where: { ChiefId: chief.id }
        , include:
            [ { model: models.ItemTask
            , include:
                [ models.House
                , models.Problem
                , 'Implementer', 'TaskType', 'Inbox'
                , 'Protocol', 'Information', 'Authority'
                , 'Schedule', 'Program', 'Repair'
                , { model: models.File
                  , include: [models.FileDescription]
                  , separate: true }
                , { model: models.NoteTask
                  , include: [models.User]
                  , separate: true }
                ]
            , where: { status: { [Op.or]: ['active', 'add'] } }
            , separate: true }
            ]
        }
      )
    )

    promiseArr.push(
      models.User.findOne(
        { where: { id: chief.id }
        , include:
            [ models.Rule
            , { model: models.Depatment
              , include:
                  [ { model: models.Inbox
                  , include:
                      [ models.House
                      , models.Problem
                      , { model: models.File
                        , include: [models.FileDescription]
                        , separate: true }
                      ]
                  , where: { status: { [Op.or]: ['active', 'add'] } } }
                  ] }
            ]
        }
      )
    )

    promiseArr.push(
      models.Protocol.findAll(
        { where:
          { [Op.and]: [
              { date:
                { [Op.between]:
                    [ moment().subtract(1, 'd').format()
                    , moment().add(2, 'w').format()
                    ] }
              , status:
                { [Op.or]: [ 'add' , 'active' ] }
              } ]
          }
        , include:
            [ { model: models.File
              , include: [models.FileDescription] }
            ]
        }
      )
    );

    promiseArr.push(
      models.Authority.findAll(
        { where:
          { [Op.and]: [
              { date:
                { [Op.between]:
                    [ moment().subtract(1, 'd').format()
                    , moment().add(2, 'w').format()
                    ] }
              , status:
                { [Op.or]: [ 'add' , 'active' ] }
              } ]
          }
        , include:
            [ { model: models.File
              , include: [models.FileDescription] }
            ]
        }
      )
    );

    Promise.all(promiseArr)
    .then(([userTasks, user, protocols, authorities]) => {
      res.render('user', {
        user, userTasks, authorities, protocols
      });
    })
    .catch(err => {
      console.log(err)
      next(err)
    })

  }

  function displayUser(user){

    promiseArr.push(
      models.User.findOne({
          where: { AuthorizationId: req.user.id }
        , include:
            [ models.Rule,
              { model: models.ItemTask
              , include:
                [ models.House
                , models.Problem
                , 'Implementer' , 'TaskType' , 'Inbox'
                , 'Protocol' , 'Information' , 'Authority'
                , 'Schedule' , 'Program' , 'Repair'
                , { model: models.File
                  , include: [ models.FileDescription ]
                  , separate: true }
                , { model: models.NoteTask , include: [models.User], separate: true }
                ]
              , where: { status: { [Op.or]: ['active', 'add'] } }
              , required: false
              , separate: true }
            , { model: models.Depatment
              , include:
                  [ { model: models.Inbox
                    , include:
                        [ models.House
                        , models.Problem
                        , { model: models.File
                          , include: [models.FileDescription]
                          , separate: true }
                        ]
                    , where: { status: { [Op.or]: ['active', 'add'] } }
                    , required: false }
                  ] }
            ]
      })
    );

    promiseArr.push(
      models.Protocol.findAll(
        { where:
          { [Op.and]: [
              { date:
                { [Op.between]:
                    [ moment().subtract(1, 'd').format()
                    , moment().add(2, 'w').format()
                    ] }
              , status:
                { [Op.or]: [ 'add' , 'active' ] }
              } ]
          }
        , include:
            [ { model: models.File
              , include: [models.FileDescription] }
            ]
        }
      )
    );

    promiseArr.push(
      models.Authority.findAll(
        { where:
          { [Op.and]: [
              { date:
                { [Op.between]:
                    [ moment().subtract(1, 'd').format()
                    , moment().add(2, 'w').format()
                    ] }
              , status:
                { [Op.or]: [ 'add' , 'active' ] }
              } ]
          }
        , include:
            [ { model: models.File
              , include: [models.FileDescription] }
            ]
        }
      )
    );

    Promise.all(promiseArr)
    .then(([user, protocols, authorities]) => {
      res.render('user', {
        user, authorities, protocols
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

    if (req.params.id !== user.id) displayUser(user)
    else (user.id == user.ChiefId)
          ? displayChief(user)
          : displayUser(user)
  })
  .catch(err => {
    console.log(err)
    next(err)
  })

})

router.post('/rule', function(req, res, next) {
  
  if (!req.body.rulelist || !req.body.userid) {
    var err = new Error('Неверные входные данные');
    err.status = 404;
    next(err)
    return;
  }
  if (Array.isArray(req.body.rulelist)) {
    req.body.rulelist = R.union([1, 15], req.body.rulelist)
  } else {
    req.body.rulelist = R.union([1, 15], [req.body.rulelist])
  }
  req.body.rulelist.map(Number)

  models.sequelize.transaction(function (t) {
      
      return models.User.findOne({
            where: {
              AuthorizationId: req.user.id
            },
            transaction: t
          })
          .then(user => {

              if (user.id !== user.ChiefId) {
                throw Error('Вы не являетесь начальников')
              }

              return models.User.findById(req.body.userid, { transaction: t })
                    .then(changeuser => {

                        if (!changeuser) {
                          throw Error('Отсутствует пользователь для которого устанавливаются права доступа')
                        }

                        return changeuser.setRules(req.body.rulelist, { transaction: t })

                    })

          })
  })
  .then(([users, user, rules]) => {    
    res.redirect('/user/enterprise')
  })
  .catch(function(err){
    err.status = 500
    next(err)
  })

})

router.post('/profile/field/edit', function(req, res, next) {
  let redirectid = '..';
  if (Object.keys(req.body).length == 3) {
    models.User.findOne({
      where: {
        AuthorizationId: req.user.id
      }
    })
    .then(user => {
      redirectid = user.id
      return user.update({
              name: req.body.name,
              email: req.body.email,
              phone: req.body.phone
            })
    })
    .then(() => {
      res.redirect('/user/' + redirectid)
      return;
    })
    .catch(err => {
      console.log(err)
      err.message = `Проблемы при загрузки файла,
       обратитесь к администратору`
      next(err)
    })
  } else {
    const err = new Error(`Не все поля заполнены`)
    next(err)
  }

})

router.post('/profile/photo/edit', function(req, res, next) {
  let redirectid = '..';
  const form = new formidable.IncomingForm();

  form.multiples = false;
  form.uploadDir = path.join(__dirname, '../uploadfiles');

  form.parse(req, function(err, fields, files){

    if( err ){
      console.log(err);
      err.message = `Файл не загрузился. Проблемы при загрузки файла,
       обратитесь к администратору`
      next(err)
      return;
    }

        console.log("files", files);
        console.log("fields", fields);
    if (files.image.size || files.image.name) {

      models.User.findOne({
        where: {
          AuthorizationId: req.user.id
        }
      })
      .then(user => {

        const fileUploadDir = path.join(__dirname, '../public', 'userprofile')
        const filePath = files.image.path;
        const nameFile = moment().format('YYYY-MM-DD') + '_' + files.image.path.substr(-32) + path.extname(files.image.name)
        const newFilePath = path.join(fileUploadDir, nameFile);

        return fse.ensureDir(fileUploadDir)
                .then(() => fse.move(filePath, newFilePath))
                .then(() => fse.ensureDir(path.join(fileUploadDir,'thumbnails')))
                .then(() => Jimp.read(newFilePath))
                .then((currentFile) => {
                    return currentFile
                          .resize(64, Jimp.AUTO)
                          .write(path.join(fileUploadDir,'thumbnails', nameFile));
                })
                .then(() => {
                  redirectid = user.id
                  return user.update({
                          image: nameFile
                        })
                })
      })
      .then(() => {
        res.redirect('/user/' + redirectid)
        return;
      })
      .catch(err => {
        console.log(err)
        err.message = `Проблемы при загрузки файла,
         обратитесь к администратору`
        next(err)
      })

    } else {
      const err = new Error(`Не отправлен файл`)
      next(err)
    }





  })

})

module.exports = router