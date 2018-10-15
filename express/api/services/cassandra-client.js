/** 
 * The app's global cassandra client
 *  Data-stax suggests one client instance.
 */

const cassandra = require('cassandra-driver');
const secret = require('../secret');
const ip = '172.20.0.3';
//cassandra role login
const authProvider = new cassandra.auth.PlainTextAuthProvider('shelf_user',secret.cassPass);

//test connect
const client = new cassandra.Client({
    contactPoints: [ip],
    authProvider: authProvider,
    socketOptions:{
        connectTimeout: 15000 
    },
    keyspace: 'shelf'
});

module.exports = client;


// example
// const fs = require("fs");
// const sslOptions = {
//     key: fs.readFileSync('/.cassandraSSL/cass100.key.pem'),
//     cert: fs.readFileSync('/.cassandraSSL/cass100.cer.pem'),
//     ca: [fs.readFileSync('/.cassandraSSL/cass100.cer.pem')]
// };

//connect to cassandra example
// const client = new cassandra.Client({
//     contactPoints: ['1.1.1.1'],
//     authProvider: authProvider,
//     sslOptions: sslOptions,
//     keyspace: our_app,
// });
