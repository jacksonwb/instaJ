function addComment(db, id_img, id_user, comment) {
	db.run(`INSERT INTO
			comments (id_img, id_user, cm_text)
			VALUES(?, ?, ?)`, [id_img, id_user, comment], (err) => {
		if (err)
			console.log(err);
		})
}

function getComments(db, id_img, callback) {
	db.all(`SELECT comments.cm_text, users.name, comments.id_cm from comments
			INNER JOIN users
			ON comments.id_user = users.id_user
			WHERE id_img=?
			`, id_img, (err, data) => {
				if (err) {
					console.error(err)
					callback(err, null)
					return;
				}
				callback(null, data)
			})
}

module.exports = {addComment, getComments}