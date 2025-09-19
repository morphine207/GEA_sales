
from pydantic import BaseModel


class ModifyTableCell(BaseModel):
    id: int
    content: str = ""
    selectable: bool = False

class ModifyTableCellsRequest(BaseModel):
    data: list[ModifyTableCell]