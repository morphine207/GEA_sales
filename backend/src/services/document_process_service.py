import math
from typing import List
from PIL import Image
from fastapi import HTTPException
from termcolor import colored, cprint

from src.models.db import TableCell, TableData, ScannedFile
from src.services import AzureDetectionServiceDup
from src.repository import file_repository, meta_table_repository
from src.utils import pil_image_to_byte
from config import config

class DocumentProcessService():
    def __init__(self):
        self.upload_path = config.upload_path
        self.azure_service = AzureDetectionServiceDup(
            service_endpoint=config.azure_di_endpoint,
            service_key=config.azure_di_key
        )

    def process_diagram(self, project_id: int, file_id: int):
        """
            process the Process flow diagram by extracting table information and storing it in the database.
        """
        file = file_repository.find_file(project_id, file_id)

        metatable_id: int | None = None

        if file is None or file.file_name is None or len(file.scanned_files) == 0:
            return None

        for scanned_file in file.scanned_files:
            scanned_file: ScannedFile = scanned_file
            full_image_path = f"{self.upload_path}/{scanned_file.file_name}"

            regions = file_repository.find_file_regions(scanned_file.id)

            if(len(regions) == 0):
                print(colored(f"The file with id {file.id} with one of the scanned files with id {scanned_file.id} has empty regions", "yellow"))
                continue

            buffer_segments = self.prepare_ocr_image_from_region([ [ r.x_min, r.y_min, r.x_max, r.y_max ] for r in regions ], full_image_path)

            meta_table = meta_table_repository.create_meta_table(project_id)
            metatable_id = meta_table.id

            table_data_list: List[TableData] = []
            table_cell_list: List[List[TableCell]] = []

            for index, buffer in enumerate(buffer_segments):
                table_data_response = self.azure_service.analyze_document(buffer)

                for table in table_data_response:
                    table_data = TableData(
                        col_count =  table.col_count,
                        row_count = table.row_count,
                        # TODO: fix the polygon value to the actual absolute pixel values instead of providign a 0. Currently the polygon values here are not needed.
                        polygon = [0, 0, 0, 0],
                        metatable_id = metatable_id
                    )

                    table_cells: List[TableCell] = []
                    for cell in table.cells:
                        table_cells.append(
                            TableCell(
                                kind = cell.kind,
                                row_index = cell.row_index,
                                col_index = cell.col_index,
                                col_span = cell.col_span,
                                row_span = cell.row_span,
                                content = cell.content,
                                selectable = False
                            )
                        )

                    table_data_list.append(table_data)
                    table_cell_list.append(table_cells)

            meta_table_repository.insert_tables_in_meta_table(table_data_list, table_cell_list)

        return {
            "metatable_id": metatable_id
        }
    
    def prepare_ocr_images(self, image_path, section_size=3000) -> list[bytes]:
        image = Image.open(image_path)
        w, h = image.size

        pieces = w // section_size
        pieces += 1 if w % section_size > 0 else 0

        image_segments = []

        for i in range(pieces):
            _x = (section_size * i) + (w % section_size) if section_size * (i + 1) > w else section_size * (i + 1)
            image_segments.append(
                image.crop((section_size * i, 0, _x, h))
            )

        if(len(image_segments) == 0):
            raise Exception("image segments not avialble")
        
        return [
            pil_image_to_byte(segment) 
            for segment in image_segments 
        ]
    
    def prepare_ocr_image_from_region(self, regions: list[list[int]], image_path: str, resolution_intensity = 1) -> list[bytes]:
        image = Image.open(image_path)
        image_segments = []

        for region in regions:
            x_min, y_min, x_max, y_max = region
            cropped_image = image.crop((x_min, y_min, x_max, y_max))
            w,h = cropped_image.size
            image_segments.append(
                cropped_image.resize((math.floor(w * resolution_intensity), math.floor(h * resolution_intensity)),Image.Resampling.LANCZOS)
            )

        if(len(image_segments) == 0):
            raise Exception("image segments not avialble")
        
        return [
            pil_image_to_byte(segment) 
            for segment in image_segments 
        ]
        
    def merge_connecting_tables(self):
        pass
    
    def fetch_table_data(project_id: int, file_id: int):
        pass