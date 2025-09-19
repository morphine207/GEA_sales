import React, { useEffect, useState } from 'react';
import {
  listViewerSettingsAPI,
  deleteSingleSetting,
  deletePipelineAPI
} from '../../vendor/o3dv/source/engine/parameters/viewerApi.js';
import { useNavigate } from 'react-router-dom';

export const ManageSettingsPage = () => {
  const [projectId, setProjectId] = useState<number | ''>('');
  const [pipelineId, setPipelineId] = useState<number | ''>('');
  const [settings, setSettings] = useState<any[]>([]);

  const navigate = useNavigate();

  const loadSettings = async () => {
    if (!projectId || !pipelineId) return;
    const pipelines = await listViewerSettingsAPI(projectId);
    const pipeline = pipelines.find(p => p.pipeline_id == pipelineId);
    setSettings(pipeline ? pipeline.settings : []);
  };

  useEffect(() => {
    loadSettings();
  }, [projectId, pipelineId]);

  const handleDeleteSetting = async (settingId: number) => {
    if (!projectId) return;
    if (confirm(`Setting ${settingId} wirklich löschen?`)) {
      await deleteSingleSetting(projectId, settingId);
      loadSettings();
    }
  };

  const handleDeletePipeline = async () => {
    if (!projectId || !pipelineId) return;
    if (confirm(`Pipeline ${pipelineId} wirklich löschen?`)) {
      await deletePipelineAPI(projectId, pipelineId);
      setSettings([]);
      setPipelineId('');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📋 Manage Settings</h1>

      <div className="mb-4 flex gap-4">
        <input
          type="number"
          value={projectId}
          onChange={(e) => setProjectId(parseInt(e.target.value))}
          placeholder="Project ID"
          className="border rounded px-3 py-1"
        />
        <input
          type="number"
          value={pipelineId}
          onChange={(e) => setPipelineId(parseInt(e.target.value))}
          placeholder="Pipeline ID"
          className="border rounded px-3 py-1"
        />
        <button
          onClick={loadSettings}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          🔄 Laden
        </button>
      </div>

      {settings.length > 0 ? (
        <>
          <table className="w-full border text-sm mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">OP-Zahl</th>
                <th className="border p-2">Typ</th>
                <th className="border p-2">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((s) => (
                <tr key={s.id}>
                  <td className="border p-2">{s.id}</td>
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-20 border px-1 py-0.5"
                      placeholder="OP"
                      // später speichern
                    />
                  </td>
                  <td className="border p-2">
                    <select className="border px-1 py-0.5">
                      <option value="input">Input</option>
                      <option value="output">Output</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <button
                      className="bg-red-500 text-white px-2 py-0.5 rounded"
                      onClick={() => handleDeleteSetting(s.id)}
                    >
                      🗑️ Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            className="bg-red-700 text-white px-4 py-2 rounded"
            onClick={handleDeletePipeline}
          >
            ❌ Ganze Pipeline löschen
          </button>
        </>
      ) : (
        <p className="text-gray-500">Keine Settings geladen.</p>
      )}

      <div className="mt-6">
        <button
          className="text-blue-700 underline"
          onClick={() => navigate('/viewer')}
        >
          ⬅️ Zurück zum Viewer
        </button>
      </div>
    </div>
  );
};

export default ManageSettingsPage;
