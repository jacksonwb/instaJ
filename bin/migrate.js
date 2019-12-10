userModel = require('../models/userModel');
commentModel = require('../models/CommentModel');
likeModel = require('../models/likeModel');
imageModel = require('../models/imageModel');

module.exports = function(db) {
	db.run(`
		CREATE TABLE users (
			id_user INTEGER PRIMARY KEY AUTOINCREMENT,
			name VARCHAR,
			email VARCHAR,
			password VARCHAR,
			pref_notify BIT,
			is_verify BIT)`);

	userModel.add(db, 'jackson', 'jackson@email.com', 'pass', 0, 1);
	userModel.add(db, 'bob', 'bob@email.com', 'pass', 1, 0);

	db.run(`
		CREATE TABLE comments (
			id_cm INTEGER PRIMARY KEY AUTOINCREMENT,
			id_img INT,
			id_user INT,
			cm_text VARCHAR
		)`, () => {
			commentModel.addComment(db, 1, 1, 'Hello there!')
			commentModel.addComment(db, 1, 1, 'Wow this webapp is amazing!')
			commentModel.addComment(db, 3, 2, 'This is a fun comment, hurray!')
			commentModel.addComment(db, 3, 1, 'Wow greatest website ever!')
		})

	db.run(`
		CREATE TABLE likes (
			id_img INT,
			id_user INT,
			UNIQUE(id_img, id_user)
		)`, () => {
			likeModel.addLike(db, 1, 1);
			likeModel.addLike(db, 1, 2);
			likeModel.addLike(db, 3, 1);
		})

	db.run(`
		CREATE TABLE images (
			id_img INTEGER PRIMARY KEY AUTOINCREMENT,
			id_user INT,
			dateCreated datetime DEFAULT(CURRENT_TIMESTAMP),
			path VARCHAR
		)`, () => {
			imageModel.addImage(db, 1, 'coolimage.jpg');
			imageModel.addImage(db, 2, 'otherimage.jpg');
			imageModel.addImage(db, 1, 'lastimage.jpg');
		})
};