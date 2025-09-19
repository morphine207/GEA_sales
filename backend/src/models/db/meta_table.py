from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from src.models.db.base import Base

class MetaTable(Base):
    __tablename__ = 'metatable'
    
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey('project.id'))
    
    project = relationship("Project", back_populates="metatable")
    tabledata = relationship("TableData", back_populates="metatable")