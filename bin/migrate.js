module.exports = function(db) {
	db.serialize(function () {
		db.run(`
			CREATE TABLE users (
				id_user INT,
				name VARCHAR,
				email VARCHAR,
				password VARCHAR,
				pref_notify BIT)`);
		db.run(
			`INSERT INTO users VALUES(
				'0',
				'jackson',
				'jbeall.email',
				'pass',
				'0'
			)`)
		db.run(
			`INSERT INTO users VALUES(
				'1',
				'bob',
				'bob.email',
				'pass',
				'0'
			)`)
	})
};