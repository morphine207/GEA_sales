from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from src.models.db.base import Base

class TableCell(Base):
    __tablename__ = 'tablecell'
    
    id = Column(Integer, primary_key=True)
    kind = Column(String)
    row_index = Column(Integer)
    col_index = Column(Integer)
    col_span = Column(Integer)
    row_span = Column(Integer)
    content = Column(String)
    selectable = Column(Boolean)
    tabledata_id = Column(Integer, ForeignKey('tabledata.id'))
    
    tabledata = relationship("TableData", back_populates="tablecells")