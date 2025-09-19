import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageContainer } from '../../components/ImageContainer';
import { useFileListStore } from '../../store/file-list.store';
import { toast } from 'react-toastify';

export const Home = () => {
  const navigate = useNavigate();

  const [filter, setFilter] = useState("")

  const { projects, loading, fetchFiles, deleteProject } = useFileListStore();

  useEffect(() => {
    fetchFiles()
  }, []);


  return (
    <div className="p-8">
      <div className="
        search-bar
        mb-8
      ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="
        getting-started-section
        mb-8
      ">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Getting Started</h2>
        <button
          onClick={() => navigate('/create/upload')}
          className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-[#0026B7] text-white font-medium py-3 px-6 rounded-lg flex items-center text-lg shadow-md transition-all duration-200"
        >
          <div className="bg-white bg-opacity-20 rounded-full p-1 mr-3 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          New
        </button>
      </div>

      <hr className="my-8 border-gray-300" />

      <div className="
        recents-section
        mb-8
      ">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">All Files</h2>
        {!loading && projects.length > 0 ? (
          <div className="grid grid-cols-auto-fill-64 gap-4 p-4">
            {
              projects.map((p) =>
                p.name.includes(filter) &&
                p.files.map(file => (
                  <ImageContainer
                    id={p.id}
                    key={file.id + p.id}
                    name={p.name}
                    lima_number={p.lima_number}
                    version={p.version}
                    created_at={
                      file.created_at && new Date(file.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }).split('/').join('.')
                    }
                    image_url={""}
                    onDeleteEvent={(id) => {
                      deleteProject(id).then(() => {
                        toast.success("project deleted successfully");
                      });
                    }}
                  />
                ))
              )
            }
          </div>
        ) : (
          <p className="text-gray-500">No recent uploads found.</p>
        )}
      </div>
    </div>
  );
};