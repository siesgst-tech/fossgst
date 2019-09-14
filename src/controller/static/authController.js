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
