from pydantic import BaseModel


class RegionCreateRequest(BaseModel):
    label: str
    x_min: int
    x_max: int
    y_min: int
    y_max: int

class RegionCreateBatch(BaseModel):
    regions : list[RegionCreateRequest]


