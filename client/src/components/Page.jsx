'use strict';

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Alert, Button, Form } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../App.css';
import { LogoutButton, LoginButton } from './Auth';
import dayjs from 'dayjs';
import { BlockForm } from './Blocks';
import API from '../API';

// PAGE COMPONENT
// Page cards and their elements
// -----------------------------

const PageCard = (props) => {
  const { id, title, author, creationDate, publicationDate } = props.pageData; //#to_do: check id can be shown

  const currentDate = dayjs().format('YYYY-MM-DD');

  return (
    <Card style={{ width: '18rem' }} className='mx-auto'>
      
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          <em>{author}</em>
        </Card.Subtitle>
        <hr />
        <Card.Text><small>Created: {creationDate}</small></Card.Text>
        <Card.Text>
          <small>
          {publicationDate === '' ? 'Draft' : publicationDate > currentDate ? 'Scheduled: ' : 'Published: '}
          {publicationDate}
          </small>
        </Card.Text>
        <ViewPageButton id={id} />
      </Card.Body>
    </Card>
  );
};

const PersonalPageCard = (props) => {
  const { id, title, author, creationDate, publicationDate } = props.pageData; //#to_do: check id can be shown

  const currentDate = dayjs().format('YYYY-MM-DD');

  return (
    <Card style={{ width: '18rem' }} className='mx-auto'>
      
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          <em>{author}</em>
        </Card.Subtitle>
        <hr />
        <Card.Text><small>Created: {creationDate}</small></Card.Text>
        <Card.Text>
          <small>
          {publicationDate === '' ? 'Draft' : publicationDate > currentDate ? 'Scheduled: ' : 'Published: '}
          {publicationDate}
          </small>
        </Card.Text>
        <div className="col-12">
          <ViewPageButton id={id} />
          <EditPageButton id={id} />
          <Button variant="danger" size="sm" onClick={() => props.deletePage(id)}>
            <i className="bi bi-trash"></i>
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};


// Buttons
// -------
const NewPageButton = () => {
  return (
    <Link to="/pages/create" className="btn btn-primary btn-sm">
      <i className="bi bi-plus-lg"></i> New Page
    </Link>
  );
};

const ViewPageButton = (props) => {
  return (
    <Link to={`/pages/${props.id}`} className="btn btn-primary btn-sm">
      View Page
    </Link>
  );
};

const EditPageButton = (props) => {
  return (
    <Link to={`/pages/edit/${props.id}`} className="btn btn-success btn-sm">
      <i className="bi bi-pencil-square"></i>
    </Link>
  );
};

// Elements
// --------
const PageHeader = (props) => {

  const page = props.pageData;
  const currentDate = dayjs().format('YYYY-MM-DD');

  return (
    <Card className="muted-color">
      <Card.Body>
        <Card.Title className='mt-2'>{page.title}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          <em>{page.author}</em>
        </Card.Subtitle>
        <Card.Text className='mt-4 mb-0'><small>Created: {page.creationDate}</small></Card.Text>
        <Card.Text className='mt-0 mb-1'>
          <small>
          {page.publicationDate === '' ? 'Draft' : page.publicationDate > currentDate ? 'Scheduled: ' : 'Published: '}
          {page.publicationDate}
          </small></Card.Text>
      </Card.Body>
    </Card>
  );
};

const PageForm = (props) => {
  /*
   * Creating a state for each parameter of the page
   * There are two possible cases: 
   * - if we are creating a new page, the form is initialized with the default values.
   * - if we are editing a page, the form is pre-filled with the previous values.
   */
  const page = props.pageData;
  const user = props.user;
  const defaultBlocks = [
    { type: 'header', content: 'Mock header' },
    { type: 'paragraph', content: 'Mock paragraph' }
  ];

  const [title, setTitle] = useState(page ? page.title : '');
  const [author, setAuthor] = useState(page ? page.author : user.name);
  const [creationDate, setCreationDate] = useState(page ? page.creationDate : dayjs().format('YYYY-MM-DD'));
  const [publicationDate, setPublicationDate] = useState(page ? page.publicationDate : '');
  const [blocks, setBlocks] = useState(page ? page.blocks : defaultBlocks); // array of objects to store the blocks info

  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // whether the page is being saved or cancelled we go back to the backoffice ('/pages')
  const handleSubmit = async (ev) => {
    try{
      ev.preventDefault(); // prevent the default behaviour of the form (refresh the page)
      const pageToSave = { "title": title.trim(), "author": author.trim(), "creationDate": creationDate, "publicationDate": publicationDate, "blocks": blocks };
      
      // check if blocks contains at least two elements: with one header and one other type
      const hasHeader = blocks.some((block) => block.type === 'header');
      const hasOther = blocks.some((block) => block.type !== 'header');
      if (!hasHeader || !hasOther) throw new Error('A page must contain at least one header and one other type of block');

      // if ADMIN: check if the author selected by the admin exists in the database
      if (user.isAdmin === 1) {
        const usersNames = await API.getUsersNames();
        const authorExists = usersNames.some((userName) => userName === pageToSave.author);
        if (!authorExists) throw new Error('The selected author does not exist');
      }

      if (page) {
        pageToSave.id = page.id;
        props.editPage(pageToSave);
      } else {
        props.createPage(pageToSave);
      }
      navigate('/pages');
    } catch (err) {
      setErrorMessage(err.message); setShow(true);
    }
  };
  
  return (
    <Form onSubmit={handleSubmit} className='below-nav' style={{ marginLeft: '15px', marginRight: '15px' }}>

      <h2 className="mb-4">Page</h2>
      
      <Card className="muted-color mb-3" >
        <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" value={title} onChange={(ev) => setTitle(ev.target.value)} required={true} />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Author</Form.Label>
          <Form.Control type="text" value={author} onChange={(ev) => setAuthor(ev.target.value)} required={true} disabled={user.isAdmin === 0}/>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Creation Date</Form.Label>
          <Form.Control type="date" value={creationDate} onChange={(ev) => setCreationDate(ev.target.value)} required={true} disabled />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Publication Date</Form.Label>
          <Form.Control type="date" value={publicationDate} onChange={(ev) => setPublicationDate(ev.target.value)} min={creationDate} />
        </Form.Group>
        </Card.Body>
      </Card>
      
      {/* for each block we create a BlockForm component*/}
      {blocks.map((block, index) => {
        return <BlockForm key={index} index={index} blocks={blocks} setBlocks={setBlocks} />;
      })}

      <div>
        <Button variant="secondary" className="add-block-button w-100 mb-3" 
          onClick={() => setBlocks([...blocks, { type: 'header', content: '' }])}>
          Add new block</Button>
      </div>

      <Alert dismissible show={show} onClose={() => setShow(false)} variant="danger">
        {errorMessage}
      </Alert>

      <Button variant="primary" type="submit">Save</Button>
      <Button variant="danger" className="ms-2" onClick={() => navigate('/pages')}>Cancel</Button>
    </Form>
  );
}

export { PageCard, PersonalPageCard, NewPageButton, PageHeader, PageForm };