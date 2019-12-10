const path = require('path')
const fs = require('fs')
const express = require('express')
const db = require('../bin/db')
const userModel = require('../models/userModel')
const imageModel = require('../models/imageModel')
const router = express.Router()

router.get('/api/allimages', (req, res) => {
	if (!req.user) {
		res.send(401)
		return;
	}
	imageModel.getAllImages(db, (images) => {
		res.send(images)
	})
})

router.get('/api/images', (req, res) => {
	imageModel.getNextImageBatch(db, req.query.nbr, req.query.lastId, (err, imgs) => {
		if (err) {
			res.sendStatus(400).send()
			return;
		}
		res.send(imgs)
	})
})

router.get('/api/img/:path', (req, res) => {
	let options = {
		root: path.join(__dirname, '..', 'img')
	}
	res.sendFile(req.params.path, options);
})

router.delete('/api/img/:id_img', (req, res) => {
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

router.post('/api/newimg', (req, res) => {
	if (req.user && req.body.image) {
		console.log('Writing image...')
		let base64Data = req.body.image.replace(/^data:image\/png;base64,/, '');
		let filename = `img-${Date.now().toString()}`
		fs.writeFile(path.join(__dirname, '..', 'img', filename), base64Data, 'base64', (err) => {
			if (err)
				console.log(err)
		})
		userModel.get_by_email(db, req.user, (user) => {
			imageModel.addImage(db, user.id_user, filename)
		})
		res.sendStatus(200)
	} else {
		res.sendStatus(400)
	}
})

module.exports = router