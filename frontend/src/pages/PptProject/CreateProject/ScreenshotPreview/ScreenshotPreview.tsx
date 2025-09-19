import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Row, Col, Typography, Button, Input, Select, message, Spin } from 'antd';
// @ts-ignore
import { getScreenshotsBySetting, getScreenshotImage } from '../../../../vendor/o3dv/source/engine/parameters/screenshotApi.js';
// @ts-ignore
import { listViewerSettingsAPI } from '../../../../vendor/o3dv/source/engine/parameters/viewerApi.js';
const { Title } = Typography;
const { Option } = Select;

const ScreenshotPreviewPage: React.FC = () => {
  const location = useLocation();
  // Try to get projectId and pipelineId from navigation state
  const initialProjectId = location.state?.projectId || '';
  const initialPipelineId = location.state?.pipelineId || '';
  const [projectId, setProjectId] = useState<number | ''>(initialProjectId);
  const [pipelineId, setPipelineId] = useState<number | ''>(initialPipelineId);
  const [settings, setSettings] = useState<any[]>([]);
  const [settingId, setSettingId] = useState<number | ''>('');
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load settings when projectId or pipelineId changes
  useEffect(() => {
    const loadSettings = async () => {
      setSettings([]);
      setSettingId('');
      setScreenshots([]);
      setImages([]);
      if (!projectId || !pipelineId) return;
      try {
        // @ts-ignore
        const pipelines = await listViewerSettingsAPI(projectId);
        const pipeline = pipelines.find((p: any) => p.pipeline_id == pipelineId);
        setSettings(pipeline ? pipeline.settings : []);
      } catch (err) {
        message.error('Fehler beim Laden der Settings');
      }
    };
    loadSettings();
  }, [projectId, pipelineId]);

  // Auto-load settings and screenshots if projectId/pipelineId are provided from navigation
  useEffect(() => {
    if (initialProjectId && initialPipelineId) {
      setProjectId(initialProjectId);
      setPipelineId(initialPipelineId);
    }
  }, [initialProjectId, initialPipelineId]);

  // Load screenshots when settingId changes
  useEffect(() => {
    const loadScreenshots = async () => {
      setScreenshots([]);
      setImages([]);
      setSelectedIndex(0);
      if (!settingId) return;
      setLoading(true);
      try {
        const shots = await getScreenshotsBySetting(settingId);
        setScreenshots(shots);
        // Fetch images as data URLs
        const imgs = await Promise.all(
          shots.map(async (shot: any) => {
            try {
              const blob = await getScreenshotImage(shot.id);
              return URL.createObjectURL(blob);
            } catch {
              return '';
            }
          })
        );
        setImages(imgs);
      } catch (err) {
        message.error('Fehler beim Laden der Screenshots');
      } finally {
        setLoading(false);
      }
    };
    loadScreenshots();
  }, [settingId]);

  // When settings are loaded, auto-select the first setting and load screenshots
  useEffect(() => {
    if (settings.length > 0 && !settingId) {
      setSettingId(settings[0].id);
    }
  }, [settings]);

  return (
    <div style={{ padding: '32px', backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* Header with title, breadcrumb, and export button */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Title level={3} style={{ margin: 0 }}>Preview Screenshots</Title>
          </div>
        </Col>
        <Col>
          <Button onClick={() => navigate('/ppt/create/presentation')} type="primary" size="large" style={{ background: '#222', borderColor: '#222' }}>
            Export to Presentation
          </Button>
        </Col>
      </Row>

      {/* Project/Pipeline/Setting selection */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Input
          type="number"
          placeholder="Project ID"
          value={projectId}
          onChange={e => setProjectId(e.target.value ? +e.target.value : '')}
          style={{ width: 120 }}
        />
        <Input
          type="number"
          placeholder="Pipeline ID"
          value={pipelineId}
          onChange={e => setPipelineId(e.target.value ? +e.target.value : '')}
          style={{ width: 120 }}
        />
        <Select
          placeholder="Select Setting"
          value={settingId !== '' ? settingId : undefined}
          onChange={val => setSettingId(val)}
          style={{ width: 180 }}
          disabled={!settings.length}
        >
          {settings.map(s => (
            <Option key={s.id} value={s.id}>{s.name || `Setting ${s.id}`}</Option>
          ))}
        </Select>
      </div>

      {/* Main screenshot preview with navigation arrows */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        minHeight: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px #f0f1f2',
        marginBottom: 32,
        position: 'relative',
      }}>
        {/* Left Arrow */}
        <Button
          shape="circle"
          size="large"
          style={{ position: 'absolute', left: 16, zIndex: 1 }}
          disabled={selectedIndex === 0 || loading || !images.length}
          onClick={() => setSelectedIndex((idx) => Math.max(0, idx - 1))}
        >
          {'<'}
        </Button>
        {loading ? (
          <Spin size="large" />
        ) : images[selectedIndex] ? (
          <img
            src={images[selectedIndex]}
            alt={`Screenshot ${selectedIndex + 1}`}
            style={{ maxHeight: 350, maxWidth: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ color: '#888' }}>No screenshot</div>
        )}
        {/* Right Arrow */}
        <Button
          shape="circle"
          size="large"
          style={{ position: 'absolute', right: 16, zIndex: 1 }}
          disabled={selectedIndex === images.length - 1 || loading || !images.length}
          onClick={() => setSelectedIndex((idx) => Math.min(images.length - 1, idx + 1))}
        >
          {'>'}
        </Button>
      </div>

      {/* Thumbnails */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, overflowX: 'auto', padding: '8px 0' }}>
        <div style={{ fontWeight: 500, minWidth: 80 }}>All Images</div>
        {images.map((src, idx) => (
          <div
            key={screenshots[idx]?.id || idx}
            onClick={() => setSelectedIndex(idx)}
            style={{
              border: idx === selectedIndex ? '2px solid #1890ff' : '2px solid transparent',
              borderRadius: 8,
              cursor: 'pointer',
              padding: 2,
              background: '#fafbfc',
              transition: 'border 0.2s',
            }}
          >
            <img
              src={src}
              alt={`Thumbnail ${idx + 1}`}
              style={{ width: 70, height: 50, objectFit: 'contain', borderRadius: 6 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScreenshotPreviewPage;