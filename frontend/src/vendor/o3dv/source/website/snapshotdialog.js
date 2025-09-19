import { AddDiv, AddDomElement, CreateDomElement } from '../engine/viewer/domutils.js';
import { AddCheckbox, AddNumberInput, AddRadioButton } from '../website/utils.js';
import { ButtonDialog } from './dialog.js';
import { DownloadUrlAsFile } from './utils.js';
import { CookieGetBoolVal, CookieGetIntVal, CookieGetStringVal, CookieSetBoolVal, CookieSetIntVal, CookieSetStringVal } from './cookiehandler.js';
import { HandleEvent } from './eventhandler.js';
import { Loc } from '../engine/core/localization.js';

export function ShowSnapshotDialog(viewer) {
    function AddSizeRadioButton(parentDiv, id, text, isSelected, onChange) {
        let line = AddDiv(parentDiv, 'ov_dialog_row');
        AddRadioButton(line, id, 'snapshot_size', text, isSelected, onChange);
    }

    function GetImageUrl(viewer, size, isTransparent) {
        let width = parseInt(size[0], 10);
        let height = parseInt(size[1], 10);
        if (width < 1 || height < 1) {
            return null;
        }
        return viewer.GetImageAsDataUrl(size[0], size[1], isTransparent);
    }


    function UpdatePreviews() {
        angleInputs.forEach((input, index) => {
            if (index < previewImages.length) {
                let angle = parseFloat(input.input.value) || 0;
                viewer.SetAngle(angle);
                let size = [160, 90]; // Vorschaubildgröße
                let url = GetImageUrl(viewer, size, isTransparent);
                previewImages[index].src = url;
            }
        });
    }

    function DowloadUpdatePreviews() {
        angleInputs.forEach((input, index) => {
            if (index < previewImages.length) {
                let angle = parseFloat(input.input.value) || 0;
                viewer.SetAngle(angle);
                let size = GetSize(sizes, selectedIndex);
                let url = GetImageUrl(viewer, size, isTransparent);
                DownloadUrlAsFile(url, `snapshot_angle_${index}.png`);
            }
        });
    }

    function UpdateCustomStatus(sizes, customIndex, selectedIndex) {
        let customSize = sizes[customIndex];
        customSize.widthInput.disabled = (selectedIndex !== customIndex);
        customSize.heightInput.disabled = (selectedIndex !== customIndex);
    }

    function GetSize(sizes, selectedIndex) {
        let selectedSize = sizes[selectedIndex];
        return selectedSize.size !== null ? selectedSize.size : [
            selectedSize.widthInput.value,
            selectedSize.heightInput.value
        ];
    }

    function AddWidthHeightNumberInput(parentDiv, text, onChange) {
        let line = AddDiv(parentDiv, 'ov_dialog_row');
        AddDiv(line, 'ov_snapshot_dialog_param_name', text);
        let numberInput = AddNumberInput(line, 'ov_dialog_text', onChange);
        numberInput.classList.add('ov_snapshot_dialog_param_value');
        numberInput.addEventListener('focus', () => {
            numberInput.setSelectionRange(0, numberInput.value.length);
        });
        return numberInput;
    }

    let selectedIndex = 0;
    let isTransparent = CookieGetBoolVal('ov_last_snapshot_transparent', false);
    let customIndex = 3;
    let sizes = [
        { name: Loc('Small (1280x720)'), size: [1280, 720] },
        { name: Loc('Medium (1920x1080)'), size: [1920, 1080] },
        { name: Loc('Large (2560x1440)'), size: [2560, 1440] },
        { name: Loc('Custom'), size: null, widthInput: null, heightInput: null }
    ];

    let dialog = new ButtonDialog();
    let contentDiv = dialog.Init(Loc('Create Snapshot'), [
        { name: Loc('Cancel'), subClass: 'outline', onClick: () => dialog.Close() },
        {
            name: Loc('Create'),
            onClick: () => {
                dialog.Close();
                HandleEvent('snapshot_created', sizes[selectedIndex].name);
                DowloadUpdatePreviews();
            }
        }
    ]);

    let dialogDiv = dialog.GetContentDiv();
    dialogDiv.classList.add('ov_snapshot_dialog');
    let optionsDiv = AddDiv(contentDiv, 'ov_snapshot_dialog_options');

    let lastSnapshotSizeName = CookieGetStringVal('ov_last_snapshot_size', sizes[1].name);
    sizes.forEach((size, i) => {
        let selected = (lastSnapshotSizeName === size.name);
        if (selected) selectedIndex = i;
        AddSizeRadioButton(optionsDiv, `snapshot_${i}`, size.name, selected, () => {
            selectedIndex = i;
            CookieSetStringVal('ov_last_snapshot_size', size.name);
            UpdatePreviews();
            UpdateCustomStatus(sizes, customIndex, selectedIndex);
        });
    });

    let customSize = sizes[customIndex];
    customSize.widthInput = AddWidthHeightNumberInput(optionsDiv, Loc('Width'), val => {
        UpdatePreviews();
        CookieSetIntVal('ov_snapshot_custom_width', val);
    });
    customSize.heightInput = AddWidthHeightNumberInput(optionsDiv, Loc('Height'), val => {
        UpdatePreviews();
        CookieSetIntVal('ov_snapshot_custom_height', val);
    });
    customSize.widthInput.value = CookieGetIntVal('ov_snapshot_custom_width', 1000);
    customSize.heightInput.value = CookieGetIntVal('ov_snapshot_custom_height', 1000);
    UpdateCustomStatus(sizes, customIndex, selectedIndex);

    let previewContainer = AddDiv(contentDiv, 'ov_angle_preview_container');
    let previewImages = Array.from({ length: 4 }, (_, i) => {
        let img = CreateDomElement('img', 'ov_angle_thumbnail');
        img.title = `Angle ${i + 1}`;
            // Style hinzufügen
        img.style.margin.top = "10px"
        img.style.borderRadius = "8px"; // Beispiel: abgerundete Ecken
        previewContainer.appendChild(img);
        return img;
    });
    contentDiv.appendChild(previewContainer);

    let angleInputs = Array.from({ length: 4 }, (_, i) => {
        let angleDiv = AddDiv(optionsDiv, 'ov_dialog_row');
        let checkbox = AddCheckbox(angleDiv, `angle_enabled_${i}`, Loc(`Enable Angle ${i + 1}`), true, isChecked => {
            console.log(`Checkbox für Winkel ${i + 1} ist jetzt ${isChecked ? 'aktiviert' : 'deaktiviert'}`);
            UpdatePreviews();
        });
        let input = AddNumberInput(angleDiv, `snapshot_angle_${i}`, Loc(`Angle ${i + 1}`));
        input.value = i * 90;
        input.addEventListener('input', UpdatePreviews);
        return { checkbox, input };
    });
    UpdatePreviews();
    dialog.Open();
    return dialog;
}
