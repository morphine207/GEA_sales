from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from config import config
from src.models.db import Base

engine = create_engine(config.db_name)
Base.metadata.create_all(engine)

def get_db():
    return Session(engine)