// src/vendor/o3dv/source/engine/parameters/viewerApi.js

import { ParameterConverter } from './parameterlist.js';
import { DownloadUrlAsFile } from '../../website/utils.js';
import { addScreenshot, addImageToScreenshot } from "./screenshotApi";
import { compressSync } from 'fflate';
import * as THREE from 'three';

const API_BASE_URL = "http://localhost:8000/api/viewer";
const API_URL = "http://localhost:8000/api";


// Hilfsfunktion: DataURL zu Blob
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}


// Toleranz für Fingerprint-Vergleich (5%)
const FP_TOLERANCE = 0.05;

/**
 * Erstellt Screenshots aus der Pipeline.
 * Sichtbarkeit: Nur Meshes mit übereinstimmendem Fingerprint und flag=true sind sichtbar.
 * Unbekannte Meshes werden per einmaligem Dialog sichtbar/unsichtbar geschaltet.
 */
export async function CreateScreenshots(viewer, projectId, pipelineId,cadFileName ,settingsList = null) {
  // 1) Settings laden, falls nicht übergeben
  if (settingsList === null) {
    const pipelines = await listViewerSettingsAPI(projectId);
    const entry = pipelines.find(x => x.pipeline_id === pipelineId);
    if (!entry) {
      console.error(`Keine Pipeline mit ID ${pipelineId} gefunden.`);
      return;
    }
    settingsList = entry.settings;
  }

  // 2) Ursprungs-Kamera & Sichtbarkeit sichern
  const startCamera     = viewer.GetCamera();
  const startVisibility = [];
  const allMeshes       = [];
  viewer.mainModel.EnumerateMeshesAndLines(mesh => {
    if (mesh) {
      allMeshes.push(mesh);
      startVisibility.push(mesh.visible);
    }
  });

  // 3) Parallele Listen von UserData und Mesh-Objekten
  const muds   = [];
  const meshes = [];
  viewer.EnumerateMeshesAndLinesUserData(mud => { if (mud) muds.push(mud); });
  viewer.mainModel.EnumerateMeshesAndLines(mesh => { if (mesh) meshes.push(mesh); });

  // 4) Für jedes gespeicherte Setting...
  for (const setting of settingsList) {
    if (!setting.id) continue;
    const data = await listViewerSettingsAPI(projectId)
    // 4a) Kamera wiederherstellen
    if (data.camera) {
      try {
        viewer.SetCamera(ParameterConverter.StringToCamera(data.camera));
      } catch (err) {
        console.warn("❌ Kamera parse error:", err);
      }
    }

    // 4b) Gespeicherte Fingerprints parsen
    const saved = (data.visibility || []).map(entry => {
      const [coordStr, flag] = entry.split('|');
      const coords = coordStr.split(',').map(v => parseFloat(v));
      return { coords, vis: flag === "true" };
    });

    // 4c) Aktuelle MeshData mit Fingerprint berechnen
    const meshData = muds.map((mud, i) => {
      const sph = viewer.GetBoundingSphere(m =>
        m.originalMeshInstance.id.GetKey() === mud.originalMeshInstance.id.GetKey()
      );
      const c = sph.center;
      return {
        mesh: meshes[i],
        coords: [c.x, c.y, c.z]
      };
    });

    // 4d) Unbekannte zählen und einmalig fragen
    let defaultUnknownVis = false;
    const unknownCount = meshData.filter(md =>
      !saved.some(s => matchCoords(s.coords, md.coords))
    ).length;
    if (unknownCount > 0) {
      defaultUnknownVis = confirm(
        `Es wurden ${unknownCount} unbekannte Mesh(es) gefunden.\n` +
        `OK = sichtbar, Abbrechen = unsichtbar`
      );
    }

    // 4e) Sichtbarkeit anwenden mit Toleranz
    meshData.forEach(({ mesh, coords }) => {
      const match = saved.find(s => matchCoords(s.coords, coords));
      mesh.visible = match ? match.vis : defaultUnknownVis;
    });

    // 4f) Render & Screenshot
    viewer.Render();
    const url = viewer.GetImageAsDataUrl(1920, 1080, true);
    DownloadUrlAsFile(url, `screenshot:P${pipelineId}_S${setting.name}.png`);
    const blob = dataURLtoBlob(url);
    // 2. Screenshot-Eintrag anlegen (ohne Bild)
    const screenshotMeta = {
      name: setting.name ||`screenshot_P${pipelineId}_S${setting.name}.png` `Screenshot_${setting.id}`,
      CAD_file_name:cadFileName,
      file_type: "image/png",
      setting_id: setting.id
    };
    const { screenshot_id } = await addScreenshot(screenshotMeta);
    await addImageToScreenshot(screenshot_id, blob);

  }

  // 5) Ursprungs-Zustand wiederherstellen
  viewer.SetCamera(startCamera);
  allMeshes.forEach((mesh, i) => {
    mesh.visible = startVisibility[i];
  });
  viewer.Render();
}

