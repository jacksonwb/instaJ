const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const db = require('./bin/db')
const userModel = require('./models/userModel');
const auth = require('./bin/authenticate');
const SEC = 'Secret';
const mail = require('./bin/mail');

const app = express();
const port = 3000;

// TODO
// Change User info

// Middleware
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(auth.authJWT(SEC));

// Home
app.get('/', (req, res) => {
	let options = {
		root: path.join(__dirname, 'views')
	}
	res.sendFile('main.html', options);
	// res.send('Hello World');
});

// Dist
app.get('/public/main_app.bundle.js' ,(req, res) => {
	let options = {
		root: path.join(__dirname, 'dist')
	}
	res.sendFile('main_app.bundle.js', options);
})

// Auth test
app.get('/auth', (req, res) => {
	if (req.user) {
		res.send('Welcome, ' + req.user);
	} else {
		res.send('Not Authenticated');
	}
})

// Login
app.get('/login', (req, res) => {
	let options = {
		root: path.join(__dirname, 'views')
	}
	res.sendFile('login.html', options);
})

app.post('/login', (req, res) => {
	userModel.login(db, req.body.email, req.body.password, (valid, user) => {
		if (valid && user.is_verify) {
			//generate Token and set in cookie
			res.cookie('JWT', auth.generateJWT(user.email, 100000, SEC),{httpOnly: true, maxAge: 100000});
			res.redirect('/auth');
		} else if (valid && !user.is_verify) {
			mail.mailValidate(user.email, user.name, `http://localhost:${port}/validate`, generateValidationToken(user.email, 100000, SEC));
			res.send('Please Validate Email - Email resent');
		} else {
			let options = {
				root: path.join(__dirname, 'views')
			}
			res.sendFile('./login_fail.html', options)
		}
	})
})

// Restore Password
function generateResetToken(email, expire, secret) {
	return auth.signToken({email: email, expire: expire + Date.now(), fn:'reset'}, secret);
}

app.get('/restore', (req, res) => {
	let options = {
		root: path.join(__dirname, 'views')
	}
	res.sendFile('restore.html', options);
})

app.post('/restore', (req, res) => {
	let email = req.body.email;
	if (email) {
		userModel.get_by_email(db, email, (user) => {
			if (user) {
				mail.mailReset(email, user.name, `http://localhost:${port}/reset`, generateResetToken(email, 100000, SEC))
				res.send('Reset Email Sent')
			} else {
				res.send('Invalid Email')
			}
		})
	}
})

app.get('/reset', (req, res) => {
	if (req.query.token && auth.verifyToken(req.query.token, SEC)) {
		let token = auth.decodeToken(req.query.token);
		console.log(token)
		if (token.data.fn === 'reset' && token.data.expire > Date.now()) {
			//set cookie and send form
			res.cookie('resetEmailToken', req.query.token);
			let options = {
				root: path.join(__dirname, 'views')
			}
			res.sendFile('reset.html', options);
			return;
		}
	}
	res.send('Invalid Token')
})

app.post('/reset', (req, res) => {
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
		res.send('success!');
		return;
	}
	res.send('Invalid')
})

// Logout
app.get('/logout', (req, res) => {
	res.clearCookie('JWT')
	res.redirect('/auth')
})

// Validate
app.get('/validate', (req, res) => {
	if (req.query.token && auth.verifyToken(req.query.token, SEC)) {
		let token = auth.decodeToken(req.query.token);
		console.log(token)
		if (token.data.expire > Date.now() && token.data.fn === 'validate') {
			console.log('validating..')
			userModel.validateEmail(db, token.data.email);
			res.cookie('JWT', auth.generateJWT(token.data.email, 100000, SEC),{httpOnly: true, maxAge: 100000});
			res.redirect('/auth');
		} else {
			res.send('Invalid Token')
		}
	}
})

// Register
function validateRegistration(name, email, password) {
	return new Promise((resolve, reject) => {
		let tests = []
		tests.push(/^[a-zA-Z0-9. ]+$/.test(name));
		tests.push(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email))
		tests.push(password.length > 8)
		tests.push(((password) => {
			let hasUpperCase = /[A-Z]/.test(password);
			let hasLowerCase = /[a-z]/.test(password);
			let hasNumbers = /\d/.test(password);
			let hasNonalphas = /\W/.test(password);
			return (hasUpperCase + hasLowerCase + hasNumbers + hasNonalphas > 3)
		})(password))
		userModel.get_by_email

		userModel.get_by_email(db, email, (row) => {
			tests.push(!Boolean(row))
			resolve(tests)
		})
	})
}

function generateValidationToken(email, expire, secret) {
	return auth.signToken({email: email, expire: expire + Date.now(), fn:'validate'}, secret);
}

app.get('/register', (req, res) => {
	let options = {
		root: path.join(__dirname, 'views')
	}
	res.sendFile('register.html', options);
})

app.post('/register', (req, res) => {
	let name = req.body.name;
	let email = req.body.email;
	let password = req.body.password;
	let pref_notify = Boolean(req.body.pref_notify);
	validateRegistration(name, email, password).then((tests) => {
		if (tests.every(val => val)) {
			userModel.add(db, name, email, password, pref_notify, 0);
			mail.mailValidate(email, name, `http://localhost:${port}/validate`, generateValidationToken(email, 100000, SEC));
			res.send('Confirmation Email Sent');
		} else {
			console.log('Invalid registration')
			res.redirect('/register')
		}
	})
})

//Users
app.get('/users', (req, res) => {
	userModel.list(db, (data) => {
		res.send(data);
	});
});

app.get('/users/:user', (req, res) => {
	userModel.get_by_email(db, req.params.user, (data) => {
		res.json(data);
	})
})

app.listen(port, () => console.log(`Listening on port: ${port}`));
