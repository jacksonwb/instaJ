function list(db, callback) {
	db.all('SELECT * FROM users', (err, row) => {
		if (err) {
			console.log(err);
			return;
		}
		callback(row);
	});
}

function add(db, name, email, password, pref_notify) {
	//validate here
	db.get('SELECT MAX (id_user) AS max FROM users', ((user) => {
		return (err, row) => {
			if (err) {
				console.log(err);
				return;
			}
			db.run('INSERT INTO users VALUES(?, ?, ?, ?, ?)', [row.max + 1, ...user], (err) => {
					if (err)
						console.log(err);
				})
		}
	})([name, email, password, pref_notify]))
}

function get_by_email(db, email, callback) {
	db.get('SELECT * FROM users WHERE email=?', email, (err, row) => {
		if (err) {
			console.log(err);
			return;
		}
		callback(row);
	})
}

function login(db, email, password, callback) {
	get_by_email(db, email, (user) => {
		if (!user) {
			console.log('no user')
			callback(false, undefined)
		} else if (user.password === password) {
			console.log('good pass')
			callback(true, user)
		} else {
			console.log('bad pass')
			callback(false, undefined)
		}
	})
}

module.exports = {list, add, get_by_email, login}