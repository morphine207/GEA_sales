import { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Button } from 'antd';
import { useFileStore } from '../../../store/file.store';
const { Title, Text } = Typography;
import { DatabaseOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { generateXlsxData } from '../../../utils/generate-xlsx-data';
import { toast } from 'react-toastify';


export function ExportPage() {

  const [columns, setColumns] = useState<string[][]>([]);

  const { project, fileImageBlobUrl, downloadPrebuiltLayout } = useFileStore();

  useEffect(() => {
    const columns = project?.metatable?.tabledata.map(table => 
      table.tablecells.filter((cell) => cell.row_index == 0 && cell.selectable)
      .sort((a, b) => a.row_index - b.row_index)
      .map(tablecells => tablecells.content)
    ).filter(columns => columns.length > 0);

    if(columns) {
      setColumns(
        columns
      );
    }
  }, []);

  const exportToXlsx = () => {
    const tabelCellsXlsxList = project?.metatable?.tabledata.map(td => { 
      let selectedColumns = new Set();
      const head = td.tablecells.filter((cell) => cell.row_index == 0 && cell.selectable);
      head.forEach(cell => {
        for (let i = cell.col_index; i < cell.col_index + cell.col_span; i++) {
          selectedColumns.add(i);
        }
      });
      
      const filteredTableCells = head.concat(
        td.tablecells.filter(cell => cell.row_index > 0).filter(cell => {
          for (let i = cell.col_index; i < cell.col_index + cell.col_span; i++) {
            if (selectedColumns.has(i)) {
                return true;
            }
          }
          return false;
        })
      );
      return filteredTableCells.length > 0 ? generateXlsxData(filteredTableCells) : undefined
    }).filter(Boolean);

    if(tabelCellsXlsxList == undefined) {
      toast.error("data is not available to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    let count = 1;
    for(const tableCells of tabelCellsXlsxList) {
      if(!tableCells) continue;

      const ws = XLSX.utils.aoa_to_sheet(tableCells.data);
      if(tableCells.merges.length > 0) {
        ws["!merges"] = tableCells.merges
      }

      XLSX.utils.book_append_sheet(wb, ws, `Sheet ${count++}`);
    }

    XLSX.writeFile(wb, "BOM_data.xlsx");

    toast.success("xlsx file is generated");
  }

  const generatePrebuiltLayout = () => {
    const projectId = project?.id;
    const metaTableId = project?.metatable?.id;
    const tableDataId = project?.metatable?.tabledata.at(0)?.id

    if(!projectId || !metaTableId || !tableDataId)
      return console.error("id values might not exists");


    downloadPrebuiltLayout(projectId, metaTableId, tableDataId).then(() => ({}));
  }

  return (
    <div className="flex-1 p-8">

      <div className="max-w-screen-2xl mx-auto">
        
        <Card 
          className="w-full mb-8 shadow-sm preview-card"
        >
          {
            !fileImageBlobUrl && (
              <div className="w-full h-64 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                <Text className="text-gray-400">Document preview will appear here</Text>
              </div>
            )
          }
          {
            fileImageBlobUrl &&
            (
              <img src={fileImageBlobUrl ?? ""} alt="No image previw" />
            )
          }
        </Card>
        
        <div className="mb-6">
          <Text className="text-gray-500">The following data from the tables along with columns will be exported:</Text>
        </div>
        
        <Row gutter={[16, 16]} className="mb-10">
          {columns.map((colList, index) => (
            <Col key={colList[index]} xs={24} sm={12} md={8} lg={8} xl={6} xxl={4.8}>
              <div>
                <Title level={5} className="font-medium mb-2">{`Table ${index + 1}`}</Title>
                <ul className="list-disc pl-5">
                  {colList.map((col) => (
                    <li key={col} className="text-gray-600 text-sm mb-1">
                      {col}
                    </li>
                  ))}
                </ul>
              </div>
            </Col>
          ))}
        </Row>
        
        <div className="flex justify-end gap-4">
          <div className="custom-export-button">
            <Button 
              type="primary"
              icon={<DatabaseOutlined />}
              onClick={() => generatePrebuiltLayout()}
              className="bg-gray-800 hover:bg-gray-700 mx-3"
            >
              Export for cylce-time tool
            </Button>
            
            <Button 
              type="primary" 
              icon={<FileExcelOutlined />}
              onClick={() => exportToXlsx()}
              className="bg-gray-800 hover:bg-gray-700 mx-3"
            >
              Export as .xlsx
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;