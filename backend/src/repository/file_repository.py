from datetime import datetime

from sqlalchemy import update
from src.models.db.scanned_file import ScannedFile
from src.repository.base_engine import get_db
from src.models.db.file import File
from src.models.db.file_region import FileRegion
from src.dto import RegionCreateRequest
from sqlalchemy.orm import joinedload

def insert_file(file: File):
    db = get_db()
    db.add(file)
    db.commit()
    db.refresh(file)

    return file

def insert_scanned_file(file_id: int, file_name: str):
    with get_db() as db:
        scanned_file = ScannedFile()
        scanned_file.file_id = file_id
        scanned_file.file_name = file_name

        db.add(scanned_file)
        db.commit()

def get_all_files():
    with get_db() as db:
        return db.query(File).all()

def find_file(project_id: int, file_id: int):
    with get_db() as db:
        return db.query(File).filter(File.id == file_id, File.project_id == project_id).options(
            joinedload(File.scanned_files).joinedload(ScannedFile.file_regions)
        ).first()

def find_files(project_id: int):
    db = get_db()
    return db.query(File).filter(File.project_id == project_id).all()

def find_scanned_files(file_id: int):
    with get_db() as db:
        return db.query(ScannedFile).filter(ScannedFile.file_id == file_id).all()


def find_scanned_file(scanned_file_id: int, file_id: int):
    with get_db() as db:
        return db.query(ScannedFile).filter(ScannedFile.file_id == file_id, ScannedFile.id == scanned_file_id).first()


def delete_file(project_id: int, file_id: int):
    db = get_db()
    file = db.query(File).filter(File.id == file_id, File.project_id == project_id).first()

    if file is None:
        return False
    
    db.delete(file)
    db.commit()

    return True

def save_page_values(project_id: int, file_id: int, page_values: list[int]):
    with get_db() as db:
        stmt = update(File).where(File.project_id == project_id, File.id == file_id).values(files_to_scan=page_values)
        db.execute(stmt)
        db.commit()

        return True

def save_region(file_id: int, scanned_file_id: int, file_region : RegionCreateRequest):
    with get_db() as db:
        scanned_file: File = db.query(ScannedFile).filter(ScannedFile.id == scanned_file_id, File.id == file_id).first()

        if scanned_file is None:
            return False

        file_region = FileRegion(
            label = file_region.label,
            x_min = file_region.x_min,
            x_max = file_region.x_max,
            y_min = file_region.y_min,
            y_max = file_region.y_max,
            scanned_file_id = scanned_file_id
        )

        db.add(file_region)
        db.commit()
        db.refresh(file_region)

    return True

def find_file_regions(scanned_file_id: int):
    with get_db() as db:
        return db.query(FileRegion).filter(FileRegion.scanned_file_id == scanned_file_id).all()

def find_file_region(region_id: int):
    with get_db() as db:
        return db.query(FileRegion).filter(FileRegion.id==region_id).first()

def delete_file_region(region_id: int):
    with get_db() as db:
        file_region = db.query(FileRegion).filter(FileRegion.id==region_id).first()

        if file_region is None:
            return False
        
        db.delete(file_region)
        db.commit()

    return True