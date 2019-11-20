userModel = require('../models/user');

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
};