from sqlalchemy import Column, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from src.models.db.base import Base

class TableData(Base):
    __tablename__ = 'tabledata'
    
    id = Column(Integer, primary_key=True)
    row_count = Column(Integer)
    col_count = Column(Integer)
    polygon = Column(JSON)
    metatable_id = Column(Integer, ForeignKey('metatable.id'))
    
    metatable = relationship("MetaTable", back_populates="tabledata")
    tablecells = relationship("TableCell", back_populates="tabledata")