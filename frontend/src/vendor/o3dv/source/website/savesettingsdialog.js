import { ButtonDialog } from './dialog.js';
import { AddDiv, AddDomElement } from '../engine/viewer/domutils.js';
import { Loc } from '../engine/core/localization.js';
import { getProjectsAPI, listViewerSettingsAPI, saveViewerSettingsAPI } from '../engine/parameters/viewerApi.js';

export function ShowSaveSettingDialog(viewer) {
    const dialog = new ButtonDialog();
    const content = dialog.Init("💾 Einstellung speichern", [
        { name: "Abbrechen", subClass: "outline", onClick: () => dialog.Close() },
        {
            name: "Speichern",
            onClick: async () => {
                const projectId = parseInt(projectSelect.value);
                const pipelineId = parseInt(pipelineSelect.value);

                if (isNaN(projectId) || isNaN(pipelineId)) {
                    alert("❌ Bitte wähle ein Projekt und eine Pipeline aus.");
                    return;
                }

                try {
                    await saveViewerSettingsAPI(viewer, projectId, pipelineId);
                    alert("✅ Einstellungen gespeichert.");
                    dialog.Close();
                } catch (err) {
                    console.error("❌ Fehler beim Speichern:", err);
                    alert("❌ Fehler beim Speichern.");
                }
            }
        }
    ]);

    const style = document.createElement('style');
    style.innerHTML = `
        .ov_dropdown {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);

    // Projekt-Auswahl
    const projectSection = AddDiv(content, 'ov_text_preview_container');
    AddDiv(projectSection, 'ov_dialog_label', "Projekt auswählen:");
    const projectSelect = AddDomElement(projectSection, 'select', 'ov_dropdown');

    // Pipeline-Auswahl
    const pipelineSection = AddDiv(content, 'ov_text_preview_container');
    AddDiv(pipelineSection, 'ov_dialog_label', "Pipeline auswählen:");
    const pipelineSelect = AddDomElement(pipelineSection, 'select', 'ov_dropdown');

    // Projekte laden
    getProjectsAPI().then(projects => {
        projectSelect.innerHTML = `<option value="">-- Projekt wählen --</option>`;
        projects.forEach(project => {
            const option = document.createElement("option");
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    });

    // Pipelines bei Projektwechsel laden
    projectSelect.onchange = async () => {
        const projectId = parseInt(projectSelect.value);
        if (isNaN(projectId)) return;

        const pipelines = await listViewerSettingsAPI(projectId);
        pipelineSelect.innerHTML = `<option value="">-- Pipeline wählen --</option>`;
        pipelines.forEach(p => {
            const option = document.createElement("option");
            option.value = p.pipeline_id;
            option.textContent = p.pipeline_name || `Projekt ${p.pipeline_id}`;
            pipelineSelect.appendChild(option);
        });
    };

    dialog.Open();
}
