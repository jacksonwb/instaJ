const path = require('path')
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// bin
const db = require('./bin/db')
const auth = require('./bin/authenticate');
const mail = require('./bin/mail');

// DB Models
const userModel = require('./models/userModel');
const imageModel = require('./models/imageModel');
const commentModel = require('./models/CommentModel');
const likeModel = require('./models/likeModel');

// Routes
const authRouter = require('./routes/authRouter')
const userRouter = require('./routes/userRouter')
const imageRouter = require('./routes/imageRouter')

const port = 3000;
const app = express();

//TODO
// Users     - Change username/password
// breakout routes
// imgRouter unlink problem

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))

// Middleware
app.use(logger('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: 10000000}))
app.use(cookieParser());
app.use(auth.authJWT(auth.SEC));

// Public
app.use('/public', express.static('public'))
app.use('/public/js', express.static('dist'))

// Home
app.get('/', (req, res) => {
	res.render('app', {
		title: 'Welcome!',
		jslink: '/public/js/main.bundle.js'
	})
});

// Photo
app.get('/photo', (req, res) => {
	if (req.user) {
		res.render('app', {
			title: 'Photo',
			jslink: '/public/js/photo.bundle.js'
		})
	} else {
		res.redirect('/login')
	}
})

//Auth
app.use('/', authRouter)
app.use('/', userRouter)
app.use('/', imageRouter)


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
	if (req.params.id_img && req.user) {
		userModel.get_by_email(db, req.user, (user) => {
			commentModel.addComment(db, req.params.id_img, user.id_user, req.body.comment)
			imageModel.getImage(db, req.params.id_img, (image) => {
				if (image) {
					userModel.get_by_id(db, image.id_user, (err, user) => {
						if (user && user.pref_notify) {
							mail.mailNotify(user.email, 'http://localhost:3000', 'Your post was commented on!')
						}
					})
				}
			})
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
				callback(true, true)
			} else if (!likeStatus && isLiked) {
				likeModel.removeLike(db, id_img, user.id_user)
				callback(true, false)
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
	if (!req.user) {
		res.send(401)
		return;
	}
	likeModel.userLikesImage(db, req.params.id_img, req.user, (likes) => {
		res.json({userLikes: likes})
	})
})

app.post('/api/likes', (req, res) => {
	if (req.user && 'likeStatus' in req.body && req.body.id_img) {
		validateLikeReq(db, req.body.likeStatus, req.body.id_img, req.user, (status, isLiked) => {
			if (!status) {
				res.status(401)
			} else {
				if (isLiked) {
					imageModel.getImage(db, req.body.id_img, (image) => {
						if (image) {
							userModel.get_by_id(db, image.id_user, (err, user) => {
								if (user && user.pref_notify) {
									mail.mailNotify(user.email, 'http://localhost:3000', 'Your post was liked!')
								}
							})
						}
					})
				}
				res.json({status})
			}
		})
		return;
	}
	res.status(400).json({'status': false})
})

app.listen(port, () => console.log(`Listening on port: ${port}`));
