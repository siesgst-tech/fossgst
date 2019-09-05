const express = require('express');
const router = express.Router();
const passport = require('passport');

// Google oAuth Sign In
router.get('/google/signin', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google oAuth Callback
router.get('/google/signin/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/'
  })
);

// Google Sign Out
router.get('/signout', (req, res) => {
  req.user = null;
  req.session.user = null;
  req.session.loggedIn = false;
  req.flash('toastMessage', 'Thanks for visiting. See you soon');

  res.redirect('/');
});

module.exports = router;
