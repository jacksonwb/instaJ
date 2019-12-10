const express = require('express')
const userModel = require('../models/userModel')
const router = express.Router()
const db = require('../bin/db')

router.get('/api/users', (req, res) => {
	if (!req.user) {
		res.send(401)
		return;
	}
	userModel.list(db, (data) => {
		res.send(data);
	});
});

router.get('/api/users/:user', (req, res) => {
	if (!req.user) {
		res.send(401)
		return;
	}
	userModel.get_by_email(db, req.params.user, (data) => {
		res.json(data);
	})
})

router.get('/api/users/id/:id', (req, res) => {
	if (!req.user) {
		res.send(401)
		return;
	}
	userModel.get_by_id(db, req.params.id, (err, data) => {
		if (err) {
			res.sendStatus(404).send()
			return;
		}
		res.send(data)
	})
})

module.exports = router