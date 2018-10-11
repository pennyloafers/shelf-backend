const express = require('express');
const cassClient = require('../services/cassandra-client');
const jwt = require('express-jwt');
const router = express();

router.post('/signup', signup);
router.post('/login', login);

// Create user
function signup(req, res) {
	// Check if username exists
	let query = "SELECT username FROM users WHERE username = ?";
	const params = [req.body.user];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		console.log(result);
		// if result contains a user return 400
		// else add user to database
		//res.send({ /*data*/ });
	})
	.catch (error => {
		console.log(error.message);
		res.status(500);
		res.send({ /*error*/ });
	})
}

// Login
function login(req, res) {

}

module.exports = router;