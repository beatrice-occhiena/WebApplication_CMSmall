'use strict';

import { useState } from 'react';
import { Form, Button, Alert, Col, Row } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

// AUTH COMPONENT
// Login and logout buttons
// ------------------------

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault(); // prevent the form to reload the current page
    const credentials = { username, password };

    props.login(credentials)
      .then( () => navigate( "/" ) )
      .catch((err) => { 
        setErrorMessage(err.error); setShow(true); 
      });
  };

  return (
    <Row className="vh-100 justify-content-md-center">
    <Col md={4} >
    <h1 className="pb-3">Login</h1>

      <Form  onSubmit={handleSubmit}>
          <Alert
            dismissible
            show={show}
            onClose={() => setShow(false)}
            variant="danger">
            {errorMessage}
          </Alert>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>email</Form.Label>
            <Form.Control
              type="email"
              value={username} placeholder="Example: user1@email.com"
              onChange={(ev) => setUsername(ev.target.value)}
              required={true}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password} placeholder="Enter the password."
              onChange={(ev) => setPassword(ev.target.value)}
              required={true} minLength={6}
            />
          </Form.Group>
          <Button className="mt-3" type="submit">Login</Button>
      </Form>
      </Col>
      </Row>

  )
};

function LogoutButton(props) {
  
  const navigate = useNavigate();
  const handleLogout = () => {
    props.logout();
    navigate( "/" );
  }
  return (
    <Button variant="outline-light" className='colored-button' onClick={handleLogout}>Logout</Button>
  )
}

function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant="outline-light" className='colored-button' onClick={()=> navigate('/login')}>Login</Button>
  )
}

function LoginLayout(props) {
  return (
    <Row className="vh-100">
      <Col md={12} className="below-nav">
        <LoginForm login={props.login} /> {/* props.login = handleLogin() in App.jsx */}
      </Col>
    </Row>
  );
}

export { LoginForm, LogoutButton, LoginButton, LoginLayout };