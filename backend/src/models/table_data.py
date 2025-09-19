from typing import List

from pydantic import BaseModel
from src.models.table_cell import TableCell


class TableData(BaseModel):
    row_count: int = 0
    col_count: int = 0
    polygon: List[int] = []
    cells: List[TableCell] = []
