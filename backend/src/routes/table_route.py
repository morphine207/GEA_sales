from enum import Enum
import json
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

from src.dto import ModifyTableCellsRequest
from src.models.table_data import TableData
from src.repository import meta_table_repository

router = APIRouter(
    prefix='/api/{project_id}/meta-table',
    tags=['meta-table']
)

@router.get(
    "/{id}"
)
def get_meta_table_data(
    project_id: int,
    id: int
):
    result = meta_table_repository.find_meta_table_data(project_id, id)
    if result is None:
        raise HTTPException(status_code=404)
    
    return result

@router.get(
    "/{id}/table/{table_id}"
)
def get_table_data_cells(
    project_id: int,
    id: int,
    table_id: int
):
    tabledata = meta_table_repository.find_table_data(id, table_id)
    if tabledata is None:
        raise HTTPException(status_code=404)

    return {
        "id": tabledata.id,
        "row_count": tabledata.row_count,  
        "col_count": tabledata.col_count, 
        "polygon": tabledata.polygon,
        "tablecells": [
            {
                "id": tc.id,
                "row_index": tc.row_index,
                "col_index": tc.col_index,
                "row_span": tc.row_span,
                "col_span": tc.col_span,
                "content": tc.content,
                "selectable": tc.selectable
            } for tc in tabledata.tablecells
        ]
    }


@router.get(
    "/{id}/table/{table_id}/dataframe"
)
def get_table_dataframe(
    project_id: int,
    id: int,
    table_id: int
):
    tabledata = meta_table_repository.find_table_data(id, table_id)
    if tabledata is None:
        raise HTTPException(status_code=404)

    df_table = tabledata_to_structured_dataframe(tabledata)
    df_table.columns = [f"{col}_{i}" if df_table.columns.duplicated()[i] else col for i, col in enumerate(df_table.columns)]
    return json.loads(df_table.to_json(orient='records'))         


class ModificationTypeEnum(str, Enum):
    selectable = "selectable"
    content = "content"

@router.patch(
    "/{id}/table/{table_id}"
)
def change_table_cell_data(
    project_id: int,
    id,
    table_id,
    table_cell_request: ModifyTableCellsRequest,
    type_enum: ModificationTypeEnum = Query(default=ModificationTypeEnum.content, description="Select size: 'original' or 'small'")
):
    if type_enum == ModificationTypeEnum.content:
        return meta_table_repository.change_table_cell_content(
            id, table_id, table_cell_request.data
        )
    if type_enum == ModificationTypeEnum.selectable:
        return meta_table_repository.change_table_cell_selectable(
            id, table_id, table_cell_request.data
        )

    raise HTTPException(status_code=400, detail="wrong enum type is entered.")

def tabledata_to_structured_dataframe(table_data: TableData) -> pd.DataFrame:
    df = pd.DataFrame([[""] * table_data.col_count for _ in range(table_data.row_count)])
    
    for cell in table_data.tablecells:
        if cell.row_index >= table_data.row_count or cell.col_index >= table_data.col_count:
            raise ValueError(f"Cell at ({cell.row_index}, {cell.col_index}) is out of bounds.")
        df.iloc[cell.row_index, cell.col_index] = cell.content

    return df