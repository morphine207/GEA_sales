// src/pages/ViewerModule/PipelineManagementPage.tsx

import React, { useEffect, useState } from "react";
import { PlusIcon, EyeIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import {
  getProjectsAPI,
  listViewerSettingsAPI,
  createPipelineAPI,
  deletePipelineAPI,
  deleteSingleSetting,
} from "../../vendor/o3dv/source/engine/parameters/viewerApi.js";
import { Button, Modal, Input, message, Spin, Select } from "antd";
const { Option } = Select;
import { useFileStore } from "../../store/file.store";

export const PipelineManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [pipelines, setPipelines] = useState<
    {
      pipeline_id: number;
      pipeline_name: string;
      settings: { id: number; name: string; opNumber?: string; type?: string }[];
    }[]
  >([]);
  const [expandedPipeline, setExpandedPipeline] = useState<number | null>(null);
  const fetchAllProjects = useFileStore((state: any) => state.fetchAllProjects);
  const createProject = useFileStore((state: any) => state.createProject);
  const [createProjectModalVisible, setCreateProjectModalVisible] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", limaNumber: "", version: "" });
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProjectsAPI().then(setProjects);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      listViewerSettingsAPI(Number(selectedProject))
        .then(setPipelines)
        .catch(() => setPipelines([]));
    } else {
      setPipelines([]);
    }
  }, [selectedProject]);

  // Fetch projects with loading spinner
  useEffect(() => {
    (async () => {
      try {
        setLoadingProjects(true);
        const projectsData = await getProjectsAPI();
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch {
        setProjects([]);
        message.error("Failed to fetch projects");
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, []);

  const handleAddPipeline = async () => {
    if (!selectedProject) {
      alert("Bitte zuerst ein Projekt auswählen.");
      return;
    }
    const name = prompt("Name der neuen Pipeline:");
    if (!name) return;
    try {
      await createPipelineAPI(Number(selectedProject), name);
      const pls = await listViewerSettingsAPI(Number(selectedProject));
      setPipelines(pls);
    } catch (err) {
      alert("Fehler beim Erstellen der Pipeline.");
    }
  };

  const handleDeletePipeline = async (pipelineId: number) => {
    if (!selectedProject) return;
    if (!window.confirm("Möchtest du diese Pipeline wirklich löschen?")) return;
    setLoading(true);
    try {
      await deletePipelineAPI(Number(selectedProject), pipelineId);
      const pls = await listViewerSettingsAPI(Number(selectedProject));
      setPipelines(pls);
    } catch (err) {
      alert("Fehler beim Löschen der Pipeline.");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (
    pipelineId: number,
    settingId: number,
    field: "opNumber" | "type",
    value: string
  ) => {
    setPipelines(prev =>
      prev.map(pl =>
        pl.pipeline_id === pipelineId
          ? {
              ...pl,
              settings: pl.settings.map(s => (s.id === settingId ? { ...s, [field]: value } : s))
            }
          : pl
      )
    );
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.limaNumber || !newProject.version) {
      message.error("Please fill all fields");
      return;
    }
    setCreatingProject(true);
    try {
      await createProject(newProject.name, newProject.limaNumber, newProject.version);
      message.success("Project created successfully");
      setCreateProjectModalVisible(false);
      setNewProject({ name: "", limaNumber: "", version: "" });
      // Refresh projects list
      const projectsData = await fetchAllProjects();
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      // Select the new project by name
      if (projectsData && projectsData.length > 0) {
        const created = projectsData.find((p: any) => p.name === newProject.name);
        if (created) {
          setSelectedProject(created.id.toString());
        }
      }
    } catch (err) {
      message.error("Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleSave = async (setting: any) => {
    setSavingId(setting.id);
    setTimeout(() => {
      setSavingId(null);
      message.success("Änderungen gespeichert");
    }, 1000);
  };

  // **Hier ist die Delete-Funktion für einzelne Settings**
  const handleDelete = async (settingId: number) => {
    if (!selectedProject) return;
    if (!window.confirm("Soll dieses Setting wirklich gelöscht werden?")) return;
    setLoading(true);
    try {
      await deleteSingleSetting(Number(selectedProject), settingId);
      // Nach dem Löschen Settings neu laden
      const pls = await listViewerSettingsAPI(Number(selectedProject));
      setPipelines(pls);
    } catch (err) {
      alert("Fehler beim Löschen des Settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Das zentrale Kästchen mit Abstand zur oberen Kante */}
      <div className="relative flex justify-center">
        <div className="mt-16 w-full max-w-6xl px-2 sm:px-6 py-8 space-y-8 bg-white/95 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">
              Pipeline Management
            </h1>
            <button
              onClick={() => navigate("/viewer")}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-lg shadow hover:bg-gray-800 transition"
              style={{ backgroundColor: '#0026B7' }}
            >
              <EyeIcon className="h-5 w-5" />
              Viewer öffnen
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <Button
              style={{ backgroundColor: "#FFF", borderColor: "#0026B7", color: "#0026B7", transition: 'all 0.2s' }}
              size="large"
              onClick={() => setCreateProjectModalVisible(true)}
              className="font-semibold shadow"
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0026B7';
                (e.currentTarget as HTMLButtonElement).style.color = '#FFF';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFF';
                (e.currentTarget as HTMLButtonElement).style.color = '#0026B7';
              }}
            >
              Create New Project
            </Button>
            <Modal
              title="Create New Project"
              open={createProjectModalVisible}
              onCancel={() => setCreateProjectModalVisible(false)}
              onOk={handleCreateProject}
              confirmLoading={creatingProject}
              okText="Create"
            >
              <Input
                placeholder="Project Name"
                style={{ marginBottom: 12 }}
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
              />
              <Input
                placeholder="Lima Number"
                style={{ marginBottom: 12 }}
                value={newProject.limaNumber}
                onChange={e => setNewProject({ ...newProject, limaNumber: e.target.value })}
              />
              <Input
                placeholder="Version"
                style={{ marginBottom: 0 }}
                value={newProject.version}
                onChange={e => setNewProject({ ...newProject, version: e.target.value })}
              />
            </Modal>
            <div>
              <Select
                size="large"
                placeholder="-Select Project-"
                style={{ width: 320 }}
                value={selectedProject || undefined}
                onChange={value => setSelectedProject(value)}
                allowClear
                loading={loadingProjects}
                optionLabelProp="children"
                dropdownStyle={{ zIndex: 1300 }}
              >
                {projects.map(p => (
                  <Option key={p.id} value={p.id.toString()}>{p.name}</Option>
                ))}
              </Select>
              {loadingProjects && <Spin size="small" className="ml-2" />}
            </div>
            <Button
              style={{ backgroundColor: "#FFF", borderColor: "#0026B7", color: "#0026B7", transition: 'all 0.2s' }}
              size="large"
              onClick={handleAddPipeline}
              className="inline-flex items-center gap-2 font-semibold shadow"
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0026B7';
                (e.currentTarget as HTMLButtonElement).style.color = '#FFF';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFF';
                (e.currentTarget as HTMLButtonElement).style.color = '#0026B7';
              }}
            >
              <PlusIcon className="h-5 w-5" />
              Add Pipelines
            </Button>
          </div>

          {/* Visuelle Trennung */}
          <div className="border-t border-gray-300 my-4" />

          <div>
            {selectedProject === "" ? (
              <div className="py-12 text-center text-gray-500 text-lg">
                Bitte ein Projekt auswählen, um Pipelines zu sehen.
              </div>
            ) : pipelines.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-lg">
                Keine Pipelines gefunden.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {pipelines.map((pl) => (
                  <div
                    key={pl.pipeline_id}
                    className="w-full p-6 bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:border-black transition"
                  >
                    <div
                      className="flex items-center justify-between"
                      onClick={() =>
                        setExpandedPipeline(
                          expandedPipeline === pl.pipeline_id ? null : pl.pipeline_id
                        )
                      }
                    >
                      <h2 className="text-2xl font-bold mb-2 text-gray-800">
                        {pl.pipeline_name}
                      </h2>
                      <button
                        className="text-sm text-red-600 underline ml-2"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleDeletePipeline(pl.pipeline_id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      ID: {pl.pipeline_id}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {pl.settings.length} Setting
                      {pl.settings.length !== 1 && "s"}
                    </p>
                    {expandedPipeline === pl.pipeline_id && (
                      <div className="space-y-4 mt-4">
                        {pl.settings.map((setting) => (
                          <div
                            key={setting.id}
                            className="border border-gray-200 rounded-xl bg-gray-50 px-6 py-4 w-full"
                          >
                            <div className="flex flex-row items-center gap-4 w-full">
                              <span className="font-medium text-gray-800 flex-1 min-w-0 truncate text-base">
                                {setting.name || `Setting ${setting.id}`}
                              </span>
                              <input
                                type="number"
                                min={0}
                                className="border border-gray-300 rounded px-3 py-2 w-24 text-base focus:ring-2 focus:ring-gray-500 transition bg-white"
                                value={setting.opNumber ?? 0}
                                onChange={e =>
                                  handleSettingChange(
                                    pl.pipeline_id,
                                    setting.id,
                                    "opNumber",
                                    e.target.value
                                  )
                                }
                                disabled={savingId === setting.id}
                              />
                              <select
                                className="border border-gray-300 rounded px-3 py-2 w-28 text-base focus:ring-2 focus:ring-gray-500 transition bg-white"
                                value={setting.type ?? "input"}
                                onChange={e =>
                                  handleSettingChange(
                                    pl.pipeline_id,
                                    setting.id,
                                    "type",
                                    e.target.value
                                  )
                                }
                                disabled={savingId === setting.id}
                              >
                                <option value="input">Input</option>
                                <option value="output">Output</option>
                              </select>
                              <button
                                onClick={() => handleSave(setting)}
                                className="px-5 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition text-sm font-semibold shadow"
                                disabled={savingId === setting.id}
                                title="Änderungen speichern"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => handleDelete(setting.id)}
                                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition text-sm font-semibold shadow"
                                title="Setting löschen"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineManagementPage;
