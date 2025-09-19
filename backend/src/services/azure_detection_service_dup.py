from typing import List
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest

from src.dto import TableCellResponse, TableDataResponse
from src.utils import polygon_to_bounding_box

class AzureDetectionServiceDup:
    def __init__(self, service_endpoint: str, service_key: str):
        self.service_endpoint: str = service_endpoint
        self.service_key: str = service_key
        self.client = self.create_client()

    def create_client(self) -> DocumentIntelligenceClient:
        return DocumentIntelligenceClient(
            endpoint=self.service_endpoint, credential=AzureKeyCredential(self.service_key), api_version="2024-07-31-preview"
        )
    
    def analyze_document(self, file_buffer: bytes) -> list[TableDataResponse]:
        """
            read the file analyze document and read the text and table layouts.
        """
        poller = self.client.begin_analyze_document(
            "prebuilt-layout", AnalyzeDocumentRequest(bytes_source=file_buffer)
        )

        result = poller.result()

        # words: List[WordData] = []
        tables: List[TableDataResponse] = []

        # TODO: store ocr word detection afterwards.
        # if(len(result['pages']) > 0):
        #     for document_word in result['pages'][0]['words']:
        #         word_data = WordData()
        #         word_data.content = document_word['content']
        #         word_data.polygon = polygon_to_bounding_box(document_word['polygon'])
        #         words.append(word_data)

        if(len(result['tables']) > 0):
            for table in result['tables']:
                table_cells = []
                for cell in table['cells']:
                    table_cells.append(
                        TableCellResponse(
                            col_index= cell['columnIndex'],
                            row_index= cell['rowIndex'],
                            col_span= cell['columnSpan'] if "columnSpan" in cell else 1,
                            row_span= cell['rowSpan'] if "rowSpan" in cell else 1,
                            content= cell['content'],
                            kind= ""
                        )
                    ) 
                
                table_data = TableDataResponse(
                    col_count=table["columnCount"],
                    row_count=table["rowCount"],
                    polygon=polygon_to_bounding_box(table['boundingRegions'][0]["polygon"]),
                    cells=table_cells
                )
                tables.append(table_data)

        return tables
