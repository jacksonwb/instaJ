const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const db = require('./bin/db')
const users = require('./models/user');
const auth = require('./bin/authenticate');
const SEC = 'Secret';
const mail = require('./bin/mail');

const app = express();
const port = 3000;

// TODO
// Forgot password
// Change User info

// Middleware
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(auth.authJWT(SEC));

// Home
app.get('/', (req, res) => {
	res.send('HOME PAGE');
	// res.send('Hello World');
});

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
	users.login(db, req.body.email, req.body.password, (valid, user) => {
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
		if (token.data.expire > Date.now()) {
			console.log('validating..')
			users.validateEmail(db, token.data.email);
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
		users.get_by_email

		users.get_by_email(db, email, (row) => {
			tests.push(!Boolean(row))
			resolve(tests)
		})
	})
}

function generateValidationToken(email, expire, secret) {
	return auth.signToken({email: email, expire: expire + Date.now()}, secret);
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
			users.add(db, name, email, password, pref_notify, 0);
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
	users.list(db, (data) => {
		res.send(data);
	});
});

app.get('/users/:user', (req, res) => {
	users.get_by_email(db, req.params.user, (data) => {
		res.json(data);
	})
})

app.listen(port, () => console.log(`Listening on port: ${port}`));
