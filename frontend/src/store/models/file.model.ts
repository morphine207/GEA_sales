import { ScannedFile } from "./scanned-file.model";

export interface DocumentFile {
    id: number;
    name: string;
    file_name: string;
    format: string;
    created_at: string;
    scanned_at: string;
    project_id: number;
    files_to_scan: number[];
    scanned_files: ScannedFile[];
}