import { TableCell } from "./table-cell.model";

export interface TableData {
    id: number;
    polygon: number[];
    row_count: number;
    col_count: number;
    tablecells: TableCell[];
}