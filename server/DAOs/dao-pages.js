'use strict';

// Data Access Object - DAO
// Module for accessing pages data in db
// -------------------------------------

const db = require('../db');
const dayjs = require('dayjs');

/**
 * Retrieves all pages from the database: both for auth users and anonymous.
 * @param {boolean} authenticated - Indicate if the user is autheticated or not. 
 *                                  If the param is not provided when calling the function => false by default.
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of page objects containing the pages' information.
 * @throws {Error} If there is an error while retrieving the pages from the database.
 */
exports.getAllPages = (authenticated = false) => {
  return new Promise((resolve, reject) => {
    const currentDate = dayjs().format('YYYY-MM-DD');
    let sql;
    let params = [];
    
    if(!authenticated){
      sql = 'SELECT * FROM pages WHERE publication_date <= ?';
      params = [currentDate];
    }
    else{
      sql = 'SELECT * FROM pages';
    }

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // WARNING: the database returns only lowercase fields. So, to be compliant with the client-side, we convert "xxx_date" to the camelCase version ("xxxDate").
        const pages = rows.map((e) => {
          const page = Object.assign({}, e, { creationDate: e.creation_date, publicationDate: e.publication_date }); // adding camelcase "publicationDate"
          delete page.creation_date;
          delete page.publication_date;
          return page;
        });
        resolve(pages);
      }
    });
  });
};

/**
 * Retrieves a page's information from the database based on the provided ID.
 * @param {number} id - The ID of the page to retrieve.
 * @param {boolean} authenticated - Indicate if the user is autheticated or not.
 * @returns {Promise<Object>} A Promise that resolves to a page object containing the page's information.
 *                            If the page is not found, it resolves to an object with an error property.
 * @throws {Error} If there is an error while retrieving the page from the database.
 */
exports.getPageById = (id, authenticated = false) => {
    return new Promise((resolve, reject) => {
      const currentDate = dayjs().format('YYYY-MM-DD');
      let sql = 'SELECT * FROM pages WHERE id=?';
      let params = [id];

      if(!authenticated){
        sql += ' AND publication_date <= ?';
        params = [id, currentDate]
      }

      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve({ error: 'Page not found.' });
        } else {
          const page = {
            id: row.id,
            title: row.title,
            author: row.author,
            creationDate: row.creation_date,
            publicationDate: row.publication_date,
            blocks: row.blocks,
          };
          resolve(page);
        }
      });
    });
  };

/**
 * Creates a new page in the database.
 * @param {Object} pageData - The data of the page to create.
 * @returns {Promise<number>} A Promise that resolves to a page object containing the page's information of the newly created page.
 * @throws {Error} If there is an error while creating the page in the database.
 */
exports.createPage = (pageData) => {
    return new Promise((resolve, reject) => {
      const { title, author, creationDate, publicationDate, blocks } = pageData;
      const sql =
        'INSERT INTO pages (title, author, creation_date, publication_date, blocks) VALUES (?, ?, ?, ?, ?)';
      db.run(
        sql,
        [title, author, creationDate, publicationDate, blocks],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(exports.getPageById(this.lastID));
          }
        }
      );
    });
  };

/**
 * Updates an existing page in the database.
 * @param {number} id - The ID of the page to update.
 * @param {Object} pageData - The updated data of the page.
 * @returns {Promise<void>} A Promise that resolves to a page object containing the udated page's information.
 * @throws {Error} If there is an error while updating the page in the database.
 */
exports.updatePage = (id, pageData) => {
  return new Promise((resolve, reject) => {
    const { title, author, creationDate, publicationDate, blocks } = pageData;
    const sql =
      'UPDATE pages SET title=?, author=?, creation_date=?, publication_date=?, blocks=? WHERE id=?';
    db.run(
      sql,
      [title, author, creationDate, publicationDate, blocks, id],
      function (err) {
        if (err) {
          reject(err);
        } 
        if (this.changes !== 1){
          resolve({ error: 'No page updated.' });
        }
        else {
          resolve(exports.getPageById(id));
        }
      }
    );
  });
};


/**
 * Deletes a page from the database.
 * @param {number} id - The ID of the page to delete.
 * @returns {Promise<void>} A Promise that resolves when the page is successfully deleted.
 * @throws {Error} If there is an error while deleting the page from the database.
 */
exports.deletePage = (id) => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM pages WHERE id=?';
      db.run(sql, [id], function (err) {
        if (err) {
          reject(err);
        } 
        if (this.changes !== 1){
          resolve({ error: 'No page deleted.' });
        }
        else {
          resolve(null);
        }
      });
    });
  };