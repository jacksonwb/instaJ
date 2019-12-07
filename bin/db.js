sqlite = require('sqlite3');
const migrate = require('./migrate');
const fs = require('fs')

let db = new sqlite.Database('db.sqlite');

fs.access('db.sqlite', (err) => {
	if (err) {
		console.log('No database found - configuring...')
		console.log('Sucess')
		migrate(db);
	}
})

module.exports = db