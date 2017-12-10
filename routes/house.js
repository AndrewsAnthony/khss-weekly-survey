var models     = require('../models');
var Op = models.sequelize.Op

var express    = require('express');
var path       = require('path');
var formidable = require('formidable');
var fse        = require('fs-extra')
var mkdirp     = require('mkdirp-promise');
var Jimp       = require("jimp");
var getSlug    = require('speakingurl');
var moment     = require('moment');
var slash      = require('slash');
var router     = express.Router();


router.post('/typeahead', function(req, res) {

  var address = req.body.address.split(/[^\wа-яА-Я]+/);
  var street = address.shift()
  var number = address.shift()
  if (street && number) {
    models.House.findAll({
      where: {
        [Op.and]: [
        {
          street: {
            [Op.like]: `%${street}%`
          }
        },
        {
          number: {
            [Op.like]: `%${number}%`
          }
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
    res.status(404).send('Ошибка запроса')
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
          <a href='../house/${inbox.House.id}'>
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

router.get('/:id', function(req, res) {
  req.params.id = parseInt(req.params.id, '10')
  if (isNaN(req.params.id)) {
    res.status(404).send('Неверный запрос на сервер')
  }
  const promiseArr = []
  promiseArr.push( models.House.findOne({ where: { id: req.params.id }, include: [models.Authority] }) );
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
    'Protocol', 'Information', 'Authority', 'Source',  'Schedule', 'Program', 'Repair',  {
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }] }) );
  promiseArr.push( models.Schedule.findAll() );
  promiseArr.push( models.Program.findAll() );
  promiseArr.push( models.Source.findAll() );
  promiseArr.push( models.Information.findAll() );
  promiseArr.push( models.Protocol.findAll() );


  Promise.all(promiseArr)
  .then(function([house, depatments, users, problems, inboxs, itemtasks, schedule, program, source, information, protocol]){
      console.log("house", house.Authorities);

    res.render('index', {
      title: 'Пример для одного адреса',
      houses: null,
      obj: {
        panel: true,
        house,
        inboxs,
        users,
        depatments,
        problems,
        itemtasks,
        tasktypes: {schedule, program, source, information, protocol, inboxs}
      }
    })

  })
  .catch(function(err){
    console.log(err)
    res.status(500).send('Ошибки на сервере')
  })

});

router.get('/', function(req, res, next) {
  models.House.findAll()
  .then(function(houses) {
    res.render('index', {
      title: 'Пример для всех адресов',
      houses: houses,
      obj: {
        panel: false
      }
    });
  })
  .catch(function(err){
    console.log(err)
    next()
  });
});




// router.get('/house/:id/inbox/', function(req, res) {});
router.post('/:id/inbox/', function(req, res) {
  var newInbox = null;
  models.sequelize.transaction(function(t){
    return models.Inbox.create({
      number: req.body.numberInbox,
      inboxdate: req.body.dateInbox,
      term: req.body.termInbox,
      binding: req.body.bindingInbox
    }, { transaction: t })
    .then((inbox) => {
      newInbox = inbox
      return inbox.setHouse(req.params.id, { transaction: t })
      .then((house) => {
        return inbox.setDepatments(req.body.depatment, { transaction: t })
        .then((depatments) => {
          if ( !req.body.problem ) {
            return ;
          }
          return inbox.setProblems(req.body.problem, { transaction: t })
        })
      })
    })
  })
  .then((inbox) => {
    res.json(newInbox)
  })
  .catch(function(msg){
    res.status(404).send("Проблемы при добавлении в базу данных")
  })

});

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
        var dbUploadDir = path.join(
            getSlug(`${house.street} ${house.number}`, {lang: 'ru'})
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

            return models.FileDescription.findOrCreate({
              where: {
                description: fields.filedescription,
                note: fields.filenote,
                name: fields.filename
              }
            })
            .spread((filedescription, created) => {
              filedescription.createFile({
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
                }
                else {
                  return Promise.resolve()
                }
              })
              .catch
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

            return models.FileDescription.findOrCreate({
              where: {
                description: fields.filedescription,
                note: fields.filenote,
                name: fields.filename
              }
            })
            .spread((filedescription, created) => {
              filedescription.createFile({
                path: slash(path.join(dbUploadDir, nameFile)),
                thumbnail: '',
                type: fields.file,
                fileable: fields.object,
                fileable_id: fields.objectid
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

router.post('/:id/task/', function(req, res) {

  models.Task.findOne({
    where: {
      name: req.body.maintask,
      type: req.body[req.body.maintask.replace('-','')]
    }
  })
  .then(function(tasktype){
    models.ItemTask.create(
    {
      taskable: tasktype.model,
      taskable_id: req.body[tasktype.type.replace('-','')],
      term: req.body.termtask,
      binding: req.body.bindingtask,
      HouseId: req.params.id,
      TaskTypeId: tasktype.id,
      ImplementerId: req.body.usertask
    }
  )
  .then(function(itemtask){
    if (!req.body.problemtask) {
      res.json({ itemtask })
      return;
    }
    itemtask.setProblems(req.body.problemtask)
  .then(function(problems){
    res.json({ itemtask , problems})
  })
  .catch(function(err){
    console.log("err", err);
    res.status('500').send('ошибка при обработке данных')
      })
    })
  })

});




module.exports = router;