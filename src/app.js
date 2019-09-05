const express = require('express');

const initMiddleware = require('./config/middleware');
const initDatabase = require('./config/database');
const initRoutes = require('./routes/index');

const app = express();

initMiddleware(app);
initDatabase();
initRoutes(app);

app.use((req, res) => {
  res.render('error');
});

module.exports = app;