/**
 * Vergleicht zwei 3D-Koordinaten-Arrays mit relativer Toleranz FP_TOLERANCE.
 */
function matchCoords(saved, current) {
  for (let i = 0; i < 3; i++) {
    const sv = saved[i], cv = current[i];
    if (Math.abs(sv) > 0) {
      if (Math.abs(cv - sv) / Math.abs(sv) > FP_TOLERANCE) return false;
    } else {
      if (Math.abs(cv) > FP_TOLERANCE) return false;
    }
  }
  return true;
}

/**
 * Speichert ein neues Setting in einer Pipeline.
 * Jeder Eintrag im visibility-Array ist "x,y,z|true" oder "x,y,z|false".
 */
export async function saveViewerSettingsAPI(
  viewer,
  projectId = null,
  pipelineId = null,
  name = "NoName",
  opNumber = 0,
  type = "input"
) {
  if (!viewer || typeof viewer.GetCamera !== "function") {
    console.error("❌ Viewer ist ungültig.");
    return;
  }

  // IDs prüfen
  if (!projectId || isNaN(projectId)) {
    alert("❗ Keine gültige Projekt-ID.");
    return;
  }
  if (!pipelineId || isNaN(pipelineId)) {
    alert("❗ Keine gültige Pipeline-ID.");
    return;
  }
  if (!name?.trim()) {
    alert("❗ Kein gültiger Name eingegeben.");
    return;
  }

  // Kamera serialisieren
  const cameraString = ParameterConverter.CameraToString(viewer.GetCamera());

  // MUDs und Meshes parallel sammeln
  const muds = [];
  const meshes = [];
  viewer.EnumerateMeshesAndLinesUserData(mud => { if (mud) muds.push(mud); });
  viewer.mainModel.EnumerateMeshesAndLines(mesh => { if (mesh) meshes.push(mesh); });

  // BoundingSphere-Mittelpunkte + Sichtbarkeit zusammenführen
  const visibilityStates = muds.map((mud, i) => {
    const sph = viewer.GetBoundingSphere(m =>
      m.originalMeshInstance.id.GetKey() === mud.originalMeshInstance.id.GetKey()
    );
    const { x, y, z } = sph.center;
    const coords = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    const vis = (meshes[i] && meshes[i].visible) ? "true" : "false";
    return `${coords}|${vis}`;
  });

  // Payload & POST
  const payload = {
    settings: [
      {
        camera:     cameraString,
        visibility: visibilityStates,
        OpNummer:   opNumber,
        PPtyp:      type
      }
    ]
  };
  const resp = await fetch(
    `${API_BASE_URL}/${projectId}/add_settings/${pipelineId}/${encodeURIComponent(name)}/`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    }
  );
  if (!resp.ok) throw new Error("❌ Fehler beim Speichern.");
}

/**
 * Erstellt eine neue Pipeline.
 */
export async function createPipelineAPI(projectId, name = "noName") {
  const resp = await fetch(
    `${API_BASE_URL}/${projectId}/create_pipeline/${encodeURIComponent(name)}`,
    { method: "POST" }
  );
  if (!resp.ok) throw new Error("❌ Fehler beim Erstellen der Pipeline.");
  const { pipeline_id } = await resp.json();
  return pipeline_id;
}

