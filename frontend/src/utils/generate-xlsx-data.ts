import { TableCell } from "../store";

interface CellPosition {
    r: number;
    c: number;
}

interface MergeCell {
    s: CellPosition,
    e: CellPosition
}

interface XlsxData {
    data: string[][];
    merges: MergeCell[]
}

export const generateXlsxData = (tableCells: TableCell[]) => {
    if (!tableCells || !tableCells.length) {
        return { data: [], merges: [] };
    }

    // Find table dimensions
    const { rows, cols } = findTableDimensions(tableCells);

    const xlsxData: XlsxData = {
        data: Array(rows).fill(undefined).map(() => Array(cols).fill('')),
        merges: []
    }


    tableCells.forEach(cell => {
        xlsxData.data[cell.row_index][cell.col_index] = cell.content;
    
        if (cell.row_span > 1 || cell.col_span > 1) {
            xlsxData.merges.push({
                s: { r: cell.row_index, c: cell.col_index },
                e: {
                r: cell.row_index + cell.row_span - 1,
                c: cell.col_index + cell.col_span - 1
                }
            });
        }
    });

    return xlsxData;
}


function findTableDimensions(tableCells: TableCell[]) {
    let maxRow = 0;
    let maxCol = 0;
    
    tableCells.forEach(cell => {
        const lastRow = cell.row_index + cell.row_span - 1;
        const lastCol = cell.col_index + cell.col_span - 1;

        maxRow = Math.max(maxRow, lastRow);
        maxCol = Math.max(maxCol, lastCol);
    });
    
    return {
        rows: maxRow + 1,
        cols: maxCol + 1
    };
}