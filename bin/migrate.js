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

	userModel.add(db, 'jackson', 'jbeall@email.com', 'pass', 0, 1);
	userModel.add(db, 'bob', 'bob@email.com', 'pass', 0, 0);

	db.run(`
		CREATE TABLE comments (
			id_cm INTEGER PRIMARY KEY AUTOINCREMENT,
			id_img INT,
			id_user INT,
			cm_text VARCHAR
		)`, () => {
			commentModel.addComment(db, 1, 1, 'blah')
			commentModel.addComment(db, 1, 1, 'yay')
		})

	db.run(`
		CREATE TABLE likes (
			id_img INT,
			id_user INT,
			UNIQUE(id_img, id_user)
		)`, () => {
			likeModel.addLike(db, 1, 1);
			likeModel.addLike(db, 1, 1);
			likeModel.addLike(db, 3, 1);
		})

	// setTimeout(() => {
	// 	likeModel.getLikes(db, 1, (rows) => {
	// 		console.log(rows);
	// 	})
	// }, 1000)
	// setTimeout(() => {
	// 	likeModel.removeLike(db, 1, 1);
	// }, 2000)
	// setTimeout(() => {
	// 	likeModel.getLikes(db, 1, (rows) => {
	// 		console.log(rows);
	// 	})
	// }, 3000)
	// setTimeout(() => {
	// 	likeModel.removeLike(db, 1, 1);
	// }, 4000)

	db.run(`
		CREATE TABLE images (
			id_img INTEGER PRIMARY KEY AUTOINCREMENT,
			id_user INT,
			dateCreated datetime DEFAULT(CURRENT_TIMESTAMP),
			path VARCHAR
		)`, () => {
			imageModel.addImage(db, 1, 'coolimage.jpg');
			imageModel.addImage(db, 1, 'otherimage.jpg');
			imageModel.addImage(db, 2, 'lastimage.jpg');
		})

	// setTimeout(() => {
	// 	imageModel.getAllImages(db, (img) => {
	// 		console.log(img);
	// 		console.log('\n')
	// 	})
	// 	imageModel.getNextImageBatch(db, 2, 2, (imgs) => {
	// 		console.log(imgs)
	// 	})
	// }, 1000)

	// setTimeout(() => {
	// 	// db.get('SELECT * from comments', (err, row) => {
	// 	// 	if (err) {
	// 	// 		console.log(err)
	// 	// 		return;
	// 	// 	}
	// 	// 	console.log(row)
	// 	// })

	// 	commentModel.getComments(db, 1, (rows) => {
	// 		console.log(rows);
	// 	})
	// }, 1000)
};