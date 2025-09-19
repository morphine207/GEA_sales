

import { AddDiv, AddDomElement, CreateDomElement } from '../engine/viewer/domutils.js';
import { ButtonDialog } from './dialog.js';
import { Loc } from '../engine/core/localization.js';
import { loadViewerSettingsAPI } from '../engine/parameters/savesettings.js';

export function Screenshotdialog(viewer) {
    // Funktion, um CSS zu dynamisch hinzuzufügen
    function addDynamicStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --primary-color: #007bff;
                --secondary-color: #6c757d;
                --button-hover-color: #0056b3;
                --input-border-color: #ccc;
                --dialog-background-color: #fff;
                --dialog-border-radius: 8px;
                --button-padding: 12px 24px;
                --font-family: Arial, sans-serif;
            }

            .ov_settings_dialog {
                background-color: var(--dialog-background-color);
                border-radius: var(--dialog-border-radius);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                max-width: 500px;
                margin: 20px auto;
                padding: 20px;
                font-family: var(--font-family);
                display: flex;
                flex-direction: column;
            }

            .ov_dialog_button {
                padding: var(--button-padding);
                font-size: 16px;
                border: none;
                cursor: pointer;
                border-radius: 5px;
                transition: background-color 0.3s ease;
                text-align: center;
            }

            .ov_dialog_button.outline {
                background-color: transparent;
                border: 2px solid var(--secondary-color);
                color: var(--secondary-color);
            }

            .ov_dialog_button.outline:hover {
                background-color: var(--secondary-color);
                color: white;
            }

            .ov_dialog_button:not(.outline) {
                background-color: var(--primary-color);
                color: white;
                border: 2px solid var(--primary-color);
            }

            .ov_dialog_button:not(.outline):hover {
                background-color: var(--button-hover-color);
            }

            .ov_file_input_div {
                display: flex;
                flex-direction: column;
                gap: 15px; /* Abstand zwischen den Inputfeldern und den Überschriften */
            }

            /* Stil für die Dialogüberschrift der Eingabefelder */
            .ov_dialog_label {
                font-size: 16px;
                font-weight: bold;
                color: white; /* Schriftfarbe auf Weiß setzen */
                 margin-top: 20px; /* Abstand zwischen der Überschrift und dem Eingabefeld */
                margin-bottom: -10px; /* Abstand zwischen der Überschrift und dem Eingabefeld */
                text-align: left; /* Optional: Überschrift linksbündig ausrichten */
            }

            .ov_file_input {
                border: 2px solid var(--input-border-color);
                border-radius: 5px;
                padding: 10px;
                font-size: 14px;
                transition: border-color 0.3s ease;
            }

            .ov_file_input:focus {
                border-color: var(--primary-color);
                outline: none;
            }
        `;
        document.head.appendChild(style); // Fügt das Stylesheet dem head-Tag hinzu
    }



    // Rufe die Funktion auf, um die Styles hinzuzufügen
    addDynamicStyles();

    console.log("test",viewer);

    function UpdatePreviews() {
        const files = fileInputs.map(input => input.files[0]);
        if (files.some(file => !file)) {
            alert(Loc('Bitte wählen Sie genau 3 Einstellungsdateien aus.'));
            return;
        }

        files.forEach((file) => {
            loadViewerSettingsAPI(viewer, file);
        });
    }

    let dialog = new ButtonDialog();
    let contentDiv = dialog.Init(Loc('Create Screenshots'), [
        { name: Loc('Abbrechen'), subClass: 'outline', onClick: () => dialog.Close() },
        {
            name: Loc('Laden'),
            onClick: () => {
                UpdatePreviews();
                dialog.Close();
            }
        }
    ]);

    let dialogDiv = dialog.GetContentDiv();
    dialogDiv.classList.add('ov_settings_dialog');
    let previewContainer = AddDiv(contentDiv, 'ov_text_preview_container');
    let fileInputs = [];
    let previewTexts = [];

    for (let i = 0; i < 3; i++) {
        let fileDiv = AddDiv(previewContainer, 'ov_file_input_div');
        AddDiv(fileDiv, 'ov_dialog_label', Loc(`Upload Position/Visibility Config ${i + 1}`));
        let fileInput = AddDomElement(fileDiv, 'input', 'ov_file_input');
        fileInput.type = 'file';
        fileInput.accept = '.txt';
        fileInputs.push(fileInput);
    }
    dialog.Open();
    return dialog;
}
