import { ParameterConverter, CreateUrlBuilder, CreateUrlParser } from './parameterlist.js';
import { DownloadUrlAsFile } from 'D:/VSCodeGitLabFraunhofer/Online3DViewer/online3dviewer-1/source/website/utils.js';

const API_BASE_URL = "http://localhost:8000/api/viewer";

/**
 * Speichert die Viewer-Einstellungen über die FastAPI-API
 */
export async function saveViewerSettingsAPI(viewer, projectId = null) {
    if (!viewer || typeof viewer.GetCamera !== 'function') {
        console.error("❌ Fehler: Viewer-Instanz ist nicht vorhanden oder GetCamera ist undefiniert.");
        return;
    }

    // Falls `projectId` nicht übergeben wurde, den Nutzer fragen
    while (!projectId || isNaN(projectId)) {
        let userInput = prompt("Bitte die Projekt-ID eingeben:");
        if (!userInput) {
            console.warn("❌ Speichern abgebrochen: Keine Projekt-ID eingegeben.");
            return;
        }
        projectId = parseInt(userInput, 10);
        if (isNaN(projectId)) {
            alert("⚠️ Ungültige Projekt-ID! Bitte eine Nummer eingeben.");
            projectId = null;
        }
    }

    let camera = viewer.GetCamera();
    let cameraString = [ParameterConverter.CameraToString(camera)]; // ✅ Kamera wird als String gespeichert
    let visibilityStates = [];

    viewer.mainModel.EnumerateMeshesAndLines((mesh) => {
        if (mesh) {
            visibilityStates.push(mesh.visible.toString()); // ✅ `true/false` in `"true"/"false"` umwandeln
        }
    });

    let settings = {
        positions: cameraString, // ✅ Kamera als String speichern
        visibility: visibilityStates
    };

    try {
        console.log(settings)
        let response = await fetch(`${API_BASE_URL}/save/${projectId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings)
        });

        let result = await response.json();
        console.log("✅ Einstellungen gespeichert:", result);
    } catch (error) {
        console.error("❌ Fehler beim Speichern der Einstellungen:", error);
    }
}

/**
 * Lädt eine gespeicherte Viewer-Einstellung von FastAPI
 */
export async function loadViewerSettingsAPI(viewer, projectId, pipelineId) {
    try {
        let response = await fetch(`${API_BASE_URL}/pipeline/${projectId}/${pipelineId}`);
        if (!response.ok) throw new Error(`Fehler: ${response.statusText}`);

        let setting = await response.json();
        console.log("✅ Geladene Pipeline:", setting);

        if (!setting.positions) {
            console.error("⚠️ Keine Kameradaten gefunden!");
            return;
        }
;
        // ✅ Kamera-Position wiederherstellen (aus String umwandeln)
        if (setting.positions && setting.positions.length > 0) {
            let cameraString = setting.positions[0]; // ["..."]
            let camera = ParameterConverter.StringToCamera(cameraString);
            viewer.SetCamera(camera);
        }

        let currentMeshes = [];
        viewer.mainModel.EnumerateMeshesAndLines((mesh) => {
            if (mesh) currentMeshes.push(mesh);
        });

        if (setting.visibility.length === currentMeshes.length) {
            currentMeshes.forEach((mesh, index) => {
                mesh.visible = setting.visibility[index] === "true";
            });
            viewer.Render();
        } else {
            console.warn("⚠️ Anzahl der geladenen Objekte stimmt nicht mit der aktuellen Szene überein.");
        }
    } catch (error) {
        console.error("❌ Fehler beim Laden:", error);
    }
}
/**
 * Holt eine Liste aller gespeicherten Viewer-Pipeline-Daten für ein Projekt
 */
export async function listViewerSettingsAPI(projectId) {
    try {
        let response = await fetch(`${API_BASE_URL}/pipelines/${projectId}`);
        if (!response.ok) throw new Error("Fehler beim Abrufen der Liste.");

        let settingsList = await response.json();
        console.log("📋 Verfügbare Einstellungen:", settingsList);
        return settingsList;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Liste:", error);
        return [];
    }
}

/**
 * Löscht eine gespeicherte Viewer-Pipeline
 */
export async function deleteViewerSettingsAPI(pipelineId) {
    try {
        let response = await fetch(`${API_BASE_URL}/delete/${pipelineId}`, {
            method: "DELETE"
        });

        let result = await response.json();
        console.log("🗑️ Einstellungen gelöscht:", result);
    } catch (error) {
        console.error("❌ Fehler beim Löschen der Einstellungen:", error);
    }
}
