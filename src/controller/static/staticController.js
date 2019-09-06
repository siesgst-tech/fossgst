const User = require('../../model/User');

module.exports.index = function (req, res) {
  const session = req.session;

  if (session.loggedIn && !session.user.tos) {
    res.redirect('/tos');
  } else {
    res.render('index');
  }
}

module.exports.tos = function (req, res) {
  res.render('static/tos');
}

module.exports.tosAccept = function (req, res) {
  const userId = req.session.user._id;

  User.findOneAndUpdate({_id: userId}, {tos: true}, (err, user) => {
    if (err) {
      // handle the damn error!
    } else {
      req.session.user.tos = true;
      res.redirect('/');
    }
  });
}

module.exports.legals = function (req, res) {

}

module.exports.register = function (req, res) {

}

function isLoggedIn (req, res, next) {
  if (req.session.loggedIn) {
    if (next) {
      next();
    }
    return true;
  } else {
    req.flash('toastMessage', 'You must Sign In to Continue!');
    req.flash('toastStatus', 'error');
    res.redirect('/');
    return false;
  }
}
module.exports.isLoggedIn = isLoggedIn;

module.exports.checkAuth = function (req, res, next) {
  if (isLoggedIn(req, res) && req.session.user.tos) {
    next();
  }
}
