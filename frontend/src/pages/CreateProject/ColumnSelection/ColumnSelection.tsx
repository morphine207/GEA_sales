import { Button, Checkbox } from "antd";
import { ColumnItemModel, ColumnItems } from "./ColumnItems";
import { useEffect, useState } from "react";
import { useFileStore } from "../../../store/file.store";
import { TableCell } from "../../../store";


export const ColumnSelection = () => {
    const { project, updateCellData } = useFileStore();
    const [columnItemsList, setColumnItemList] = useState<(ColumnItemModel & { id: number })[][]>([]);

    useEffect(() => {
        if(!project?.metatable) return;
        
        const tableCellsList = project?.metatable?.tabledata.map(
            td => td.tablecells.filter(x => x.row_index === 0).map(tc => ({ id: tc.id, name: tc.content, selected: tc.selectable }))
        );
        setColumnItemList(tableCellsList);
    }, []);

    const setCheckboxValue = (checked: boolean, id: number) => {
        const newList = columnItemsList.map(
            (items) => items.map(item => {
                if(item.id === id) {
                    return {
                        ...item,
                        selected: checked
                    }
                }

                return item
            })
        );
        setColumnItemList(newList);
    }

    const updateCellSelectableValues = () => {
        const metaTableId = project?.metatable?.id;
        const projectId = project?.id;

        if(!projectId && !metaTableId) {
            throw new Error("project or metatable is not defined.");
        }
        
        const tableDataCells = project?.metatable?.tabledata
            .map(table => ({
                id: table.id,
                cells: table.tablecells.map(cell => ({ id: cell.id, selectable: cell.selectable })),
            })).flat();

        const grouped: { [key: number]: ({ id: number; selectable: boolean; } | undefined)[] } = {};

        const tableCellList = columnItemsList
            .map(
                items => items.map(
                    item => ({
                        id: item.id,
                        selectable: item.selected 
                    })
                )
            )
            .flat();

        tableDataCells?.forEach(td => {
            grouped[td.id] = tableCellList.map(cell => {
                if(td.cells.findIndex(c => c.id == cell.id) != -1)
                    return cell;
                return undefined;
            })
            .filter(Boolean)
        });


        const groupedInstace = Object.keys(grouped)
        .map(key => ({
            tableId: Number(key),
            values: grouped[Number(key)]
        }))
        .filter((instance) => instance.values.length > 0);

        // all the table list that have changed since the last request to change the selevtables.
        for(let instance of groupedInstace) {
            updateCellData(metaTableId as number, projectId as number, instance.tableId, instance.values as TableCell[], 'selectable');
        }
    }

    return (
        <>
            <div>
                <h3 className="text-xl font-bold">Table and Column Selection</h3>
                <p className="text-lg">Select the table and its respective columns to be in the final sheet</p>
            </div>

            {
                columnItemsList.map((items, itemIndex) => (
                    <div
                        key={itemIndex} 
                        className="columns mt-3"
                    >
                        <h4 className="text-lg mb-1">
                            Table {itemIndex + 1}
                            <span className="ml-2">
                                <Checkbox onChange={(event) => {
                                    setColumnItemList([
                                        ...columnItemsList.slice(0, itemIndex),
                                        items.map(item => ({
                                            ...item,
                                            selected: event.target.checked ?? false 
                                        })),
                                        ...columnItemsList.slice(itemIndex + 1, columnItemsList.length),
                                    ])
                                }} />
                            </span>
                        </h4>
                        <div className="column-list">
                            <ColumnItems
                                columnItems={items.map((item) => ({ name: item.name, selected: item.selected }))}
                                onSelectChange={(checked, index) => {
                                    setCheckboxValue(checked, items[index].id);
                                }}
                            />
                        </div>
                    </div>
                ))
            }
            
            <div className="flex items-center gap-4 mt-4">
                {/* <BackButton/>  */}
                <Button
                    size="small"
                    className="bg-gradient-to-r bg-gray-700 text-white font-medium p-3 py-4 rounded-lg"
                    onClick={() => updateCellSelectableValues()}
                >
                    Save
                </Button>
            </div>
               
        </>
    );
}