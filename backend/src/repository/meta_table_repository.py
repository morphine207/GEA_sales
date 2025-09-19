
from sqlalchemy import func, update
from src.dto import ModifyTableCell
from src.models.db import Project, TableCell, MetaTable, TableData
from src.repository.base_engine import get_db
from sqlalchemy.orm import joinedload

def create_meta_table(project_id: int):
    db = get_db()
    meta_table = MetaTable(
        project_id=project_id
    )
    db.add(meta_table)
    db.commit()
    db.refresh(meta_table)

    return meta_table

def insert_tables_in_meta_table(table_data_list: list[TableData], table_cell_list: list[list[TableCell]]):
    with get_db() as db:
        # meta_table = db.query(MetaTable).filter(MetaTable.id == id).first()
        for index, td in enumerate(table_data_list):    
            db.add(td)
            db.commit()
            db.refresh(td)

            td_id = td.id

            for d in table_cell_list[index]:
                d.tabledata_id = td_id

            db.bulk_save_objects(table_cell_list[index])
            db.commit()

        return True
    
def find_meta_table_data(
        project_id: int, 
        meta_table_id: int
):
    with get_db() as db:
        return db.query(MetaTable).options(
            joinedload(MetaTable.tabledata)
        ).filter(
            MetaTable.project_id == project_id, MetaTable.id == meta_table_id
        ).first()

def find_table_data(meta_table_id: int, table_data_id: int):
    with get_db() as db:
        return db.query(TableData).options(
                joinedload(TableData.tablecells)
            ).filter(
                TableData.metatable_id == meta_table_id, TableData.id == table_data_id
            ).first()
    
def change_table_cell_content(meta_table_id: int, table_data_id: int, table_cells_data: list[ModifyTableCell]):
    with get_db() as db:
        for cell in table_cells_data:
            stmt = update(TableCell).values(
                content = cell.content
            ).where(
                TableCell.tabledata_id == TableData.id
            ).where(
                TableData.metatable_id == meta_table_id,
                TableData.id == table_data_id,
                TableCell.id == cell.id
            )

            db.execute(stmt)
            db.commit()


def change_table_cell_selectable(meta_table_id: int, table_data_id: int, table_cells_data: list[ModifyTableCell]):
    with get_db() as db:
        for cell in table_cells_data:
            stmt = update(TableCell).values(
                selectable = cell.selectable
            ).where(
                TableCell.tabledata_id == TableData.id
            ).where(
                TableData.metatable_id == meta_table_id,
                TableData.id == table_data_id,
                TableCell.id == cell.id
            )

            db.execute(stmt)
            db.commit()