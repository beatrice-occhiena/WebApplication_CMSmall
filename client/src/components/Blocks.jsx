'use strict';

// BLOCKS COMPONENT
// Page blocks and their elements
// ------------------------------
import React, { useState, useEffect } from 'react';
import { Form, Card, Button, Row, Col} from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

import '../App.css';

// images path
const imagesPath = '../../public/';

// View blocks
// -----------
const Blocks = (props) => {
  const { blocks } = props.blocks;
  return (
    <div>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'header':
            return <h5 key={index}>{block.content}</h5>;
          case 'paragraph':
            return <p key={index}>{block.content}</p>;
          case 'image':
            return <img key={index} src={imagesPath + block.content} alt="block image" className="img-fluid mb-3" />;
          default:
            return <p key={index}>Unknown block type</p>;
        }
      })}
    </div>
  );
};

// Edit blocks
// -----------

const BlockForm = (props) => {
  const { index, blocks, setBlocks } = props;
  const block = blocks[index];

  const handleTypeChange = (ev) => {
    const newBlockType = ev.target.value;
    const updatedBlocks = [...blocks];

    // reset the content when changing the block type
    updatedBlocks[index].type = newBlockType;
    updatedBlocks[index].content = '';

    setBlocks(updatedBlocks);
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        
        {/* Block type */}
        <Form.Group controlId={"blockContent"+index}>
          <Form.Label>Block Type</Form.Label>
          <Form.Select value={block.type} onChange={handleTypeChange}>
            <option value={''} disabled>Choose a block type</option>
            <option value={'header'}>Header</option>
            <option value={'paragraph'}>Paragraph</option>
            <option value={'image'}>Image</option>
          </Form.Select>
        </Form.Group>
        
        {/* Block content */}
        <BlockContent index={index} blocks={blocks} setBlocks={setBlocks} />
        
        {/* Buttons */}
        <Row>
          <div className="d-flex justify-content-end mb-1"> 
            <UpButton index={index} blocks={blocks} setBlocks={setBlocks} /> 
          </div>
          <div className="d-flex">  
            <DeleteButton index={index} blocks={blocks} setBlocks={setBlocks} /> 
            <DownButton index={index} blocks={blocks} setBlocks={setBlocks} /> 
          </div>
        </Row>
      </Card.Body>

        
    </Card>
  );
};

/*
  block internal structure:
  {
    type: 'header' | 'paragraph' | 'image',
    content: string
  }
  if type === 'image' content is the image filename e.g. 'img1.png'
*/
const BlockContent = (props) => {
  
  const { index, blocks, setBlocks } = props;
  const blockType = blocks[index].type;
  const blockContent = blocks[index].content;

  const handleContentChange = (ev) => {
    const newContent = ev.target.value;
    const updatedBlocks = [...blocks];
    updatedBlocks[index].content = newContent;
    setBlocks(updatedBlocks);
  };


  switch (blockType) {
    case 'header':
      return (
        <Form.Group controlId={"blockContent"+index}  className="mt-2 mb-2" >
          <Form.Control type="text" value={blockContent} placeholder="Header" onChange={handleContentChange} required={true} />
        </Form.Group>
      );
    case 'paragraph':
      return (
        <Form.Group controlId={"blockContent"+index} className="mt-2 mb-2" >
          <Form.Control as="textarea" value={blockContent} rows={3} placeholder="Paragraph" onChange={handleContentChange} required={true} />
        </Form.Group>
      );
    case 'image':
      return (
        <Form.Group controlId={"blockContent"+index} className="mt-2 mb-2" >
          <div className="d-flex flex-wrap">
            <ImageOption src="img1.png" alt="img1" value={blockContent} onChange={handleContentChange}/>
            <ImageOption src="img2.png" alt="img2" value={blockContent} onChange={handleContentChange}/>
            <ImageOption src="img3.png" alt="img3" value={blockContent} onChange={handleContentChange}/>
            <ImageOption src="img4.png" alt="img4" value={blockContent} onChange={handleContentChange}/>
          </div>
        </Form.Group>
      );
    default:
      return <></>; 
  }
};

// Image selection
// ---------------
const ImageOption = (props) => {
  const { src, alt, value, onChange } = props;

  // when the image is selected, we update the block content
  // converting the ev.target.value to the image filename
  const handleImageChange = (ev) => {
    onChange({ target: { value: src } });
  };

  return (
    <Form.Check
      type="radio"
      name="imageOption"
      id={src}
      label={<img src={imagesPath + src} alt={alt} style={{ width: '560px', height: '50px' }}/>}
      checked={src === value}
      onChange={handleImageChange}
      required={true}
    />
  );
};


// Buttons
// -------
const DeleteButton = (props) => {
  const { index, blocks, setBlocks } = props;
  
  const handleDelete = () => {
    const newBlocks = blocks.filter((block, i) => i !== index);
    setBlocks(newBlocks);
  };

  return (
    <Button variant="danger" onClick={handleDelete} className="btn-sm d-flex me-auto" style={{ fontSize: '10px', padding: '2px' }}>
      <i className="bi bi-x-lg"></i>
    </Button>
  );
};

const UpButton = (props) => {
  const { index, blocks, setBlocks } = props;
  const isFirstBlock = index === 0 ? true : false;

  const moveBlockUp = () => {
    if (!isFirstBlock) {
      const newBlocks = [...blocks];
      const temp = newBlocks[index - 1];
      newBlocks[index - 1] = newBlocks[index];
      newBlocks[index] = temp;
      setBlocks(newBlocks);
    }
  };

  return (
    <Button variant="secondary" disabled={isFirstBlock} onClick={moveBlockUp} className="btn-sm" style={{ fontSize: '10px', padding: '2px' }}>
      <i className="bi bi-caret-up-fill"></i>
    </Button>
  );
};

const DownButton = (props) => {
  const { index, blocks, setBlocks } = props;
  const isLastBlock = index === blocks.length - 1 ? true : false;

  const moveBlockDown = () => {
    if (!isLastBlock) {
      const newBlocks = [...blocks];
      const temp = newBlocks[index + 1];
      newBlocks[index + 1] = newBlocks[index];
      newBlocks[index] = temp;
      setBlocks(newBlocks);
    }
  };

  return (
    <Button variant="secondary" disabled={isLastBlock} onClick={moveBlockDown} className="btn-sm" style={{ fontSize: '10px', padding: '2px' }}>
      <i className="bi bi-caret-down-fill"></i>
    </Button>
  );
};



export { Blocks, BlockForm };