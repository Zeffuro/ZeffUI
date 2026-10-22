import { isRecord, normalizeSettings } from "../shared/defaults";
import type { Settings } from "../shared/settings";
import {
    settingsOrigin,
    settingsPacket,
    type SettingsPacket,
} from "../shared/settings-sync";
import { refreshOverlayAppearance } from "./live-appearance";
import { getScript } from "./display/layout";
import { loadContextMenu } from "./preferences/menu";
import { translate } from "../shared/dom";
import { runtime, ui } from "./state";

let session = "";
let baseline: Settings | null = null;
let channel: BroadcastChannel | null = null;
let dirty = false;
let language: Settings["language"] | null = null;
let languageUpdate = Promise.resolve();

function refreshLanguage() {
    languageUpdate = languageUpdate
        .then(async () => {
            const next = runtime.currentSettings.language;
            if (next !== language) {
                await getScript(`data/language/${next}.js`);
                language = next;
            }
            $.contextMenu("destroy");
            loadContextMenu();
            const reminder = document.getElementById("lock-overlay-reminder");
            if (reminder) reminder.textContent = translate("lockoverlay");
        })
        .catch((error) =>
            console.error("Unable to update the overlay language.", error),
        );
}

function reply(packet: SettingsPacket) {
    ui.activeSettingsWindow?.postMessage(packet, settingsOrigin);
    channel?.postMessage(packet);
}

function receive(value: unknown): boolean {
    const packet = settingsPacket(value);
    if (!packet || !session || packet.session !== session || !baseline)
        return false;
    if (packet.action === "close") {
        finishSettingsSession();
        ui.activeSettingsWindow = null;
        return true;
    }
    if (packet.action === "hello") {
        reply({ type: "zeffui-settings", session, action: "hello" });
        return true;
    }
    if (!isRecord(packet.settings) || !isRecord(packet.settings.healthbar))
        return false;
    runtime.currentSettings = normalizeSettings(
        packet.settings,
        baseline.language,
    );
    runtime.previewingSettings = packet.action === "preview";
    dirty = packet.action === "preview";
    if (packet.action === "commit")
        baseline = normalizeSettings(
            runtime.currentSettings,
            runtime.currentSettings.language,
        );
    refreshOverlayAppearance();
    refreshLanguage();
    reply({ type: "zeffui-settings", session, action: packet.action });
    return true;
}

export function initializeSettingsReceiver() {
    window.zeffuiSettingsMessage = receive;
    window.addEventListener("message", (event) => {
        if (
            event.origin === location.origin &&
            event.source === ui.activeSettingsWindow
        )
            receive(event.data);
    });
}

export function beginSettingsSession(): string {
    finishSettingsSession();
    session = Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) =>
        value.toString(16),
    ).join("");
    baseline = normalizeSettings(
        runtime.currentSettings,
        runtime.currentSettings.language,
    );
    language ??= baseline.language;
    if (typeof BroadcastChannel === "function") {
        channel = new BroadcastChannel(`zeffui-settings-${session}`);
        channel.onmessage = (event) => receive(event.data);
    }
    return session;
}

export function finishSettingsSession() {
    if (dirty && baseline) {
        runtime.currentSettings = baseline;
        runtime.previewingSettings = false;
        refreshOverlayAppearance();
        refreshLanguage();
    }
    dirty = false;
    baseline = null;
    session = "";
    channel?.close();
    channel = null;
}
