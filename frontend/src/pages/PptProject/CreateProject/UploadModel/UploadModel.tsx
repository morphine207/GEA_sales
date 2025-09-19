import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Row, Col, Typography, Button, Space, Select, Form, Avatar, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload'; 
import { UploadOutlined } from '@ant-design/icons';
import { useFileStore } from '../../../../store/file.store';
// @ts-ignore: Allow JS import without declaration
import { listViewerSettingsAPI } from '../../../../vendor/o3dv/source/engine/parameters/viewerApi.js';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const UploadModelPage: React.FC = () => {
  const navigate = useNavigate();
  const fetchAllProjects = useFileStore((state) => state.fetchAllProjects);
  const [form] = Form.useForm();
  const [modelFileList, setModelFileList] = useState<UploadFile[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const projectsData = await fetchAllProjects();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (err) {
        setProjects([]);
        message.error('Failed to fetch projects');
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [fetchAllProjects]);

  // Fetch pipelines when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setLoadingPipelines(true);
      listViewerSettingsAPI(selectedProjectId)
        .then((data: any[]) => {
          if (Array.isArray(data)) {
            setPipelines(data.filter(p => p.pipeline_id && p.pipeline_name));
          } else {
            setPipelines([]);
          }
        })
        .catch(() => {
          setPipelines([]);
          message.error('Failed to fetch pipelines');
        })
        .finally(() => setLoadingPipelines(false));
    } else {
      setPipelines([]);
    }
  }, [selectedProjectId]);

  // Fetch models when project changes (separate from pipelines)
  useEffect(() => {
    if (selectedProjectId) {
      setLoadingModels(true);
      fetch(`/api/viewer/${selectedProjectId}/cadfiles`)
        .then(res => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setModels(data);
          } else {
            setModels([]);
          }
        })
        .catch(() => {
          setModels([]);
          message.error('Failed to fetch models');
        })
        .finally(() => setLoadingModels(false));
    } else {
      setModels([]);
    }
  }, [selectedProjectId]);

  const handleModelFileChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.slice(-1);
    setModelFileList(newFileList);

    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const beforeUploadHandler = (file: RcFile) => {
    setModelFileList([file]);
    return false;
  };

  // Only handle navigation with selected project, pipeline, and model
  const handleSubmit = async (values: any) => {
    const { selectedExistingProject, selectedExistingPipeline, selectedExistingModel } = values;
    const uploadedModelFile = modelFileList.length > 0 ? modelFileList[0].originFileObj || modelFileList[0] : null;

    // Requirements to generate screenshots (uploaded or selected)
/*     if (!uploadedModelFile && !selectedExistingModel) {
      message.error('Please upload a new model or select an existing one.');
      return;
    }
 */
    const data = {
      projectId: selectedExistingProject,
      pipelineId: selectedExistingPipeline,
      modelFile: uploadedModelFile,
      existingModelId: selectedExistingModel,
    };
    // Pass projectId and pipelineId to screenshot preview page
    navigate('/ppt/create/preview-screenshot', { state: { projectId: selectedExistingProject, pipelineId: selectedExistingPipeline } });
  };

  const commonFileAccepts = [
    '.step',
    '.stp',
    '.dwg',
    '.dxf',
    '.obj',
    '.fbx',
    '.glb',
    '.gltf',
    '.sldprt',
    '.sldasm',
    '.iges',
    '.igs',
    '.stl',
    'application/STEP',
    'application/sla',
    'model/gltf-binary',
  ].join(',');

  return (
    <div style={{ padding: '32px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Header with title and generate screenshots button */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 56 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Title level={3} style={{ margin: 0 }}>Upload 3D Model</Title>
          </div>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            style={{ background: '#222', borderColor: '#222' }}
            onClick={() => form.submit()}
          >
            Generate Screenshots
          </Button>
        </Col>
      </Row>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          selectedExistingModel: undefined,
        }}
      >
        <Row gutter={48}>
          <Col xs={24} lg={12}>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <Space align="center" size="middle">
                <Avatar
                  size={32}
                  style={{
                    backgroundColor: 'rgb(51, 51, 51)',
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  1
                </Avatar>
                <Title level={4} style={{ margin: 0 }}>
                  Select Project and Pipeline
                </Title>
              </Space>
              <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
                Select the project and associated pipeline you want to work with.
              </Paragraph>
              <Form.Item
                name="selectedExistingProject"
                label={<Text strong>Select from existing Projects</Text>}
                style={{ marginBottom: 0 }}
              >
                <Select
                  size="large"
                  placeholder="Project Name"
                  style={{ width: '100%' }}
                  allowClear
                  loading={loadingProjects}
                  onChange={(value) => {
                    setSelectedProjectId(value);
                    const selected = projects.find((p) => p.id === value);
                    setSelectedProject(selected || null);
                    form.setFieldsValue({ selectedExistingPipeline: undefined });
                  }}
                >
                  {Array.isArray(projects) && projects.map((project) => (
                    <Option key={project.id} value={project.id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {selectedProject && (
                <div style={{ margin: '8px 0', fontWeight: 500, color: '#222' }}>
                  Selected Project: <span style={{ color: '#1677ff' }}>{selectedProject.name}</span>
                </div>
              )}
              <Form.Item
                name="selectedExistingPipeline"
                label={<Text strong>Select from existing Pipelines</Text>}
                style={{ marginBottom: 0 }}
              >
                <Select
                  size="large"
                  placeholder="Pipeline Name"
                  style={{ width: '100%' }}
                  allowClear
                  loading={loadingPipelines}
                  disabled={!selectedProjectId}
                >
                  {Array.isArray(pipelines) && pipelines.map((pipeline) => (
                    <Option key={pipeline.pipeline_id} value={pipeline.pipeline_id}>
                      {pipeline.pipeline_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Space>
          </Col>
          <Col xs={24} lg={12}>
            <Space direction="vertical" size={24} style={{ width: '100%' }}>
              <Space align="center" size="middle">
                <Avatar
                  size={32}
                  style={{
                    backgroundColor: 'rgb(51, 51, 51)',
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  2
                </Avatar>
                <Title level={4} style={{ margin: 0 }}>
                  Upload 3D model
                </Title>
              </Space>
              <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
                Supported formats include .step, .stp, and .obj 
              </Paragraph>
              <Upload
                name="modelFile"
                accept={commonFileAccepts}
                beforeUpload={beforeUploadHandler}
                onChange={handleModelFileChange}
                fileList={modelFileList}
                maxCount={1}
                showUploadList={{
                  showRemoveIcon: true,
                  showPreviewIcon: false,
                }}
              >
                <Button
                  style={{ backgroundColor: '#0026B7', borderColor: '#0026B7', color: 'white' }}
                  icon={<UploadOutlined />}
                  size="large"
                  block
                >
                  Upload new model
                </Button>
              </Upload>
              <Text
                strong
                style={{
                  display: 'block',
                  textAlign: 'center',
                  margin: '16px 0',
                }}
              >
                OR
              </Text>
              <Form.Item
                name="selectedExistingModel"
                label={<Text strong>Select from an existing uploaded model</Text>}
                style={{ marginBottom: 0 }}
              >
                <Select
                  size="large"
                  placeholder="Model Name"
                  style={{ width: '100%' }}
                  allowClear
                  loading={loadingModels}
                  disabled={!selectedProjectId}
                >
                  {Array.isArray(models) && models.length > 0 ? (
                    models.map((model) => (
                      <Option key={model.id} value={model.id}>
                        {model.name}
                      </Option>
                    ))
                  ) : (
                    <Option value={undefined} disabled>
                      {selectedProjectId ? 'No models found for this project' : 'Select a project first'}
                    </Option>
                  )}
                </Select>
              </Form.Item>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default UploadModelPage;