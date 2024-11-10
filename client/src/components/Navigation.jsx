'use strict';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Navbar, Nav, Form, Badge } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../App.css';
import { LogoutButton, LoginButton } from './Auth';


// NAVIGATION COMPONENT
// Navigation bar at the top of the page
// -------------------------------------

const Navigation = (props) => {

  const { siteName, getSiteName } = props;

  // Get the website name from the db on first render
  useEffect(() => {
    getSiteName();
  }, []);

  return (
    <Navbar expand="sm" variant="dark" fixed="top" className="navbar-padding main-color">
      
      {/* Logo - link to home (front-office) */}
      <Navbar.Brand>
        <i className ="bi bi-file-earmark"/> {siteName}
      </Navbar.Brand>

      {/* Front and Back Office buttons */}
      {/* - FrontOffice button: link to home page */}
      {/* - BackOffice button: if loggedIn link to backoffice page, if not link to login page */}
      <Nav className="mx-auto"> 
        <Nav className="mx-2">
          <FrontOfficeButton variant="secondary" />
        </Nav>
        <Nav className="mx-2">
          <BackOfficeButton loggedIn={props.loggedIn} />
        </Nav>
      </Nav>

      {/* Login/out + user info */}
      <Nav className="ml-md-auto">
        <Navbar.Text className="mx-2">
          {props.user && props.user.name && (
            <Badge>
              {props.user.isAdmin === 0 ? 'User' : 'Admin'}
            </Badge>
          )}
          {' '}
          {props.user && props.user.name && ` ${props.user.name}`}
        </Navbar.Text>
        <Form className="mx-2">
          {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
        </Form>
      </Nav>
      
      
    </Navbar>
  );

};

// Button to link to the Front Office (home) page
const FrontOfficeButton = () => {
  
  return (
    <Link to="/" className="btn btn-outline-light colored-button">
      <i className="bi bi-house-door-fill"/> Front Office
    </Link>
  );
  
};

// Button to link to the Back Office (auth) page
// BackOffice button: if loggedIn link to backoffice page, if not link to login page
const BackOfficeButton = (props) => {
  if(props.loggedIn) {
    return (
      <Link variant="Secondary" to="/pages" className="btn btn-outline-light colored-button">
        <i className="bi bi-gear-fill"/> Back Office
      </Link>
    );
  }
  else {
    return (
      <Link variant="secondary" to="/login" className="btn btn-outline-light colored-button">
        <i className="bi bi-gear-fill"/> Back Office
      </Link>
    );
  }
};


export { Navigation };