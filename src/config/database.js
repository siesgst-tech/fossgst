const mongoose = require('mongoose');

module.exports.connect = function () {
  return new Promise((resolve, reject) => {
    console.log('Initializing Database Connection');

    const options = {
      // reconnectTries: 10,
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
    const connection = mongoose.connection;
    console.log('Trying to connect: ' + dbUri);

    connection.on('connected', () => {
      console.log('Database Connection Status: Successful');
      console.log('Database Connnection Established');
      resolve();
    });

    // For handling and reporting error
    connection.on('error', (err) => {
      console.log('Database Connection Status: Unsuccessful');
      console.log('Database Connection Error: ' + err);
      reject();
    });

    // For handling and reporting disconnection
    connection.on('disconnected', () => {
      console.log('Database Connection Status: Unsuccessful');
      console.log('Database Connection: Disconnected');
      reject();
    });

  });
}
