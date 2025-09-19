import { Checkbox } from "antd"

export interface ColumnItemModel {
    name: string;
    selected: boolean;
}

export const ColumnItems = ({ columnItems, onSelectChange }: { columnItems: ColumnItemModel[], onSelectChange: (checked: boolean, index: number) => void }) => {
    return (
        <div>
            <div className="flex flex-wrap gap-1 mb-4">
                {
                    columnItems.map(({ name, selected }, index) => (
                        <div 
                            key={name + index} 
                            className="items-center ps-4 border border-gray-200 rounded-sm p-3"
                        >
                            <div className="flex justify-end mr-2">
                                <Checkbox 
                                    checked={selected} 
                                    onChange={(event) => onSelectChange(event.target.checked, index)} 
                                />
                            </div>
                            <div className="mt-2 text-base">
                                {name}
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}