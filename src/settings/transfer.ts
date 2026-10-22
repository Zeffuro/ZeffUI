import { state, translation } from "./state";
import { formValue } from "../shared/dom";
import { commitLiveSettings } from "./live";
import {
    isRecord,
    normalizeSettings,
    profileSnapshot,
} from "../shared/defaults";

function exportValue() {
    if ($("#includeProfiles").prop("checked")) return state.currentSettings;
    return profileSnapshot(state.currentSettings);
}

function copyExport(value: string) {
    $("#settingsText").val(value).select();
    document.execCommand("copy");
    alert(translation("currentsettingscopied"));
}

export function exportSettings() {
    copyExport(Base64.encodeURI(JSON.stringify(exportValue())));
}

export function exportSettingsJson() {
    copyExport(JSON.stringify(exportValue(), null, 2));
}

async function importValue(value: unknown) {
    if (!isRecord(value) || !isRecord(value.healthbar))
        throw new Error("Invalid settings object");
    const includeProfiles = $("#includeProfiles").prop("checked");
    const imported = { ...value };
    if (!includeProfiles) delete imported.profiles;
    const current = state.currentSettings;
    const settings = normalizeSettings(
        { ...current, ...imported },
        current.language,
    );
    if (!confirm(translation("importsettingsoverwrite"))) return;
    if (settings.profiles.currentprofile) {
        Object.defineProperty(
            settings.profiles.profiles,
            settings.profiles.currentprofile,
            {
                value: profileSnapshot(settings),
                enumerable: true,
                writable: true,
                configurable: true,
            },
        );
    }
    await state.callCurrentOverlayHandler({
        call: "saveData",
        key: "zeffUI",
        data: settings,
    });
    localStorage.setItem("settings", JSON.stringify(settings));
    await commitLiveSettings(settings);
    state.currentSettings = settings;
    location.reload();
    window.close();
}

export async function importSettings() {
    try {
        const value: unknown = JSON.parse(
            Base64.decode(formValue("#settingsText")),
        );
        await importValue(value);
    } catch {
        alert(translation("invalidsettingsstring"));
    }
}

export async function importSettingsJson() {
    try {
        const value: unknown = JSON.parse(formValue("#settingsText"));
        await importValue(value);
    } catch {
        alert(translation("invalidsettingsstring"));
    }
}
