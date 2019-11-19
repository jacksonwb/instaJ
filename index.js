const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const db = require('./bin/db')
const users = require('./models/user');
const auth = require('./bin/authenticate');
const SEC = 'Secret';

const app = express();
const port = 3000;

users.list(db, (row) => {
	console.log(row)});

// Middleware
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(auth.authJWT(SEC));

// Routing
app.get('/', (req, res) => {
	res.send('HOME PAGE');
	// res.send('Hello World');
});

app.get('/login', (req, res) => {
	let options = {
		root: path.join(__dirname, 'views')
	}
	res.sendFile('login.html', options);
})

app.get('/auth', (req, res) => {
	if (req.user) {
		res.send('Welcome, ' + req.user);
	} else {
		res.send('Not Authenticated');
	}
})

app.post('/login', (req, res) => {
	users.login(db, req.body.email, req.body.password, (valid) => {
		if (valid) {
			//generate Token and set in cookie
			res.cookie('JWT', auth.generateJWT(req.body.email, 100, SEC),{httpOnly: true, maxAge: 100000});
			res.redirect('/');
		} else {
			let options = {
				root: path.join(__dirname, 'views')
			}
			res.sendFile('./login_fail.html', options)
		}
	})
})

app.get('/users', (req, res) => {
	users.list(db, (data) => {
		console.log(data);
	});
	// db.all('SELECT * FROM users', function (err, row) {
	// 	console.log(row)
	// 	res.json(row);
	// })
});

app.get('/users/:user', (req, res) => {
	users.get_by_email(db, req.params.user, (data) => {
		res.json(data);
	})
})

app.listen(port, () => console.log(`Listening on port: ${port}`));
