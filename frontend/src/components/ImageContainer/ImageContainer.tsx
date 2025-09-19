import { Button, Dropdown } from 'antd';
import { MoreOutlined, DeleteOutlined } from '@ant-design/icons';

export interface ImageContainerProps {
  id: number;
  name: string;
  lima_number: string;
  version: string;
  created_at: string;
  image_url: string;
  onClick?: () => void;
  onDeleteEvent?: (id: number) => void;
}


export const ImageContainer: React.FC<ImageContainerProps> = ({
  id,
  name,
  created_at,
  image_url,
  onClick,
  onDeleteEvent
}) => {
  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col">
        {/* PDF Preview Image */}
        <div className="mb-3 h-40 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
          {image_url ? (
            <img 
              src={image_url} 
              alt={`Preview of ${name}`} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>No preview available</span>
            </div>
          )}
        </div>
        
        {/* File Information */}
        <div className="flex w-full items-start justify-between">
          <div className="flex-1 max-w-[75%]">
            <h3 className="font-medium text-gray-800 truncate">
              {name}
            </h3>
            <p className="text-sm text-gray-500 mt-2 truncate">Uploaded on {created_at}</p>            
          </div>
            <Dropdown menu={{ 
              items: [
                {
                  key: '1',
                  title: 'Delete',
                  label: (
                    <span onClick={() => {
                      if (onDeleteEvent) {
                        onDeleteEvent(id);
                      }
                    }}>
                      <DeleteOutlined />
                      <span className="mx-2">
                        Delete
                      </span>
                    </span>
                  )
                }
              ]  
            }} trigger={['click']}>
              <Button className="px-1 p-0">
                <MoreOutlined />
              </Button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default ImageContainer; 