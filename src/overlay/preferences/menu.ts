import type { Locale } from "../../shared/settings";
import { normalizeSettings } from "../../shared/defaults";
import { translate } from "../../shared/dom";
import { runtime, ui } from "../state";
import { toggleGrid, toggleLock } from "../display/layout";
import { saveSettings } from "./save";
import { setLoadedElements } from "./load";
import { reloadCooldownModules } from "../display/visibility";
import { beginSettingsSession, finishSettingsSession } from "../live-settings";
import { cancelAllSpeech } from "../timers/speech";

export function generateProfileItems() {
    let profileItems: Record<string, { name: string }> = {};
    for (let profile in runtime.currentSettings.profiles.profiles) {
        profileItems[`profile_${profile}`] = { name: profile };
    }
    return profileItems;
}

export function handleSettings() {
    const active = ui.activeSettingsWindow;
    if (active && !active.closed) {
        // An empty URL reselects the named window without navigating its draft.
        const selected = window.open("", "zeffui_settings");
        if (selected && selected !== active) {
            try {
                if (selected.location.href === "about:blank") selected.close();
            } catch {}
        }
        active.focus();
        return;
    }
    ui.activeSettingsWindow = null;
    openSettingsWindow();
}

export function loadContextMenu() {
    $(":root").contextMenu({
        selector: "body",
        callback: function (key: string) {
            switch (key) {
                case "lock": {
                    toggleLock();
                    break;
                }
                case "grid": {
                    toggleGrid();
                    break;
                }
                case "reload": {
                    location.reload();
                    break;
                }
                case "settings": {
                    handleSettings();
                    break;
                }
                case "en": {
                    setUILanguageAndReload("en");
                    break;
                }
                case "de": {
                    setUILanguageAndReload("de");
                    break;
                }
                case "fr": {
                    setUILanguageAndReload("fr");
                    break;
                }
                case "jp": {
                    setUILanguageAndReload("jp");
                    break;
                }
                case "cn": {
                    setUILanguageAndReload("cn");
                    break;
                }
                case "kr": {
                    setUILanguageAndReload("kr");
                    break;
                }
                case "tc": {
                    setUILanguageAndReload("tc");
                    break;
                }
            }
            if (key.includes("profile_")) {
                let profile = key.split("_")[1];
                loadProfile(profile);
            }
        },
        items: {
            lock: {
                name: translate("lock"),
                icon: "fas fa-lock-open",
            },
            grid: {
                name: translate("grid"),
                icon: "fas fa-border-all",
            },
            reload: {
                name: translate("reload"),
                icon: "fas fa-sync-alt",
            },
            settings: {
                name: translate("settings"),
                icon: "fas fa-cog",
            },
            profiles: {
                name: translate("profiles"),
                icon: "fas fa-user",
                items: generateProfileItems(),
            },
            fold1: {
                name: translate("language"),
                icon: "fas fa-globe-americas",
                items: {
                    en: { name: "English (default)", icon: "en" },
                    de: { name: "Deutsch", icon: "de" },
                    fr: { name: "Français", icon: "fr" },
                    jp: { name: "日本語", icon: "jp" },
                    cn: { name: "中文", icon: "cn" },
                    kr: { name: "한국어", icon: "kr" },
                    tc: { name: "繁體中文", icon: "cn" },
                },
            },
            sep1: "---------",
            quit: {
                name: translate("close"),
                icon: function () {
                    return "context-menu-icon context-menu-icon-quit";
                },
            },
        },
    });
}

export function setUILanguageAndReload(language: Locale) {
    runtime.currentSettings.language = language;
    saveSettings();
    location.reload();
}

export function loadProfile(profileName: string) {
    if (
        !Object.prototype.hasOwnProperty.call(
            runtime.currentSettings.profiles.profiles,
            profileName,
        )
    )
        return;
    saveSettings();
    runtime.currentSettings.profiles.currentprofile = profileName;

    const profile = runtime.currentSettings.profiles.profiles[profileName];
    if (!profile) return;
    const settings = normalizeSettings(profile);
    settings.profiles = runtime.currentSettings.profiles;
    cancelAllSpeech();
    runtime.currentSettings = settings;

    setLoadedElements();
    reloadCooldownModules();
    saveSettings();
}

export function openSettingsWindow() {
    let parameters = new URLSearchParams(window.location.search);
    let settingsUrl = parameters.has("OVERLAY_WS")
        ? `settings.html?OVERLAY_WS=${parameters.get("OVERLAY_WS")}`
        : "settings.html";
    settingsUrl += `${settingsUrl.includes("?") ? "&" : "?"}settingsSession=${beginSettingsSession()}`;
    ui.activeSettingsWindow = window.open(settingsUrl, "zeffui_settings");
    if (ui.activeSettingsWindow)
        ui.activeSettingsWindow.onbeforeunload = onSettingsWindowClose;
}

export function onSettingsWindowClose() {
    finishSettingsSession();
    ui.activeSettingsWindow = null;
}
