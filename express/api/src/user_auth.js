const express = require('express');
const cassClient = require('../services/cassandra-client');
const secret = require('../secret');
const bcrypt = require('bcryptjs');
const async = require('async');
const router = express();

const saltRounds = 10;

router.post('/update/email', changeEmail);
router.post('/update/password', changePassword);

// Updates user email
function changeEmail(req, res) {
	async.waterfall([
		function(callback) {
			req.body.user = req.user;
			callback(null, req.body);
		},
		validateEmail,
		checkEmail,
		getEmail,
		updateUser,
		deleteEmail,
		updateEmail
		], function(err, status, result) {
			return res.status(status).send(result);
	});
}

// Validate post data
function validateEmail(body, callback) {
	let emailRegex = new RegExp("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", "g");
	
	let keys = Object.keys(body);
	if (!keys.includes('email')) {
		callback(true, 400, {success: false, error: 'Missing post parameters'});
	} else if (!emailRegex.test(body.email) || typeof body.email != 'string') {
		callback(true, 400, {success: false, error: 'Invalid email'})
	} else {
		callback(null, body);
	}
}

// Check if email is taken
function checkEmail(body, callback) {
	let query = "SELECT email FROM shelf.users_by_email WHERE email = ?";
	const params = [body.email];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		// if result contains an email return 400
		if (result.rowLength > 0) {
			callback(true, 400, {success: false, error: 'Email is taken'});
		} else {
			callback(null, body);
		}
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 200'});
	})
}

// Store old email in body.emailOld
function getEmail(body, callback) {
	let query = "SELECT email, id FROM shelf.users WHERE username = ?";
	const params = [body.user];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		body.id = result.rows[0].id;
		body.emailOld = result.rows[0].email;
		callback(null, body);
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success: false, error: 'Server error: 200'});
	})
}

// Update user table with new email
function updateUser(body, callback) {
	let query = "UPDATE shelf.users SET email = ? WHERE username = ?";
	const params = [body.email, body.user];
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		callback(null, body);
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success:false, error: 'Server error: 201'});
	})
}

// Delete email from user_by_email
function deleteEmail(body, callback) {
	let query = "DELETE FROM shelf.users_by_email WHERE email = ?"
	const params = [body.emailOld]
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		callback(null, body);
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success:false, error: 'Server error: 202'});
	})
}

// Update user_by_email table with new email
function updateEmail(body, callback) {
	let query = "INSERT INTO shelf.users_by_email (id, username, email) VALUES (?, ?, ?)"
	const params = [body.id, body.user, body.email]
	cassClient.execute(query, params, { prepare: true })
	.then(result => {
		callback(null, 200, {success: true});
	})
	// if error return 500
	.catch (error => {
		console.log(error.message);
		callback(true, 500, {success:false, error: 'Server error: 203'});
	})
}

// Updates user password
function changePassword(req, res) {
	let passRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g");
	
	// Validate post data
	let keys = Object.keys(req.body);
	if (!keys.includes('password')) {	
		return res.status(400).send({success: false, error: 'Missing post parameters'});
	} else if (!passRegex.test(req.body.password) || typeof req.body.password != 'string') {
		return res.status(400).send({success: false, error: 'Invalid password'});
	}

	// Hash the password
	bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
		// Update user table with new password hash
		let query = "UPDATE shelf.users SET password = ? WHERE username = ?";
		const params = [hash, req.user];
		cassClient.execute(query, params, { prepare: true })
		.then(result => {
			return res.status(200).send({success: true});
		})
		// if error return 500
		.catch (error => {
			console.log(error.message);
			return res.status(500).send({success: false, error: 'Server error: 204'});
		})
	});
}

module.exports = router;