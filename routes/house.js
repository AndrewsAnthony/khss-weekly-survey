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
    'Protocol', 'Information', 'Authority',  'Schedule', 'Program', 'Repair',  {
        model: models.File,
        order: ['createdAt','DESC'],
        include: [models.FileDescription]
    }] }) );
  promiseArr.push( models.Schedule.findAll() );
  promiseArr.push( models.Program.findAll() );
  promiseArr.push( models.Authority.findAll() );
  promiseArr.push( models.Information.findAll() );
  promiseArr.push( models.Protocol.findAll() );


  Promise.all(promiseArr)
  .then(function([house, depatments, users, problems, inboxs, itemtasks, schedule, program, authority, information, protocol]){
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
        tasktypes: {schedule, program, authority, information, protocol, inboxs}
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

router.post('/:id/task/', function(req, res, next) {

  const chainObj = {};

  models.Task.findOne({
    where: {
      name: req.body.maintask,
      type: (req.body.maintask.split('-')[0] == 'information') ? 'info-information' : req.body[req.body.maintask.replace('-','')]
    }
  })
  .then(tasktype => {
    chainObj.tasktype = tasktype;
    console.log("chainObj", chainObj.tasktype);
    if (chainObj.tasktype.model == 'information') {
      return models.Information.create({
        description: (req.body.maintask.split('-')[0] == 'information') ? req.body[chainObj.tasktype.type.replace('-','')] : req.body[req.body[req.body.maintask.replace('-','')].replace('-','')],
        source: chainObj.tasktype.name.split('-')[0]
      })
    }
    return Promise.resolve(null);
  })
  .then(info => {
    chainObj.info = info
    return  models.ItemTask.create({
      taskable: chainObj.tasktype.model,
      taskable_id: chainObj.info ? chainObj.info.id : req.body[tasktype.type.replace('-','')],
      term: req.body.termtask,
      binding: req.body.bindingtask,
      HouseId: req.params.id,
      TaskTypeId: chainObj.tasktype.id,
      ImplementerId: req.body.usertask
    })
  })
  .then(itemtask => {
    chainObj.itemtask = itemtask
    if (req.body.problemtask) {
      return chainObj.itemtask.setProblems(req.body.problemtask)
    }
    return Promise.resolve(null);
  })
  .then(problem =>{
    chainObj.problem = problem
    console.log("chainObj", chainObj);
    res.json(chainObj)
  })
  .catch( err => {
    console.log("err", err);
    res.status('500').next('ошибка при обработке данных')
  })


});




module.exports = router;