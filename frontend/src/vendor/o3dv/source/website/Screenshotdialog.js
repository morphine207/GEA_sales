import { AddDiv, AddDomElement } from '../engine/viewer/domutils.js';
import { ButtonDialog } from './dialog.js';
import { listViewerSettingsAPI, getProjectsAPI,CreateScreenshots } from '../engine/parameters/viewerApi.js';

export async function Screenshotdialog(viewer) {
    const style = document.createElement('style');
    style.innerHTML = `
        .ov_dropdown, .ov_input {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);

    const dialog = new ButtonDialog();
    const contentDiv = dialog.Init("Screenshots für gespeicherte Einstellungen", [
        { name: "Abbrechen", subClass: "outline", onClick: () => dialog.Close() },
        {
            name: "create",
            onClick: async () => {
                const projectId = projectDropdown.value;
                const pipelineId = pipelineDropdown.value;
        
                if (!projectId || !pipelineId) {
                    alert("❌ Bitte ein Projekt und eine Pipeline auswählen.");
                    return;
                }
        
                const pipelines = await listViewerSettingsAPI(projectId);
                const pipeline = pipelines.find(p => String(p.pipeline_id) === String(pipelineId));
                if (!pipeline || !pipeline.settings || pipeline.settings.length === 0) {
                    alert("⚠️ Keine Settings in dieser Pipeline.");
                    return;
                }
        
                await CreateScreenshots(viewer, projectId, pipelineId, pipeline.settings);
                dialog.Close();
            }
        }
    ]);

    const projectDiv = AddDiv(contentDiv, 'ov_text_preview_container');
    AddDiv(projectDiv, 'ov_dialog_label', "Projekt auswählen");
    const projectDropdown = AddDomElement(projectDiv, 'select', 'ov_dropdown');

    const pipelineDiv = AddDiv(contentDiv, 'ov_text_preview_container');
    AddDiv(pipelineDiv, 'ov_dialog_label', "Pipeline auswählen");
    const pipelineDropdown = AddDomElement(pipelineDiv, 'select', 'ov_dropdown');

    // Projekte laden
    const projects = await getProjectsAPI();
    if (!projects.length) {
        alert("⚠️ Keine Projekte gefunden.");
        return;
    }

    projectDropdown.innerHTML = '<option value="">-- Projekt auswählen --</option>';
    projects.forEach(project => {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.name || `Projekt ${project.id}`;
        projectDropdown.appendChild(option);
    });

    // Lade Pipelines, wenn Projekt gewählt wird
    projectDropdown.onchange = async () => {
        const selectedProjectId = projectDropdown.value;
        pipelineDropdown.innerHTML = '<option value="">-- Pipeline auswählen --</option>';

        if (!selectedProjectId) return;

        const settingsList = await listViewerSettingsAPI(selectedProjectId);
        settingsList.forEach(p => {
            const option = document.createElement("option");
            option.value = p.pipeline_id;
            option.textContent = p.pipeline_name || `Projekt ${p.pipeline_id}`;
            pipelineDropdown.appendChild(option);
        });
    };

    dialog.Open();
}
