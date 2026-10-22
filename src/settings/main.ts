import { loadZeffUISettings } from "./bootstrap";
import { initializeLiveSettings } from "./live";
import { initializeCustomCssEditor } from "./custom-css";
import { initializeTextTagInserters } from "./text-tags";
import { initializeLanguageControls } from "./language";
import { initializeSpeechControls } from "./speech";
import {
    loadProfile,
    saveProfile,
    saveJobProfile,
    saveAllJobProfile,
    deleteJobProfile,
    deleteProfile,
} from "./profiles";
import { setPartyOrder, toggleJob } from "./party";
import {
    changeXY,
    addCustomFont,
    removeCustomFont,
    loadSkin,
    loadFont,
    loadLanguage,
    refreshLocalizedSelects,
    applyDefaultFont,
} from "./appearance";
import { toggleOverride, saveOverride, loadAbility } from "./overrides";
import {
    searchCustomAbility,
    switchCustomcdMode,
    loadCustomCdAbility,
    addCustomAbility,
    saveCustomAbility,
    deleteCustomAbility,
} from "./custom-cooldowns";
import {
    exportSettings,
    exportSettingsJson,
    importSettings,
    importSettingsJson,
} from "./transfer";
import { saveSettingsAndProfile, deleteSettings } from "./save";

Object.assign(window, {
    saveSettingsAndProfile,
    loadLanguage,
    loadSkin,
    loadFont,
    applyDefaultFont,
    removeCustomFont,
    addCustomFont,
    setPartyOrder,
    loadProfile,
    deleteProfile,
    saveProfile,
    saveJobProfile,
    saveAllJobProfile,
    deleteJobProfile,
    exportSettings,
    importSettings,
    deleteSettings,
    exportSettingsJson,
    importSettingsJson,
    changeXY,
    loadAbility,
    toggleOverride,
    saveOverride,
    switchCustomcdMode,
    searchCustomAbility,
    loadCustomCdAbility,
    addCustomAbility,
    saveCustomAbility,
    deleteCustomAbility,
    toggleJob,
});

$(function () {
    const waiting = setTimeout(() => {
        const status = document.getElementById("settings-status");
        const phase = status?.textContent ?? "Loading settings…";
        console.warn("Settings are still loading:", phase);
        if (status)
            status.textContent = `${phase} Still waiting. Try reopening Settings.`;
    }, 10000);
    void loadZeffUISettings()
        .then(() => {
            initializeCustomCssEditor();
            initializeTextTagInserters();
            initializeLanguageControls(refreshLocalizedSelects);
            initializeSpeechControls();
            initializeLiveSettings();
        })
        .catch((error: unknown) => {
            console.error("Settings failed to load.", error);
            const status = document.getElementById("settings-status");
            if (status)
                status.textContent =
                    "Settings could not load. Close this window and reopen Settings.";
        })
        .finally(() => clearTimeout(waiting));
});
