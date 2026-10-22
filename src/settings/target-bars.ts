import type { Settings } from "../shared/settings";
import { formNumber, formValue } from "../shared/dom";
import { state } from "./state";

const bars = [
    {
        key: "targethealthbar",
        prefix: "targetHealth",
        label: "Target health bar",
        resource: "health",
    },
    {
        key: "targetmanabar",
        prefix: "targetMana",
        label: "Target mana bar",
        resource: "mana",
    },
] as const;

function field(prefix: string, suffix: string, label: string, control: string) {
    return `<div class="form-group row text-right">
        <label class="control-label col-sm-4" for="${prefix}${suffix}">${label}</label>
        <div class="col-sm-6">${control}</div>
    </div>`;
}

function input(
    prefix: string,
    suffix: string,
    label: string,
    type = "number",
    attributes = "",
) {
    return field(
        prefix,
        suffix,
        label,
        `<input class="form-control form-control-sm" id="${prefix}${suffix}" type="${type}" ${attributes}>`,
    );
}

function toggle(prefix: string, suffix: string, label: string) {
    return `<div class="form-group"><div class="form-check form-switch">
        <input type="checkbox" class="form-check-input" id="${prefix}${suffix}">
        <label class="custom-control-label" for="${prefix}${suffix}">${label}</label>
    </div></div>`;
}

export function initializeTargetBarControls(settings: Settings) {
    for (const { key, prefix, label, resource } of bars) {
        state.currentFont[prefix] = settings[key].font;
        const host = document.getElementById(`anchor_${key}`);
        if (!host || host.childElementCount) continue;
        host.innerHTML = `<div class="card text-white bg-dark mb-3" style="max-width: 40rem;">
            <div class="card-header">${toggle(prefix, "BarEnabled", label)}</div>
            <div class="card-body">
                <p class="card-text">Display the current target's ${resource}. Hidden when no valid target is selected.</p>
                <div class="module-preview" data-preview-module="${key}" data-preview-title="${label}"></div>
                ${input(prefix, "X", "Position X")}
                ${input(prefix, "Y", "Position Y")}
                ${input(prefix, "Scale", "Scale", "number", 'step="0.1" min="0.1"')}
                ${input(prefix, "Rotation", "Rotation", "number", 'step="1"')}
                ${toggle(prefix, "HideOutOfCombat", "Hide out of combat")}
                ${toggle(prefix, "TextEnabled", "Show text")}
                ${input(prefix, "Format", "Text format", "text", `aria-describedby="${prefix}FormatHelp"`)}
                <p class="form-text" id="${prefix}FormatHelp">Use [name] and [${resource}:current], [${resource}:max], [${resource}:percent], [${resource}:current-short], [${resource}:max-short], [${resource}:current-max] or [${resource}:deficit].</p>
                ${field(
                    prefix,
                    "Align",
                    "Text align",
                    `<select class="form-select form-select-sm" id="${prefix}Align">
                    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                </select>`,
                )}
                ${field(prefix, "Font", "Font", `<select class="form-select form-select-sm" id="${prefix}Font"></select>`)}
                ${toggle(prefix, "StaticFontSizeEnabled", "Use static font size")}
                ${input(prefix, "FontSize", "Static font size", "number", 'min="1"')}
                ${input(prefix, "FontXOffset", "Font X offset")}
                ${input(prefix, "FontYOffset", "Font Y offset")}
                ${field(prefix, "Color", "Color", `<select class="form-select form-select-sm" id="${prefix}Color"></select>`)}
            </div>
        </div>`;
        host.querySelector<HTMLSelectElement>(
            `#${prefix}Font`,
        )?.addEventListener("change", (event) => {
            if (event.target instanceof HTMLSelectElement)
                state.currentFont[prefix] = event.target.value;
        });
    }
}

export function populateTargetBarControls(settings: Settings) {
    for (const { key, prefix } of bars) {
        const bar = settings[key];
        for (const [suffix, value] of Object.entries({
            BarEnabled: bar.enabled,
            HideOutOfCombat: bar.hideoutofcombat,
            TextEnabled: bar.textenabled,
            StaticFontSizeEnabled: bar.staticfontsize,
        }))
            $(`#${prefix}${suffix}`).prop("checked", value);
        for (const [suffix, value] of Object.entries({
            Format: bar.textformat,
            Color: bar.color,
            Scale: bar.scale,
            Rotation: bar.rotation,
            X: bar.x,
            Y: bar.y,
            Align: bar.align,
            Font: bar.font,
            FontXOffset: bar.fontxoffset,
            FontYOffset: bar.fontyoffset,
            FontSize: bar.fontsize,
        }))
            $(`#${prefix}${suffix}`).val(value);
    }
}

export function readTargetBarControls(settings: Settings) {
    function read(key: (typeof bars)[number]["key"], prefix: string) {
        const bar = settings[key];
        return {
            ...bar,
            enabled: $(`#${prefix}BarEnabled`).is(":checked"),
            hideoutofcombat: $(`#${prefix}HideOutOfCombat`).is(":checked"),
            textenabled: $(`#${prefix}TextEnabled`).is(":checked"),
            staticfontsize: $(`#${prefix}StaticFontSizeEnabled`).is(":checked"),
            textformat: formValue(`#${prefix}Format`),
            color: formValue(`#${prefix}Color`),
            scale: formNumber(`#${prefix}Scale`, bar.scale),
            rotation: formNumber(`#${prefix}Rotation`, bar.rotation),
            x: formNumber(`#${prefix}X`, bar.x),
            y: formNumber(`#${prefix}Y`, bar.y),
            align: formValue(`#${prefix}Align`),
            font: formValue(`#${prefix}Font`),
            fontxoffset: formNumber(`#${prefix}FontXOffset`, bar.fontxoffset),
            fontyoffset: formNumber(`#${prefix}FontYOffset`, bar.fontyoffset),
            fontsize: formNumber(`#${prefix}FontSize`, bar.fontsize),
        };
    }
    return {
        targethealthbar: read("targethealthbar", "targetHealth"),
        targetmanabar: read("targetmanabar", "targetMana"),
    };
}
