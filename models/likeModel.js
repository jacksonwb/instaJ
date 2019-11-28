function addLike(db, id_img, id_user) {
	db.run(`INSERT or IGNORE INTO
			likes (id_img, id_user)
			VALUES(?, ?)`, [id_img, id_user], (err) => {
		if (err)
			console.error(err);
		})
}

function removeLike(db, id_img, id_user) {
	db.run(`DELETE FROM likes
			WHERE id_img=?
			AND id_user=?`, [id_img, id_user])
}

function removeAllLikes(db, id_img) {
	db.run(`DELETE FROM likes
			WHERE id_img=?`, id_img)
}


function getLikes(db, id_img, callback) {
	db.all(`SELECT * from likes
			WHERE id_img=?`, id_img, (err, row) => {
				if (err) {
					console.error(err)
					return;
				}
				callback(row)
			})
}

function userLikesImage(db, id_img, user, callback) {
	db.get(`SELECT * from likes
			INNER JOIN users
			ON likes.id_user=users.id_user
			WHERE id_img=?
			AND email=?`, id_img, user, (err, row) => {
				if (err) {
					console.error(err)
					return
				}
				callback(Boolean(row))
			})
}

module.exports = {addLike, getLikes, removeLike, userLikesImage, removeAllLikes}