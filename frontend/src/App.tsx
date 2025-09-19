import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { NavigationSidebar } from "./components/SideBar/NavigationSidebar";
import { WelcomePage } from './pages/WelcomePage/WelcomePage';
import { Home } from './pages/Home/HomePage';
import { UploadDocument } from './pages/CreateProject/UploadDocuments/UploadDocument';
import { ConfigProvider } from 'antd';
import { StepForm } from './pages/CreateProject/StepWizard';
import { ReviewTable } from './pages/CreateProject/ReviewTable/ReviewTable';
import { ExportPage } from './pages';
import { ColumnSelection } from './pages/CreateProject/ColumnSelection/ColumnSelection';
import { DocumentReview } from './pages/CreateProject/DocumentReview/DocumentReview'; // Added this import
import { PptHome } from './pages/PptProject/Home/Home';
import UploadModelPage from './pages/PptProject/CreateProject/UploadModel/UploadModel';
import PipelineManagementPage  from './pages/ViewerModule/PipelineManagementPage';
import {ViewerPage} from "./pages/ViewerModule/ViewerPage";
import {ManageSettingsPage} from "./pages/ViewerModule/"
import ScreenshotPreviewPage from './pages/PptProject/CreateProject/ScreenshotPreview/ScreenshotPreview';
import PresentationPreviewPage from './pages/PptProject/CreateProject/PresentationPreview/PresentationPreview';

function App() {
  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            Menu: {
              itemSelectedBg: '#2d2b28',
              itemSelectedColor: '#ffffff',
              itemHoverBg: '#2d2b28',
              colorText: '#ffffff' 
            },
          },
        }}
      >
        <BrowserRouter>
            <div className="w-screen flex">
              <div className="fixed top-0 left-0 overflow-y-auto">
                <NavigationSidebar />
              </div>
              <div 
                style={{ marginLeft: "var(--nav-width)" }}
                className="w-screen"
              >
                <Routes>
                  <Route path="/" element={<WelcomePage />} />
                  <Route path="home" element={<Home />} />
                  <Route path="/viewer" element={<ViewerPage />} />
                  <Route path="/pipeline-management" element={<PipelineManagementPage />} />
                  <Route path="/manage-settings/:projectId/:pipelineId" element={<ManageSettingsPage />} />
                  {/* routes and subroutes */}

                  <Route path="/create" element={<StepForm />} >
                    <Route path="upload" element={<UploadDocument />} />
                    <Route path="document-review" element={<DocumentReview />} />
                    <Route path="review" element={<ReviewTable />} />
                    <Route path="selection" element={<ColumnSelection />} />
                    <Route path="export" element={<ExportPage />} />
                  </Route>
                  <Route path="/ppt/home" element={<PptHome />} />
                    <Route path="/ppt/create/upload" element={<UploadModelPage />} />
                    <Route path="/ppt/create/preview-screenshot" element={<ScreenshotPreviewPage />} />
                    <Route path="/ppt/create/presentation" element={<PresentationPreviewPage />} />
                    <Route path="/ppt/projects" element={<PipelineManagementPage />} />
                </Routes>
              </div>
            </div>
        </BrowserRouter>
      </ConfigProvider>
    </>
    
  );
}

export default App;