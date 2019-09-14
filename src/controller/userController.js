const User = require('../model/User');

module.exports.profile = function (req, res) {
  res.render('users/profile')
}
