from datetime import datetime
from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

from src.models.db.base import Base

class File(Base):
    __tablename__ = 'file'
    
    id = Column(Integer, primary_key=True)
    file_name = Column(String)
    format = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    files_to_scan = Column(JSON, default=list)
    project_id = Column(Integer, ForeignKey('project.id'))
    
    scanned_files = relationship("ScannedFile", back_populates="file")
    project = relationship("Project", back_populates="files")
