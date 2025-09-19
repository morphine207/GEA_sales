// src/pages/ViewerModule/ViewerPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Viewer } from '../../vendor/o3dv/source/engine/viewer/viewer.js'
import { IntersectionMode } from '../../vendor/o3dv/source/engine/viewer/viewermodel.js'
import { RGBColor } from '../../vendor/o3dv/source/engine/model/color.js'
import { InputFilesFromFileObjects } from '../../vendor/o3dv/source/engine/import/importerfiles.js'
import { ImportErrorCode, ImportSettings } from '../../vendor/o3dv/source/engine/import/importer.js'
import { ThreeModelLoaderUI } from '../../vendor/o3dv/source/website/threemodelloaderui.js'
import {
  getProjectsAPI,
  listViewerSettingsAPI,
  saveViewerSettingsAPI,
  CreateScreenshots
} from '../../vendor/o3dv/source/engine/parameters/viewerApi.js'
import PipelineSettingsModal from './PipelineSettingsModal'
import SaveSettingModal from "./SaveSettingModal";
import meshNameMapping from './meshNameMapping.json'

// --- LoaderOverlay als eigene Komponente ---
const LoaderOverlay: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "rgba(255,255,255,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20,
      pointerEvents: "all"
    }}
  >
    <span style={{ fontSize: 22, color: "#1e293b", fontWeight: 600 }}>
      Lade Modell…
    </span>
  </div>
);

// --- Typen ---
interface MeshEntry {
  id: any
  key: string
  name: string
  visible: boolean
}

