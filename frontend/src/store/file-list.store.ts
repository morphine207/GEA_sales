import { create } from "zustand";
import { Project } from "./index"
import { ConfigConst } from "../config.const";
import { getLsCredentials } from "../utils/ls-credentials";
import { toast } from "react-toastify";

type state = {
    projects: Project[],
    loading: boolean
}

type actions = {
    fetchFiles: () => Promise<void>;
    deleteProject: (id: number) => Promise<void>;
    clearData: () => Promise<void>;
}

export const useFileListStore = create<state & actions>((set) => ({
    projects: [],
    loading: false,
    fetchFiles: async () => {
        set(state => ({
           ...state,
           loading: true 
        }));

        const { username, password } = getLsCredentials()

        const response = await fetch(
            `${ConfigConst.apiUrl}/api/project/all`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        );
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const projects: Project[] = await response.json();

        return set((state) => {
            return {
                ...state,
                projects,
                loading: false
            };
        });
    },
    deleteProject: async (id: number) => {
        const { username, password } = getLsCredentials()

        const response = await fetch(
            `${ConfigConst.apiUrl}/api/project?id=${id}`, 
            {
                method: "DELETE",
                headers: {
                    "Authorization": "Basic " + btoa(`${username}:${password}`)
                }
            }
        );

        if (!response.ok) {
            toast.error(`error delete the project`);
            console.error(`error message: ${response.statusText}`);
        }


        return set((state) => ({
            ...state,
            projects: state.projects.filter((project) => project.id !== id),
            loading: false
        }));
    },
    clearData: async () => {
        return set((state) => {

            return {
                ...state,
                files: []
            };
        })
    },
}))