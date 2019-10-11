const moment = require('moment');

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

  // check if the user has connected his/her GitHub account
  if (!user.ghProfile) {
    req.flash('toastMessage', 'Connect your GitHub account first.');
    req.flash('toastStatus', 'error');
    res.redirect('/user/profile');
    return;
  }

  const xdoc = req.body;
  // console.log(xdoc);
  const startDate = new moment(xdoc.startDate) || new moment();
  const endDate = new moment(startDate).add(parseInt(req.body.x), 'days');
  // console.log(startDate, endDate);

  xdoc.startDate = startDate;
  xdoc.endDate = endDate;
  xdoc.userId = user._id;
  xdoc.repo = `${user.ghProfile}/${xdoc.repo}`;
  // console.log(xdoc);

  // TODO: chech if XDOC exist with same repo
  // if exists, reject xdoc

  XDOC.findOne({ userId: user._id, endDate: { $gte: moment().toISOString() } }, (err, doc) => {
    if (err) {
      req.flash('toastMessage', 'Oops some error.');
      req.flash('toastStatus', 'error');
      res.redirect('back');
    } else if (doc) {
      req.flash('toastMessage', 'You alread have an active XDoC.');
      req.flash('toastStatus', 'error');
      res.redirect('back');
    } else {
      XDOC.create(xdoc).then((doc) => {
        // console.log(doc);
        req.flash('toastMessage', 'New XDoC Challange added.');
        req.flash('toastStatus', 'success');
        res.redirect('/user/profile');
      }).catch((err) => {
        // TODO: Handle Error
        // console.log(err);

        // Error Code 11000: duplicate key error
        if (err.code === 11000) {
          req.flash('toastMessage', 'A XDoC in same repo exists.');
          req.flash('toastStatus', 'error');
          res.redirect('back');
        } else {
          req.flash('toastMessage', 'Oops some error.');
          req.flash('toastStatus', 'error');
          res.redirect('back');
        }
      });
    }
  });
}
