import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

export const BackButton = () => {
  const navigate = useNavigate();

  return (
    <Button 
      onClick={() => navigate(-1)}
      icon={<ArrowLeftOutlined />}
      style={{ display: 'flex', alignItems: 'center', height: '32px' }}
    >
      Back
    </Button>
  );
};