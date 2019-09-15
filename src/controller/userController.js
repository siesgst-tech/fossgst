const User = require('../model/User');
const XDOC = require('../model/Xdoc');

module.exports.profile = function (req, res) {
  let xdoc = {
    activities: [],
    challenges: {
      active: [],
      past: []
    }
  };

  let projects = {
    activities: [],
    participated: [],
    my: []
  }
  res.render('users/profile', { xdoc: xdoc, projects: projects });
}

module.exports.xdocNew = function (req, res) {

}
