from io import BytesIO
import re
from typing import List
from fastapi import APIRouter, File, HTTPException, Response, UploadFile
from fastapi.responses import StreamingResponse
from src.models.table_data import TableData
from src.models.ocr_document_data import OCRDocumentData
from src.services.azure_detection_service import AzureDetectionService, check_intersection_of_tables, pil_image_to_byte, tabledata_to_structured_dataframe
from src.utils import fastapi_pdf_upload_file_to_image_file
from src.utils import get_absolute_bbox, create_image_segments
import pandas as pd
from PIL import Image
from config import config
import json
from PIL import Image
import fitz

PUBLIC_PATH = './public'

data_mem_df = None

service = AzureDetectionService(config.azure_di_endpoint, config.azure_di_key)

router = APIRouter(
    prefix='/api/document-ocr',
    tags=['pid']
)

@router.get(
    "/"
)
async def test():
    return { "message": "success" }

@router.post(
    '/process'
)
async def process_document(
    file: UploadFile = File(..., description="PDF document")
):
    """
        process a pdf document and return a JSON
    """
    validate_document(file)

    pdf_data = await file.read()
    output_img_name = "document_output.jpg"
    full_image_path = f"{PUBLIC_PATH}/{output_img_name}"

    data = await prepare_ocr_data(pdf_data, full_image_path)

    df_tables = [tabledata_to_structured_dataframe(table) for table in data.tables]

    offset = 20
    for table in data.tables:
        x, y, _x, _y = table.polygon
        table.polygon = [x - offset, y - offset, _x + offset, _y + offset]

    updated_df_tables, intersection_indexes = check_intersection_of_tables(data.tables, df_tables)

    for df in updated_df_tables:
        df.columns = [f"{col}_{i}" if df.columns.duplicated()[i] else col for i, col in enumerate(df.columns)]

    new_polygons = []
    for i, j in intersection_indexes:
        x, y, _x, _y = data.tables[i].polygon[0], data.tables[i].polygon[1], data.tables[j].polygon[2], data.tables[j].polygon[3]
        new_polygons.append((x, y, _x, _y))

    new_json_data = []
    for df in updated_df_tables:
        temp_list = []
        for instance in json.loads(df.to_json(orient='records')):
            temp_list.append(list(instance.values()))
        new_json_data.append(
            temp_list
        )

    # new_json_data = [
    #     [['Naht Nr. Weld No.', '', 'Sequenz Sequence', 'Feld', 'Gesamt Nahtlaenge [mm] Total Weld Length [mm]', '(Ueberlappung) (Overlapping)', '', 'Einbrandtiefe Penetration depth', 'eg length penetration\nFlankeneinbrand', 'Wirksame Nahtdicke fective throat thickness', 'ax. Schweiss Spalt [mm] x. Wela Ga', 'schliff Nr. Section No.', '', '', 'Nacharbeit Rework', 'SC / CC', 'Bewertungs .gruppe Rating category B, C, D, E', 'Zusatzinfo add. Information'], ['LH', 'RH', '', '', '', 'ext: EinLauT Lam,', 'Hext: Auslauf Lan/', '', '', 'X [mm]', '', '', '', '', '', '', '', ''], ['W03', 'WO4', '', 'D13', '45(x2)', '(5)', '(5)', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', '', 'Cosa', '', '', '', '', ''], ['WO5', 'W06', '', 'D15', '43(x2)', '(5)', '(5)', '≥ 0,35', '> 2,45', '≥ 2,45', '1,2', '', 'Co6a', '', '', '', '', ''], ['W07', 'WO8', '', 'D15', '45(x2)', '(5)', '(5)', '0,35', '2,45', '≥ 2,45', '1,2', '', 'CORE', '', '', '', '', ''], ['W09', 'W10', '', 'D13', '44(x2)', '(5)', '(5)', '> 0,35', '2,45', '> 2,45', '1,2', '', 'C10a', '', '', '', '', ''], ['W11', 'W12', '', 'D2', '118(x2)', '0', '0', '≥ 0,3', '≥ 2,1', '≥ 2,1', '1,2', 'C12a', '', 'CIRC', '', '', '', ''], ['W13', 'W14', '', 'D4', '64(x2)', '0', '(5)', '> 0,3', '> 2,1', '≥ 2,1', '1,2', '', 'C14a', '', '', '', '', ''], ['W15', 'W16', '', 'E4', '64(x2)', '0', '(5)', '0,3', '2,1', '≥ 2,1', '1,2', '', '', '', '', '', '', ''], ['W17', 'W18', '', 'B3', '153(x2)', '(5)', '0', '0,34', '2,38', '≥ 2,38', '1,2', 'C17a', '', 'G168', '', '', '', ''], ['W19', 'W20', '', 'C3', '138(x2)', '(5)', '0', '0,34', '2,38', '≥ 2,38', '1,2', 'CIBB', '', 'CROC]', '', '', '', ''], ['W21', 'W22', '', 'B6', '94(x2)', '0', '0', '0,34', '2,38', '> 2,38', '1,2', 'CELA', '', 'CZC', '', '', '', ''], ['W23', 'W24', '', 'B3', '129(x2)', '5', '(5)', '≥ 0,34', '≥ 2,38', '≥ 2,38', '1.2', 'C2481', '', 'GRAC', '', '', '', ''], ['W25', 'W26', '', 'B9', '113(x2)', '0', '(5)', '> 0,35', '2,45', '≥ 2,45', '1,2', 'COBB', '', 'COSE', '', '', '', ''], ['W27', 'W28', '', 'B9', '114(x2)', '(5)', '(5)', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', 'C288', '', 'CZEc', '', '', '', ''], ['W29', 'W30', '', 'B12', '108(x2)', '0', '(5)', '0,35', '2,45', '≥ 2,45', '1,2', 'CESa', '', '028)', '', '', '', ''], ['W31', 'W32', '', 'B14', '56(x2)', '0', '0', '≥ 0,25', '≥ 1,75', '≥ 1,75', '1,2', 'C32 8', '', 'CS20', '', '', '', ''], ['W33', 'W34', '', 'B15', '23(x2)', '0', '0', '0,25', '≥ 1,75', '≥ 1,75', '1.2', '', 'C34a', '', '', '', '', ''], ['W35', 'W36', '', 'D11', '90(x2)', '0', '0', '≥ 0,25', '≥ 1,75', '≥ 1,75', '1,2', 'C368', '', '0366', '', '', '', ''], ['W37', 'W38', '', 'G9', '82(x2)', '0', '0', '0,25', '≥ 1,75', '≥ 1,75', '1,2', 'COSTA', '', 'CSER', '', '', '', 'ONLY FOR CC21-E'], ['W39', 'W40', '', 'G2', '173(x2)', '(5)', '(5)', '≥ 0,6', '≥ 4,2', '≥ 4,2', '1,2', 'C40a', '', 'CHỐC', '', '', '', 'ONLY FOR CC21-E/CC24 5S'], ['W41', 'W42', '', 'G2', '163(x2)', '0', '0', '0,6', '> 4,2', '≥ 4,2', '1,2', 'CAZa', '', 'Cake', '', '', '', 'ONLY FOR CC21-E/CC24 5S'], ['W43', 'W44', '', 'B15', '23(x2)', '0', '0', '0,25', '≥ 1,75', '≥ 1,75', '1,2', '', 'Casa', '', '', '', '', ''], ['W45', 'W46', '', 'H5', '25(x2)', '0', '(5)', '0,35', '> 2,45', '≥ 2,45', '1,2', '', 'CASA', '', '', '', '', ''], ['W47', 'W48', '', 'H5', '75(x2)', '0', '(5)', '> 0,35', '> 2,45', '≥ 2,45', '1,2', 'CAZA', '', 'CARD', '', '', '', 'ONLY FOR CC21-E'], ['W49', 'W50', '', 'G5', '121 (x2)', '0', '0', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', 'CSOB', '', 'Code', '', '', '', 'ONLY FOR CC21-E'], ['W51', 'W52', '', 'E7', '23(x2)', '0', '0', '2 0,2', '≥ 1,4', '≥ 1,4', '1,2', '', 'CS18', '', '', '', '', ''], ['W53', 'W54', '', 'D9', '31 (x2)', '0', '0', '≥ 0,2', '≥ 1,4', '≥ 1,4', '1,2', '', 'C54a', '', '', '', '', ''], ['W55', 'W56', '', 'B1', '153(x2)', '(5)', '0', '≥ 0,34', '≥ 2,38', '≥ 2,38', '1,2', 'COBB', '', 'C550', '', '', '', ''], ['W57', 'W58', '', 'C2', '138(x2)', '(5)', '0', '≥ 0,34', '≥ 2,38', '≥ 2,38', '1,2', 'c58a 1', '', 'CSEC', '', '', '', '']],
    #     [['Naht Nr. Weld No.', '', 'Sequenz Sequence', 'Feld', 'Gesamt Nahtlaenge [mm] Total Weld Length [mm]', '(Ueberlappung) (Overlapping)', '', 'Einbrandtiefe Penetration depth', 'Flankeneinbrand eg length penetration', 'Wirksame Nahtdicke ffective throat thicknes', 'max. Schweiss Spalt Ins]', 'Schliff Nr. Section No.', '', 'Nacharbeit Rework', 'SC / CC', 'Bewertungs Rating category', 'Zusatzinfo add. Information'], ['LH', 'RH', '', '', '', 'st: Einlauf ummenext:', 'Aun-out |mm', 'f [mm]', '5 [mm]', 'X [mm]', '', '', '', '', '', '', ''], ['W71', 'W72', '', 'H12', '28(x2)', '0', '(5)', '> 0,35', '≥ 2,45', '≥ 2,45', '1,2', '', 'CHIR', '', '', '', ''], ['W73', 'W74', '', 'H12', '75(x2)', '0', '(5)', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', 'C73a', 'CZ', '', '', '', ''], ['W75', 'W76', '', 'G11', '135(x2)', '0', '0', '≥ 0,35', '≥ 2,45', '> 2,45', '1,2', 'C75a', 'C75C', '', '', '', ''], ['W77', 'W78', '', 'G14', '86(x2)', '0', '0', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', 'C78a', 'C75b', '', '', '', '']],
    #     [['Naht Nr. Weld No.', '', 'Sequenz Sequence', 'Feld Section', 'Gesamt Nahtlaenge [mm] Total Weld Length [mm]', '(Ueberlappung) over Lapping)', '', 'Einbrandtiefe Penetration depth', 'eg length penetratin\nFlankeneinbrand', 'Wirksame Nahtdicke fective throat thickness', 'Max. schweiss ax. Weld Gap [mm]', 'Schliff Nr. Section No.', '', '', 'Nacharbeit Rework', 'SC / CC', 'Bewertungs\nlatina categor\nGruppe\nB, C, D, E', 'Zusatzinfo add. Information'], ['LH', 'RH', '', '', '', '', 'It: Auslauf (mm)', 'f [mm]', 's [mm]', 'X [mm]', '', '', '', '', '', '', '', ''], ['W81', 'W82', '', 'B17', '193(x2)', '0', '0', '≥ 0,6', '≥ 4,2', '≥ 4,2', '1,2', 'C82a', '', 'CB2d', '', '', '', 'ONLY FOR EOV24 7S/ECC21 -E-300'], ['W83', 'W84', '', 'B18', '203(x2)', '(5)', '(5)', '0,6', ': 4,2', '≥ 4,2', '1,2', 'c84a', '', 'CBad', '', '', '', 'ONLY FOR EOV24 7S/ECC21 -E-300'], ['W85', 'W86', '', 'C20', '20(x2)', '0', '(5)', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', '', 'C86a', '', '', '', '', ''], ['W87', 'W88', '', 'C20', '75(x2)', '0', '(5)', '0,35', '≥ 2,45', '> 2,45', '1,2', 'Cara', '', 'CBED', '', '', '', ''], ['W89', 'W90', '', 'B20', '121(x2)', '0', '0', '≥ 0,35', '≥ 2,45', '> 2,45', '1,2', 'caga', '', 'CROC', '', '', '', ''], ['W91', 'W92', '', 'B23', '104(x2)', '0', '0', '0,6', '≥ 4,2', '≥ 4,2', '1,2', 'c92a1', '', 'Caz', '', '', '', '']],
    #     [['Naht Nr. Weld No.', '', 'Sequenz Sequence', 'Feld Section', 'Gesamt Nahtlaenge [mm] Total Weld Length [mm]', '(Ueberlappung) (Overlapping)', '', 'Einbrandtiefe Penetration depth', 'Flankeneinbrand\n|Leg length penetration', 'Wirksame Nahtdicke ffective throat thickness', 'ax. Schweiss Spalt [un]', 'Schliff Nr. Section No.', '', 'Nacharbeit Rework', 'SC / CC', 'Bewertungs Gruppe B. C. D. E', 'Zusatzinfo add. Information'], ['LH', 'RH', '', '', '', 'xt- Einlauf [an/', '*]ext axt- Auslauf Lang', '', '', '', '', '', '', '', '', '', ''], ['W91', 'W92', '', 'G17', '26(x2)', '0', '(5)', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', '', 'c91a', '', '', '', ''], ['W93', 'W94', '', 'F17', '75(x2)', '0', '(5)', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', 'Ca4a 1', 'CeAb', '', '', '', ''], ['W95', 'W96', '', 'E17', '129(x2)', '0', '0', '≥ 0,35', '≥ 2,45', '> 2,45', '1,2', 'Cosa', 'COS', '', '', '', ''], ['W97', 'W98', '', 'E20', '104(x2)', '0', '0', '≥ 0,35', '≥ 2,45', '≥ 2,45', '1,2', 'C98a 1', 'C98C', '', '', '', '']],
    #     [['31', ''], ['Allgemeine Zeichnungseintraege GENERAL DRAWING ENTRY', ''], ['Werk: PRODUCT PLANT:', ''], ['Schweissnahtqualitaet nach Norm/Spez. (Datum) : WELD SEAM QUALITY ACC. SPEC (Date) :', 'BS PG (xx. xx'], ['Schweisszusatzwerksoff (Guete & Abmessung) : WELDING WIRE (GRADE & DIMENSION) :', 'ER70S- acc. BATD - V Ø 1,2m'], ['Schutzgas : SHIELD GAS:', '15% Co'], ['Schweissverfahren: WELDING METHOD:', 'MAG (1'], ['Toleranz fuer Schweissnahtlaenge: (mm) TOLERANCE FOR WELD SEAM LENGTH: (mm)', '+5mm'], ['Schliffentnahme wie Zeichnungsdarstellung: POSITION OF METALLOGRAPHIC SECTION ACC. SEC.', 'Senkrecht Schweiss. vertical']],
    #     [['', '', '33', '', '', '', '', '', ''], ['ndex\nndex', 'Nr.\nNo.', 'Feld Area', 'Datum Date', '', '', 'Aenderung Modification', 'ECR-Nr. ECR-No.', 'Name Name'], ['A.A', '', '', '20.08.21', 'INTIAL DRAWING', '', '', '-', 'MUTHU'], ['AB', '01', '-', '02.09.21', 'DRAWING UPDATED', 'WITH', 'VERSION MO4', '- STALIN', ''], ['AC', '02', '', '07.09.21', 'DRAWING UPDATED', 'WITH', 'VERSION M09', '', 'MUTHU'], ['AD', '03', '', '26.04.22', 'DRAWING UPDATED', 'WITH', 'VERSION M15', '', 'STALIN'], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:\n:unselected:', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:\n:unselected:', ':unselected:\n:unselected:', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:\n:unselected:', '', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], [':unselected:', '', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', ''], [':unselected:', ':unselected:', '', '', '', '', '', '', '']]
    # ]

    result_list = []
    for index, json_data in enumerate(new_json_data):
        polygon = (0, 0, 0, 0)
        if (len(new_polygons) - 1 > index):
            polygon = new_polygons[index]
        else:
            x, y, _x, _y = data.tables[index].polygon
            polygon = (x, y, _x, _y)

        filter_data = filter_table_data(json_data)
        if(len(filter_data) > 0 and len(filter_data[0]) > 0):
            result_list.append(
                {
                    "data": update_table_format(filter_data),
                    "polygon": polygon
                }
            )
    global data_mem_df 
    data_mem_df = result_list
    return result_list

