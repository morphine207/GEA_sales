import { create } from "zustand";
import { Project, DocumentFile, MetaTable, TableCell } from "./models"
import { TableData } from "./models/table-data.model";
import { ConfigConst } from "../config.const";
import { getLsCredentials } from "../utils/ls-credentials";

type state = {
    project: Project | null,
    fileImageBlobUrl: string | null,
    tableDataValidated: boolean,
    tableColumnsSelected: boolean,
    loading: boolean
}

type actions = {
    createProject: (name: string, lima_number: string, version: string) => Promise<void>;
    uploadProjectFile: (file: File, projectId: number) => Promise<void>;
    fetchProjectFile: (fileId: number, projectId: number) => Promise<void>;
    fetchProject: (id: number) => Promise<void>;
    createProjectAndUploadFile: (name: string, lima_number: string, version: string, file: File) => Promise<void>;
    loadFileImage: (fileId: number, scannedFileId: number,  projectId: number, size: string) => Promise<void>;
    scanFile: (id: number, projectId: number) => Promise<void>;
    updateCellData: (metaTableId: number, projectId: number, tableId: number, cells: TableCell[], type: 'content' | 'selectable') => Promise<void>;
    modifyTableCell: (tableCell: TableCell, value: string) => Promise<void>;
    modifyProjectData: (projectId: number, patchData: { name: string, lima_number: string, version: string }) => Promise<void>;
    createdScannedFileRegions: (projectId: number, fileId: number, scannedFileId: number, size: string, regions: { xMin: number, yMin: number, xMax: number, yMax: number  }[]) => Promise<void>;
    selectPagesToScan: (projectId: number, fileId: number, pages: number[]) => Promise<void>;
    downloadPrebuiltLayout: (projectId: number, metaTableId: number, tableId: number) => Promise<void>;
    clearData: () => void;
    fetchAllProjects: () => Promise<Pick<Project, 'id' | 'name'>[]>;
}


