from pydantic import BaseModel


class TableCellResponse(BaseModel):
    kind: str = ""
    row_index: int = 0
    col_index: int = 0
    col_span: int = 1
    row_span: int = 1
    content: str = ""