@router.post(
    '/process/xlsx',
    response_model=bytes
)
async def process_document_to_excel(
    file: UploadFile = File(..., description="PDF document")
):
    """
        process a pdf document and return a downloadable xlsx document.
    """
    validate_document(file)
              
    pdf_data = await file.read()
    output_img_name = "document_output.jpg"
    full_image_path = f"{PUBLIC_PATH}/{output_img_name}"

    if data_mem_df is not None:
        return data_mem_df
    
    data = await prepare_ocr_data(pdf_data, full_image_path)

    df_tables = [tabledata_to_structured_dataframe(table) for table in data.tables]

    offset = 20
    for table in data.tables:
        x, y, _x, _y = table.polygon
        table.polygon = [x - offset, y - offset, _x + offset, _y + offset]

    updated_df_tables = check_intersection_of_tables(data.tables, df_tables)

    for df in updated_df_tables:
        df.columns = [f"{col}_{i}" if df.columns.duplicated()[i] else col for i, col in enumerate(df.columns)]

    data_mem_df = updated_df_tables

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        for index, df in enumerate(updated_df_tables):
            df.to_excel(writer, index=False, sheet_name=f"Sheet{index}")
    output.seek(0)

    headers = {
        'Content-Disposition': 'attachment; filename="data.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    return Response(content=output.getvalue(), headers=headers)


@router.get('/image')
async def get_image_from_polygon(
    x1: int, y1: int, x2: int, y2: int 
):
    output_img_name = "document_output.jpg"
    image = Image.open(f'./public/{output_img_name}')
    cropped_image = image.crop((x1, y1, x2, y2))

    img_byte_arr = BytesIO()
    cropped_image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    return StreamingResponse(img_byte_arr, media_type="image/png")

def validate_document(file: UploadFile):
    global data_mem_df

    if file.filename is not None or file.filename != '':
        if(file.filename.split('.')[1] in ['pdf']) is False:
            raise HTTPException(status_code=400, detail="Bad request")

async def prepare_ocr_data(pdf_buffer: bytes, image_path: str) -> OCRDocumentData:
    fastapi_pdf_upload_file_to_image_file(pdf_buffer, image_path, matrix=fitz.Matrix(1.6, 1.6))

    image = Image.open(image_path)
    w, h = image.size

    # sections = 3
    section_size = 4500
    pieces = w // section_size
    pieces += 1 if w % section_size > 0 else 0

    image_segments = []
    
    for i in range(pieces):
        _x = (section_size * i) + (w % section_size) if section_size * (i + 1) > w else section_size * (i + 1)
        image_segments.append(
            image.crop((section_size * i, 0, _x, h - 500))
        )

    if(len(image_segments) == 0):
        raise HTTPException(status_code=404, detail="image segments not available")

    data = OCRDocumentData()
    data.words = []

    for i in range(len(image_segments)):
        # it should not only return words but other instance too, which I will write afterwards.
        if image_segments[i] is None:
            continue
        
        print("Predict image ", i)
        words, tables = service.analyze_document(
            pil_image_to_byte(image_segments[i])
        )
        print("finished")

        # get absolute bbox. 
        for index, word in enumerate(words):
            word.polygon = get_absolute_bbox(bbox=word.polygon, chunk_size=section_size, row=i, col=0)

        for index, table in enumerate(tables):
            table.polygon = get_absolute_bbox(bbox=table.polygon, chunk_size=section_size, row=i, col=0)

        data.words = [*data.words, *words]
        data.tables = [*data.tables, *tables]
    
    return data


def filter_table_data(json_data: list[list[str]]) -> list:
    WELD_NO = "weld no"
    TOTAL_WELD_LENGTH = "total weld length"
    OVERLAPPING = "overlapping"
    OVERLAPPING_DE = "ueberlappung"
    WELD_GAP = "weld gap"
    WELD_GAP_DE = "schweiss"

    if (len(json_data) == 0): return []

    filter_json_data_col = []

    i = 0
    while i < len(json_data[0]):
        col = json_data[0][i]
        if WELD_NO in col.lower() or OVERLAPPING in col.lower() or OVERLAPPING_DE in col.lower():
            filter_json_data_col.append(True)
            filter_json_data_col.append(True)
            i += 1
        elif TOTAL_WELD_LENGTH in col.lower() or WELD_GAP in col.lower() or WELD_GAP_DE in col.lower():
            filter_json_data_col.append(True)
        else:
            filter_json_data_col.append(False)
        i += 1

    new_json_data = []

    for row in json_data:
        data = []
        for index, col in enumerate(row):
            if filter_json_data_col[index]:
                data.append(col)
        new_json_data.append(data)

    return new_json_data


def update_table_format(json_data: list):
    WELD_NO = "weld no"
    TOTAL_WELD_LENGTH = "total weld length"
    OVERLAPPING = "overlapping"
    OVERLAPPING_DE = "ueberlappung"
    WELD_GAP = "weld gap"

    def find_col_index(list, keyword):
        for i, item in enumerate(list):
            if keyword.lower() in item.lower():
                return i
        return -1

    # first seperate all the weld values.
    weld_index = find_col_index(json_data[0], WELD_NO)

    del json_data[1]

    if weld_index != -1:
        i = 1
        while i < len(json_data):
            if(json_data[i][weld_index] != '' and json_data[i][weld_index + 1] != ''):
                # curr_weld_value = json_data[i][weld_index]
                # next_weld_value = json_data[i][weld_index + 1]
                old_row_modified = ['' if index == weld_index + 1 else item for index, item in enumerate(json_data[i])]
                new_row_to_insert = ['' if index == weld_index else item for index, item in enumerate(json_data[i])]
                json_data[i] = [item for item in old_row_modified]
                json_data.insert(i + 1, [item for item in new_row_to_insert])
                i += 1
            else:
                old_row_modified = [item for item in json_data[i]]
                json_data[i] = old_row_modified
            i += 1

    # remove the multiplier from weld length

    weld_length_index = find_col_index(json_data[0], TOTAL_WELD_LENGTH)

    if weld_length_index != -1:
        i = 1
        while i < len(json_data):
            weld_length = re.sub(r"\(x[0-9]+\)", "", json_data[i][weld_length_index])
            json_data[i] = [weld_length if index == weld_length_index else item for index, item in enumerate(json_data[i])]
            i += 1

    def find_overlapping_match(text):
        pattern = r"\((\d+)\)"
        match = re.search(pattern, text)
        return int(match.group(1)) if match else 0

    overlapping_index = find_col_index(json_data[0], OVERLAPPING)
    if overlapping_index == -1: overlapping_index =  find_col_index(json_data[0], OVERLAPPING_DE)

    if overlapping_index != -1:
        overlaping_sum = [str(find_overlapping_match(data[overlapping_index]) + find_overlapping_match(data[overlapping_index + 1])) for data in json_data[1:]]

        for index, data in enumerate(json_data[1:]):
            data[overlapping_index] = overlaping_sum[index]
            del data[overlapping_index + 1]

    i = 0
    while i < len(json_data):
        json_data[i] = [item for item in json_data[i] if item != '']
        i += 1
    # json_data[0] = [item for item in json_data[0] if item != '']
    return json_data