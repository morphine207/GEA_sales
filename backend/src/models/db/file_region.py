from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

from src.models.db.base import Base

class FileRegion(Base):
    __tablename__ = 'file_region'
    
    id = Column(Integer, primary_key=True)
    label = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    x_min = Column(Integer)
    x_max = Column(Integer)
    y_min = Column(Integer)
    y_max = Column(Integer)
    scanned_file_id = Column(Integer, ForeignKey('scannedfile.id'))
    
    scanned_file = relationship("ScannedFile", back_populates="file_regions")