import { useEffect, useMemo, useState } from "react";
import { Input, Tooltip, Spin, Select } from "antd";
import { InfoCircleOutlined } from '@ant-design/icons';
import { UploadForm } from "./UploadForm";
import { useFileStore } from "../../../store/file.store";

/**
 * for the number of files in the project we only assume one value.
 * @returns 
 */
export const UploadDocument = () => {
  const { project, fileImageBlobUrl, loading, createProjectAndUploadFile, loadFileImage, modifyProjectData, selectPagesToScan } = useFileStore();

  const [name, setName] = useState<string>("");
  const [limaNumber, setLimaNumber] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [scannedFileIndex, setScannedFileIndex] = useState<number>(0);

  const getFilePageNumbers = useMemo(() => (project?.files ?? []).length > 0 ? project?.files[0].scanned_files.map(sf => sf.page_number) ?? [] : [], [project?.files])

  useEffect(() => {
    setName(project?.name ?? "");
    setLimaNumber(project?.lima_number ?? "");
    setVersion(project?.version ?? "");
  }, [project?.name, project?.lima_number, project?.version]);

  useEffect(() => {
    if(project && Object.keys(project.files).length > 0 && !fileImageBlobUrl) {
      const projectId = project?.id;
      const fileId = project?.files[0].id;

      if(!projectId || !fileId) return;

      selectPagesToScan(projectId, fileId, [scannedFileIndex]).then(() => {
        loadFileImage(fileId, project.files[0].scanned_files[scannedFileIndex].id, projectId, "medium");
      });

    }
  }, [project?.files]);

  const [timeoutState, setTimeoutState] = useState<NodeJS.Timeout | undefined>(undefined); 
  const onFiledValuesChanged = (
    fields: Partial<{ name: string, limaNumber: string, version: string }>
  ) => {
    if(timeoutState)
      clearTimeout(timeoutState);
    
    setTimeoutState(
      setTimeout(() => {
        if(!project?.id) return;

        modifyProjectData(
          project?.id,
          {
            name: fields?.name ?? name,
            lima_number: fields?.limaNumber ?? limaNumber,
            version: fields?.version ?? version
          }
        );
      }, 400)
    );      
  };

  const postPdfData = async (file: File) => {
    let newprojectName = !name ? file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : name;
    setName(newprojectName);

    try {
      await createProjectAndUploadFile(newprojectName, limaNumber, version, file);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };


  return (
    <div className="flex-1 p-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Upload Your Drawing</h1>
        </div>
        <div 
          className="
            project-details bg-white p-6 rounded-lg shadow-sm mb-8 border border-gray-200
          "
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" >
            <div 
              className="project-name"
            >
              <h2 className="text-lg font-medium mb-2 text-gray-800">Name the project</h2>
              <Input
                placeholder="Enter project name"
                value={name}
                onChange={(e) => { setName(e.target.value); onFiledValuesChanged( { name: e.target.value ?? "" } );  }}
                className="w-full p-2 border border-gray-300 rounded-md"
                size="large"
              />
            </div>
            
            <div className="project-number">
              <h2 className="text-lg font-medium mb-2 text-gray-800">Lima Drawing Number</h2>
              <Input
                placeholder="Enter drawing number"
                value={limaNumber}
                onChange={(e) => { setLimaNumber(e.target.value); onFiledValuesChanged( { limaNumber: e.target.value ?? "" } ); }}
                className="w-full p-2 border border-gray-300 rounded-md"
                size="large"
              />          
            </div>
            <div className="project-version">
              <h2 className="text-lg font-medium mb-2 text-gray-800">Version</h2>
              <Input
                placeholder="Enter version number"
                value={version}
                onChange={(e) => { setVersion(e.target.value); onFiledValuesChanged( { version: e.target.value ?? "" } ); }}
                className="w-full p-2 border border-gray-300 rounded-md"
                size="large"
              />          
            </div>

          </div>
        </div>
        
        <div 
          className="
            upload-form bg-white p-4 rounded-lg shadow-sm mb-8 border border-gray-200
          "
        >
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-full md:w-1/3">
              <h2 className="text-lg font-medium mb-2 text-gray-800">Upload File</h2>
              <div className="flex items-center text-sm text-gray-500">
                <Tooltip title="Ensure a high quality file for accurate results">
                  <InfoCircleOutlined className="mr-1 text-gray-400" />
                </Tooltip>
                <span>Ensure a high quality file for accurate results</span>
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <UploadForm 
                loading={loading} 
                onFileUploaded={(file) => {
                  postPdfData(file.file);
                }} 
              />
            </div>
          </div>
        </div>
        {
          loading && !fileImageBlobUrl && (
            <div
              className="flex justify-between items-center"
            >
              <Spin className="w-screen" />
            </div>
          )
        }
                
        {
          fileImageBlobUrl && (
            <div className="image-display-container mt-8 border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
              <h3 className="text-lg font-medium mb-4 text-gray-700 text-center">Uploaded Drawing Preview</h3>
              <div className="flex justify-end mb-2 mr-2">
                {
                  getFilePageNumbers?.length > 0 && scannedFileIndex < getFilePageNumbers?.length ? (
                    <Select
                      defaultValue={getFilePageNumbers[scannedFileIndex]}
                      onChange={(value) => {
                        setScannedFileIndex(value);
                        const projectId = project?.id;
                        const fileId = project?.files[0].id;
                        const scannedFileId = project?.files[0].scanned_files[value].id;

                        if( !projectId || !fileId || !scannedFileId ) {
                          return;
                        }

                        if(project && (project?.files[0].scanned_files.length ?? 0 > value)) {
                          loadFileImage(fileId, scannedFileId, projectId, "medium").then(() => {
                            selectPagesToScan(projectId, fileId, [value])
                          })
                        }
                        }}
                        // Dropdown options for page selection, displaying "Page X" where X is page number (starts form 1, hence val + 1)
                        options={getFilePageNumbers.map((val) => ({ value: val, label: `Page ${val + 1}` }))} 
                      />
                      ): <></>
                }
              </div>
              <img src={fileImageBlobUrl} alt="Uploaded drawing preview" className="max-w-full h-auto mx-auto block rounded" />
            </div>
          )
        }
      </div>
    </div>
  );
}