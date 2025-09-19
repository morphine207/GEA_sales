export interface TableCell {
    id: number;
    row_index: number;
    col_index: number;
    row_span: number;
    col_span: number;
    content: string;
    changed: boolean;
    selectable: boolean;
}