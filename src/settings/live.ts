import { normalizeSettings } from "../shared/defaults";
import type { Settings } from "../shared/settings";
import {
    settingsOrigin,
    settingsPacket,
    type SettingsAction,
    type SettingsPacket,
} from "../shared/settings-sync";
import { saveAllSettings } from "./save";
import { initializePreviews, updatePreviews } from "./previews";
import { state } from "./state";
import { settingsArePopulating } from "./load";
import {
    hasPendingSettings,
    setSavedSettings,
    updatePendingSettings,
} from "./dirty";

const session =
    new URLSearchParams(location.search).get("settingsSession") ?? "";
let channel: BroadcastChannel | null = null;
let connected = false;
let ready = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let pendingCommit: (() => void) | undefined;
let lastDraft = "";

function status(text: string) {
    const label = document.getElementById("settings-status");
    if (label) label.textContent = text;
}

function send(action: SettingsAction, settings?: Settings): boolean {
    if (!session) return false;
    const packet: SettingsPacket = {
        type: "zeffui-settings",
        session,
        action,
        settings,
    };
    const opener: unknown = window.opener;
    if (typeof opener === "object" && opener !== null) {
        const accept: unknown = Reflect.get(opener, "zeffuiSettingsMessage");
        if (typeof accept === "function") {
            const accepted: unknown = Reflect.apply(accept, opener, [packet]);
            return accepted === true;
        }
        const post: unknown = Reflect.get(opener, "postMessage");
        if (typeof post === "function") {
            Reflect.apply(post, opener, [packet, settingsOrigin]);
            return false;
        }
    }
    channel?.postMessage(packet);
    return false;
}

function receive(value: unknown) {
    const packet = settingsPacket(value);
    if (!packet || packet.session !== session) return;
    connected = true;
    if (packet.action === "commit") pendingCommit?.();
    if (packet.action === "hello")
        status(
            hasPendingSettings()
                ? "Unsaved changes. Previewing on the overlay."
                : "Changes preview live. Save Settings to keep them.",
        );
}

export function refreshLiveSettings() {
    if (!ready || settingsArePopulating()) return;
    saveAllSettings();
    const settings = normalizeSettings(
        state.currentSettings,
        state.currentSettings.language,
    );
    updatePreviews(settings);
    updatePendingSettings(settings);
    const serialized = JSON.stringify(settings);
    if (serialized === lastDraft) return;
    lastDraft = serialized;
    send("preview", settings);
    status(
        hasPendingSettings()
            ? connected
                ? "Unsaved changes. Previewing on the overlay."
                : "Unsaved changes. Save Settings to keep them."
            : "No unsaved changes.",
    );
}

export function scheduleLiveSettings() {
    if (!ready) return;
    clearTimeout(timer);
    timer = setTimeout(refreshLiveSettings, 120);
}

export async function commitLiveSettings(
    settings: Settings,
    preserveDraft = false,
): Promise<void> {
    clearTimeout(timer);
    lastDraft = JSON.stringify(settings);
    updatePreviews(settings);
    setSavedSettings(settings, preserveDraft);
    status("Settings saved.");
    if (session)
        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                pendingCommit = undefined;
                resolve();
            }, 1000);
            pendingCommit = () => {
                clearTimeout(timeout);
                pendingCommit = undefined;
                resolve();
            };
            if (send("commit", settings)) pendingCommit?.();
        });
    if (preserveDraft) refreshLiveSettings();
    status(
        hasPendingSettings()
            ? connected
                ? "Unsaved changes. Previewing on the overlay."
                : "Unsaved changes. Save Settings to keep them."
            : "Settings saved.",
    );
}

export function initializeLiveSettings() {
    saveAllSettings();
    ready = true;
    lastDraft = JSON.stringify(state.currentSettings);
    setSavedSettings(state.currentSettings);
    initializePreviews(state.currentSettings);
    if (session && typeof BroadcastChannel === "function") {
        channel = new BroadcastChannel(`zeffui-settings-${session}`);
        channel.onmessage = (event) => receive(event.data);
    }
    window.addEventListener("message", (event) => {
        if (event.origin === location.origin && event.source === window.opener)
            receive(event.data);
    });
    document.addEventListener("input", scheduleLiveSettings);
    document.addEventListener("change", scheduleLiveSettings);
    document.addEventListener("sortupdate", scheduleLiveSettings, true);
    document.addEventListener("click", (event) => {
        if (
            event.target instanceof Element &&
            event.target.closest("button, a[onclick]")
        )
            scheduleLiveSettings();
    });
    window.addEventListener("pagehide", () => {
        clearTimeout(timer);
        send("close");
        channel?.close();
    });
    if (send("hello")) connected = true;
    status(
        connected
            ? "Changes preview live. Save Settings to keep them."
            : "Save Settings to keep changes.",
    );
    updatePreviews(state.currentSettings);
}
