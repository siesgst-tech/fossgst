const moment = require('moment');

const User = require('../model/User');
const XDOC = require('../model/Xdoc');
const Activity = require('../model/XdocActivity');

module.exports.profile = function (req, res) {
  const user = req.session.user;

  Promise.all([
    User.findById(user._id).select({'createdAt':1}).exec(),
    XDOC.find({userId:user._id}).exec()
  ]).then((docs) => {
    const user = docs[0];
    const xdocs = docs[1]
    // console.log(user, xdocs);

    const past = xdocs.filter(x => x.endDate < new moment());
    // console.log(past);
    const active = xdocs.filter(x => x.endDate >= new moment());
    // console.log(active);

    const xdocIds = xdocs.map(x => x._id);
    // console.log(xdocIds);

    Activity.find({xdocId:{$in:xdocIds}}).sort({createdAt:1}).limit(10).then((activities) => {
      // console.log(activities);
      activities = activities.sort((a,b)=>new Date(b.createdAt) - new Date(a.createdAt));
      let xdoc = {
        activities: activities,
        challenges: {
          active: active,
          past: past
        }
      };

      let projects = {
        activities: [],
        participated: [],
        my: []
      };

      res.render('users/profile', { user: user, xdoc: xdoc, projects: projects });
    }).catch((err) => {
      req.flash('toastMessage', 'Oops some error.');
      req.flash('toastStatus', 'danger');
      res.redirect('/');
    });
  }).catch((err) => {
    // console.log(err);
    req.flash('toastMessage', 'Oops some error.');
    req.flash('toastStatus', 'danger');
    res.redirect('/');
  });
}

module.exports.xdocNew = function (req, res) {
  const user = req.session.user;
  // console.log(req.body);

  // TODO: verify & validate incomming request

  // check if the user has connected his/her GitHub account
  if (!user.ghProfile) {
    req.flash('toastMessage', 'Connect your GitHub account first.');
    req.flash('toastStatus', 'danger');
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
      req.flash('toastStatus', 'danger');
      res.redirect('back');
    } else if (doc) {
      req.flash('toastMessage', 'You alread have an active XDoC.');
      req.flash('toastStatus', 'danger');
      res.redirect('back');
    } else {
      XDOC.create(xdoc).then((doc) => {
        // console.log(doc);
        const activity = {
          xdocId: doc._id,
          point: 0,
          validate: true,
          type: 'new'
        };

        Activity.create(activity).then((act) => {
          // console.log(act);
          req.flash('toastMessage', 'New XDoC Challange added.');
          req.flash('toastStatus', 'success');
          res.redirect('/user/profile');
        }).catch((err) => {
          req.flash('toastMessage', 'Oops some error.');
          req.flash('toastStatus', 'danger');
          res.redirect('back');
        });
      }).catch((err) => {
        // TODO: Handle Error
        // console.log(err);

        // Error Code 11000: duplicate key error
        if (err.code === 11000) {
          req.flash('toastMessage', 'A XDoC in same repo exists.');
          req.flash('toastStatus', 'danger');
          res.redirect('back');
        } else {
          req.flash('toastMessage', 'Oops some error.');
          req.flash('toastStatus', 'danger');
          res.redirect('back');
        }
      });
    }
  });
}
