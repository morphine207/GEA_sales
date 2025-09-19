
import io
import math
import mimetypes
import os
from PIL import Image
import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile, Query
from fastapi.responses import FileResponse, StreamingResponse
import fitz

from config import config
from src.dto.region_batch_request import RegionCreateRequest
from src.enums import SCALE_VECTOR, SizeEnum
from src.services import DocumentProcessService
from src.utils import save_pdf_to_image_files, save_tiff_to_image_files
from src.models.db import File as DbFile, ScannedFile
from src.dto import RegionCreateBatch
from src.repository import file_repository


router = APIRouter(
    prefix='/api/{project_id}/file',
    tags=['file']
)

@router.get(
    "/all"
)
def get_files(
    project_id: int
):
    files = file_repository.find_files(project_id)
    return [
        {
            "id": file.id,
            "file_name": file.file_name,
            "format": file.format 
        } for file in files
    ]

@router.get(
    "/{id}"
)
def get_file(
    project_id: int,
    id: int
):
    """
        get the file instance from project id and file id
    """
    result = file_repository.find_file(project_id, id)

    if result is not None:
        return result
    
    return HTTPException(status_code=404)

@router.get(
    "/{id}/scanned_file/{scanned_file_id}/image"
)
async def get_file_image(
    project_id: int,
    id: int,
    scanned_file_id: int,
    size: SizeEnum = Query(default=SizeEnum.ORIGINAL, description="Select size: 'original' or 'small'")
):
    if size not in [SizeEnum.ORIGINAL, SizeEnum.MEDIUM, SizeEnum.SMALL]:
        return HTTPException(status_code=400)
    
    scanned = file_repository.find_scanned_file(scanned_file_id, id)

    if scanned is None or scanned.file_name == "":
        return HTTPException(status_code=404)
    
    image_file_path = f"{config.upload_path}/{scanned.file_name}"

    mime_type, _ = mimetypes.guess_type(image_file_path)
    
    if size == SizeEnum.ORIGINAL:
        return FileResponse(image_file_path, media_type=mime_type)
    
    image = Image.open(image_file_path)

    w,h = image.size

    new_w, new_h = w, h

    if size == SizeEnum.MEDIUM:
        new_w, new_h = round(w * SCALE_VECTOR[SizeEnum.MEDIUM], 2), round(h * SCALE_VECTOR[SizeEnum.MEDIUM], 2)
    elif size == SizeEnum.SMALL:
        new_w, new_h = round(w * SCALE_VECTOR[SizeEnum.SMALL], 2), round(h * SCALE_VECTOR[SizeEnum.SMALL], 2)

    resized_image = image.resize((math.floor(new_w), math.floor(new_h)), Image.Resampling.LANCZOS)

    img_buffer = io.BytesIO()
    resized_image.save(img_buffer, format=image.format)
    img_buffer.seek(0)

    return StreamingResponse(img_buffer, media_type=mime_type)


@router.post(
    "/"
)
def upload_file(
    project_id: int,
    file: UploadFile = File(..., description="PDF document")
):
    """
        upload either a pdf or tiff file and its image version in the configured path
    """
    if validate_document(file) is False:
        raise HTTPException(status_code=400, detail="Bad request")
    
    path_ext = get_document_path(file)
    
    upload_path = config.upload_path
    uid = str(uuid.uuid4())

    os.makedirs(upload_path, exist_ok=True)
    with open(f"{upload_path}/{uid}.{path_ext}", "wb") as uploaded_file:
        uploaded_file.write(file.file.read())

    output_paths = []
    page_numbers = []
    if path_ext == "pdf":
        output_paths, page_numbers = save_pdf_to_image_files(upload_path=upload_path, input_file_name=f"{uid}.pdf", output_file_name=uid, save_format="png")
    elif path_ext == "tif":
        output_paths, page_numbers = save_tiff_to_image_files(upload_path=upload_path, input_file_name=f"{uid}.tif", output_file_name=uid, save_format="png")
    else:
        raise HTTPException(status_code=500, detail="file type is invalid")

    file = DbFile(
        file_name=f"{uid}.{path_ext}",
        format=f"{path_ext}",
        project_id=project_id,
        scanned_files = [
            ScannedFile(
                file_name=op,
                page_number=page_numbers[index]
            ) for index, op in enumerate(output_paths)
        ]
    )

    file_repository.insert_file(file)

    return {
        "id": file.id,
        "scanned_files": [ { "id": sc.id } for sc in file.scanned_files ]
    }

