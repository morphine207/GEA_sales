import { ButtonDialog } from './dialog.js';
import { AddDiv, AddDomElement, ClearDomElement } from '../engine/viewer/domutils.js';
import {
    createPipelineAPI,
    deletePipelineAPI,
    listViewerSettingsAPI,
    reorderSettingsAPI,
    deleteSingleSetting,
    getProjectsAPI
} from '../engine/parameters/viewerApi.js';

export function ShowPipelineDialog() {
    const dialog = new ButtonDialog();
    const content = dialog.Init("🛠️ Pipeline-Verwaltung", [
        { name: "Schließen", subClass: "outline", onClick: () => dialog.Close() }
    ]);

    const style = document.createElement('style');
    style.innerHTML = `
        .ov_dropdown, .ov_input {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
        }

        .settingItem {
            padding: 8px;
            margin-bottom: 6px;
            border: 1px solid #ccc;
            border-radius: 5px;
            cursor: default;
            background-color: #f9f9f9;
            color: #000;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .settingItem button {
            font-size: 14px;
            padding: 4px 6px;
        }
    `;
    document.head.appendChild(style);

    let projectId = null;
    let pipelineId = null;

    const projectDiv = AddDiv(content, 'ov_text_preview_container');
    AddDiv(projectDiv, 'ov_dialog_label', "Projekt auswählen");
    const projectDropdown = AddDomElement(projectDiv, 'select', 'ov_dropdown');

    const pipelineDiv = AddDiv(content, 'ov_text_preview_container');
    AddDiv(pipelineDiv, 'ov_dialog_label', "Pipeline auswählen");
    const pipelineDropdown = AddDomElement(pipelineDiv, 'select', 'ov_dropdown');

    const settingContainer = AddDiv(content, 'ov_text_preview_container');

    const createBtn = AddDomElement(content, 'button', 'ov_dialog_button');
    createBtn.innerText = "➕ Neue Pipeline erstellen";
    createBtn.onclick = async () => {
        if (!projectDropdown.value) {
            alert("Bitte ein Projekt auswählen.");
            return;
        }
        const name = prompt("Bitte Namen für die Pipeline eingeben:");
        if (!name || name.trim() === "") {
            alert("❗ Kein gültiger Name eingegeben.");
            return;
        }
    
        const id = await createPipelineAPI(projectDropdown.value, name);
        alert(`✅ Neue Pipeline "${name}" mit ID ${id} erstellt.`);
        await loadPipelines(projectDropdown.value);
    };

    (async function loadProjects() {
        const projects = await getProjectsAPI();
        projectDropdown.innerHTML = `<option value="">-- Projekt wählen --</option>`;
        projects.forEach(p => {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = p.name;
            projectDropdown.appendChild(option);
        });
    })();

    projectDropdown.onchange = async () => {
        projectId = parseInt(projectDropdown.value);
        await loadPipelines(projectId);
    };

    async function loadPipelines(pid) {
        pipelineDropdown.innerHTML = `<option value="">-- Pipeline wählen --</option>`;
        settingContainer.innerHTML = "";
        const pipelines = await listViewerSettingsAPI(pid);
        pipelines.forEach(p => {
            const option = document.createElement("option");
            option.value = p.pipeline_id;
            option.textContent = p.pipeline_name || `Projekt ${p.pipeline_id}`;
            pipelineDropdown.appendChild(option);
        });
    }

    pipelineDropdown.onchange = async () => {
        pipelineId = parseInt(pipelineDropdown.value);
        settingContainer.innerHTML = "";

        const pipelines = await listViewerSettingsAPI(projectId);
        const settings = pipelines.find(p => p.pipeline_id == pipelineId)?.settings || [];

        const list = AddDiv(settingContainer, 'settingsList');
        list.style.border = '1px solid #aaa';
        list.style.padding = '10px';

        function renderSettings(settingsArray) {
            list.innerHTML = '';
            settingsArray.forEach((setting, index) => {
                const div = document.createElement("div");
                div.className = 'settingItem';
                div.dataset.settingId = setting.id;

                const text = document.createElement("span");
                text.textContent = setting.name || `Projekt ${setting.id}`;
                text.style.flexGrow = "1";

                const upBtn = document.createElement("button");
                upBtn.textContent = "🔼";
                upBtn.disabled = index === 0;
                upBtn.onclick = () => {
                    [settingsArray[index - 1], settingsArray[index]] = [settingsArray[index], settingsArray[index - 1]];
                    renderSettings(settingsArray);
                };

                const downBtn = document.createElement("button");
                downBtn.textContent = "🔽";
                downBtn.disabled = index === settingsArray.length - 1;
                downBtn.onclick = () => {
                    [settingsArray[index], settingsArray[index + 1]] = [settingsArray[index + 1], settingsArray[index]];
                    renderSettings(settingsArray);
                };

                const delBtn = document.createElement("button");
                delBtn.textContent = "🗑️";
                delBtn.onclick = async () => {
                    if (confirm(`Setting ${setting.id} löschen?`)) {
                        await deleteSingleSetting(projectId, setting.id);
                        pipelineDropdown.dispatchEvent(new Event('change'));
                    }
                };

                div.appendChild(text);
                div.appendChild(upBtn);
                div.appendChild(downBtn);
                div.appendChild(delBtn);
                list.appendChild(div);
            });

            // Reihenfolge speichern Button
            const saveBtn = document.createElement("button");
            saveBtn.innerText = "💾 Reihenfolge speichern";
            saveBtn.style.marginTop = "10px";
            saveBtn.onclick = async () => {
                const ids = settingsArray.map(s => s.id);
                await reorderSettingsAPI(projectId,pipelineId, ids);
                alert("✅ Reihenfolge gespeichert!");
            };
            list.appendChild(saveBtn);

            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = `🗑️ Pipeline ${pipelineId} löschen`;
            deleteBtn.style.marginTop = "10px";
            deleteBtn.onclick = async () => {
                if (confirm("Pipeline wirklich löschen?")) {
                    await deletePipelineAPI(projectId, pipelineId);
                    await loadPipelines(projectId);
                }
            };
            list.appendChild(deleteBtn);
        }

        renderSettings(settings);
    };

    dialog.Open();
}
