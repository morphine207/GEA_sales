import { FileRegion } from "./file-region.model";

export interface ScannedFile {
    id: number;
    file_name: string;
    created_at: string;
    file_id: number;
    page_number: number;
    file_regions: FileRegion[];
}