import React, { useState } from 'react';
import { Row, Col, Typography, Button, List, Avatar, Input, Divider, Modal, message } from 'antd';
const { Title } = Typography;

const initialSlides = [
  {
    title: 'OP10 | Part Flow',
    img: 'https://via.placeholder.com/120x80?text=Slide+1',
    content: 'This is the content for Part Flow.',
  },
  {
    title: 'OP10 | Weld Plan',
    img: 'https://via.placeholder.com/120x80?text=Slide+2',
    content: 'This is the content for Weld Plan.',
  },
];

const PresentationPreview: React.FC = () => {
  const [slides, setSlides] = useState(initialSlides);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Open edit modal
  const openEditModal = () => {
    setEditTitle(slides[selectedIndex].title);
    setEditContent(slides[selectedIndex].content);
    setIsEditing(true);
  };

  // Save edits
  const handleSaveEdit = () => {
    const updatedSlides = [...slides];
    updatedSlides[selectedIndex] = {
      ...updatedSlides[selectedIndex],
      title: editTitle,
      content: editContent,
    };
    setSlides(updatedSlides);
    setIsEditing(false);
    message.success('Slide updated!');
  };

  // Save presentation (stub)
  const handleSavePresentation = () => {
    // Save to backend or local storage
    message.success('Presentation saved!');
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 56 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Presentation Preview</Title>
        </Col>
        <Col>
          <Button type="primary" size="large" style={{ background: '#222', borderColor: '#222' }} onClick={handleSavePresentation}>
            Export Presentation
          </Button>
        </Col>
      </Row>

      {/* Main Content */}
      <div style={{ background: '#fff', borderRadius: 12, minHeight: 500, display: 'flex', boxShadow: '0 2px 8px #f0f1f2' }}>
        {/* Slide Preview */}
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
          {/* Edit Button above slide */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button onClick={openEditModal}>Edit Slide</Button>
          </div>
          <div style={{ flex: 1, padding: 32, position: 'relative', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px #e0e0e0', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Title level={4} style={{ marginBottom: 12 }}>{slides[selectedIndex].title}</Title>
            <Divider />
            <div style={{ marginBottom: 24 }}>{slides[selectedIndex].content}</div>
            <img src={slides[selectedIndex].img} alt="slide" style={{ maxWidth: '100%', maxHeight: 300 }} />
          </div>
        </div>
        {/* Sidebar */}
        <div style={{ width: 300, padding: 24, borderLeft: '1px solid #eee', background: '#fafbfc', borderRadius: '0 12px 12px 0' }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>
            Slides <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}>• Total {slides.length}</span>
          </div>
          <List
            itemLayout="horizontal"
            dataSource={slides}
            renderItem={(slide, idx) => (
              <List.Item
                style={{
                  borderRadius: 8,
                  marginBottom: 8,
                  background: idx === selectedIndex ? '#e6f7ff' : 'transparent',
                  padding: 8,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedIndex(idx)}
              >
                <List.Item.Meta
                  avatar={<Avatar shape="square" size={60} src={slide.img} />}
                  title={<span style={{ fontWeight: 600, fontSize: 16 }}>{idx + 1} {slide.title}</span>}
                />
              </List.Item>
            )}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title="Edit Slide"
        open={isEditing}
        onOk={handleSaveEdit}
        onCancel={() => setIsEditing(false)}
        okText="Save"
      >
        <Input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          placeholder="Slide Title"
          style={{ marginBottom: 16 }}
        />
        <Input.TextArea
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          placeholder="Slide Content"
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default PresentationPreview;