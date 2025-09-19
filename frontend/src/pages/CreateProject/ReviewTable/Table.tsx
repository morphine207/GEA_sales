import { ImputeText } from '../../../components/ImputeText';
import { TableCell } from '../../../store';

interface TableProps {
  tablecells: TableCell[],
  onCellValueChange?: (tableCell: TableCell, value: string) => void;
}

export const Table = ({
  tablecells,
  onCellValueChange
}: TableProps) => {
  const maxRow = Math.max(...tablecells.map(cell => cell.row_index + cell.row_span));
  const maxCol = Math.max(...tablecells.map(cell => cell.col_index + cell.col_span));

  let cellIndex = 0;
  const spannedColumns = new Array(maxCol).fill(0);

  // Helper function to determine if content should use numeric styling
  const shouldUseNumericStyling = (content: string): boolean => {
    // Check if the content contains numbers or specifically has '0' or 'O'
    return !isNaN(Number(content)) || /[0O]/i.test(content);
  };

  return (
    <div className="custom-table">
      <section className="container mx-auto">
        <div className="flex flex-col mt-2">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-x-auto border border-gray-200 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 table-fixed overflow-auto">
                  <thead className="bg-gray-50">
                    {Array.from({ length: 1 }).map((_, row) => {
                        const rowCells = [];
                        let col = 0;
                        while (col < maxCol && cellIndex < tablecells.length) {
                          if (spannedColumns[col] > 0) {
                            spannedColumns[col]--;
                            col++;
                          } else {
                            const cell = tablecells[cellIndex];
                            if (cell.row_index === row) {
                              rowCells.push(
                                <th 
                                  key={cell.id} 
                                  rowSpan={cell.row_span} 
                                  colSpan={cell.col_span}
                                  scope="col"
                                  className={`px-4 py-4 text-sm font-medium text-gray-700 max-w-xs ${
                                    shouldUseNumericStyling(cell.content) ? 'font-mono font-feature-zero tabular-nums slashed-zero' : ''
                                  }`}
                                >
                                  <span className="ml-2 truncate block max-w-[150px] hover:text-gray-900" title={cell.content}>
                                    {cell.content}
                                  </span>
                                </th>
                              );
                              for (let c = col; c < col + cell.col_span; c++) {
                                if (cell.row_span > 1) spannedColumns[c] = cell.row_span - 1;
                              }
                              col += cell.col_span;
                              cellIndex++;
                            } else {
                              col++;
                            }
                          }
                        }
                        return <tr key={row}>{rowCells}</tr>;
                    })}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {
                      Array.from({ length: maxRow }).map((_, row) => {
                        const rowCells = [];
                        let col = 0;

                        while (col < maxCol && cellIndex < tablecells.length) {
                          if (spannedColumns[col] > 0) {
                            spannedColumns[col]--;
                            col++;
                          } else {
                            const cell = tablecells[cellIndex];
                            if (cell.row_index === row) {
                              rowCells.push(
                                <td
                                  key={cell.id}
                                  rowSpan={cell.row_span}
                                  colSpan={cell.col_span}
                                  className={`py-3.5 px-4 text-sm font-normal text-left text-gray-500 max-w-xs ${
                                    shouldUseNumericStyling(cell.content) ? 'font-mono font-feature-zero tabular-nums slashed-zero' : ''
                                  }`} 
                                >
                                    <ImputeText
                                      initialValue={cell.content}
                                      highlightText={cell.changed}
                                      placeholder=''
                                      onSave={(value) => {
                                        if(onCellValueChange) {
                                          onCellValueChange(cell, value);
                                        }
                                      }}
                                      className={`truncate ${shouldUseNumericStyling(cell.content) ? 'font-mono font-feature-zero tabular-nums slashed-zero' : ''}`}
                                    />
                                </td>
                              );
                              for (let c = col; c < col + cell.col_span; c++) {
                                if (cell.row_span > 1) {
                                  spannedColumns[c] = cell.row_span - 1;
                                }
                              }
                              col += cell.col_span;
                              cellIndex++;
                            } else {
                              col++;
                            }
                          }
                        }

                        return <tr key={row}>{rowCells}</tr>;
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};