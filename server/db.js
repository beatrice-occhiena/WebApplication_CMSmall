'use strict';

// DATABASE ACCESS MODULE
// ----------------------

const sqlite = require('sqlite3');

// open the database
const db = new sqlite.Database('CMSmall.db', (err) => {
  if (err) throw err;
});

module.exports = db;