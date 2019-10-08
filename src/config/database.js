const mongoose = require('mongoose');

// Handles all the database operations in the app.js
function initDatabase () {

  // Starting Database Connections
  console.log('Initializing Database Connection');

  // Connection Configuration for MongoDB
  const options = {
    reconnectTries: 10,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
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
    console.log('Trying to connect: ' + dbUri);
    console.log('Database Connection Status: Successful');
    console.log('Database Connnection Established');

    // Ending Database Connections
    // console.log('Finished Database Connectivity');
  });

  // For handling and reporting error
  connection.on('error',(err) => {
    console.log('Trying to connect: ' + dbUri);
    console.log('Database Connection Status: Unsuccessful');
    console.log('Database Connection Error: ' + err);

    // Ending Database Connections
    // console.log('Finished Database Connectivity');
  });

  // For handling and reporting disconnection
  connection.on('disconnected', () => {
    console.log('Trying to connect: ' + dbUri);
    console.log('Database Connection Status: Unsuccessful');
    console.log('Database Connection: Disconnected');

    // Ending Database Connections
    // console.log('Finished Database Connectivity');
  });
};

module.exports = initDatabase;
