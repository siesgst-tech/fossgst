const express = require('express');
const router = express.Router();
const passport = require('passport');

const static = require('../controller/static/staticController');
const auth = require('../controller/static/authController');

router.get('/', static.index);
router.get('/tos', static.tos);
router.get('/tos/accept', auth.isLoggedIn, static.tosAccept);

// Google OAuth Sign In
router.get('/google/signin', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth Callback
router.get('/google/signin/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/'
  })
);

// Sign Out
router.get('/signout', (req, res) => {
  req.user = null;
  req.session.user = null;
  req.session.passport = null;
  req.session.loggedIn = null;

  // To do or not to do??
  // delete req.user;
  // delete req.session;
  // nope dont do that! never directly delete req.session, modules like flash(connect-flash) requires to have session

  req.flash('toastMessage', 'Thanks for visiting. See you soon');

  res.redirect('/');
});

module.exports = router;
