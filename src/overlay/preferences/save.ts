import { callOverlayHandler } from "../../plugin/bridge";
import { element } from "../../shared/dom";
import { normalizeSettings } from "../../shared/defaults";
import { runtime, ui } from "../state";

export async function saveSettings() {
    if (runtime.previewingSettings) return;
    const settings = runtime.currentSettings;
    const positions = {
        healthbar: "health-bar",
        manabar: "mana-bar",
        targethealthbar: "target-health-bar",
        targetmanabar: "target-mana-bar",
        mpticker: "mp-ticker-bar",
        dotticker: "dot-ticker-bar",
        hotticker: "hot-ticker-bar",
        timerbar: "timer-bar",
        dottimerbar: "dot-timer-bar",
        bufftimerbar: "buff-timer-bar",
        stacksbar: "stacks-bar",
        raidbuffs: "raid-buffs-bar",
        mitigation: "mitigation-bar",
        customcd: "customcd-bar",
        party: "party-bar",
    } as const;
    for (const key of [
        "healthbar",
        "manabar",
        "targethealthbar",
        "targetmanabar",
        "mpticker",
        "dotticker",
        "hotticker",
        "timerbar",
        "dottimerbar",
        "bufftimerbar",
        "stacksbar",
        "raidbuffs",
        "mitigation",
        "customcd",
        "party",
    ] as const) {
        if (
            (key === "manabar" || key === "targetmanabar") &&
            settings[key].attachment.enabled
        )
            continue;
        const position = ui.dragPosition[positions[key]];
        if (!position)
            throw new Error(`Missing bar position: ${positions[key]}`);
        settings[key].x = Math.trunc(position.x);
        settings[key].y = Math.trunc(position.y);
    }
    applyResourceFontSettings();
    if (
        settings.profiles.currentprofile &&
        Object.prototype.hasOwnProperty.call(
            settings.profiles.profiles,
            settings.profiles.currentprofile,
        )
    ) {
        const { profiles: _profiles, ...profile } = normalizeSettings(
            settings,
            settings.language,
            false,
        );
        settings.profiles.profiles[settings.profiles.currentprofile] = profile;
    }
    await callOverlayHandler({
        call: "saveData",
        key: "zeffUI",
        data: settings,
    });
    localStorage.setItem("settings", JSON.stringify(settings));
}

export function applyResourceFontSettings() {
    const settings = runtime.currentSettings;
    for (const key of ["healthbar", "manabar"] as const) {
        const value = settings[key];
        const prefix = key === "healthbar" ? "health" : "mana";
        const bar = element(`${prefix}-bar`);
        bar.style.textAlign = value.align;
        const offset = value.scale * 8 + value.fontxoffset;
        const x =
            value.align === "center"
                ? value.fontxoffset
                : value.align === "right"
                  ? -Math.abs(offset)
                  : offset;
        bar.style.setProperty(`--${prefix}FontX`, `${x}px`);
        bar.style.setProperty(
            `--${prefix}FontSize`,
            `${value.staticfontsize ? value.fontsize : value.scale * 10}px`,
        );
        bar.style.setProperty(
            `--${prefix}FontY`,
            `${value.scale * -14 + value.fontyoffset}px`,
        );
    }
    for (const key of ["timerbar", "dottimerbar", "bufftimerbar"] as const) {
        const value = settings[key];
        const prefix =
            key === "timerbar"
                ? "timer"
                : key === "dottimerbar"
                  ? "dot"
                  : "buff";
        const bar = element(
            key === "timerbar"
                ? "timer-bar"
                : key === "dottimerbar"
                  ? "dot-timer-bar"
                  : "buff-timer-bar",
        );
        bar.style.setProperty(
            `--${prefix}FontSize`,
            `${value.staticfontsize ? value.fontsize : value.scale * 10}px`,
        );
        bar.style.setProperty(
            `--${prefix}FontX`,
            `${value.scale * 8 + value.fontxoffset}px`,
        );
        bar.style.setProperty(
            `--${prefix}FontY`,
            `${value.scale * -14 + value.fontyoffset}px`,
        );
    }
}
