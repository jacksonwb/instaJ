const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const db = require('./bin/db')
const users = require('./models/user');

const app = express();
const port = 3000;

users.list(db, (row) => {
	console.log(row)});

// Middleware
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: false }))

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

app.post('/login', (req, res) => {
	users.login(db, req.body.email, req.body.password, (valid) => {
		if (valid)
			res.redirect('/')
		else {
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
