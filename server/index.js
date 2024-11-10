'use strict';

// IMPORTING MODULES
// -----------------
const express = require('express');

// Middlewares
const morgan = require('morgan');                 //logging
const delay = require('express-delay');           //delay in server responses -> debug time only
const cors = require('cors');                     //Cross-Origin Resource Sharing
const passport = require('passport');             //authentication
const LocalStrategy = require('passport-local');  //auth -> strategy (username and password)
const session = require('express-session');       //session management
const { check, validationResult, } = require('express-validator'); //validation


// SERVER INITIALISATION
// ---------------------
const app = new express();

// Middlewares set-up
app.use(morgan('dev'));
app.use(express.json());
//app.use(delay(200,2000)); // to debug loading time only

// CORS for React Web Server origin
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// AUTHENTICATION strategy: local = username + pw
// - user info saved in session
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if(!user)
    return callback(null, false, 'Incorrect username or password');  
    
  return callback(null, user); //user info saved in session: {id, username, name, isAdmin}
}));

// Serialize: user object -> str format that can be stored in session info
passport.serializeUser(function (user, callback) { // this user is id + username + name 
  callback(null, user);
});
// Deserialize: str user from session -> user object
passport.deserializeUser(function (user, callback) { 
  return callback(null, user); // this will be available in req.user
});

// CREATING THE SESSION
// - configuration options
app.use(session({
  secret: "secretKeyForCookie",     //used to sign the session cookie
  resave: false,                    
  saveUninitialized: false,         
}));
// AUTHENTICATION strategy -> session
app.use(passport.authenticate('session'));

// DEFINING AUTHENTICATION VERIFICATION MIDDLEWARE
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

// SHOW ERROR MESSAGES
// - express-validator errors -> format: string
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

// SERVER ACTIVATION
// -----------------
const port = 3001;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const userDao = require('./DAOs/dao-users');

// Application Programming Interface - API
// Route handling of users API endpoints
// ---------------------------------------

