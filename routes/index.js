var models  = require('../models');
var express = require('express');
var router  = express.Router();

// router.get('/house/:id/inbox/', function(req, res) {});
router.post('/house/:id/inbox/', function(req, res) {
  models.Inbox.create({
    number: req.body.number,
    inboxdate: req.body.inboxdate,
    term: req.body.term,
    problem: req.body.problem.split(','),
  }, {
    include: [ Problem ]
  }).then(function() {
    console.log('Create Inbox for house ', req.params.id)
    // res.redirect('/house/' + req.params.id);
  });
});

// router.get('/house/:id/photoreport/', function(req, res) {});
router.post('/house/:id/photoreport/', function(req, res) {
  models.Photoreport.create({
    binding: req.body.binding,
    req.body.problem,
    term: req.body.term,
    explain: req.body.explain,
    status: req.body.statuse,
    problem: req.body.problem.split(','),
  }, {
    include: [ Problem ]
  }).then(function() {
    console.log('Create Inbox for Photoreport ', req.params.id)
    // res.redirect('/house/' + req.params.id);
  });
});

router.get('/house/:id', function(req, res) {

});

router.get('/house', function(req, res) {
  models.House.findAll({}).then(function(houses) {
    res.render('index', {
      title: 'Пример для всех адресов',
      houses: houses
    });
  });
});

module.exports = router;