@router.patch(
    "/{id}"
)
def select_pages_to_scan(
    project_id: int,
    id: int,
    pages_to_scan: list[int]
):
    """
        store the value of the pages that will be scheduled to scan.
    """
    file = file_repository.find_file(project_id, id)
    doc = fitz.open(f"{config.upload_path}/{file.file_name}")
    
    for i in pages_to_scan:
        if i not in list(range(len(doc))):
            raise HTTPException(status_code=400, detail="wrong number value is provided in pages_to_scan")

    return file_repository.save_page_values(project_id=project_id, file_id=id, page_values=pages_to_scan)
    

@router.delete(
    "/{id}"
)
def delete_file(
    project_id: int,
    id: int
):
    success = file_repository.delete_file(project_id, id)
    return { "id": id } if success is True else HTTPException(status_code=404)

@router.post(
    "/{id}/scan"
)
def scan_file(
    project_id: int,
    id: int
):
    """
        scan the file by extracting all the text and table information using Azure-Service
    """
    service = DocumentProcessService()

    result = service.process_diagram(project_id, id)
    
    if result is None:
        raise HTTPException(status_code=404)
    
    return result


@router.post("/{id}/{scanned_file_id}/regions")
def create_file_region_batch(
    region_list: RegionCreateBatch, 
    project_id: int, 
    id: int,
    scanned_file_id: int,
    size: SizeEnum = Query(default=SizeEnum.ORIGINAL, description="Select size: 'medium' or 'small'. default file is original")
):
    """
        create a region for the file.
        * the purpose for adding the size has to do with the fact the regions that might be scanned over files might be medium or small sized of the original ones, so we have to take them into account.
    """

    scanned_file = file_repository.find_scanned_file(scanned_file_id, id)

    file_path = os.path.join(config.upload_path, scanned_file.file_name)
    image = Image.open(file_path)

    image_width, image_height = image.size

    if len(region_list.regions) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 regions are allowed.")

    outofbounds = []
    correct: list[RegionCreateBatch] = []
    
    for region in region_list.regions:
        # new up/down scaled values of the coordinates.
        x_min, x_max, y_min, y_max = [
            math.ceil(region.x_min / SCALE_VECTOR[size]), 
            math.ceil(region.x_max / SCALE_VECTOR[size]), 
            math.ceil(region.y_min / SCALE_VECTOR[size]), 
            math.ceil(region.y_max / SCALE_VECTOR[size])
        ]

        new_region = RegionCreateRequest(
            label="",
            x_max=x_max,
            x_min=x_min,
            y_min=y_min,
            y_max=y_max
        )

        if x_max < image_width \
            and x_min >= 0 \
            and y_max < image_height \
            and y_min >= 0 \
            and x_min < x_max \
            and y_min < y_max:
            correct.append(new_region)
        else:
            outofbounds.append(region)

    if not len(outofbounds) == 0:
        labels = ", ".join(obj.label for obj in outofbounds)
        message = f"One or more Regions out of bounds: {labels}."

        raise HTTPException(status_code=400, detail=message)
    else:
        for region in correct:
            file_region_confirmation = file_repository.save_region(id, scanned_file_id, region)
            if file_region_confirmation is False:
                raise HTTPException(status_code=404)
            
        return True
        
@router.get("/{id}/{scanned_file_id}/regions")
def get_file_regions(
    project_id: int,
    id: int,
    scanned_file_id: int
):
    """
        get all the regions of the file.
    """
    result = file_repository.find_file_regions(scanned_file_id)

    if result is None:
        raise HTTPException(status_code=404)
    return result

@router.get("/{id}/region/{region_id}")
def get_file_region(region_id: int):
    """
        get the region of the file.
    """
    result = file_repository.find_file_region(region_id)

    return result

@router.delete("/{id}/region/{region_id}")
def delete_file_region(
    region_id: int
):
    """
        delete the region of the file.
    """
    result = file_repository.delete_file_region(region_id)

    if result is None:
        raise HTTPException(status_code=404)
    
    return result

"""
    private functions for router.
"""
def validate_document(file: UploadFile):
    """
        validated if the uploaded file is pdf.
    """
    if file.filename is not None or file.filename != '':
        a = file.filename.split('.')[-1]
        return (file.filename.split('.')[-1] in ['pdf', 'tif'])
    
def get_document_path(file: UploadFile):
    """
        get the path of the document
    """
    if file.filename is not None or file.filename != '':
        return file.filename.split('.')[-1]