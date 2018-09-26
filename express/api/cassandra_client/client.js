/** 
 * The app's global cassandra client
 *  Data-stax suggests one client instance.
 */

const cassandra = require('cassandra-driver');

//cassandra role login
const authProvider = new cassandra.auth.PlainTextAuthProvider('cassandra','cassandra');

//should change default username/password to cassandra
//const authProvidertest = new cassandra.auth.PlainTextAuthProvider('mcarl','password');

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

//test connect
const client = new cassandra.Client({
    contactPoints: ['172.20.0.3'],
    authProvider: authProvider,
    socketOptions:{
        connectTimeout: 15000 
    }
    //keyspace: 'our_app'
});


module.exports = client; 