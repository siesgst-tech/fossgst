const static = require('./static');
const users = require('./users');

const auth = require('../controller/static/authController');

function initRoutes(app) {
  console.log("Initializing Routes...");

  app.use('/', static);
  app.use('/user', auth.checkAuth, users);

  // Ending Routes
  console.log('Finished Initializing Routes...');
}

module.exports = initRoutes;
