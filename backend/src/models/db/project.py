from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from src.models.db.base import Base


class Project(Base):
    __tablename__ = 'project'
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    lima_number = Column(String)
    version = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    files = relationship("File", back_populates="project")
    metatable = relationship("MetaTable", back_populates="project")