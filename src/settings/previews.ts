import type { Settings } from "../shared/settings";
import type { PreviewModule } from "../overlay/preview";
import { isRecord } from "../shared/defaults";

interface PreviewFrame {
    module: PreviewModule;
    frame: HTMLIFrameElement;
    status: HTMLElement;
    ready: boolean;
    scaled?: boolean;
    lastSettingsKey?: string;
}

const previews: PreviewFrame[] = [];
let currentSettings: Settings | null = null;
let listening = false;

function previewStatus(preview: PreviewFrame) {
    if (!currentSettings) return;
    const status = currentSettings[preview.module].enabled
        ? preview.module === "customcd" &&
          currentSettings.customcd.abilities.length === 0
            ? "Sample abilities"
            : ""
        : "Disabled in overlay";
    preview.status.textContent = [status, preview.scaled ? "Scaled to fit" : ""]
        .filter(Boolean)
        .join(" · ");
}

function send(preview: PreviewFrame) {
    if (!currentSettings || !preview.ready) return;
    const target = preview.frame.contentWindow;
    if (!target) return;
    const viewport = {
        width: preview.frame.parentElement?.clientWidth || 560,
        height: 260,
    };
    const pair =
        preview.module === "healthbar" || preview.module === "manabar"
            ? ([currentSettings.healthbar, currentSettings.manabar] as const)
            : preview.module === "targethealthbar" ||
                preview.module === "targetmanabar"
              ? ([
                    currentSettings.targethealthbar,
                    currentSettings.targetmanabar,
                ] as const)
              : null;
    const settingsKey = JSON.stringify({
        module: { ...currentSettings[preview.module], x: 0, y: 0 },
        resourcePair: pair?.[1].attachment.enabled
            ? pair.map((bar) => ({ ...bar, x: 0, y: 0 }))
            : undefined,
        skin: currentSettings.skin,
        font: currentSettings.font,
        language: currentSettings.language,
        gamelanguage: currentSettings.gamelanguage,
        usehdicons: currentSettings.general.usehdicons,
        customcss: currentSettings.general.customcss,
        override: currentSettings.override,
        viewport,
        includealliance:
            preview.module === "party"
                ? currentSettings.includealliance
                : undefined,
    });
    if (preview.lastSettingsKey === settingsKey) return;
    previewStatus(preview);
    target.postMessage(
        {
            type: "zeffui-preview-settings",
            settings: currentSettings,
            viewport,
        },
        location.origin === "null" ? "*" : location.origin,
    );
    preview.lastSettingsKey = settingsKey;
}

export function initializePreviews(settings: Settings) {
    currentSettings = settings;
    if (!listening) {
        listening = true;
        window.addEventListener("message", (event: MessageEvent<unknown>) => {
            if (event.origin !== location.origin || !isRecord(event.data))
                return;
            const preview = previews.find(
                (entry) => entry.frame.contentWindow === event.source,
            );
            if (!preview) return;
            if (event.data.type === "zeffui-preview-ready") {
                preview.ready = true;
                preview.lastSettingsKey = undefined;
                send(preview);
            } else if (event.data.type === "zeffui-preview-size") {
                const { width, height } = event.data;
                if (
                    typeof width !== "number" ||
                    typeof height !== "number" ||
                    !Number.isFinite(width) ||
                    !Number.isFinite(height)
                )
                    return;
                preview.frame.style.width = `${Math.max(1, width)}px`;
                preview.frame.style.height = `${Math.max(1, height)}px`;
                preview.scaled =
                    typeof event.data.scale === "number" &&
                    event.data.scale < 0.999;
                previewStatus(preview);
                const viewport = preview.frame.parentElement;
                if (viewport) {
                    viewport.scrollLeft = 0;
                    viewport.scrollTop = 0;
                }
            }
        });
    }
    document
        .querySelectorAll<HTMLElement>("[data-preview-module]")
        .forEach((host) => {
            if (host.querySelector("iframe")) return;
            const module = host.dataset.previewModule;
            if (!isPreviewModule(module)) return;
            const heading = document.createElement("div");
            heading.className = "preview-heading";
            const label = document.createElement("span");
            label.textContent = "Preview";
            const status = document.createElement("span");
            status.className = "preview-status";
            status.textContent = "Loading preview…";
            heading.append(label, status);
            const viewport = document.createElement("div");
            viewport.className = "preview-viewport";
            const frame = document.createElement("iframe");
            frame.style.colorScheme = "normal";
            frame.title = `${host.dataset.previewTitle ?? module} overlay preview`;
            frame.src = `preview.html?module=${module}`;
            frame.loading = "lazy";
            frame.setAttribute("scrolling", "no");
            frame.addEventListener("load", () => {
                const preview = previews.find((entry) => entry.frame === frame);
                if (preview) send(preview);
            });
            const preview = { module, frame, status, ready: false };
            previews.push(preview);
            viewport.appendChild(frame);
            host.append(heading, viewport);
            if (typeof ResizeObserver === "function")
                new ResizeObserver(() => send(preview)).observe(viewport);
        });
    updatePreviews(settings);
}

function isPreviewModule(value: unknown): value is PreviewModule {
    return (
        typeof value === "string" &&
        [
            "healthbar",
            "manabar",
            "targethealthbar",
            "targetmanabar",
            "mpticker",
            "dotticker",
            "hotticker",
            "timerbar",
            "bufftimerbar",
            "dottimerbar",
            "stacksbar",
            "raidbuffs",
            "mitigation",
            "party",
            "customcd",
        ].includes(value)
    );
}

export function updatePreviews(settings: Settings) {
    currentSettings = settings;
    previews.forEach(send);
}
