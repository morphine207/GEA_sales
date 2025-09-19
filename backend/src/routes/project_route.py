from fastapi import APIRouter, HTTPException, Response
from dataclasses import asdict

from src.models.db.project import Project
from src.dto import ProjectCreateRequest

import src.repository.project_repository as porject_repo
from src.repository import file_repository 
router = APIRouter(
    prefix='/api/project',
    tags=['project']
)

@router.get(
    "/all"
)
def get_projects():
    projects = porject_repo.find_projects()
    return [
        {
            "id": project.id,
            "name": project.name,
            "lima_number": project.lima_number,
            "version": project.version,
            "created_at": project.created_at,
            "files": project.files
        } for project in projects
    ]

@router.get(
    "/all/files"
)
def get_all_project_files():
    files = file_repository.get_all_files()
    return files

@router.get(
    "/{id}"
)
def get_project(id: int):
    project = porject_repo.find_project(id)

    if project is not None:
        return project
    
    raise HTTPException(status_code=404, detail="Project not found") 


@router.post(
    "/"
)
def create_project(request: ProjectCreateRequest):
    project = Project(
        name=request.name,
        lima_number=request.lima_number,
        version=request.version
    )

    porject_repo.insert_project(project)

    return { 
        "id": project.id 
    }

@router.patch(
    "/{id}"
)
def update_project_fields(id: int, request: ProjectCreateRequest):
    porject_repo.update_project(id, request.__dict__)

    return True

@router.delete(
    "/"
)
def delete_project(id):
    success = porject_repo.delete_project(id)

    return { "id": id } if success is True else HTTPException(status_code=404)