/**
 * Löscht eine Pipeline.
 */
export async function deletePipelineAPI(projectId, pipelineId) {
  const resp = await fetch(
    `${API_BASE_URL}/${projectId}/delete_pipeline/${pipelineId}`,
    { method: "DELETE" }
  );
  if (!resp.ok) throw new Error("❌ Fehler beim Löschen der Pipeline.");
}

/**
 * Löscht ein einzelnes Setting.
 */
export async function deleteSingleSetting(projectId, settingId) {
  const resp = await fetch(
    `${API_BASE_URL}/${projectId}/delete_setting/${settingId}`,
    { method: "DELETE" }
  );
  if (!resp.ok) throw new Error("❌ Fehler beim Löschen des Settings.");
}

/**
 * Reordert Settings.
 */
export async function reorderSettingsAPI(projectId, pipelineId, newOrderArray) {
  const resp = await fetch(
    `${API_BASE_URL}/${projectId}/reorder_settings/${pipelineId}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(newOrderArray)
    }
  );
  if (!resp.ok) throw new Error("❌ Fehler beim Aktualisieren der Reihenfolge.");
}

/**
 * Alle Pipelines eines Projekts inkl. Settings (mit OpNummer und PPtyp)
 */
export async function listViewerSettingsAPI(projectId) {
  const res = await fetch(`${API_BASE_URL}/${projectId}/pipelines`);
  console.log("listViewerSettingsAPI", res);
  if (!res.ok) throw new Error("Fehler beim Laden der Pipelines");
  const data = await res.json();
  return data.map(pipeline => ({
    pipeline_id: pipeline.pipeline_id,
    pipeline_name: pipeline.pipeline_name,
    settings: (pipeline.settings || []).map(s => ({
      id: s.id,
      name: s.name,
      camera: s.camera,
      visibility: s.visibility,
      order: s.order,
      opNumber: s.OpNummer, // Mapping Backend → Frontend
      type: s.PPtyp         // Mapping Backend → Frontend
    }))
  }));
}

/**
 * Einzelne Pipeline inkl. Settings (mit OpNummer und PPtyp)
 */
export async function getSinglePipelineAPI(projectId, pipelineId) {
  const res = await fetch(`${API_BASE_URL}/${projectId}/pipeline/${pipelineId}`);
  if (!res.ok) throw new Error("Fehler beim Laden der Pipeline");
  const pipeline = await res.json();
  return {
    pipeline_id: pipeline.pipeline_id,
    pipeline_name: pipeline.pipeline_name,
    settings: (pipeline.settings || []).map(s => ({
      id: s.id,
      name: s.name,
      camera: s.camera,
      visibility: s.visibility,
      order: s.order,
      opNumber: s.OpNummer,
      type: s.PPtyp
    }))
  };
}

/**
 * Einzelnes Setting einer Pipeline (mit OpNummer und PPtyp)
 */
export async function getSingleSettingAPI(projectId, pipelineId, settingId) {
  const res = await fetch(`${API_BASE_URL}/${projectId}/${pipelineId}/setting/${settingId}`);
  if (!res.ok) throw new Error("Fehler beim Laden des Settings");
  const s = await res.json();
  return {
    id: s.id,
    name: s.name,
    camera: s.camera,
    visibility: s.visibility,
    order: s.order,
    opNumber: s.OpNummer,
    type: s.PPtyp
  };
}

/**
 * Listet alle Projekte.
 */
export async function getProjectsAPI() {
  try {
    const resp = await fetch(`${API_URL}/project/all`);
    if (!resp.ok) throw new Error("Fehler beim Laden der Projekte");
    return await resp.json();
  } catch {
    return [];
  }
}

/**
 * Aktualisiert ein bestehendes Setting.
 */
export async function updateSettingAPI(projectId, settingId, opNumber, type) {
  const resp = await fetch(
    `${API_BASE_URL}/${projectId}/update_setting/${settingId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        OpNummer: opNumber,
        PPtyp: type
      })
    }
  );
  if (!resp.ok) throw new Error("Fehler beim Aktualisieren des Settings");
  return await resp.json();
}
