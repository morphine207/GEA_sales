from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from src.models.db.base import Base
from sqlalchemy.orm import relationship

class ScannedFile(Base):
    __tablename__ = 'scannedfile'

    id = Column(Integer, primary_key=True)
    file_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    file_id = Column(Integer, ForeignKey('file.id'))
    page_number = Column(Integer, default=0)

    file_regions = relationship("FileRegion", back_populates="scanned_file")
    file = relationship("File", back_populates="scanned_files")