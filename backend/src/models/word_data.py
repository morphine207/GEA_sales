from typing import List
from pydantic import BaseModel


class WordData(BaseModel):
    content: str = ""
    polygon: List[int] = []