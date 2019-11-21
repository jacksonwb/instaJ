function addComment(db, id_img, id_user, comment) {
	db.run(`INSERT INTO
			comments (id_img, id_user, cm_text)
			VALUES(?, ?, ?)`, [id_img, id_user, comment], (err) => {
		if (err)
			console.log(err);
		})
}

function getComments(db, id_img, callback) {
	db.all(`SELECT * from comments
			WHERE id_img=?`, id_img, (err, row) => {
				if (err) {
					console.error(err)
					return;
				}
				callback(row)
			})
}

module.exports = {addComment, getComments}