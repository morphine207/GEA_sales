from typing import Dict
from src.repository.base_engine import get_db
from src.models.db.project import Project

def insert_project(project: Project):
    db = get_db()
    db.add(project)
    db.commit()
    db.refresh(project)

    return project

def find_project(id: int):
    db = get_db()
    return db.query(Project).filter(Project.id == id).first()

def find_projects():
    db = get_db()
    return db.query(Project).all()


def update_project(project_id: int, request: Dict[str, str]):
    with get_db() as db:
        project = db.query(Project).filter(Project.id == project_id).first()

        if  'name' in request:
            project.name = request['name']
        if 'lima_number' in request:
            project.lima_number = request['lima_number']
        if 'version' in request:
            project.version = request['version']

        db.commit()

def delete_project(id):
    db = get_db()
    project = db.query(Project).filter(Project.id == id).first()

    if project is None:
        return False
    
    db.delete(project)
    db.commit()

    return True