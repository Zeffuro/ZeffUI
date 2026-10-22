import type { Settings } from "../shared/settings";

let saved = "";
let current = "";
let saving = false;
let failed = false;

function snapshot(settings: Settings) {
    return JSON.stringify(settings, (_key, value: unknown) =>
        value !== null && typeof value === "object" && !Array.isArray(value)
            ? Object.fromEntries(
                  Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
              )
            : value,
    );
}

function render() {
    const pending = hasPendingSettings();
    const button = document.getElementById("lang_savesettings_2");
    if (button && button instanceof HTMLButtonElement) {
        button.disabled = saving;
        button.classList.toggle("has-changes", pending);
    }
    const label = document.getElementById("settings-dirty-state");
    if (label) {
        label.textContent = saving
            ? "Saving…"
            : failed
              ? "Save failed"
              : pending
                ? "Unsaved changes"
                : "Saved";
        label.dataset.state = saving
            ? "saving"
            : failed
              ? "error"
              : pending
                ? "pending"
                : "saved";
    }
}

export function hasPendingSettings() {
    return current !== saved;
}

export function setSavedSettings(settings: Settings, preserveCurrent = false) {
    saved = snapshot(settings);
    if (!preserveCurrent) current = saved;
    failed = false;
    render();
}

export function updatePendingSettings(settings: Settings) {
    const next = snapshot(settings);
    if (next !== current) failed = false;
    current = next;
    render();
}

export function setSettingsSaving(value: boolean) {
    saving = value;
    if (value) failed = false;
    render();
}

export function reportSettingsSaveFailure() {
    failed = true;
    render();
}
