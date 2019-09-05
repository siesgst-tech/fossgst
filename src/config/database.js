const mongoose = require('mongoose');
const debug = require('debug')('fossgst:db');

// Handles all the database operations in the app.js
function initDatabase () {

  // Starting Database Connections
  debug('Initializing Database Connection');

  // Connection Configuration for MongoDB
  const options = {
    reconnectTries: 10,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  };

  let dbUri = process.env.DB_DEV_URI;
  if (process.env.NODE_ENV !== 'dev') {
    dbUri = process.env.DB_URI;
  }

  mongoose.connect(dbUri, options);

  // Get the connection object
  const connection = mongoose.connection;

  // Connection Response Types
  // For handling and reporting conection successful
  connection.on('connected',() => {
    debug('Trying to connect: ' + dbUri);
    debug('Database Connection Status: Successful');
    debug('Database Connnection Established');

    // Ending Database Connections
    // debug('Finished Database Connectivity');
  });

  // For handling and reporting error
  connection.on('error',(err) => {
    debug('Trying to connect: ' + dbUri);
    debug('Database Connection Status: Unsuccessful');
    debug('Database Connection Error: ' + err);

    // Ending Database Connections
    // debug('Finished Database Connectivity');
  });

  // For handling and reporting disconnection
  connection.on('disconnected', () => {
    debug('Trying to connect: ' + dbUri);
    debug('Database Connection Status: Unsuccessful');
    debug('Database Connection: Disconnected');

    // Ending Database Connections
    // debug('Finished Database Connectivity');
  });
};

module.exports = initDatabase;
