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
  const user = req.session.user;
  // console.log(req.body);

  // TODO: verify & validate incomming request

  const xdoc = req.body;
  xdoc.startDate = Date(xdoc.startDate);
  xdoc.userId = user._id;
  xdoc.repo = `https://github.com/${user.ghProfile}/${xdoc.repo}`;
  // console.log(xdoc);

  // TODO: chech if XDOC exist with same repo
  // if exists, reject xdoc

  XDOC.create(xdoc).then((doc) => {
    // console.log(doc);

    req.flash('toastMessage', 'New XDoC Challange added.');
    req.flash('toastStatus', 'success');
    res.redirect('/user/profile');
  }).catch((err) => {
    // TODO: Handle Error
    // console.log(err);

    // Error Code 11000: duplicate key error

    req.flash('toastMessage', 'Oops some error.');
    req.flash('toastStatus', 'error');
    res.redirect('back');
  });
}
