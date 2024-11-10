/****************************************
 * Web Applications I - 2022/2023
 * Exam I - CMSmall
 * Author: s314971 Beatrice Occhiena
 ****************************************/
'use strict';

// CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

// Libraries
import { React, useState, useEffect, useContext } from 'react';
import { Container, Toast } from 'react-bootstrap/';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Components
import { Navigation } from './components/Navigation';
import { LoginLayout } from './components/Auth';
import { FrontOfficeLayout, BackOfficeLayout, 
         ViewPageLayout, EditPageLayout, CreatePageLayout,  LoadingLayout } from './components/PageLayouts';

// Functions
import MessageContext from './messageCtx';    // Context used to show error messages in a toast
import API from './API';


function App() {

  // State variables
  // ---------------
  const [dirty, setDirty] = useState(true);         // dirty flag
  const [user, setUser] = useState(null);           // user info
  const [loggedIn, setLoggedIn] = useState(false);  // login status
  const [pages, setPages] = useState([]);           // list of pages
  const [siteName, setSiteName] = useState('');     // website name
  const [message, setMessage] = useState('');       // error message

  // Utility functions
  // -----------------

  const handleErrors = (err) => {
    let msg = '';
    if (err.error) msg = err.error;
    else if (String(err) === "string") msg = String(err);
    else msg = "Unknown Error";
    setMessage(msg); // only last error is shown.
  }

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      // error is handled and visualized in the login form
      throw err;
    }
  };

  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clear user info
    setUser(null);
  };

  // Get the website name
  const getSiteName = async () => {
    try {
      const siteName = await API.getWebsiteName();
      setSiteName(siteName);
    } catch (err) {
      handleErrors(err);
    }
  }

  return (
    <BrowserRouter>
      <MessageContext.Provider value={{ handleErrors }}>
        <Container fluid className="App"> {/* fluid: full width */}

          {/* Permanent navbar at the top of the app */}
          <Navigation logout={handleLogout} user={user} loggedIn={loggedIn} siteName={siteName} getSiteName={getSiteName}/>
          
          {/* Routes */}
          <Routes>
            <Route path="/" 
              element={ 
                <FrontOfficeLayout pages={pages} setPages={setPages} /> 
              }
            />
            <Route path="/pages" 
              element= { 
                <BackOfficeLayout pages={pages} setPages={setPages} user={user} dirty={dirty} setDirty={setDirty} siteName={siteName} setSiteName={setSiteName} />
              }
            />
            <Route path="/pages/:id"
              element={
                <ViewPageLayout />
              }
            />
            <Route path="/pages/edit/:id"
              element={
                !loggedIn ? <Navigate replace to='/login' />
                : <EditPageLayout pages={pages} setPages={setPages} user={user} dirty={dirty} setDirty={setDirty} />
              }
            />
            <Route path="/pages/create"
              element={
                !loggedIn ? <Navigate replace to='/login' />
                : <CreatePageLayout pages={pages} setPages={setPages} user={user} dirty={dirty} setDirty={setDirty} />
              }
            />
            <Route path="/login" 
              element={
                !loggedIn ? <LoginLayout login={handleLogin} /> 
                : <Navigate replace to='/pages' />
              }
            />
          
          </Routes>

          {/* Toast for error message */}
          <Toast show={message !== ''} onClose={() => setMessage('')} delay={100} autohide bg="danger">
            <Toast.Body>{message}</Toast.Body>
          </Toast>

        </Container>
      </MessageContext.Provider>
    </BrowserRouter>
  )
}

export default App;
