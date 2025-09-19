from typing import List

from pydantic import BaseModel

from src.models.table_data import TableData
from src.models.word_data import WordData


class OCRDocumentData(BaseModel):
    words: List[WordData] = []
    tables: List[TableData] = []