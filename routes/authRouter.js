const express = require('express')
const auth = require('../bin/authenticate')
const SEC = auth.SEC
const db = require('../bin/db')
const mail = require('../bin/mail')

// DB Models
const userModel = require('../models/userModel');

module.exports = function(port) {
	const router = express.Router()

	// Auth test
	router.get('/auth', (req, res) => {
		if (req.user) {
			res.send('Welcome, ' + req.user);
		} else {
			res.send('Not Authenticated');
		}
	})

	router.get('/api/auth', (req, res) => {
		if (req.user) {
			userModel.get_by_email(db, req.user, (user) => {
				res.json({
					currentUser:req.user,
					name: user.name,
					id_user: user.id_user
				});

			})
		} else {
			res.json({});
		}
	})

	// Login
	router.get('/login', (req, res) => {
		if (req.user) {
			res.redirect('/')
			return;
		}
		res.render('login')
	})

	router.post('/login', (req, res) => {
		userModel.login(db, req.body.email, req.body.password, (valid, user) => {
			if (valid && user.is_verify) {
				//generate Token and set in cookie
				res.cookie('JWT', auth.generateJWT(user.email, 10000000, SEC),{httpOnly: true, maxAge: 10000000});
				res.redirect('/');
			} else if (valid && !user.is_verify) {
				mail.mailValidate(user.email, user.name, `http://localhost:${port}/validate`, generateValidationToken(user.email, 100000, SEC));
				res.render('message', {message:'Please Validate Email - Email resent'});
			} else {
				res.render('login', {errorMessage:'Bad Credentials!'})
			}
		})
	})

	// Restore Password
	function generateResetToken(email, expire, secret) {
		return auth.signToken({email: email, expire: expire + Date.now(), fn:'reset'}, secret);
	}

	router.get('/restore', (req, res) => {
		res.render('restore')
	})

	router.post('/restore', (req, res) => {
		let email = req.body.email;
		if (email) {
			userModel.get_by_email(db, email, (user) => {
				if (user) {
					mail.mailReset(email, user.name, `http://localhost:${port}/reset`, generateResetToken(email, 100000, SEC))
					res.render('message', {message:'Reset email has been sent'})
				} else {
					res.render('message', {message: 'Invalid email'})
				}
			})
		}
	})

	router.get('/reset', (req, res) => {
		if (req.query.token && auth.verifyToken(req.query.token, SEC)) {
			let token = auth.decodeToken(req.query.token);
			console.log(token)
			if (token.data.fn === 'reset' && token.data.expire > Date.now()) {
				//set cookie and send form
				res.cookie('resetEmailToken', req.query.token);
				res.render('reset')
				return;
			}
		}
		res.send('Invalid Token')
	})

	router.post('/reset', (req, res) => {
		let tokenData = undefined
		let valid = false
		if (req.cookies.resetEmailToken) {
			tokenData = auth.decodeToken(req.cookies.resetEmailToken)
		}
		if (tokenData && tokenData.data.fn === 'reset'
			&& tokenData.data.expire > Date.now()
			&& auth.verifyToken(req.cookies.resetEmailToken, SEC)) {
				valid = true;
			}
		if (valid && req.body.password === req.body.confirm_password) {
			// update password value
			userModel.updateUserPassword(db, tokenData.data.email, req.body.password)
			res.render('message', {message: 'Password change succesful'});
			return;
		}
		res.render('message', {message: 'Invalid'})
	})

	// Logout
	router.get('/logout', (req, res) => {
		res.clearCookie('JWT')
		res.redirect('/')
	})

	// Validate
	router.get('/validate', (req, res) => {
		if (req.query.token && auth.verifyToken(req.query.token, SEC)) {
			let token = auth.decodeToken(req.query.token);
			console.log(token)
			if (token.data.expire > Date.now() && token.data.fn === 'validate') {
				console.log('validating..')
				userModel.validateEmail(db, token.data.email);
				res.cookie('JWT', auth.generateJWT(token.data.email, 100000, SEC),{httpOnly: true, maxAge: 100000});
				res.redirect('/');
			} else {
				res.send('Invalid Token')
			}
		}
	})

	// Register
	function createTestObject(bool, message) {
		return {testVal: bool,
				testName: message}
	}

	function validateRegistration(name, email, password) {
		return new Promise((resolve, reject) => {
			let tests = []
			tests.push(createTestObject(/^[a-zA-Z0-9. ]+$/.test(name), "Invalid Name"));
			tests.push(createTestObject(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email), "Invalid Email Address"))
			tests.push(createTestObject(password.length > 8, "Password must be at least 8 characters"))
			tests.push(createTestObject(((password) => {
				let hasUpperCase = /[A-Z]/.test(password);
				let hasLowerCase = /[a-z]/.test(password);
				let hasNumbers = /\d/.test(password);
				let hasNonalphas = /\W/.test(password);
				return (hasUpperCase + hasLowerCase + hasNumbers + hasNonalphas >= 3)
			})(password), "Password must have 3 of the following: uppercase, lowercase, numbers, non-alphanumeric"))

			userModel.get_by_email(db, email, (row) => {
				tests.push(createTestObject(!Boolean(row), 'This email has already been used'))
				resolve(tests)
			})
		})
	}

	function generateValidationToken(email, expire, secret) {
		return auth.signToken({email: email, expire: expire + Date.now(), fn:'validate'}, secret);
	}

	router.get('/register', (req, res) => {
		res.render('register')
	})

	router.post('/register', (req, res) => {
		let name = req.body.name;
		let email = req.body.email;
		let password = req.body.password;
		let pref_notify = Boolean(req.body.pref_notify);
		validateRegistration(name, email, password).then((tests) => {
			if (tests.every(val => val.testVal)) {
				userModel.add(db, name, email, password, pref_notify, 0);
				mail.mailValidate(email, name, `http://localhost:${port}/validate`, generateValidationToken(email, 100000, SEC));
				res.render('message', {message: 'Confirmation Email Sent'})
			} else {
				for(test of tests) {
					if (!test.testVal) {
						res.render('register', {errorMessage: test.testName})
						return
					}
				}
			}
		})
	})

	// User Settings
	router.get('/settings', (req, res) => {
		if (!req.user) {
			res.redirect('/login')
			return;
		}
		res.render('settings')
	})

	router.get('/settings/username', (req, res) => {
		if (!req.user) {
			res.redirect('/login')
			return;
		}
		res.render('settings-username')
	})

	router.post('/settings/username', (req, res) => {
		if (req.user) {
			let name = req.body.username
			if (name && /^[a-zA-Z0-9. ]+$/.test(name)) {
				userModel.updateUserValue(db, req.user, 'name', name, (err) => {
					console.error(err)
				})
				res.render('settings-username', {message: `Updated username to - ${name}`})
			} else {
				res.render('settings-username', {message: 'Invalid username'})
			}
		} else {
			res.sendStatus(401)
		}
	})

	router.get('/settings/email', (req, res) => {
		if (!req.user) {
			res.redirect('/login')
			return;
		}
		res.render('settings-email')
	})

	router.post('/settings/email', (req, res) => {
		if (req.user) {
			let email = req.body.email
			if (email && /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
				console.log('good')
				userModel.updateUserValue(db, req.user, 'is_verify', 0, (err) => {
					console.error(err)
				})
				userModel.updateUserValue(db, req.user, 'email', email, (err) => {
					console.error(err)
				})
				res.clearCookie('JWT')
				mail.mailValidate(email, '', `http://localhost:${port}/validate`, generateValidationToken(email, 100000, SEC));
				res.render('message', {message: 'Confirmation Email Sent'})
			} else {
				res.render('settings-email', {message: 'Invalid email'})
			}
		} else {
			res.sendStatus(401)
		}
	})

	return router
}
