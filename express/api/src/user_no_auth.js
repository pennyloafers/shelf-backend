const express = require('express');
const cassClient = require('../services/cassandra-client');
const secret = require('../secret');
const Uuid = require('cassandra-driver').types.Uuid;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const async = require('async');
const nodeMailer = require('nodemailer'); 
const router = express();

const saltRounds = 10;

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot', forgot);
router.post('/forgot/verify', verify);
router.post('/forgot/reset', reset);

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
	if (!keys.includes('username') || !keys.includes('password') || !keys.includes('email')) {
		callback(true, 400, {success: false, error: 'Missing post parameters'});
	} else if (!userRegex.test(body.username) || typeof body.username != 'string') {
		callback(true, 400, {success: false, error: 'Invalid username'});
	} else if (!emailRegex.test(body.email) || typeof body.email != 'string') {
		callback(true, 400, {success: false, error: 'Invalid email'});
	} else if (!passRegex.test(body.password) || typeof body.password != 'string') {
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
	const params = [body.username];
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
	const params = [body.id, body.username, body.password, body.email]
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
	const params = [body.id, body.username, body.email]
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		console.log('Created user: %s', body.username);
		callback(null, 200, {success: true})
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 103'});
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
	if (!keys.includes('username') || !keys.includes('password')) {
		callback(true, 400, {success: false, error: 'Missing post parameters'});
	} else if (typeof body.username != 'string' || typeof body.password != 'string') {
		callback(true, 400, {success: false, error: 'Invalid username or password'});
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
	const params = [body.username]
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
		callback(true, 500, {success: false, error: 'Server error: 104'});
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
			var token = jwt.sign({ user: body.username }, secret.jwt, {
				expiresIn: 86400 // expires in 24 hours
			});
			callback(null, 200, {success: true, token: token})
		} else {
			// if passwords do not match return 400
			callback(true, 400, {success: false, error: 'Invalid username or password'});
		}
	});
}

/*
	Forgot password
	Generates and emails unique link for resetting password
*/
function forgot(req, res) {
	async.waterfall([
		function(callback) {
			callback(null, req.body);
		},
		validateForgot,
		verifyEmail,
		generateUrl,
		updateForgot,
		sendEmail
		], function(err, status, result) {
			return res.status(status).send(result);
	});
}

/* 
	Validate post data
	Post body should include email
*/
function validateForgot(body, callback) {
	let keys = Object.keys(body);
	if (!keys.includes('email')) {
		callback(true, 400, {success: false, error: 'Missing post parameters'});
	} else if (typeof body.email != 'string') {
		callback(true, 400, {success: false, error: 'Invalid email'});
	} else {
		callback(null, body);
	}
}

/*
	Check if email is in users_by_email
	If found store username in body.username
	If not found return 200 for security
*/
function verifyEmail(body, callback) {
	let query = "SELECT username FROM shelf.users_by_email WHERE email = ?";
	const params = [body.email];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		// if result contains an email return 400 else create user
		if (result.rowLength > 0) {
			body.username = result.rows[0].username;
			callback(null, body);
		} else {
			callback(true, 200, {success: true});
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 105'});
	})
}

/*
	Generates a random string
	String is stored in body.id
	This string will be stored into forgot table
	and will be used to validate the reset request
*/
function generateUrl(body, callback) {
	crypto.randomBytes(20, function(err, buffer) {
		body.token = buffer.toString('hex');
		callback(null, body);
	});
}

/*
	Insert password token into forgot table
	This data has a time to live of 30 min.
	After expired, data will be deleted from forgot table
*/
function updateForgot(body, callback) {
	let query = "INSERT INTO shelf.forgot (id, username) VALUES (?, ?) USING TTL 1800"
	const params = [body.token, body.username]
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		callback(null, body);
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 106'});
	})
}

function sendEmail(body, callback) {
	let transporter = nodeMailer.createTransport({
		service: 'gmail',
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			type: "OAuth2",
			user: secret.email,
			clientId: secret.emailId,
			clientSecret: secret.emailSecret,
			refreshToken: secret.emailRefresh
		}
	});
	let mailOptions = {
		from: '"Shelf Password Recovery" <' + secret.email + '>',
		to: body.email,
		subject: 'Password Reset',
		html: `
			<h2>Shelf Password Reset Request</h2>
			<p>Hello ${body.username},<br>
			Someone has requested a password reset for your shelf account.
			If you didn't request a password reset, just ignore this email and
			your password will stay the same.</p>
			<p>If you do want to reset your password, please click below.</p>
			<a href="https://www.google.com/?q=${body.token}">RESET PASSWORD</a>
			<p>(Note: This link will expire in 30 minutes.)</p>
			<p>Thank you for using Shelf!<br>
			The Shelf Team</p>`
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
			callback(true, 500, {success: false, error: 'Server error: 107'});
		}
		callback(null, 200, {success: true, token: body.token});
	});
}

// Verifies if reset token is valid
function verify(req, res) {
	let keys = Object.keys(req.body);
	if (!keys.includes('token')) {
		return res.status(400).send({success: false, error: 'Missing post parameters'});
	} else if (typeof req.body.token != 'string') {
		return res.status(400).send({success: false, error: 'Invalid token'});
	}
	let query = "SELECT id FROM shelf.forgot WHERE id = ?";
	const params = [req.body.token];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		if (result.rowLength > 0) {
			return res.status(200).send({success: true, valid: true});
		} else {
			return res.status(400).send({success: true, valid: false});
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		res.sattus(500).send({success: false, error: 'Server error: 108'});
	})
}

// Resets password
function reset(req, res) {
	async.waterfall([
		function(callback) {
			callback(null, req.body);
		},
		validateReset,
		hashPassword,
		getUser,
		updateUser,
		removeForgot
		], function(err, status, result) {
			return res.status(status).send(result);
	});
}

/* 
	Validate post data
	Post body should include token and password
*/
function validateReset(body, callback) {
	let passRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g");
	
	// Validate post data
	let keys = Object.keys(body);
	if (!keys.includes('token') || !keys.includes('password')) {
		callback(true, 400, {success: false, error: 'Missing post parameters'});
	} else if (typeof body.token != 'string') {
		callback(true, 400, {success: false, error: 'Invalid token'});
	} else if (!passRegex.test(body.password) || typeof body.password != 'string') {
		callback(true, 400, {success: false, error: 'Invalid password'});
	} else {
		callback(null, body);
	}
}

/*
	Retrieves username from forgot table
	Username is stored in body.username
*/
function getUser(body, callback) {
	let query = "SELECT username FROM shelf.forgot WHERE id = ?";
	const params = [body.token];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		// if result contains an email return 400 else create user
		if (result.rowLength > 0) {
			body.username = result.rows[0].username;
			callback(null, body);
		} else {
			callback(true, 400, {success: false, error: "This token is either invalid or expired"});
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 109'});
	})
}

// users table is updated with new password
function updateUser(body, callback) {
	let query = "UPDATE shelf.users SET password = ? WHERE username = ?";
	const params = [body.password, body.username];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		callback(null, body);
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 110'});
	})
}

// Token is deleted from forgot table
function removeForgot(body, callback) {
	let query = "DELETE FROM shelf.forgot WHERE id = ?";
	const params = [body.token];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		callback(null, 200, {success: true});
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 111'});
	})
}

module.exports = router;