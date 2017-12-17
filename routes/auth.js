var express       = require('express');
var passport      = require('passport');
var models        = require('../models');
var Authorization = models.Authorization;
var router        = express.Router();


router.get('/signin', function(req, res, next){
  res.render('signin');
})

router.post('/signin', function(req, res, next){ 
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.render('signin', { info }); }
    req.logIn(user, function () {
      return res.redirect('/');
    });
  })(req, res, next);
})

router.get('/signup', function(req, res, next){
  res.render('signup');
});

router.post('/signup', function(req, res, next){
  Authorization.register(req.body.email, req.body.password, function(err, user){
    err
      ? res.render('signup', {error: err})
      : ( 
        console.log("user2", user),
        user.createUser(models.User,{})
        .then(() => {
          req.logIn(user, function () {
            return res.redirect('/');
          })
        })
        .catch(err => {
          user.destroy().then(() => res.render('signup', {error: err}))
        })
      )
  })
})

router.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    res.redirect('/signin');
  })
})


module.exports = router;