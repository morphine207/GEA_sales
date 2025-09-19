import io
import os
from itertools import combinations
from typing import List
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
from PIL import Image, ImageFile
import pandas as pd
from dotenv import load_dotenv
import fitz
from shapely import box

from src.models import OCRDocumentData, TableCell, TableData, WordData
from src.utils import polygon_to_bounding_box, get_absolute_bbox, save_pdf_to_image_files

class AzureDetectionService:
    def __init__(self, service_endpoint: str, service_key: str):
        self.service_endpoint: str = service_endpoint
        self.service_key: str = service_key
        self.client = self.create_client()

    def create_client(self) -> DocumentIntelligenceClient:
        return DocumentIntelligenceClient(
            endpoint=self.service_endpoint, credential=AzureKeyCredential(self.service_key)
        )
    
    def analyze_document(self, file_buffer: bytes):
        """
            read the file analyze document and read the text and table layouts.
        """
        poller = self.client.begin_analyze_document(
            "prebuilt-layout", AnalyzeDocumentRequest(bytes_source=file_buffer)
        )

        result = poller.result()

        words: List[WordData] = []
        tables: List[TableData] = []

        if(len(result['pages']) > 0):
            for document_word in result['pages'][0]['words']:
                word_data = WordData()
                word_data.content = document_word['content']
                word_data.polygon = polygon_to_bounding_box(document_word['polygon'])
                words.append(word_data)

        if(len(result['tables']) > 0):
            for table in result['tables']:
                table_cells = []
                for cell in table['cells']:
                    table_cells.append(
                        TableCell(
                            col_index=cell['columnIndex'],
                            row_index=cell['rowIndex'],
                            col_span= cell['columnSpan'] if "columnSpan" in cell else 1,
                            row_span=cell['rowSpan'] if "rowSpan" in cell else 1,
                            content=cell['content'],
                            kind=cell['kind'] if 'kind' in cell else ""
                        )
                    ) 
                
                table_data = TableData(
                    col_count=table["columnCount"],
                    row_count=table["rowCount"],
                    polygon=polygon_to_bounding_box(table['boundingRegions'][0]["polygon"]),
                    cells=table_cells
                )
                tables.append(table_data)

        return words, tables


def tabledata_to_structured_dataframe(table_data: TableData) -> pd.DataFrame:
    df = pd.DataFrame([[""] * table_data.col_count for _ in range(table_data.row_count)])
    
    for cell in table_data.cells:
        if cell.row_index >= table_data.row_count or cell.col_index >= table_data.col_count:
            raise ValueError(f"Cell at ({cell.row_index}, {cell.col_index}) is out of bounds.")
        df.iloc[cell.row_index, cell.col_index] = cell.content

    return df

def check_intersection_of_tables(tables: List[TableData], df_tables: List[pd.DataFrame]) -> List[pd.DataFrame]:
    merged_data_frames: List = []
    comb = combinations(list(range(len(tables))), 2)
    intersected_index = []
    for com in comb:
        i, j = com
        bbox_i, bbox_j = tables[i].polygon, tables[j].polygon
        polygon_i = box(bbox_i[0], bbox_i[1], bbox_i[2], bbox_i[3])
        polygon_j = box(bbox_j[0], bbox_j[1], bbox_j[2], bbox_j[3])

        intersection = polygon_i.intersection(polygon_j)

        if(not intersection.is_empty):
            min_x, min_y, max_x, max_y = intersection.bounds

            width = max_x - min_x
            height = max_y - min_y

            merged_data_frames.append(pd.concat([df_tables[i], df_tables[j]], axis=1 if width < height else 0))

            intersected_index.append((i, j))

    index_to_exclude = set()

    for i, j in intersected_index:
        index_to_exclude.add(i)
        index_to_exclude.add(j)

    final_result = []

    for index, df in enumerate(df_tables):
        if index not in index_to_exclude:
            final_result.append(df)

    return [*final_result, *merged_data_frames], intersected_index


def get_all_polygons(data: OCRDocumentData):
    bboxes = []
    for word in data.words:
        if(len(word.polygon) > 0):
            bboxes = [*bboxes, word.polygon] 
    for table in data.tables:
        if(len(table.polygon)):
            bboxes = [*bboxes, table.polygon]

    return bboxes


def file_path_to_bytes(file_path: str) -> bytes:
        with open(file_path, "rb") as image_file:
            return image_file.read()

def pil_image_to_byte(image: ImageFile, format: str = "PNG") -> bytes:
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format=format)
    return img_byte_arr.getvalue()

if __name__ == "__main__":
    load_dotenv()

    endpoint = os.getenv("AZURE_DI_ENDPONT")
    key = os.getenv("AZURE_DI_KEY")

    if(endpoint is None or key is None):
        raise KeyError("The keys are not provided. Can't run the process")

    service = AzureDetectionService(endpoint, key)
    file_path = './public/825276_AE_S0_ASSY_CC21_E_REAR_AXLE_Sheet_1.pdf'
    output_path = './public/output_ocr_file.png'
    save_pdf_to_image_files(file_path, output_path, matrix=fitz.Matrix(1.5, 1.5))

    image = Image.open(output_path)

    # image segmentation.
    image = Image.open("./public/output_ocr_file.png")
    w, h = image.size

    sections = 3
    piece_size = w // sections

    image_segments = []

    for i in range(sections):
        image_segments.append(
            image.crop((piece_size * i, 0, piece_size * (i + 1), h - 500))
        )
    
    # chunk_size = 3000
    # image_segments = create_image_segments(image, chunk_size)

    # if(len(image_segments) == 0):
    #     raise IndexError()

    # n = len(image_segments)
    # m = len(image_segments[0])

    data = OCRDocumentData()
    data.words = []

    for i in range(len(image_segments)):
        # it should not only return words but other instance too, which I will write afterwards.
        words, tables = service.analyze_document(
            pil_image_to_byte(image_segments[i])
        )

        # get absolute bbox. 
        for word in words:
            word.polygon = get_absolute_bbox(word.polygon, piece_size, i, 0)

        for table in tables:
            table.polygon = get_absolute_bbox(table.polygon, piece_size, i, 0)

        data.words = [*data.words, *words]
        data.tables = [*data.tables, *tables]

    bboxes = get_all_polygons(data)

    print(bboxes)

    # df_tables = [tabledata_to_structured_dataframe(table) for table in data.tables]

    # # expand the table bounding region or bbox
    # offset = 20

    # for table in data.tables:
    #     x, y, _x, _y = table.polygon
    #     table.polygon = [x - offset, y - offset, _x + offset, _y + offset]

    # updated_df_tables = check_intersection_of_tables(data.tables, df_tables)

    # print(
    #     updated_df_tables[0].head
    # )