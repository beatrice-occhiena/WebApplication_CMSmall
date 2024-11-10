'use strict';

// APP LAYOUTS
// Different layouts for different pages
// -------------------------------------

import { PageCard, PersonalPageCard, NewPageButton, PageHeader, PageForm } from './Page';
import { Outlet, useParams } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { Button, Row, Col, Form, Alert } from 'react-bootstrap';
import API from '../API';
import { Blocks } from './Blocks';
import '../App.css';
import MessageContext from '../messageCtx';
import dayjs from 'dayjs';

// Presentation text
const presentationText = "Welcome to our web application, the ideal content management system for small websites. As a simple guest, you can explore our beautifully curated content and gain valuable insight on a variety of topics. But as a registered user, you can take full control of your digital presence. Create and manage engaging pages, personalize your content, and unleash your creativity to engage your audience like never before. Join us today and experience the power of our CMS to take your online presence to new heights.";
    
// Front Office
function FrontOfficeLayout(props){

  const {handleErrors} = useContext(MessageContext);
  const [loading, setLoading] = useState(false);

  // get pages from the server and order them by publication date
  // ------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    API.getPages()
      .then((pages) => {
        // sort pages by publication date
        pages.sort((a, b) => {
          if (a.publicationDate < b.publicationDate) return 1;
          else if (a.publicationDate > b.publicationDate) return -1;
          else return 0;
        });
        // IMPORTANT:
        // for guests users, first of all I filtered on the server side!
        // but since for logged in users all the pages are downloaded
        // I decided to filter on the client side as well 
        // to have data consistency in the frontoffice
        pages = pages.filter((page) => page.publicationDate !== '' && page.publicationDate <= dayjs().format('YYYY-MM-DD'));
        props.setPages(pages);
      })
      .catch((err) => {
        handleErrors(err);
      })
      .finally(() => {
        setLoading(false);
      });
  },[]); // only on first render

  const { pages } = props;

  // render the page layout
  // ----------------------
  return (
    loading ? <LoadingLayout /> :
    <div className='below-nav'>
      <h1>Newly published pages</h1>
      <div className="card mt-4">
        <div className="card-body">
          <p className="card-text">
            {presentationText}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="row"> 
          {pages.map((page) => (
            <div className="col-md-4 mb-4" key={page.id}>
              <PageCard pageData={page} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Back Office
function BackOfficeLayout(props) {

  const {handleErrors} = useContext(MessageContext);
  const [loading, setLoading] = useState(false);

  // get pages from the server and order them by publication date
  // ------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    API.getPages()
      .then((pages) => {
        // sort pages by creation date
        pages.sort((a, b) => {
          if (a.creationDate < b.creationDate) return 1;
          else if (a.creationDate > b.creationDate) return -1;
          else return 0;
        });
        props.setPages(pages);
      })
      .catch((err) => {
        handleErrors(err);
      })
      .finally(() => {
        props.setDirty(false);
        setLoading(false);
      });
  },[props.dirty]); // only on first render and when a page is deleted

  const { pages } = props;
  const myPages = pages.filter((page) => page.author === props.user.name);
  const otherPages = pages.filter((page) => page.author !== props.user.name);

  // handle the deletion of a page
  //------------------------------
  const deletePage = (pageId) => {
    API.deletePage(pageId)
      .then(() => { props.setDirty(true); })
      .catch(e => handleErrors(e)); 
  }

  // if ADMIN: handle the form to change the website name
  // ---------------------------------------------------
  const { siteName, setSiteName } = props;
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (ev) => { // #to_do: check if it works
    try{
      ev.preventDefault();
      const newSiteName = ev.target.siteName.value.trim();
      if (newSiteName === '') throw new Error('Website name cannot be empty');

      const res = await API.setWebsiteName(newSiteName);
      if (res) setSiteName(res.name);
    } catch (err) {
      setErrorMessage(err.message); setShow(true); 
    }
  }

  // if ADMIN: add a section with h2 "Website name" and a form to change it
  // ----------------------------------------------------------------------
  const adminSection = props.user.isAdmin === 1 ? (
    <div>
      <h2> Website name </h2>
      <Form onSubmit={handleSubmit} className="mt-4">
        <Form.Group controlId="siteName">
          <Form.Control type="text" defaultValue={siteName} required={true} /> 
          <Button className="btn-sm mt-2" type='submit'> Update </Button>
        </Form.Group>
        <Alert dismissible show={show} onClose={() => setShow(false)} variant="danger">
          {errorMessage}
        </Alert>
      </Form>
      <hr />
    </div>
  ) : <></>;

  // render the backoffice page layout
  // ---------------------------------
  return (
    loading ? <LoadingLayout /> :
    <div className='below-nav'>
      {adminSection}
      <h2>Your pages <NewPageButton /></h2>
      <div className="mt-4">
        <div className="row">
          {myPages.map((page) => (
            <div className="col-md-4 mb-4" key={page.id}>
              <PersonalPageCard pageData={page} deletePage={deletePage} />
            </div>
          ))}
        </div>
      </div>
      <hr />
      <h2 className='mt-4'>From other authors</h2>
      <div className="mt-4">
        <div className="row">
          {otherPages.map((page) => (
            <div className="col-md-4 mb-4" key={page.id}>
              {props.user.isAdmin === 1 ? 
                <PersonalPageCard pageData={page} deletePage={deletePage} /> :
                <PageCard pageData={page} />
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// View Page
function ViewPageLayout(props) {
  
  const {handleErrors} = useContext(MessageContext);
  const { id } = useParams(); // get pageId from the URL

  const [page, setPage] = useState(null); // page to be shown

  // get page from the server
  // ------------------------
  useEffect(() => {
    API.getPageById(id)
      .then((page) => {
        setPage(page);
      })
      .catch((err) => {
        handleErrors(err);
      })
  },[id]); // only on first render and when pageId changes

  // render the page layout
  // ONLY IF is not empty!!!
  // -----------------------
  return (
    page ?
      <div className='below-nav'>
        <PageHeader pageData={page} />
        <p>   </p>
        <Blocks blocks={page} />
        <Button onClick={() => window.history.back()}>
          <i className="bi bi-arrow-left"></i> Back
        </Button>
      </div>
    : < ></>    
  );
}

// Edit Page
function EditPageLayout(props) {

  const setDirty = props.setDirty;
  const user = props.user;
  const {handleErrors} = useContext(MessageContext);

  const { id } = useParams(); // get pageId from the URL
  const [page, setPage] = useState(null); // page to be edited

  // get page from the server
  useEffect(() => {
    API.getPageById(id)
      .then((page) => {
        setPage(page);
      })
      .catch((err) => {
        handleErrors(err);
      })
  },[id]); // only on first render and when pageId changes

  // edit page
  const editPage = (page) => {
    API.updatePage(page)
      .then(() => { setDirty(true); })
      .catch(e => handleErrors(e));
  }

  return (
    page ? <PageForm pageData={page} user={user} editPage={editPage} /> : <></>
  );
}

// Create Page
function CreatePageLayout(props) {
  
  const setDirty = props.setDirty;
  const user = props.user;
  const {handleErrors} = useContext(MessageContext);

  // create page
  const createPage = (page) => {
    API.createPage(page)
      .then(() => { setDirty(true); })
      .catch(e => handleErrors(e));
  }
  
  return (
    <PageForm createPage={createPage} user={user} />
  );
}

// Loading
function LoadingLayout(props) {
  return (
    <div className="below-nav">
        <h1>The app is loading ...</h1>
    </div>
  )
}

export { FrontOfficeLayout, BackOfficeLayout, ViewPageLayout, EditPageLayout, CreatePageLayout, LoadingLayout };