bcrypt = require('bcrypt');
const saltRounds = 10;

function list(db, callback) {
	db.all('SELECT * FROM users', (err, row) => {
		if (err) {
			console.log(err);
			return;
		}
		callback(row);
	});
}

function add(db, name, email, password, pref_notify, is_verify) {
	//validate here
	bcrypt.hash(password, saltRounds).then((hash) => {
		db.run(`INSERT INTO
				users (name, email, password, pref_notify, is_verify)
				VALUES(?, ?, ?, ?, ?)`, [name, email, hash, pref_notify, is_verify], (err) => {
			if (err)
				console.log(err);
			})
	}).catch((err) => {
		console.log('User add error:', err);
	})
}

function get_by_email(db, email, callback) {
db.get('SELECT * FROM users WHERE email=?', email, (err, row) => {
	if (err) {
		console.error(err);
		return;
		}
		callback(row);
	})
}

function validateEmail(db, email) {
	db.run(`UPDATE users
			SET is_verify=1
			WHERE email=?`, email, (err, row) => {
				if (err) {
					console.error(err);
					return;
				}
			});
}

function login(db, email, password, callback) {
	get_by_email(db, email, (user) => {
		if (!user) {
			console.log('no user')
			callback(false, undefined)
			return;
		}
		bcrypt.compare(password, user.password).then((res) => {
			if (res) {
				console.log('good pass')
				callback(true, user)
			} else {
				console.log('bad pass')
				callback(false, undefined)
			}
		})
	})
}

function updateUserValue(db, email, field, value) {
	db.run(`UPDATE users
			SET ${field} = ?
			WHERE email = ?`, [value, email], (err) => {
				if (err) {
					console.error(err);
					return;
				}
			})
}

function updateUserPassword(db, email, password) {
	// validate password
	bcrypt.hash(password, saltRounds).then((hash) => {
		updateUserValue(db, email, 'password', hash)
	})
}

module.exports = {list, add, get_by_email, login, validateEmail, updateUserValue, updateUserPassword}