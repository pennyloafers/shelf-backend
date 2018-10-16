const express = require('express');
const cassClient = require('../services/cassandra-client');
const secret = require('../secret');
const Uuid = require('cassandra-driver').types.Uuid;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const async = require('async'); 
const router = express();

const saltRounds = 10;

router.post('/signup', signup);
router.post('/login', login);

/*
	Creates user.  Checks if either username or
	email is in the database already.  If not,
	user credentials are stored into all user tables.
*/
function signup(req, res) {
	async.waterfall([
		function(callback) {
			callback(null, req.body);
		},
		validateSignup,
		hashPassword,
		checkUser,
		checkEmail,
		createUser,
		createUserByEmail
	], function(err, status, result) {
		return res.status(status).send(result);
	});
}

/* 
	Validate post data
	Post body should include user, email, and password
	Verifies if username, email, and password are valid
*/
function validateSignup(body, callback) {
	// Username must be at least 6 alpha-numeric characters with no special characters
	let userRegex = new RegExp("^(?=.{4,})(?!.*\\W).*$", "g");
	// Password must be at least 8 alpha-numeric characters
	// with at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character
	let passRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g");
	// Matches valid emails
	let emailRegex = new RegExp("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", "g");
	
	// Validate post data
	let keys = Object.keys(body);
	if (!keys.includes('user') || !keys.includes('password') || !keys.includes('email')) {
		callback(true, 400, {success: false, error: 'Missing post parameters'});
	} else if (!userRegex.test(body.user)) {
		callback(true, 400, {success: false, error: 'Invalid username'});
	} else if (!emailRegex.test(body.email)) {
		callback(true, 400, {success: false, error: 'Invalid email'});
	} else if (!passRegex.test(body.password)) {
		callback(true, 400, {success: false, error: 'Invalid password'});
	} else {
		callback(null, body);
	}
}

/*
	Hashes the password
	Overwrites body.password with hash
*/
function hashPassword(body, callback) {
	bcrypt.hash(body.password, saltRounds, function(err, hash) {
		body.password = hash;
		callback(null, body)
	});
}

// Check if username is taken
function checkUser(body, callback) {
	let query = "SELECT username FROM shelf.users WHERE username = ?";
	const params = [body.user];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		// if result contains a user return 400 else next check
		if (result.rowLength > 0) {
			callback(true, 400, {success: false, error: 'Username is taken'});
		} else {
			callback(null, body);
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 100'});
	})
}

// Check if email is taken
function checkEmail(body, callback) {
	let query = "SELECT email FROM shelf.users_by_email WHERE email = ?";
	const params = [body.email];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		// if result contains an email return 400 else create user
		if (result.rowLength > 0) {
			callback(true, 400, {success: false, error: 'Email is taken'});
		} else {
			callback(null, body);
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 101'});
	})
}

// Store hash and user info into users table
function createUser(body, callback) {
	body.id = Uuid.random();
	let query = "INSERT INTO shelf.users (id, username, password, email) VALUES (?, ?, ?, ?)"
	const params = [body.id, body.user, body.password, body.email]
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		callback(null, body);
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 102'});
	})
}

// Store user info into users_by_email table
function createUserByEmail(body, callback) {
	let query = "INSERT INTO shelf.users_by_email (id, username, email) VALUES (?, ?, ?)"
	const params = [body.id, body.user, body.email]
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		console.log('Created user: %s', body.user);
		callback(null, 200, {success: true})
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error 103'});
	})
}



// Login
function login(req, res) {
	async.waterfall([
		function(callback) {
			callback(null, req.body);
		},
		validateLogin,
		getHash,
		compareHash
	], function(err, status, result) {
		return res.status(status).send(result);
	});
}

/* 
	Validate post data
	Post body should include user, and password
*/
function validateLogin(body, callback) {
	let keys = Object.keys(body);
	if (!keys.includes('user') || !keys.includes('password')) {
		callback(true, 400, {success: false, error: 'Missing post parameters'});
	} else {
		callback(null, body);
	}
}

/*
	Retrieves password hash from users table
	Stores hash in body.hash
*/
function getHash(body, callback) {
	let query = "SELECT password FROM shelf.users WHERE username = ?"
	const params = [body.user]
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		if (result.rowLength == 0) {
			callback(true, 400, {success: false, error: 'Invalid username or password'});
		} else {
			body.hash = result.rows[0].password;
			callback(null, body);
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error 104'});
	})
}

/*
	Compares password to hash
	If match, returns jwt token
*/
function compareHash(body, callback) {
	bcrypt.compare(body.password, body.hash, function(err, result) {
		if (result) {
			// generate jwt token and send back
			var token = jwt.sign({ user: body.user }, secret.jwt, {
				expiresIn: 86400 // expires in 24 hours
			});
			callback(null, 200, {success: true, token: token})
		} else {
			// if passwords do not match return 400
			callback(true, 400, {success: false, error: 'Invalid username or password'});
		}
	});
}

module.exports = router;