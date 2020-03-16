const static = require('./static');
const users = require('./users');

const auth = require('../controller/static/authController');

module.exports.init = function initRoutes(app) {
  console.log("Initializing Routes...");

  app.use('/', static);
  app.use('/user', auth.checkAuth, users);

  app.use((req, res) => {
    res.status(404).render('error');
  });

  // Ending Routes
  console.log('Finished Initializing Routes...');
}
