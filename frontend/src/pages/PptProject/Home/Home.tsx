import { useNavigate } from 'react-router-dom';

export const PptHome = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Getting Started</h2>
        <hr className="my-8 border-gray-300" />
        {/* Main Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/ppt/create/upload')}
            className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-[#0026B7] text-white font-medium py-3 px-6 rounded-lg flex items-center text-lg shadow-md transition-all duration-200"
          >
            Start New Project
          </button>
{/*           <button
            onClick={() => {'navigation for the 3D Viewer app'}}
            className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-[#0026B7] text-white font-medium py-3 px-6 rounded-lg flex items-center text-lg shadow-md transition-all duration-200"
          >
            3D Viewer
          </button>
          <button
            onClick={() => {'navigation for PPT app'}}
            className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-[#0026B7] text-white font-medium py-3 px-6 rounded-lg flex items-center text-lg shadow-md transition-all duration-200"
          >
            PPT
          </button>
 */}        </div>
      </div>
    </div>
  );
};