const path = require('path');
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const session = require('cookie-session');
const flash = require('connect-flash');
const moment = require('moment');
const compression = require('compression');
const helmet = require('helmet');
const dotenv = require('dotenv');
const passport = require('passport');

dotenv.config();
require('./passport')(passport);

// modules for logging
const fs = require('fs');
const rfs = require('rotating-file-stream');
const logDirectory = path.join(__dirname, '../../logs');
// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

function initMiddleware(app) {
  // protect ourself, wear a helmet
  app.use(helmet());

  // view engine setup
  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'ejs');

  // make moment available throught the app
  app.locals.moment = moment;

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // for toast/flash messages
  app.use(flash());

  // session
  app.use(session({
    name: 'fossgst',
    keys: [process.env.COOKIE_KEY0, process.env.COOKIE_KEY1, process.env.COOKIE_KEY2],
    secret: process.env.COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 2628000000,
      secure: 'dev' !== process.env.NODE_ENV,
    }
  }));

  // use passport for oAuth (Google) Signin
  // Future Plans GitHub
  app.use(passport.initialize());
  app.use(passport.session());

  // usage variables
  app.use((req, res, next) => {
    res.locals.req = req;
    res.locals.session = req.session;
    res.locals.toastMessage = req.flash('toastMessage');
    res.locals.toastStatus = req.flash('toastStatus');
    if (res.locals.toastMessage != "" && res.locals.toastStatus != "" && 'dev' === process.env.NODE_ENV) {
      console.log('Flash Message: ' + res.locals.toastMessage + ' ' + res.locals.toastStatus);
    }
    next();
  });


  // gzip files before sending
  app.use(compression());

  // logging format
  let logFormat = '_ID=:_id :remote-addr [:date[web]] ":method :url HTTP/:http-version" :status ":referrer" ":user-agent"';


  // although this stuff is dependant on ENV, but for now its everything will be served from here
  app.use('/assets', express.static(path.join(__dirname, '../public')));
  // serve favicon from ./public/assets
  // app.use(favicon(path.join(__dirname, '../public', 'assets', 'favicon.ico')));
  // uncomment when favicon is ready


  // ENV specific stuff
  if ('dev' === process.env.NODE_ENV) {
  } else {
    // modify :remote-addr token in prod for X-Real-IP || X-Forwarded-For || X-Forwarded-Host
    logger.token('real-addr', (req, res) => {
      return req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.headers['x-forwarded-host'];
    });

    // modify log format with real ip address of client
    logFormat = '_ID=:_id :real-addr [:date[web]] ":method :url HTTP/:http-version" :status ":referrer" ":user-agent"';

    // custom logging related stuff
    // options for RFS
    const rfsOptions = {
      size: "10M",
      interval: '1d',
      path: logDirectory
    };
    // create a rotating write stream for FOSSGST
    const accessLogStream = rfs('access.log', rfsOptions);

    // create custom token for user's _id
    logger.token('_id', (req, res) => {
      if (req.session && req.session.user && req.session.user._id)
        return req.session.user._id;

      return 'NOT-LOGGED-IN-PADDING00s';
    });

    // setup logger for endpoints directed at website
    app.use(logger(logFormat, { stream: accessLogStream }));
  }

  // and also log to console
  app.use(logger('dev'));

  console.log('Setting up middlewares done!');
}

module.exports = initMiddleware;
