from typing import List

from pydantic import BaseModel

from src.dto.table_cell_response import TableCellResponse

class TableDataResponse(BaseModel):
    row_count: int = 0
    col_count: int = 0
    polygon: List[int] = []
    cells: List[TableCellResponse] = []