'use strict';

// Data Access Object - DAO
// Module for accessing users data in db
// -------------------------------------

const db = require('../db');
const crypto = require('crypto');

/**
 * Retrieves a user's information from the database based on the provided ID.
 * @param {number} id - The ID of the user to retrieve.
 * @returns {Promise<Object>} A Promise that resolves to a user object containing the user's information. 
 *                            If the user is not found, it resolves to an object with an error property.
 * @throws {Error} If there is an error while retrieving the user from the database.
 */
exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE id=?';
        db.get(sql, [id], (err, row) => {
            if (err)
                reject(err);
            else if (row === undefined)
                resolve({ error: 'User not found.' });
            else {
                // By default, the local strategy looks for "username": 
                // for simplicity, instead of using "email", we create an object with that property.
                const user = { id: row.id, username: row.email, name: row.name, isAdmin: row.is_admin }
                resolve(user);
            }
        });
    });
};
  
/**
 * Log-in time: retrieves a user from the database based on the provided email and password.
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<object|false>} A Promise that resolves to the user object if the email and password are valid, 
 *                                  or resolves to false if the email or password is incorrect.
 */
exports.getUser = (email, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE email=?';
        db.get(sql, [email], (err, row) => {
        if (err) {
            reject(err);
        } else if (row === undefined) {
            resolve(false);
        }
        else {
            const user = { id: row.id, username: row.email, name: row.name, isAdmin: row.is_admin };

            // Check the password hashes
            // - this operation may be CPU-intensive (and we don't want to block the server)
            // => ASYNC call
            crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                if (err) reject(err);
                if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)) 
                    resolve(false);
                else
                    resolve(user);
            });
        }
        });
    });
};

/*
    The name is the UNIQUE username of the user.
    - The model is similar to the one adopted by GitHub.
    - In a possible registration form, the user will be asked to provide a new username if the one he/she chose is already taken.
*/
exports.getUserByName = (name) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE name=?';
        db.get(sql, [name], (err, row) => {
            if (err) {
                reject(err);
            } else if (row === undefined) {
                resolve(false);
            }
            else {
                const user = { id: row.id, username: row.email, name: row.name, isAdmin: row.is_admin };
                resolve(user);
            }
        });
    });
}

/*
    Gets all the users' names in the database.
*/
exports.getUsersNames = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT name FROM users';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const users = rows.map((row) => row.name);
                resolve(users);
            }
        });
    });
}