from pydantic import BaseModel

class ProjectCreateRequest(BaseModel):
    name: str
    lima_number: str
    version: str