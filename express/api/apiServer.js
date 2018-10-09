const express = require('express');
const cassClient = require('./services/cassandra-client');
const bodyParser = require("body-parser");

const secret = require('./secret.js');

const app = express();
const port = 8888;

console.log(secret.jwt());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.get('/', (req, res) => res.send("HEY it is connected to cassandra"));

//app.listen(port, () => console.log(`Example app listening on port ${port}!`));


//connect express to cassandra and start listening.
cassClient.connect(function (err) {
    if (err) return console.error(err);
    console.log('Connected to cluster with %d host(s): %j', cassClient.hosts.length, cassClient.hosts.keys());
    console.log('Keyspaces: %j', Object.keys(cassClient.metadata.keyspaces));
    
    app.listen(port, () => {
        console.log(`App is listening on port ${port}!`)
    });
    
    console.log("Connected to Cassandra Server ");
});
