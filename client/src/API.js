'use strict';

import dayjs from 'dayjs';
const SERVER_URL = 'http://localhost:3001/api/';

/**
 * Utility function: for parsing the HTTP response.
 * @param {Promise<Object>} httpResponsePromise - Promise returned by the fetch method.
 * @returns {JSON<String>} - Server's response.
 */
function getJson(httpResponsePromise) {
    // server API always return JSON, in case of error the format is the following { error: <message> } 
    return new Promise((resolve, reject) => {
      httpResponsePromise
        .then((response) => {
          if (response.ok) {
  
           // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
           response.json()
              .then( json => resolve(json) )
              .catch( err => reject({ error: "Cannot parse server response" }))
  
          } else {
            // analyzing the cause of error
            response.json()
              .then(obj => 
                reject(obj)
                ) // error msg in the response body
              .catch(err => reject({ error: "Cannot parse server response" })) // something else
          }
        })
        .catch(err => 
          reject({ error: "Cannot communicate with the server"  })
        ) // connection error
    });
  }


// USERS APIs -> HTTP requests
// ---------------------------

/**
 * Logs in a user by sending a POST request to the server with the provided credentials.
 * @param {Object} credentials - The login credentials of the user.
 * @param {string} credentials.username - The username of the user.
 * @param {string} credentials.password - The password of the user.
 * @returns {Promise<Object>} A promise that resolves to the JSON response from the server.
 */
const logIn = async (credentials) => {
    return getJson(fetch(SERVER_URL + 'sessions', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        credentials: 'include',  //authentication cookie must be forwared
        body: JSON.stringify(credentials),
    }))
};
  
/**
 * Retrieves the user's information from the server.
 * @returns {Promise<Object>} A Promise that resolves to a JSON object containing the user info.
 */
const getUserInfo = async () => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
        credentials: 'include'  //authentication cookie must be forwared
    }))
};
  
/**
 * Logs out the current user and destroys the session.
 * @returns {Promise<Object>} A Promise that resolves to a JSON object representing the logout response.
 */
const logOut = async() => {
    return getJson(fetch(SERVER_URL + 'sessions/current', {
        method: 'DELETE',
        credentials: 'include'  // this parameter specifies that authentication cookie must be forwared
    }))
}

/**
 * Retrieves the list of all users' names from the server.
 * @returns {Promise<Array>} A Promise that resolves to an array of strings.
 * The array contains the names of all the users.
 */
const getUsersNames = async () => {
    return getJson(
        fetch(SERVER_URL + 'users',{ credentials: 'include' })
    ).then((json) => {
        return json;
    })
}


// PAGES APIs -> HTTP requests
// ---------------------------

/**
 * Retrieves all the pages from the server.
 * @returns {Promise<Array>} A Promise that resolves to an array of page objects.
 */
const getPages = async () => {
    return getJson(
        fetch(SERVER_URL + 'pages',{ credentials: 'include' })
    ).then((json) => {
        return json.map((page) => {
          const clientPage = {
            id: page.id,
            title: page.title,
            author: page.author,
            creationDate: page.creationDate,
            publicationDate: ''
          }
          if (page.publicationDate)
            clientPage.publicationDate = page.publicationDate;
          return clientPage;
        })
      }
    )
 }

 /**
 * Retrieves a specific page by its ID.
 * @param {string} pageId - The ID of the page to retrieve.
 * @returns {Promise<Object>} A Promise that resolves to the page object.
 */
const getPageById = async (pageId) => {
  
  return getJson(
    fetch(SERVER_URL + 'pages/' + pageId, { credentials: 'include' })
  ).then((page) => {
    
    // IMPORTANT!!! parse the blocks string into an array of objects
    const blocks = JSON.parse(page.blocks).blocks; //blocks is an array of objects

    const clientPage = {
      id: page.id,
      title: page.title,
      author: page.author,
      creationDate: page.creationDate,
      publicationDate: '',
      blocks: blocks,
    };
    if (page.publicationDate)
      clientPage.publicationDate = page.publicationDate;
    return clientPage;
  });
};

/**
 * Creates a new page.
 * @param {Object} pageData - The data of the page to create.
 * @returns {Promise<Object>} A Promise that resolves to the created page object.
 */
const createPage = async (pageData) => {

  // IMPORTANT!!! create an internal object with the blocks array of objects
  pageData.blocks = { blocks: pageData.blocks }; //blocks is an array of objects

  return getJson(
    fetch(SERVER_URL + "pages", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(pageData),
    })
  );
};

/**
 * Updates an existing page.
 * @param {Object} updatedPageData - The updated data of the page.
 * @returns {Promise<Object>} A Promise that resolves to the updated page object.
 */
const updatePage = async (updatedPageData) => {

  // IMPORTANT!!! create an internal object with the blocks array of objects
  updatedPageData.blocks = { blocks: updatedPageData.blocks }; //blocks is an array of objects

  return getJson(
    fetch(SERVER_URL + `pages/${updatedPageData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updatedPageData),
    })
  );
};

/**
 * Deletes a page by its ID.
 * @param {string} pageId - The ID of the page to delete.
 * @returns {Promise} A Promise that resolves when the deletion is successful.
 */
const deletePage = async (pageId) => {
  return getJson(
    fetch(SERVER_URL + `pages/${pageId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
  );
};

// WEBSITE APIs -> HTTP requests
// -----------------------------
/**
 * Retrieves the website's name.
 * @returns {Promise<string>} A Promise that resolves to the website's name.
 */
const getWebsiteName = async () => {
  return getJson(
    fetch(SERVER_URL + 'website/name', { credentials: 'include' })
  ).then((json) => {
    return json.name;
  });
};

/**
 * Sets the website's name.
 * @param {string} name - The name of the website.
 * @returns {Promise<Object>} A Promise that resolves to the JSON response from the server.
 */
const setWebsiteName = async (name) => {
  return getJson(
    fetch(SERVER_URL + 'website/name', {
      method: 'PUT',
      body: JSON.stringify({ name: name }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
  );
};

const API = {logIn, getUserInfo, logOut, getUsersNames, getPages, getPageById, createPage, updatePage, deletePage, getWebsiteName, setWebsiteName};
export default API;