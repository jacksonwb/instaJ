const path = require('path')
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// CONST
const port = 3000

// bin
const auth = require('./bin/authenticate');

// Routes
const authRouter = require('./routes/authRouter')(port)
const userRouter = require('./routes/userRouter')
const imageRouter = require('./routes/imageRouter')
const likeCommentRouter = require('./routes/likeCommentRouter')

const app = express();

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

//API Routers
app.use('/', authRouter)
app.use('/', userRouter)
app.use('/', imageRouter)
app.use('/', likeCommentRouter)

app.listen(port, () => console.log(`Listening on port: ${port}`));
