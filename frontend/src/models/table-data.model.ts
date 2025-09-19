export interface Cell {
    kind: string,
    row_index: number,
    col_index: number,
    col_span: number,
    row_span: number,
    content: string
}


export interface TableData {
    row_count: number;
    col_count: number;
    polygon: number[];
    cells: Cell[]
    twodim_form: any[][];
}