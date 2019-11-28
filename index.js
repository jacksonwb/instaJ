const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const db = require('./bin/db')
const userModel = require('./models/userModel');
const imageModel = require('./models/imageModel');
const commentModel = require('./models/CommentModel');
const likeModel = require('./models/likeModel');
const auth = require('./bin/authenticate');
const SEC = 'Secret';
const mail = require('./bin/mail');
const fs = require('fs');

const app = express();
const port = 3000;

//TODO
// Secure API - require req.user

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))

// Middleware
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cookieParser());
app.use(auth.authJWT(SEC));

// Public
app.use('/public', express.static('public'))

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

app.get('/api/auth', (req, res) => {
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
app.get('/login', (req, res) => {
	if (req.user) {
		res.redirect('/')
		return;
	}
	res.render('login')
})

app.post('/login', (req, res) => {
	userModel.login(db, req.body.email, req.body.password, (valid, user) => {
		if (valid && user.is_verify) {
			//generate Token and set in cookie
			res.cookie('JWT', auth.generateJWT(user.email, 10000000, SEC),{httpOnly: true, maxAge: 10000000});
			res.redirect('/');
		} else if (valid && !user.is_verify) {
			mail.mailValidate(user.email, user.name, `http://localhost:${port}/validate`, generateValidationToken(user.email, 100000, SEC));
			res.send('Please Validate Email - Email resent');
		} else {
			res.render('login', {errorMessage:'Bad Credentials!'})
		}
	})
})

// Restore Password
function generateResetToken(email, expire, secret) {
	return auth.signToken({email: email, expire: expire + Date.now(), fn:'reset'}, secret);
}

app.get('/restore', (req, res) => {
	res.render('restore')
})

app.post('/restore', (req, res) => {
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

app.get('/reset', (req, res) => {
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
	res.redirect('/')
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
	res.render('register')
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
app.get('/api/users', (req, res) => {
	userModel.list(db, (data) => {
		res.send(data);
	});
});

app.get('/api/users/:user', (req, res) => {
	userModel.get_by_email(db, req.params.user, (data) => {
		res.json(data);
	})
})

app.get('/api/users/id/:id', (req, res) => {
	userModel.get_by_id(db, req.params.id, (err, data) => {
		if (err) {
			res.sendStatus(404).send()
			return;
		}
		res.send(data)
	})
})

// Images
app.get('/api/images', (req, res) => {
	imageModel.getNextImageBatch(db, req.query.nbr, req.query.lastId, (err, imgs) => {
		if (err) {
			res.sendStatus(404).send()
			return;
		}
		res.send(imgs)
	})
})

app.get('/api/img/:path', (req, res) => {
	let options = {
		root: path.join(__dirname, 'img')
	}
	res.sendFile(req.params.path, options);
})

app.delete('/api/img/:id_img', (req, res) => {
	if (req.user && req.body.confirm) {
		userModel.get_by_email(db, req.user, (user) => {
			imageModel.getImage(db, req.params.id_img, (img) => {
				if (user.id_user === img.id_user) {
					console.log('deleting image...')
					fs.unlink(path.join('img', img.path), (err) => {
						if (err)
							console.log(err)
					})
					imageModel.removeImage(db, req.params.id_img)
					likeModel.removeAllLikes(db, req.params.id_img)
					commentModel.removeAllComments(db, req.params.id_img)
					res.sendStatus(200)
				}
			})
		})
	} else {
		res.sendStatus(400)
	}

})

// Comments
app.get('/api/comments/:id_img', (req, res) => {
	commentModel.getComments(db, req.params.id_img, (err, data) => {
		if (err) {
			res.sendStatus(404).send()
			return;
		}
		res.send(data)
	})
})

app.post('/api/comments/:id_img', (req, res) => {
	console.log('here')
	if (req.params.id_img && req.user) {
		userModel.get_by_email(db, req.user, (user) => {
			commentModel.addComment(db, req.params.id_img, user.id_user, req.body.comment)
		})
	} else {
		res.sendStatus(400)
	}
})

// Likes
function validateLikeReq(db, likeStatus, id_img, email, callback) {
	userModel.get_by_email(db, email, (user) => {
		likeModel.userLikesImage(db, id_img, email, (isLiked) => {
			if (likeStatus && !isLiked) {
				likeModel.addLike(db, id_img, user.id_user)
				console.log('liked!')
				callback(true)
			} else if (!likeStatus && isLiked) {
				likeModel.removeLike(db, id_img, user.id_user)
				callback(true)
				console.log('unliked!')
			} else {
				console.log('invalid!')
				callback(false)
			}
		})
	})
}

app.get('/api/likes/:id_img', (req, res) => {
	likeModel.getLikes(db, req.params.id_img, (data) => {
		res.json({numLikes:data.length})
	})
})

app.get('/api/likes/isLiked/:id_img', (req, res) => {
	likeModel.userLikesImage(db, req.params.id_img, req.user, (likes) => {
		res.json({userLikes: likes})
	})
})

app.post('/api/likes', (req, res) => {
	if (req.user && 'likeStatus' in req.body && req.body.id_img) {
		validateLikeReq(db, req.body.likeStatus, req.body.id_img, req.user, (status) => {
			if (!status)
				res.status(401)
			res.json({status})
		})
		return;
	}
	res.status(400).json({'status': false})
})

app.listen(port, () => console.log(`Listening on port: ${port}`));
