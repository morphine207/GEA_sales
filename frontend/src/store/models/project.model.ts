import { DocumentFile } from "./file.model";
import { MetaTable } from "./meta-table.model";

export interface Project {
    id: number;
    name: string;
    lima_number: string;
    version: string;
    created_at: Date
    files: DocumentFile[];
    metatable?: MetaTable; 
}