'use strict';

// Data Access Object - DAO
// Module for accessing website data in the database
// -------------------------------------------------

const db = require('../db');

/**
 * Retrieves the website's name from the database.
 * @returns {Promise<string>} A Promise that resolves to the website's name.
 */
exports.getWebsiteName = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT name FROM website';
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve({ error: 'Website name not found.' });
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Updates the website's name in the database.
 * @param {string} name - The new name of the website.
 * @returns {Promise<string>} A Promise that resolves to the website's name.
 */
exports.updateWebsiteName = (name) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE website SET name=?';
    db.run(sql, [name], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(exports.getWebsiteName());
      }
    });
  });
}