export const ViewerPage: React.FC = () => {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const loaderRef = useRef<ThreeModelLoaderUI | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // UI-State
  const [loading, setLoading] = useState(false)
  const [meshes, setMeshes] = useState<MeshEntry[]>([])
  const [selectedMeshId, setSelectedMeshId] = useState<any>(null)
  const highlightColor = useRef(new RGBColor(142, 201, 240)).current

  const [projects, setProjects] = useState<{ id: number; name: string }[]>([])
  const [pipelines, setPipelines] = useState<{ id: number; name: string }[]>([])
  const [projectId, setProjectId] = useState<number | ''>('')
  const [pipelineId, setPipelineId] = useState<number | ''>('')

  const [isPipelineOpen, setPipelineOpen] = useState(false)
  const [pipelineSettings, setPipelineSettings] = useState<any[]>([])
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [cadFileName, setCadFileName] = useState<string>("");

  // Projekte laden
  useEffect(() => {
    getProjectsAPI().then(data =>
      setProjects(data.map((p: any) => ({ id: p.id, name: p.name })))
    )
  }, [])

  // Pipelines laden
  useEffect(() => {
    if (projectId === '') {
      setPipelines([])
      setPipelineId('')
    } else {
      listViewerSettingsAPI(projectId).then(data =>
        setPipelines(data.map((pl: any) => ({
          id: pl.pipeline_id,
          name: pl.pipeline_name
        })))
      )
      setPipelineId('')
    }
  }, [projectId])

  // Viewer & Loader initialisieren
  useEffect(() => {
    if (!canvasRef.current) return
    const v = new Viewer()
    v.Init(canvasRef.current)
    viewerRef.current = v

    const loader = new ThreeModelLoaderUI()
    loaderRef.current = loader

    v.SetMouseClickHandler((btn, coords) => {
      if (btn !== 1) return
      const mud = v.GetMeshUserDataUnderMouse(IntersectionMode.MeshAndLine, coords)
      setSelectedMeshId(mud ? mud.originalMeshInstance.id : null)
    })
  }, [])

  // Highlight & Fit auf Auswahl
  useEffect(() => {
    const v = viewerRef.current
    if (!v) return
    v.SetMeshesHighlight(
      highlightColor,
      mud => selectedMeshId !== null && mud.originalMeshInstance.id.IsEqual(selectedMeshId)
    )
    if (selectedMeshId) {
      const sph = v.GetBoundingSphere(mud =>
        mud.originalMeshInstance.id.IsEqual(selectedMeshId)
      )
      v.FitSphereToWindow(sph, true)
    }
    v.Render()
    if (containerRef.current) {
      v.Resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      )
    }
  }, [selectedMeshId, highlightColor])

  // Sichtbarkeit aktualisieren
  useEffect(() => {
    const v = viewerRef.current
    if (!v) return
    v.SetMeshesVisibility(mud => {
      const entry = meshes.find(m => m.key === mud.originalMeshInstance.id.GetKey())
      return entry ? entry.visible : true
    })
    v.Render()
  }, [meshes])

  // Hilfsfunktion: Filtert unsinnige Namen
  function isValidName(name: string, fileName: string) {
    if (!name) return false;
    const lower = name.toLowerCase();
    if (lower === fileName.toLowerCase()) return false;
    if (lower === "unnamed" || lower === "name" || lower === "unknown") return false;
    if (/\.stp$|\.step$/.test(lower)) return false;
    if (/^\s*$/.test(name)) return false;
    return true;
  }

  // Datei-Upload & Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !viewerRef.current || !loaderRef.current) return

    const files = Array.from(e.target.files)
    const inputFiles = InputFilesFromFileObjects(files)
    const settings = new ImportSettings()
    setLoading(true)

    // 1. Extrahiere alle Namen aus sinnvollen Entities (PRODUCT, ADVANCED_FACE, ...)
    const allEntityNamesData = [] //await extractAllEntityNames(files);

    // 2. Flache Liste aller eindeutigen, sinnvollen Namen (Reihenfolge nach Entity-ID, numerisch sortiert)
    const nameSet = new Set<string>();
    const flatNames: string[] = [];
    Object.entries(allEntityNamesData).forEach(([fileName, entityMap]) => {
      Object.entries(entityMap)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .forEach(([_, obj]) => {
          if (isValidName(obj.name, fileName) && !nameSet.has(obj.name)) {
            nameSet.add(obj.name);
            flatNames.push(obj.name);
          }
        });
    });

    loaderRef.current.LoadModel(inputFiles, settings, {
      onStart: () => {},
      onFinish: (_res, threeObject) => {
        setLoading(false)
        const v = viewerRef.current!
        v.SetMainObject(threeObject)

        const fullSphere = v.GetBoundingSphere(() => true)
        v.AdjustClippingPlanesToSphere(fullSphere)
        v.FitSphereToWindow(fullSphere, false)

        const list: MeshEntry[] = []
        let nameIdx = 0;
        v.EnumerateMeshesAndLinesUserData(mud => {
          const key = mud.originalMeshInstance.id.GetKey();
          const idMatch = key.match(/\d+/);
          let meshName = key.slice(0, 8);

          if (idMatch && meshNameMapping[idMatch[0]]) {
            meshName = meshNameMapping[idMatch[0]];
          }

          // Name im Mesh-Objekt dauerhaft überschreiben:
          if (mud.node?.SetName && typeof mud.node.SetName === "function") {
            mud.node.SetName(meshName);
          }
          if (mud.originalMeshInstance?.name !== undefined) {
            mud.originalMeshInstance.name = meshName;
          }

          if (!list.find(m => m.key === key)) {
            list.push({ id: mud.originalMeshInstance.id, key, name: meshName, visible: true });
          }
        })

        setMeshes(list)
        setSelectedMeshId(null)

        setPipelineSettings(
          list.map((mesh, idx) => ({
            id: idx + 1,
            name: mesh.name,
            opNumber: "",
            type: "input",
          }))
        )
      },
      onRender: () => viewerRef.current!.Render(),
      onError: err => {
        setLoading(false)
        alert(
          err.code === ImportErrorCode.NoImportableFile
            ? 'Kein importierbares Modell gefunden.'
            : `Fehler beim Laden: ${err.message}`
        )
      }
    })

    if (files.length > 0) {
      setCadFileName(files[0].name); // oder ggf. mehrere Namen merken
    }
  }

  // Sichtbarkeit umschalten
  const toggleVisibility = (entry: MeshEntry) =>
    setMeshes(ms =>
      ms.map(m =>
        m.key === entry.key ? { ...m, visible: !m.visible } : m
      )
    )

  // Einstellungen speichern
  const handleSave = () => {
    setSaveModalOpen(true)
  }

  const handleSettingChange = (
    settingId: number,
    field: "opNumber" | "type",
    value: string
  ) => {
    setPipelineSettings(prev =>
      prev.map(s =>
        s.id === settingId ? { ...s, [field]: value } : s
      )
    )
  }

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Cleanup falls Komponente unmountet wird während loading=true
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col">
      <div className="flex-1 flex justify-center items-center min-h-0">
        <div className="w-full max-w-6xl px-2 sm:px-6 py-8 bg-white/95 rounded-2xl shadow-lg flex flex-col h-full min-h-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 justify-between mb-2">
            <div className="flex gap-2">
              {/* Project */}
              <select
                className="border border-gray-300 rounded-lg px-3 py-1 bg-white shadow-sm focus:ring-2 focus:ring-black min-w-[140px] text-sm"
                value={projectId}
                onChange={e => setProjectId(e.target.value ? +e.target.value : '')}
              >
                <option value="">Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {/* Pipeline */}
              <select
                className="border border-gray-300 rounded-lg px-3 py-1 bg-white shadow-sm focus:ring-2 focus:ring-black min-w-[140px] text-sm"
                value={pipelineId}
                onChange={e => setPipelineId(e.target.value ? +e.target.value : '')}
                disabled={!projectId}
              >
                <option value="">Pipeline</option>
                {pipelines.map(pl => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
              {/* Open File */}
              <label className="relative">
                <span className="inline-flex items-center px-3 py-1 bg-gray-900 text-white rounded-lg shadow hover:bg-gray-700 transition cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Open
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
            </div>
            <div className="flex gap-2">
              {/* Pipeline Settings */}
              <button
                onClick={() => setPipelineOpen(true)}
                className="inline-flex items-center px-3 py-1 text-white rounded-lg shadow hover:bg-gray-800 transition"
                style={{ backgroundColor: '#0026B7' }}
                title="Pipeline Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 2.25c.966 0 1.75.784 1.75 1.75v.5a7.5 7.5 0 014.95 4.95h.5a1.75 1.75 0 110 3.5h-.5a7.5 7.5 0 01-4.95 4.95v.5a1.75 1.75 0 11-3.5 0v-.5a7.5 7.5 0 01-4.95-4.95h-.5a1.75 1.75 0 110-3.5h.5a7.5 7.5 0 014.95-4.95v-.5c0-.966.784-1.75 1.75-1.75z" />
                </svg>
                Settings
              </button>
              {/* Save */}
              <button
                onClick={handleSave}
                className="inline-flex items-center px-3 py-1 bg-gray-900 text-white rounded-lg shadow hover:bg-gray-700 transition"
                title="Save"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2m10-6V5a2 2 0 00-2-2H8a2 2 0 00-2 2v5m12 0a2 2 0 01-2 2H6a2 2 0 01-2-2m12 0V5a2 2 0 00-2-2H8a2 2 0 00-2 2v5" />
                </svg>
                Save
              </button>
              {/* Snap */}
              <button
                onClick={() => CreateScreenshots(viewerRef.current, projectId, pipelineId, cadFileName)}
                className="inline-flex items-center px-3 py-1 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-600 transition"
                title="Screenshot"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="13" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h2l2-3h6l2 3h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
                </svg>
                Snap
              </button>
              {/* Back */}
              <button
                onClick={() => navigate('/pipeline-management')}
                className="inline-flex items-center px-3 py-1 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-600 transition"
                title="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          </div>

          <div className="flex-1 flex gap-8 flex-col lg:flex-row min-h-0">
            {/* Viewer */}
            <div
              ref={containerRef}
              className="flex-1 relative rounded-xl shadow-lg overflow-hidden min-h-0 min-w-0 flex"
              style={{ backgroundColor: '#0026B7', height: "100%" }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ background: 'transparent', height: "100%" }}
              />
              {loading && <LoaderOverlay />}
            </div>

            {/* Mesh-Liste */}
            <div className="w-full lg:w-72 bg-white rounded-xl shadow p-4 overflow-y-auto min-h-0 min-w-0 border border-gray-100">
              <h4 className="text-base font-semibold mb-3 text-gray-700">Meshes</h4>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={meshes.every(m => m.visible)}
                  onChange={e => {
                    const checked = e.target.checked
                    setMeshes(meshes.map(m => ({ ...m, visible: checked })))
                  }}
                />
                <span className="ml-2 text-sm font-semibold text-gray-800">All Visible</span>
              </div>
              {meshes.length ? meshes.map(m => (
                <div key={m.key} className="flex items-center mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={m.visible}
                    onChange={() => toggleVisibility(m)}
                  />
                  <span
                    onClick={() => setSelectedMeshId(m.id)}
                    className={`ml-2 flex-1 text-sm truncate ${
                      selectedMeshId?.GetKey() === m.key
                        ? 'text-blue-700 font-semibold'
                        : 'text-gray-900'
                    }`}
                  >
                    {m.name}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No meshes loaded</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PipelineSettingsModal */}
      <PipelineSettingsModal
        open={isPipelineOpen}
        onClose={() => setPipelineOpen(false)}
        projectId={projectId}
        pipelineId={pipelineId}
      />
      <SaveSettingModal
        open={isSaveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        viewer={viewerRef.current}
        projectId={projectId}
        pipelineId={pipelineId}
        onSaved={() => {/* Optional: Settings neu laden */}}
      />
    </div>
  )
}

export default ViewerPage

// Hilfsfunktion: Namen aus STEP-Hierarchie finden
function findStepNameForMesh(meshKey: string, meshNode: any, stepEntities: any) {
  // a) Name direkt aus Mesh-Node
  if (meshNode?.GetName && typeof meshNode.GetName === "function") {
    const n = meshNode.GetName();
    if (n && !/^\d+:\d+$/.test(n)) return n;
  }
  // b) Versuche, STEP-ID aus MeshKey zu extrahieren
  const meshIdMatch = meshKey.match(/\d+/);
  if (!meshIdMatch) return meshKey.slice(0, 8);
  const meshId = meshIdMatch[0];

  // c) Suche im STEP-Mapping nach Namen, ggf. über Referenzkette
  for (const file in stepEntities) {
    let entity = stepEntities[file][meshId];
    let depth = 0;
    while (entity && depth < 5) {
      if (entity.name && entity.name.length > 1 && !/^\d+:\d+$/.test(entity.name)) {
        return entity.name;
      }
      if (entity.refs && entity.refs.length) {
        entity = stepEntities[file][entity.refs[0]];
        depth++;
      } else {
        break;
      }
    }
  }
  // d) Fallback
  return meshKey.slice(0, 8);
}
