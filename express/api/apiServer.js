const fs = require('fs');
const https = require('https');
const express = require('express');
const bodyParser = require("body-parser");
const cassClient = require('./services/cassandra-client');
const jwt = require('jsonwebtoken');

const secret = require('./secret');
const shelvesByUser = require('./src/shelves_by_username');
const shelfItems = require('./src/shelf_items');
const itemsDescription = require('./src/item_description');
const userNoAuth = require('./src/user_no_auth');
const userAuth = require('./src/user_auth');

const app = express();
const port = 8888;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*
	jwt verification middleware
	header format:
		Authorization: bearer TOKEN
	username is stored in req.user
*/
function verifyToken(req, res, next) {
	// Check if authorization header exists
	if (req.headers.authorization) {
		// Check for malformed authorization header
		var auth = req.headers.authorization.split(' ');
		if (auth.length > 1 && auth[0].toLowerCase() === 'bearer') {
			// Verify the token
			jwt.verify(auth[1], secret.jwt, function (err, decodedToken) {
				if (err || !decodedToken) {
					res.status(401).send({success: false, error: 'Invalid token'});
				} else {
					req.user = decodedToken.user;
					next();
				}
			});
		} else {
			res.status(400).send({success: false, error: 'Malformed authorization header'});
		}
	} else {
		res.status(400).send({success: false, error: 'Missing authorization header'});
	}
}

app.use('/user', userNoAuth);
app.use('/user', verifyToken, userAuth);
app.use('/shelves', verifyToken, shelvesByUser);
app.use('/shelves', verifyToken, shelfItems);
app.use('/shelves', verifyToken, itemsDescription);

app.get('/', (req, res) => res.send("HEY it is connected to cassandra"));

app.get('/test', verifyToken, (req, res) => res.send(req.user));



const server = https.createServer({
	key: fs.readFileSync('../.https/server.key'),
	cert: fs.readFileSync('../.https/server.cert')
  }, app);
  
//connect express to cassandra and start listening.
cassClient.connect(function (err) {
	if (err) {
		return console.error(err);
	}
    console.log('Connected to cluster with %d host(s): %j', cassClient.hosts.length, cassClient.hosts.keys());
    console.log('Keyspaces: %j', Object.keys(cassClient.metadata.keyspaces));
	
	server.listen(port,  () => {
        console.log(`App is listening on port ${port}!`)
    });
    // app.listen(port, () => {
    //     console.log(`App is listening on port ${port}!`)
    // });
    
    console.log("Connected to Cassandra Server ");
});
