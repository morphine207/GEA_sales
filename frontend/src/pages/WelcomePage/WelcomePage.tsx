import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Typography, Button,Row,Col,Card,Space,Input,Table,Tag,Select,Dropdown,} from 'antd';
import type { MenuProps, TableProps } from 'antd';
import {PlusOutlined,SearchOutlined,FileExcelOutlined,FilePptOutlined,FolderOpenOutlined,ArrowUpOutlined,ArrowDownOutlined,MoreOutlined,FileTextOutlined} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// --- Mock Data and Interfaces ---

interface FileData {
  key: string;
  name: string;
  type: 'Excel' | 'PPT';
  lastModified: string;
  tags: string[];
}

const mockFiles: FileData[] = [];

const getFileIcon = (type: FileData['type']) => {
    switch (type) {
        case 'Excel':
            return <FileExcelOutlined style={{ color: '#217346', fontSize: '18px' }} />;
        case 'PPT':
            return <FilePptOutlined style={{ color: '#D24726', fontSize: '18px' }} />;
        default:
            return <FileTextOutlined style={{ color: '#888', fontSize: '18px' }}/>;
    }
}

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortKey, setSortKey] = useState<'name' | 'lastModified'>('lastModified');
  
  const getFileActionMenu = (record: FileData): MenuProps['items'] => [
    {
      key: '1',
      label: 'Open',
      onClick: () => console.log('Open project:', record.name),
    },
    {
      key: '2',
      label: 'Delete',
      danger: true,
      onClick: () => console.log('Delete project:', record.name),
    },
  ];


  const columns: TableProps<FileData>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: FileData, b: FileData) => a.name.localeCompare(b.name),
      render: (name: string, record: FileData) => (
        <Space>
            {getFileIcon(record.type)}
            <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Excel', value: 'Excel' },
        { text: 'PPT', value: 'PPT' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type: string) => {
        let color = 'geekblue';
        if (type === 'Excel') color = 'green';
        if (type === 'PPT') color = 'volcano';
        return <Tag color={color}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      sorter: (a: FileData, b: FileData) => new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime(),
      defaultSortOrder: 'descend' as 'descend',
    },
    {
        title: 'Actions',
        key: 'actions',
        align: 'center' as 'center',
        render: (_: any, record: FileData) => (
            <Dropdown menu={{ items: getFileActionMenu(record) }} trigger={['click']}>
                <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
        ),
    },
  ];

  const filteredAndSortedFiles = mockFiles
    .filter(file => file.name.toLowerCase().includes(searchValue.toLowerCase()))
    .sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        const compare = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? compare : -compare;
    });

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Content style={{ padding: '24px 48px' }}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '32px' }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>Welcome Back!</Title>
            <Paragraph type="secondary">Here's your dashboard to automate your process planning tasks.</Paragraph>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              style={{ background: '#222', borderColor: '#222' }}
              onClick={() => navigate('/ppt/projects')}
            >
              Create New Project
            </Button>
          </Col>
        </Row>

        {/* Quick Access */}
        <div style={{ marginBottom: '32px' }}>
            <Title level={4} style={{marginBottom: '16px'}}>Quick Access</Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <Card hoverable onClick={() => navigate('/ppt/projects')}>
                        <Space>
                            <FolderOpenOutlined style={{fontSize: '24px', color: '#1890ff'}}/>
                            <Text strong>Manage Projects</Text>
                        </Space>
                        <Paragraph type="secondary" style={{marginTop: 8, marginBottom: 0}}>View and organize all your ongoing projects.</Paragraph>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card hoverable onClick={() => navigate('/create')}>
                        <Space>
                            <FileExcelOutlined style={{fontSize: '24px', color: '#217346'}}/>
                            <Text strong>Auto Excel Tool</Text>
                        </Space>
                         <Paragraph type="secondary" style={{marginTop: 8, marginBottom: 0}}>Generate process sheets from schematics.</Paragraph>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card hoverable onClick={() => navigate('/ppt/create/upload')}>
                         <Space>
                            <FilePptOutlined style={{fontSize: '24px', color: '#D24726'}}/>
                            <Text strong>Auto Presentation Tool</Text>
                        </Space>
                         <Paragraph type="secondary" style={{marginTop: 8, marginBottom: 0}}>Create presentations from 3D models.</Paragraph>
                    </Card>
                </Col>
            </Row>
        </div>


        {/* All Projects Section */}
        <Card>
            <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                <Col>
                     <Title level={4} style={{ margin: 0 }}>All Projects</Title>
                </Col>
                <Col>
                    <Space wrap>
                        <Input
                            placeholder="Search files..."
                            prefix={<SearchOutlined />}
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            style={{ width: 240 }}
                        />
                        <Select value={sortKey} onChange={setSortKey}>
                            <Option value="lastModified">Sort by Date</Option>
                            <Option value="name">Sort by Name</Option>
                        </Select>
                        <Button 
                            icon={sortOrder === 'asc' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} 
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        />
                    </Space>
                </Col>
            </Row>
            <Table
                columns={columns}
                dataSource={filteredAndSortedFiles}
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: 'No projects found. Create your first project to get started.' }}
                />
        </Card>
      </Content>
    </Layout>
  );
};
