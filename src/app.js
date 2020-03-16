const express = require('express');
const app = express();

const middleware = require('./config/middleware');
middleware.init(app);

const routes = require('./routes/index');
routes.init(app);

const database = require('./config/database');
database.connect().then(() => {
  console.log('Connection to database done!');

  const server = require('./config/server');
  server.start(app);

  middleware.errorHandler(app);
}).catch((err) => {
  console.log(err);
  process.exit(1);
});

module.exports = app;
