function addImage(db, id_user, path) {
	db.run(`INSERT INTO
			images (id_user, path)
			VALUES(?, ?)`, [id_user, path], (err) => {
		if (err)
			console.log(err);
		})
}

function removeImage(db, id_img) {
	db.run(`DELETE from images
			WHERE id_img=?`, id_img)
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
	let query
	if (last_id > 0) {
		query = `SELECT images.id_img, images.datecreated, images.path, users.name, users.id_user from images
			INNER JOIN users
			ON images.id_user=users.id_user
			WHERE
				images.id_img < $last_id
			ORDER BY id_img desc
			LIMIT $nbr`
		db.all(query, {$nbr: nbr, $last_id: last_id}, (err, data) => {
					if (err) {
						console.error(err)
						callback(err, null);
						return;
					}
					callback(null, data)
				})
	} else {
		query = `SELECT images.id_img, images.datecreated, images.path, users.name, users.id_user from images
			INNER JOIN users
			ON images.id_user=users.id_user
			ORDER BY id_img DESC
			LIMIT $nbr`
		db.all(query, {$nbr: nbr}, (err, data) => {
					if (err) {
						console.error(err)
						callback(err, null);
						return;
					}
					callback(null, data)
				})
	}
}

module.exports = {addImage, getImage, getAllImages, getNextImageBatch, removeImage}