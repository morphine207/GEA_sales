import { Cell } from "../models/table-data.model";

export const jsonTableTo2dArray = (jsonData: Cell[]): any[][] => {
    const maxRow = Math.max(...jsonData.map(item => item.row_index)) + 1;
    const maxCol = Math.max(...jsonData.map(item => item.col_index)) + 1;

    const table = Array.from({ length: maxRow }, () => Array(maxCol).fill(''));

    jsonData.forEach(item => {
        const row = item.row_index;
        const col = item.col_index;
        const content = item.content;
        const rowSpan = item.row_span || 1;
        const colSpan = item.col_span || 1;

        for (let r = row; r < row + rowSpan; r++) {
            for (let c = col; c < col + colSpan; c++) {
                table[r][c] = content;
            }
        }
    });

    return table;
}