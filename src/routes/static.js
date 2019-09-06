const express = require('express');
const router = express.Router();
const passport = require('passport');

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
  req.session.loggedIn = false;

  // To do or not to do??
  // delete req.user;
  // delete req.session;

  req.flash('toastMessage', 'Thanks for visiting. See you soon');

  res.redirect('/');
});

module.exports = router;