// POST /api/sessions 
// ---> login
app.post('/api/sessions', function(req, res, next) {
  
  passport.authenticate('local', (err, user, info) => { 
    if (err) //any err occurred
      return next(err);
    if (!user) { //no obj 'atuhenticated user'
      return res.status(401).json({ error: info});
    }
    // success, perform the login and extablish a login session
    req.login(user, (err) => {
      if (err)
        return next(err);
      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser() in LocalStratecy Verify Fn
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /api/sessions/current
// ---> isLoggedIn? getUserInfo
app.get('/api/sessions/current', (req, res) => {
  
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
// ---> logout
app.delete('/api/sessions/current', (req, res) => {
  
  req.logout(() => {
    res.status(200).json({});
  });
});

// GET /api/users
// ---> getAllUsersNames
app.get('/api/users', async (req, res) => {
  
  // Check if the user is authenticated as an admin
  if (!req.user.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized for retrieving users: not admin.' });
  }

  try {
    const users = await userDao.getUsersNames();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error - Failed to retrieve users.' });
  }
});


// Application Programming Interface - API
// Route handling of pages API endpoints
// ---------------------------------------

const pageDao = require('./DAOs/dao-pages');

// GET /api/pages
// ---> getAllPages
//      * auth users = all existing pages
//      * anonimous = all published pages
app.get('/api/pages', async (req, res) => {
  
  try {
    const authenticated = req.isAuthenticated();
    const pages = await pageDao.getAllPages(authenticated);
    res.status(200).json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error - Failed to retrieve pages.' });
  }
});

// GET /api/pages/:id
// ---> getPageById
app.get('/api/pages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const authenticated = req.isAuthenticated();
    const page = await pageDao.getPageById(id, authenticated);
    if (page.error) {
      res.status(404).json(page);
    } else {
      res.status(200).json(page);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error - Failed to retrieve page.' });
  }
});

// POST /api/pages
// ---> createPage
app.post('/api/pages', 
  isLoggedIn,
  [
    check('title').isLength({min: 1, max:160}),
    check('author').isLength({min: 1, max:160}),
    check('creationDate').isDate({format: 'YYYY-MM-DD'}),
    check('publicationDate')
      .custom((value, { req }) => {
        if (!value) {
          // Publication date does not exist, no further validation needed
          return true;
        }
        const creationDate = new Date(req.body.creationDate);
        const publicationDate = new Date(value);
        if (publicationDate < creationDate) {
          throw new Error('Publication date must be after the creation date');
        }
        return true;
      })
      .withMessage('Invalid publication date'),
    check('blocks.blocks').isArray({ min: 2 }).withMessage('Blocks must be an array and should contain at least two blocks.'),
    check('blocks.blocks.*.type').isIn(['header', 'paragraph', 'image']).withMessage('Block type must be either "header", "paragraph", or "image"'),
    check('blocks').custom((blocks, { req }) => {
      const hasHeaderBlock = blocks.blocks.some(block => block.type === 'header');
      const hasOtherBlocks = blocks.blocks.some(block => block.type !== 'header');
      if (!hasHeaderBlock) {
        throw new Error('At least one header block is required');
      }
      if (!hasOtherBlocks) {
        throw new Error('At least one of the other blocks (paragraph or image) is required');
      }
      return true;
    })
  ],
  async (req, res) => {
    
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message from index.js
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") }); // error message is a single string with all error joined together
    }

    const pageData = req.body;
    try {

      // Check if the user is authenticated as an admin or the author of the page
      if(req.user.name !== pageData.author){
        if (!req.user.isAdmin) { // Check if the user is admin
          return res.status(401).json({ error: 'Unauthorized for updating: not admin nor author.' });
        }
        else{ // Check if the author exists
          const author = await userDao.getUserByName(pageData.author);
          if(!author)
            return res.status(400).json({ error: 'Author does not exist.' });
        }
      }

      // Convert the blocks array object in a string to be stored in the db !!!!!!
      pageData.blocks = JSON.stringify(pageData.blocks);

      const page = await pageDao.createPage(pageData);
      res.status(201).json(page);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error - Failed to create page.' });
    }
});

// PUT /api/pages/:id
// ---> updatePage
app.put('/api/pages/:id',
  [
    check('id').isInt(),
    check('title').isLength({min: 1, max:160}),
    check('author').isLength({min: 1, max:160}),
    check('creationDate').isDate({format: 'YYYY-MM-DD'}),
    check('publicationDate')
      .custom((value, { req }) => {
        if (!value) {
          // Publication date does not exist, no further validation needed
          return true;
        }
        const creationDate = new Date(req.body.creationDate);
        const publicationDate = new Date(value);
        if (publicationDate < creationDate) {
          throw new Error('Publication date must be after the creation date');
        }
        return true;
      })
      .withMessage('Invalid publication date'),
    check('blocks.blocks').isArray({ min: 2 }).withMessage('Blocks must be an array and should contain at least two blocks.'),
    check('blocks.blocks.*.type').isIn(['header', 'paragraph', 'image']).withMessage('Block type must be either "header", "paragraph", or "image"'),
    check('blocks').custom((blocks, { req }) => {
      const hasHeaderBlock = blocks.blocks.some(block => block.type === 'header');
      const hasOtherBlocks = blocks.blocks.some(block => block.type !== 'header');
      if (!hasHeaderBlock) {
        throw new Error('At least one header block is required');
      }
      if (!hasOtherBlocks) {
        throw new Error('At least one of the other blocks (paragraph or image) is required');
      }
      return true;
    })
  ],
  isLoggedIn, 
  async (req, res) => {

    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }

    const { id } = req.params;
    const pageData = req.body;
    try {

      // Check if the user is authenticated as an admin or the author of the page
      const authenticated = req.isAuthenticated();
      const pageToUpdate = await pageDao.getPageById(id,authenticated);
      if(req.user.name !== pageToUpdate.author){
        if (!req.user.isAdmin) { // Check if the user is admin
          return res.status(401).json({ error: 'Unauthorized for updating: not admin nor author.' });
        }
        else{ // Check if the author exists
          const author = await userDao.getUserByName(pageData.author);
          if(!author)
            return res.status(400).json({ error: 'Author does not exist.' });
        }
      }

      // Check if the creation date is unchanged
      if (pageData.creationDate !== pageToUpdate.creationDate) {
        return res.status(400).json({ error: 'Creation date cannot be changed.' });
      }

      // Convert the blocks array object in a string to be stored in the db !!!!!!
      pageData.blocks = JSON.stringify(pageData.blocks);

      // Update page
      const pageUpdated = await pageDao.updatePage(id, pageData);
      
      if (pageUpdated.error) {
        res.status(404).json(pageUpdated);
      } else {
        res.status(200).json(pageUpdated);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error - Failed to update page.' });
    }
});

// DELETE /api/pages/:id
// ---> deletePage
app.delete('/api/pages/:id', 
  isLoggedIn,
  [ check('id').isInt() ],
  async (req, res) => {
    
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }
    
    const { id } = req.params;
    try {

      // Check if the user is authenticated as an admin or the author of the page
      const authenticated = req.isAuthenticated();
      const page = await pageDao.getPageById(id,authenticated);
      if (!req.user.isAdmin && req.user.name !== page.author) {
        return res.status(401).json({ error: 'Unauthorized for deletion: not admin nor author.' });
      }
      
      // The return value for deletePage is null if OK and message for '404 - page not found in db'
      const result = await pageDao.deletePage(id);
      if(result == null)
        res.status(200).json({});
      else
        return res.status(404).json(result);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error - Failed to delete page.' });
    }
});

// Application Programming Interface - API
// Route handling of website API endpoints
// ---------------------------------------

const websiteDao = require('./DAOs/dao-website');

// GET /api/website/name
// ---> getWebsiteName
app.get('/api/website/name', async (req, res) => {
  try {
    const name = await websiteDao.getWebsiteName();
    res.status(200).json(name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error - Failed to retrieve website name.' });
  }
});

// PUT /api/website/name
// ---> updateWebsiteName
app.put('/api/website/name',
  isLoggedIn,
  [ check('name').isLength({min: 1, max:160}) ],
  async (req, res) => {
    
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }

    //check if the user is admin
    if (!req.user.isAdmin) {
      return res.status(401).json({ error: 'Unauthorized for updating: not admin.' });
    }

    const { name } = req.body;
    try {
      await websiteDao.updateWebsiteName(name);
      res.status(200).json({name});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server Error - Failed to update website name.' });
    }
});

module.exports = {app, errorFormatter, isLoggedIn}; 