export const useFileStore = create<state & actions>((set) => ({
    project: null,
    loading: false,
    tableDataValidated: false,
    tableColumnsSelected: false,
    fileImageBlobUrl: null,
    createProject: async (name: string, lima_number: string, version: string) => {
        set(state => ({
            ...state,
            loading: true 
        }));

        const { username, password } = getLsCredentials();

        const response = await fetch(`${ConfigConst.apiUrl}/api/project`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + btoa(`${username}:${password}`)
            },
            body: JSON.stringify({
                name, lima_number, version
            }),
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();

        if(result['id'] == null) throw new Error("return id is not defiend");
        
        return set((state) => {
            return {
                ...state,
                project: {
                    id: result['id'] 
                } as Project,
                loading: false
            };
        });
    },
    fetchProject: async (id: number) => {
        set(state => ({
            ...state,
            loading: true
        }));

        const {username, password} = getLsCredentials();

        const response = await fetch(
            `${ConfigConst.apiUrl}/api/project/` + id,
            {
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        );
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result: Project = await response.json();

        set(state => ({
            ...state,
            project: {
                id: result.id,
                name: result?.name ?? "",
                lima_number: result?.lima_number ?? "",
                version: result?.version ?? "",
                created_at: new Date(),
                files: []
            } as Project,
            loading: false,
        }));
    },
    uploadProjectFile: async (file: File, projectId: number) => {
        set((state) => ({
            ...state,
            loading: true
        }));

        const formData = new FormData();

        formData.append("file", file);

        const { username, password } = getLsCredentials();

        const response = await fetch(
            `${ConfigConst.apiUrl}/api/${projectId}/file/`,
            {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        );

        if(!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();

        set(state => {
            if(!state.project)
                return {
                    ...state,
                    loading: false
                }

            return ({
                ...state,
                project: {
                    ...state.project,
                    files: [
                        {
                            id: result['id']
                        } as DocumentFile
                    ]
                } as Project,
                loading: false
            });
        });
    },
    fetchProjectFile: async (fileId: number, projectId: number) => {
        set((state) => ({
            ...state,
            loading: true
        }));

        const {username, password} = getLsCredentials();
        
        const response = await fetch(
            `${ConfigConst.apiUrl}/api/${projectId}/file/${fileId}`,
            {
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        );
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result: DocumentFile = await response.json();

        set(state => {
            if (state.project == null || Object.keys(state.project.files).length === 0)
                return {
                    ...state
                }

            return {
                ...state,
                project: {
                    ...state.project,
                    files: [
                        {
                            id: result.id,
                            file_name: result.file_name,
                            format: result.format,
                            created_at: result.created_at,
                            scanned_at: result.scanned_at,
                            project_id: result.project_id,
                            scanned_files: result.scanned_files ?? []
                        } as DocumentFile
                    ]
                }
            }
        })
    },
    createProjectAndUploadFile: async (name: string, lima_number: string, version: string, file: File) => {
        set(state => ({
            ...state,
            loading: true 
        }));

        const { username, password } = getLsCredentials();

        const projectCreateResponse = await fetch(`${ConfigConst.apiUrl}/api/project`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + btoa(`${username}:${password}`)
            },
            body: JSON.stringify({
                name: name, lima_number: lima_number, version: version
            }),
        });

        if (!projectCreateResponse.ok) {
            throw new Error(`unable to create project, Response status: ${projectCreateResponse.status}`);
        }

        let result = await projectCreateResponse.json();
        const projectId = result['id']

        const projectFetchResponse = await fetch(
            `${ConfigConst.apiUrl}/api/project/${projectId}`, 
            {
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                },
            }
        );
        if (!projectFetchResponse.ok) {
            throw new Error(`unble to fetch project, Response status: ${projectFetchResponse.status}`);
        }

        const project: Project = await projectFetchResponse.json();

        const formData = new FormData();

        formData.append("file", file);

        const uploadFileResponse = await fetch(
            `${ConfigConst.apiUrl}/api/${projectId}/file/`,
            {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        );

        if(!uploadFileResponse.ok) {
            throw new Error(`unable to upload file, Response status: ${uploadFileResponse.status}`);
        }

        result = await uploadFileResponse.json();
        const fileId = result['id'];

        const fetchFileResponse = await fetch(
            `${ConfigConst.apiUrl}/api/${projectId}/file/${fileId}`,
            {
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        );
        if (!fetchFileResponse.ok) {
            throw new Error(`unable to fetch file, Response status: ${fetchFileResponse.status}`);
        }

        const documentFile: DocumentFile = await fetchFileResponse.json();

        project.files = [documentFile]

        set(state => ({
            ...state,
            loading: false,
            project: { ...project }
        }));
    },
    loadFileImage: async (fileId: number, scannedFileId: number,  projectId: number, size: string = "medium") => {
        set((state) => ({
            ...state,
            loading: true
        }));

        const { username, password } = getLsCredentials();

        const response = await fetch(
            `${ConfigConst.apiUrl}/api/${projectId}/file/${fileId}/scanned_file/${scannedFileId}/image?size=${size}`,
            {
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        );

        if (!response.ok) {
            throw new Error(`unable to load image, Response status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        return set((state) => ({
            ...state,
            loading: false,
            fileImageBlobUrl: url
        }))
    },
    scanFile: async (id: number, projectId: number) => {
        set((state) => ({
            ...state,
            loading: true
        }));

        const { username, password } = getLsCredentials();

        // comment for now here and hardcode projectId and id
        // projectId = 3;
        // id = 5;
        // uncomment when done with testing and want to scan the data first before fetching meta tables.
        const responseScan = await fetch(
            `${ConfigConst.apiUrl}/api/${projectId}/file/${id}/scan`, {
                method: "POST",
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        )

        if (!responseScan.ok) {
            throw new Error(`unable to scan the file: ${responseScan.status}`);
        }

        const scanedResult = await responseScan.json();

        const meta_table_id = scanedResult['metatable_id'] 

        const responseMetatable = await fetch(
            `${ConfigConst.apiUrl}/api/${projectId}/meta-table/${meta_table_id}`,
            {
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        )

        if (!responseMetatable.ok) {
            throw new Error(`unable to fetch metatable data: ${responseMetatable.status}`);
        }

        const metatable = await responseMetatable.json() as MetaTable;

        for(let i = 0; i < metatable.tabledata.length; i++) {
            const table = metatable.tabledata[i];
            const responseTableData = await fetch(
                `${ConfigConst.apiUrl}/api/${projectId}/meta-table/${metatable.id}/table/${table.id}`,
                {
                    headers: {
                        "Authorization": "Basic " + btoa(`${username}:${password}`)
                    }
                }
            )
            
            if (!responseTableData.ok) {
                throw new Error(`unable to fetch table data: ${responseTableData.status}`);
            }
            
            const tableData: TableData = await responseTableData.json();

            metatable.tabledata[i] = {
                ...tableData,
                tablecells: tableData.tablecells.map(tc => ({
                    ...tc,
                    changed: false
                }))
            }
        }
        
        set((state) => ({
            ...state,
            project: {
                ...state.project,
                metatable: metatable
            } as Project,
            loading: false
        }))
    },
    updateCellData: async (metaTableId: number, projectId: number, tableId: number, cells: TableCell[], type: 'content' | 'selectable' = 'content') => {
        set((state) => ({
            ...state,
            loading: true
        }));
        let requestDto = null;

        const { username, password } = getLsCredentials();

        if(type == 'content') {
            requestDto = cells.map(cell => ({
                id: cell.id,
                content: cell.content
            }));
        }            
        else if(type == 'selectable') {
            requestDto = cells.map(cell => ({
                id: cell.id,
                selectable: cell.selectable
            }));
        }

        const response = await fetch(`${ConfigConst.apiUrl}/api/${projectId}/meta-table/${metaTableId}/table/${tableId}?type_enum=${type}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + btoa(`${username}:${password}`)
            },
            body: JSON.stringify({
                data: requestDto
            }),
        });
        if (!response.ok) {
            throw new Error(`error in updating the table cell: ${response.status}`);
        }
        
        set((state) => ({
            ...state,
            tableDataValidated: type == 'content',
            tableColumnsSelected: type == 'selectable',
            project: {
                ...state.project,
                metatable: !!state.project?.metatable ? {
                    ...state.project.metatable,
                    tabledata: state.project.metatable.tabledata.map(table => {
                        if(table.id == tableId) {
                            return {
                                ...table,
                                tablecells: table.tablecells.map(cell => ({
                                    ...cell,
                                    selectable: cells.find(c => c.id == cell.id)?.selectable ?? cell.selectable,
                                    changed: false
                                }))
                            };
                        }

                        return {
                            ...table,
                            tablecells: table.tablecells.map(cell => ({ ...cell, content: cell.content, changed: false  }))
                        };
                    })
                } : undefined 
            } as Project,
            loading: false
        }));
    },
    modifyTableCell: async (tableCell: TableCell, value: string) => {
        return set((state) => {
            state.project?.metatable?.tabledata.forEach(td => {
                td.tablecells.forEach(tc => {
                    if(tc === tableCell || tc.id === tableCell.id) {
                        tc.changed = true;
                        tc.content = value;
                        return tc;
                    }
                    return tc;
                })
            });

            return ({
                ...state,
                project: { ...state.project } as Project,
                loading: false
            })
        });
    },
    modifyProjectData: async (projectId: number, data: { name: string, lima_number: string, version: string }) => {
        const { name, lima_number, version } = data;

        set((state) => ({
            ...state,
            loading: true
        }))

        const response = await fetch(`${ConfigConst.apiUrl}/api/project/${projectId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, lima_number, version })
        });

        if (!response.ok) {
            throw new Error(`unable to update project data: ${response.status}`);
        }

        return set((state) => ({
            ...state,
            loading: false,
            project: {
                ...state.project as Project,
                name,
                lima_number,
                version
            }
        }))
    },
    createdScannedFileRegions: async (projectId: number, fileId: number, scannedFileId: number, size: string, regions: { xMin: number, yMin: number, xMax: number, yMax: number  }[]) => {
        set((state) => ({
            ...state,
            loading: true
        }))

        const { username, password } = getLsCredentials();

        const jsonRegions = regions.map(r => ({
            label: "123",
            x_min: Math.floor(r.xMin),
            x_max: Math.floor(r.xMax),
            y_min: Math.floor(r.yMin),
            y_max: Math.floor(r.yMax)
        }));
        const response = await fetch(`${ConfigConst.apiUrl}/api/${projectId}/file/${fileId}/${scannedFileId}/regions?size=${size}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + btoa(`${username}:${password}`)
            },
            body: JSON.stringify({
                regions: jsonRegions
            })
        });

        if (!response.ok) {
            throw new Error(`unable to load image, Response status: ${response.status}`);
        }

        return set((state) => ({
            ...state,
            project: {
                ...state.project,
                files: state.project?.files.map(file => ({
                    ...file,
                    scanned_files: file.scanned_files.map(sf => ({
                        ...sf,
                        file_regions: sf.id == scannedFileId ? [...sf.file_regions, ...jsonRegions] : sf.file_regions
                    }))
                })),
            } as Project,
            loading: false
        }));
    },
    selectPagesToScan: async (projectId: number, fileId: number, pages: number[]) => {
        set((state) => ({
            ...state,
            loading: true
        }));

        const { username, password } = getLsCredentials();

        const response = await fetch(`${ConfigConst.apiUrl}/api/${projectId}/file/${fileId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic " + btoa(`${username}:${password}`)
            },
            body: JSON.stringify(pages)
        });

        if (!response.ok) {
            throw new Error(`unable to load image, Response status: ${response.status}`);
        }

        set((state) => 
             ({
                state: {
                    ...state,
                    project: {
                        ...state.project,
                        files: state.project?.files.map(file => {
                            if(file.id != fileId) {
                                return file;
                            }
            
                            file.files_to_scan = pages;
                            return file;
                        })
                    }
                },
                loading: false
            })
        );

        return;
    },
    downloadPrebuiltLayout: async (projectId: number, metaTableId: number) => {
        set((state) => ({
            ...state,
            loading: true
        }));

        const {username, password} = getLsCredentials(); 

        const response = await fetch(`${ConfigConst.apiUrl}/api/${projectId}/meta-table/${metaTableId}/prebuilt`, {
            method: "GET",
            headers: {
                "Authorization": "Basic " + btoa(`${username}:${password}`)
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'output.xlsx';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);

        set((state) => ({
            ...state,
            loading: false
        }));

        return;
    },
    clearData: () => {
        set(() => ({
            project: null,
            fileImageBlobUrl: null,
            loading: false
        }))
    },
    fetchAllProjects: async (): Promise<Pick<Project, 'id' | 'name'>[]> => {
        const { username, password } = getLsCredentials();
        const response = await fetch(`${ConfigConst.apiUrl}/api/project/all`, {
            headers: {
                "Authorization": "Basic " + btoa(`${username}:${password}`)
            }
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const result = await response.json();
        return Array.isArray(result)
            ? result.map((p: any) => ({ id: p.id, name: p.name }))
            : [];
    }
}));