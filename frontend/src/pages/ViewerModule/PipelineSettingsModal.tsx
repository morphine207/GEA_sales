// src/pages/ViewerModule/PipelineSettingsModal.tsx

import React, { useEffect, useState } from "react";
import {
  listViewerSettingsAPI,
  deleteSingleSetting,
  updateSettingAPI
} from "../../vendor/o3dv/source/engine/parameters/viewerApi.js";

interface Setting {
  id: number;
  name: string;
  opNumber?: string | number;
  type?: string;
}

interface PipelineSettingsModalProps {
  open: boolean;
  onClose: () => void;
  projectId: number | '';
  pipelineId: number | '';
}

const MODAL_HEIGHT = 540; // px

const PipelineSettingsModal: React.FC<PipelineSettingsModalProps> = ({
  open,
  onClose,
  projectId,
  pipelineId,
}) => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [pipelineName, setPipelineName] = useState<string>("");
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !projectId || !pipelineId) {
      setSettings([]);
      setPipelineName("");
      return;
    }
    loadSettings();
    // eslint-disable-next-line
  }, [open, projectId, pipelineId]);

  const loadSettings = async () => {
    const pipelines = await listViewerSettingsAPI(projectId);
    const pipeline = pipelines.find((p) => p.pipeline_id === pipelineId);
    setPipelineName(pipeline?.pipeline_name || "");
    setSettings(
      (pipeline?.settings || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        opNumber: s.opNumber ?? 0,
        type: s.type ?? "input",
      }))
    );
  };

  // Setting löschen
  const handleDelete = async (settingId: number) => {
    if (!projectId) return;
    if (!window.confirm("Soll dieses Setting wirklich gelöscht werden?")) return;
    try {
      await deleteSingleSetting(projectId, settingId);
      await loadSettings();
    } catch (err: any) {
      alert("Fehler beim Löschen: " + err.message);
    }
  };

  // Setting bearbeiten/speichern
  const handleSave = async (setting: Setting) => {
    if (!projectId) return;
    setSavingId(setting.id);
    try {
      await updateSettingAPI(projectId, setting.id, setting.opNumber, setting.type);
      await loadSettings();
    } catch (err: any) {
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  // Änderungen im State speichern
  const handleChange = (id: number, field: "opNumber" | "type", value: string) => {
    setSettings(prev =>
      prev.map(s =>
        s.id === id ? { ...s, [field]: field === "opNumber" ? value.replace(/\D/g, "") : value } : s
      )
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 38, 183, 0.5)' }}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-0 relative flex flex-col"
        style={{ height: MODAL_HEIGHT, minHeight: MODAL_HEIGHT, maxHeight: MODAL_HEIGHT }}
      >
        <div className="flex items-center justify-between border-b px-7 py-5 bg-gray-100 rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-800">
            Pipeline: <span className="font-normal text-gray-600">{pipelineName}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
        <div
          className="overflow-y-auto flex-1 px-7 py-4 bg-gray-50"
          style={{ minHeight: 0 }}
        >
          {settings.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-10">Keine Viewer Settings für diese Pipeline.</div>
          ) : (
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-gray-500 font-medium">
                  <th className="text-left px-2 py-1">Name</th>
                  <th className="text-left px-2 py-1">OP-Nummer</th>
                  <th className="text-left px-2 py-1">Typ</th>
                  <th className="px-2 py-1 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {settings.map((setting) => (
                  <tr
                    key={setting.id}
                    className="bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    <td className="px-2 py-2 rounded-l-lg font-medium text-gray-800 break-all align-middle">
                      {setting.name || `Setting ${setting.id}`}
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <input
                        type="number"
                        min={0}
                        className="border border-gray-300 rounded px-2 py-1 w-24 text-sm focus:ring-2 focus:ring-gray-500 transition bg-white"
                        value={setting.opNumber ?? 0}
                        onChange={e =>
                          handleChange(setting.id, "opNumber", e.target.value)
                        }
                        disabled={savingId === setting.id}
                      />
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <select
                        className="border border-gray-300 rounded px-2 py-1 w-28 text-sm focus:ring-2 focus:ring-gray-500 transition bg-white"
                        value={setting.type ?? "input"}
                        onChange={e =>
                          handleChange(setting.id, "type", e.target.value)
                        }
                        disabled={savingId === setting.id}
                      >
                        <option value="input">Input</option>
                        <option value="output">Output</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 rounded-r-lg align-middle">
                      <div className="flex flex-row gap-2 justify-center items-center">
                        <button
                          onClick={() => handleSave(setting)}
                          className="px-4 py-1 bg-gray-700 text-white rounded hover:bg-gray-900 transition text-xs font-semibold shadow-sm"
                          disabled={savingId === setting.id}
                          title="Änderungen speichern"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleDelete(setting.id)}
                          className="px-4 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition text-xs font-semibold shadow-sm"
                          title="Setting löschen"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end border-t px-7 py-4 bg-gray-100 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-200 border border-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PipelineSettingsModal;
