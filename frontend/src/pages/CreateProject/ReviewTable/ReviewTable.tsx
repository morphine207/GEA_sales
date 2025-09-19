import { Button, Select, Spin } from "antd"
import { Table } from "./Table"
import { useEffect, useState } from "react"
import { useFileStore } from "../../../store/file.store"
import { TableCell } from "../../../store";
import { toast } from 'react-toastify';

export const ReviewTable = () => {

    const { project, loading, scanFile, updateCellData, modifyTableCell } = useFileStore();
    const [selectedTable, setSelectedTable] = useState<number>(0);

    useEffect(() => {
        if((project?.files.length || -1) > 0) {
            scanFile(project?.files[0].id as number, project?.id as number);
        }
    }, []);

    return (
        <>
            {
                !project?.metatable && loading && (
                    <div className="flex w-full justify-center m-auto items-center flex-col">
                        <div className="flex items-center">
                            <Spin className="inline" />
                            <span className="font-bold mx-2 inline-block">
                                Scanning files and fetching table data
                            </span>
                        </div>
                    </div>
                ) 
            }
            {
                !!project?.metatable && project.metatable.tabledata.length > 0 &&
                (
                    <div
                        className="review-table-section overflow-hidden"
                    >
                        <div>
                            <Table
                                tablecells={
                                    Object.keys(project.metatable.tabledata[selectedTable].tablecells).length > 0 ? project.metatable.tabledata[selectedTable].tablecells : []
                                }
                                onCellValueChange={(tableCell, value) => {
                                    modifyTableCell(tableCell, value)
                                }}
                            />
                        </div>
                        <div
                            className="mt-3 w-screen flex gap-4 items-center"
                        >
                            <Select 
                                size="large" 
                                onChange={(value) => setSelectedTable(value)}
                                className="w-36"
                                defaultValue={project.metatable.tabledata.length > 0 ? 0 : undefined}
                            >
                                {
                                    project.metatable.tabledata.map((_, index) => (
                                        <Select.Option
                                            key={index}
                                            value={index}
                                        >
                                            {`Table ${index + 1}`}
                                        </Select.Option>
                                    ))
                                }
                            </Select>
                            <Button
                                onClick={() => {
                                    if(!project || !project.metatable) return;

                                    const cellsToUpdate: TableCell[] = project.metatable.tabledata.map(item => item.tablecells).flat().filter(item => item.changed)
                                    updateCellData(project.metatable.id, project.id, project.metatable.tabledata[selectedTable ?? 0].id, cellsToUpdate, 'content').then(() => {
                                        toast("table data is validated")
                                    }).catch(err => {
                                        console.error(err.message);
                                        toast("error validating the data", {
                                            type: "error"
                                        })
                                    })
                                }}
                            >
                                Save Changes
                            </Button>
                            {/* <BackButton/> */}
                        </div>
                    </div>
                )
            }
        </>
    )
};