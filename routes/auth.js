// var express = require('express');
// var router = express.Router();

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/signup');
}

module.exports = function(app, passport){
// GET on(up page.
  app.get('/signup', function(req, res, next) {
    res.render('signup', { title: 'Регистрация' });
  });

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/protocol',
    failureRedirect: '/signup'
  }))


  app.get('/signin', function(req, res, next) {
    res.render('signin', { title: 'Вход в систему' });
  });

  app.use('/protocol', isLoggedIn, function(req, res, next) {
    res.render('protocol', { title: 'Доступ разрешен' });
  });

  app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
      res.redirect('/');
    })
  })

}