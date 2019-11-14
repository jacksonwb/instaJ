sqlite = require('sqlite3');
const migrate = require('./migrate');

let db = new sqlite.Database(':memory:');
migrate(db);

module.exports = db