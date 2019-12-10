const express = require('express')
const commentModel = require('../models/CommentModel')
const userModel = require('../models/userModel')
const imageModel = require('../models/imageModel')
const mail = require('../bin/mail')
const db = require('../bin/db')

const router = express.Router()

// Comments
router.get('/api/comments/:id_img', (req, res) => {
	commentModel.getComments(db, req.params.id_img, (err, data) => {
		if (err) {
			res.sendStatus(404).send()
			return;
		}
		res.send(data)
	})
})

router.post('/api/comments/:id_img', (req, res) => {
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

router.get('/api/likes/:id_img', (req, res) => {
	likeModel.getLikes(db, req.params.id_img, (data) => {
		res.json({numLikes:data.length})
	})
})

router.get('/api/likes/isLiked/:id_img', (req, res) => {
	if (req.user) {
		likeModel.userLikesImage(db, req.params.id_img, req.user, (likes) => {
			res.json({userLikes: likes})
		})
	} else {
		res.json({})
	}

})

router.post('/api/likes', (req, res) => {
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

module.exports = router