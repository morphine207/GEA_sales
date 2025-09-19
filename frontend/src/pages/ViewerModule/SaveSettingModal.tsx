import React, { useState } from "react";
import { saveViewerSettingsAPI } from "../../vendor/o3dv/source/engine/parameters/viewerApi.js";

interface SaveSettingModalProps {
  open: boolean;
  onClose: () => void;
  viewer: any; // Dein Viewer-Objekt (z.B. viewerRef.current)
  projectId: number | '';
  pipelineId: number | '';
  onSaved?: () => void; // Optional: Callback nach erfolgreichem Speichern
}

const SaveSettingModal: React.FC<SaveSettingModalProps> = ({
  open,
  onClose,
  viewer,
  projectId,
  pipelineId,
  onSaved
}) => {
  const [name, setName] = useState("");
  const [opNumber, setOpNumber] = useState(0);
  const [type, setType] = useState("input");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!viewer || !projectId || !pipelineId || !name.trim()) {
      alert("Bitte alle Felder ausfüllen und ein Modell laden.");
      return;
    }
    setSaving(true);
    try {
      await saveViewerSettingsAPI(
        viewer,
        projectId,
        pipelineId,
        name.trim(),
        opNumber,
        type
      );
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 38, 183, 0.4)' }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl font-bold"
          aria-label="Schließen"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Aktuelles Setting speichern</h2>
        <div className="space-y-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 w-full"
            placeholder="Name des Settings"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
          />
          <input
            className="border border-gray-300 rounded px-3 py-2 w-full"
            type="number"
            placeholder="OPNummer"
            value={opNumber}
            onChange={e => setOpNumber(Number(e.target.value))}
            disabled={saving}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full"
            value={type}
            onChange={e => setType(e.target.value)}
            disabled={saving}
          >
            <option value="input">Input</option>
            <option value="output">Output</option>
          </select>
        </div>
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            className="px-6 py-2 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
            style={{ backgroundColor: '#0026B7' }}
            disabled={saving}
          >
            {saving ? "Speichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSettingModal;