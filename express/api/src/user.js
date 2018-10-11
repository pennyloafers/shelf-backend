const express = require('express');
const cassClient = require('../services/cassandra-client');
const Uuid = require('cassandra-driver').types.Uuid;
const jwt = require('express-jwt');
const bcrypt = require('bcryptjs');
const router = express();

const saltRounds = 10;

router.post('/signup', signup);
router.post('/login', login);

// Create user
function signup(req, res) {
	// Check if username is taken
	let query = "SELECT username FROM shelf.users WHERE username = ?";
	const params = [req.body.user];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		//console.log(result);
		// if result contains a user return 400
		if (result.rowLength > 0) {
			return res.status(400).send({error: 'Username is taken'});
		} else {
			checkEmail(req, res);
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		return res.status(500).send({error: 'Server error'});
	})
}

function checkEmail(req, res) {
	// Check if email is taken
	let query = "SELECT email FROM shelf.users_by_email WHERE email = ?";
	const params = [req.body.email];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		// if result contains an email return 400
		if (result.rowLength > 0) {
			return res.status(400).send({error: 'Email is already used'});
		} else {
			createUser(req, res);
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		return res.status(500).send({error: 'Server error'});
	})
}

function createUser(req, res) {
	// hash password
	bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
		// Store hash and user info into users table
		const id = Uuid.random();
		let query = "INSERT INTO shelf.users (id, username, password, email) VALUES (?, ?, ?, ?)"
		const params = [id, req.body.user, hash, req.body.email]
		cassClient.execute(query, params, { prepare: true })
		.then(result => {
			// If successfully inserted into users, insert into users_by_email
			let query = "INSERT INTO shelf.users_by_email (id, username, email) VALUES (?, ?, ?)"
			const params = [id, req.body.user, req.body.email]
			cassClient.execute(query, params, { prepare: true })
			.then(result => {
				console.log('Created user: %s', req.body.user);
				return res.status(200).send({message: 'Success'});
			})
			// if error return 500
			.catch (error => {
				console.log(error.message);
				return res.status(500).send({error: 'Server error'});
			})
		})
		// if error return 500
		.catch (error => {
			console.log(error.message);
			return res.status(500).send({error: 'Server error'});
		})
	});
}

// Login
function login(req, res) {

}

module.exports = router;