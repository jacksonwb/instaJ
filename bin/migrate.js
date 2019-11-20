userModel = require('../models/user');

module.exports = function(db) {
	db.run(`
		CREATE TABLE users (
			id_user INT,
			name VARCHAR,
			email VARCHAR,
			password VARCHAR,
			pref_notify BIT,
			is_verify BIT)`);

	userModel.add(db, 'jackson', 'jbeall.email', 'pass', 0, 1);
	userModel.add(db, 'bob', 'bob.email', 'pass', 0, 0);
};