function addImage(db, id_user, path) {
	db.run(`INSERT INTO
			images (id_user, path)
			VALUES(?, ?)`, [id_user, path], (err) => {
		if (err)
			console.log(err);
		})
}

function getImage(db, id_img, callback) {
	db.get(`SELECT * FROM images
			WHERE id_img=?`, id_img, (err, row) => {
				if (err) {
					console.error(err)
					return;
				}
				callback(row);
			})
}

function getAllImages(db, callback) {
	db.all(`SELECT * FROM images`, (err, rows) => {
		if (err) {
			console.error(err)
			return;
		}
		callback(rows)
	})
}

function getNextImageBatch(db, nbr, last_id, callback) {
	db.all(`SELECT * FROM images
			WHERE id_img > ?
			ORDER BY id_img
			LIMIT ?`, [last_id, nbr], (err, data) => {
				if (err) {
					console.error(err)
					callback(err, null);
					return;
				}
				callback(null, data)
			})
}

module.exports = {addImage, getImage, getAllImages, getNextImageBatch}