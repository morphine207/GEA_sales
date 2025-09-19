import { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import { PdfSvg } from "../../../assets/svgs";

export const UploadForm = ({ onFileUploaded, loading }: { onFileUploaded?: (image: { url: string, file: File }) => void, loading?: boolean }) => {

    const [pdfFile, setpdfFile] = useState<File>();
    const [pdfFileUrl, setpdfFileUrl] = useState<string>();

    useEffect(() => {
        if(pdfFileUrl) {
            const image = {
                url: pdfFileUrl!,
                file: pdfFile!
            };
            if(onFileUploaded != undefined) {
                onFileUploaded(image);
            }
        }
    }, [pdfFileUrl]);


    const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if(!loading) {
            if(!event || event.target.files?.length === 0) return;
            uploadImage(event.target.files);
        }

    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if(!loading) {
            const droppedFiles = event.dataTransfer.files;
            if (droppedFiles.length === 0) return;
            uploadImage(droppedFiles);    
        }
    };


    const uploadImage = (fileList: FileList | null) => {
        const file = fileList![0];
        const extension = file.name.split('.').pop();

        if(['pdf', 'tif'].findIndex(ext => extension == ext) === -1) {
            console.error('incorrect file extension, only pdf and tif is accepted.');
            toast.error("upload form only accepts pdf and tif");
            return;
        }

        const urlObj = URL.createObjectURL(file);

        setpdfFile(file);
        setpdfFileUrl(urlObj);
    }

    return (
        <div 
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event)} 
            className="flex items-center justify-center w-full"
        >
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50   hover:bg-gray-100   ">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {
                        !pdfFile ?
                        (
                            <>
                                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500 ">PDF</p>
                            </>
                        ) : (
                            <div className="flex justify-center items-center">
                                <span>{pdfFile.name}</span>
                                <PdfSvg />
                            </div>
                        )
                    }
                    
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={(event) => onImageChange(event)} multiple={false} />
            </label>

            <ToastContainer />
        </div>
    );
}