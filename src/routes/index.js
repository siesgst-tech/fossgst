const static = require('./static');

function initRoutes(app) {
  console.log("Initializing Routes...");

  app.use('/', static);

  // Ending Routes
  console.log('Finished Initializing Routes...');
}

module.exports = initRoutes;
