import { callOverlayHandler } from "../../plugin/bridge";
import { element, translate } from "../../shared/dom";
import {
    checkAndInitializeDefaultSettingsObject,
    normalizeSettings,
} from "../../shared/defaults";
import { getScript } from "../display/layout";
import { loadContextMenu } from "./menu";
import { runtime, ui } from "../state";
import { saveSettings } from "./save";
import { applyTargetBarSettings } from "../display/target";
import { applyManaAttachments } from "../display/attachments";

export function initializeSettings(): unknown {
    const stored = localStorage.getItem("settings");
    if (stored !== null) {
        return JSON.parse(stored);
    } else {
        return {};
    }
}

export async function loadSettings() {
    const stored = await callOverlayHandler({
        call: "loadData",
        key: "zeffUI",
    });
    let settings = await checkAndInitializeDefaultSettingsObject(
        stored?.data ?? initializeSettings(),
    );

    if (Object.keys(settings.profiles.profiles).length !== 0) {
        let profiles = settings.profiles;
        if (
            profiles.currentprofile &&
            Object.prototype.hasOwnProperty.call(
                profiles.profiles,
                profiles.currentprofile,
            )
        ) {
            settings = normalizeSettings(
                profiles.profiles[profiles.currentprofile],
                settings.language,
            );
            settings.profiles = profiles;
        }
    }

    runtime.currentSettings = settings;
    setLoadedElements();
    await getScript(`data/language/${settings.language}.js`);
    loadContextMenu();
    const reminder = element("lock-overlay-reminder");
    reminder.textContent = translate("lockoverlay");
    reminder.style.display = "none";
    await saveSettings();
}

export function setLoadedElements() {
    applyTargetBarSettings();
    let head = document.getElementsByTagName("head")[0];

    let settings = runtime.currentSettings;

    if (document.getElementById("customcss")) element("customcss").remove();
    if (settings.general.customcss) {
        let style = document.createElement("style");
        style.id = "customcss";
        style.textContent = settings.general.customcss;
        head.appendChild(style);
    }

    document.documentElement.style.setProperty("--defaultFont", settings.font);

    if (document.getElementById("skin") === null) {
        let link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = `skins/${settings.skin}/styles/resources.css`;
        link.id = "skin";
        head.append(link);
    } else {
        element("skin", HTMLLinkElement).href =
            `skins/${settings.skin}/styles/resources.css`;
    }

    let healthbar = element("health-bar", HTMLProgressElement);
    settings.healthbar.enabled
        ? (healthbar.style.display = "")
        : (healthbar.style.display = "none");

    healthbar.style.setProperty(
        "--healthBarColor",
        `var(${settings.healthbar.color})`,
    );
    healthbar.style.width = `${settings.healthbar.scale * 160}px`;
    healthbar.style.height = `${settings.healthbar.scale * 15}px`;
    healthbar.style.setProperty("--healthFont", settings.healthbar.font);
    healthbar.style.transformOrigin = "top left";

    ui.dragPosition["health-bar"] = {
        x: settings.healthbar.x,
        y: settings.healthbar.y,
    };
    healthbar.classList.add("ltr");
    healthbar.style.transform = `translate(${settings.healthbar.x}px, ${
        settings.healthbar.y
    }px)${
        settings.healthbar.rotation
            ? ` rotate(${settings.healthbar.rotation}deg)`
            : ""
    }`;

    healthbar.setAttribute(
        "data-label",
        runtime.currentSettings.healthbar.textenabled ? ui.labels.health : "",
    );

    let manabar = element("mana-bar", HTMLProgressElement);
    settings.manabar.enabled
        ? (manabar.style.display = "")
        : (manabar.style.display = "none");

    manabar.style.setProperty(
        "--manaBarColor",
        `var(${settings.manabar.color})`,
    );
    manabar.style.width = `${settings.manabar.scale * 160}px`;
    manabar.style.height = `${settings.manabar.scale * 15}px`;
    manabar.style.setProperty("--manaFont", settings.manabar.font);

    manabar.style.transformOrigin = "top left";
    ui.dragPosition["mana-bar"] = {
        x: settings.manabar.x,
        y: settings.manabar.y,
    };

    manabar.classList.add("ltr");
    manabar.style.transform = `translate(${settings.manabar.x}px, ${
        settings.manabar.y
    }px)${
        settings.manabar.rotation
            ? ` rotate(${settings.manabar.rotation}deg)`
            : ""
    }`;

    manabar.setAttribute(
        "data-label",
        runtime.currentSettings.manabar.textenabled ? ui.labels.mana : "",
    );

    let mpticker = element("mp-ticker-bar");
    settings.mpticker.enabled
        ? (mpticker.style.display = "")
        : (mpticker.style.display = "none");

    mpticker.style.setProperty(
        "--mptickerColor",
        `var(${settings.mpticker.color})`,
    );

    mpticker.style.width = `${settings.mpticker.scale * 160}px`;
    mpticker.style.height = `${settings.mpticker.scale * 15}px`;

    mpticker.style.transformOrigin = "top left";
    ui.dragPosition["mp-ticker-bar"] = {
        x: settings.mpticker.x,
        y: settings.mpticker.y,
    };
    mpticker.classList.add("ltr");
    mpticker.style.transform = `translate(${settings.mpticker.x}px, ${
        settings.mpticker.y
    }px)${
        settings.mpticker.rotation
            ? ` rotate(${settings.mpticker.rotation}deg)`
            : ""
    }`;

    let dotticker = element("dot-ticker-bar");
    dotticker.style.display = settings.dotticker.enabled ? "block" : "none";

    dotticker.style.setProperty(
        "--dottickerColor",
        `var(${settings.dotticker.color})`,
    );
    dotticker.style.width = `${settings.dotticker.scale * 160}px`;
    dotticker.style.height = `${settings.dotticker.scale * 15}px`;

    dotticker.style.transformOrigin = "top left";
    ui.dragPosition["dot-ticker-bar"] = {
        x: settings.dotticker.x,
        y: settings.dotticker.y,
    };
    dotticker.classList.add("ltr");
    dotticker.style.transform = `translate(${settings.dotticker.x}px, ${
        settings.dotticker.y
    }px)${
        settings.dotticker.rotation
            ? ` rotate(${settings.dotticker.rotation}deg)`
            : ""
    }`;

    let hotticker = element("hot-ticker-bar");
    hotticker.style.display = settings.hotticker.enabled ? "block" : "none";

    hotticker.style.setProperty(
        "--hottickerColor",
        `var(${settings.hotticker.color})`,
    );
    hotticker.style.width = `${settings.hotticker.scale * 160}px`;
    hotticker.style.height = `${settings.hotticker.scale * 15}px`;

    hotticker.style.transformOrigin = "top left";
    ui.dragPosition["hot-ticker-bar"] = {
        x: settings.hotticker.x,
        y: settings.hotticker.y,
    };
    hotticker.classList.add("ltr");
    hotticker.style.transform = `translate(${settings.hotticker.x}px, ${
        settings.hotticker.y
    }px)${
        settings.hotticker.rotation
            ? ` rotate(${settings.hotticker.rotation}deg)`
            : ""
    }`;

    let timerbar = element("timer-bar");
    timerbar.style.setProperty(
        "--pulltimerBarColor",
        `var(${settings.timerbar.color})`,
    );

    timerbar.style.width = `${settings.timerbar.scale * 160}px`;
    timerbar.style.height = `${settings.timerbar.scale * 15}px`;
    timerbar.style.setProperty("--timerFont", settings.timerbar.font);
    timerbar.style.transformOrigin = "top left";

    ui.dragPosition["timer-bar"] = {
        x: settings.timerbar.x,
        y: settings.timerbar.y,
    };

    timerbar.classList.add("ltr");
    timerbar.style.transform = `translate(${settings.timerbar.x}px, ${
        settings.timerbar.y
    }px)${
        settings.timerbar.rotation
            ? ` rotate(${settings.timerbar.rotation}deg)`
            : ""
    }`;

    let dottimerbar = element("dot-timer-bar");
    dottimerbar.style.width = `${settings.dottimerbar.scale * 160}px`;
    dottimerbar.style.height = `${settings.dottimerbar.scale * 15}px`;
    dottimerbar.style.setProperty("--dotFont", settings.dottimerbar.font);

    let dotbar = element("dot-bar");
    dotbar.style.transform = `rotate(${settings.dottimerbar.rotation}deg)`;
    dotbar.style.transformOrigin = "center";

    ui.dragPosition["dot-timer-bar"] = {
        x: settings.dottimerbar.x,
        y: settings.dottimerbar.y,
    };

    dottimerbar.classList.add("ltr");
    dottimerbar.style.transform = `translate(${settings.dottimerbar.x}px, ${settings.dottimerbar.y}px)`;

    let bufftimerbar = element("buff-timer-bar");
    bufftimerbar.style.width = `${settings.bufftimerbar.scale * 160}px`;
    bufftimerbar.style.height = `${settings.bufftimerbar.scale * 15}px`;
    bufftimerbar.style.setProperty("--buffFont", settings.bufftimerbar.font);

    let buffbar = element("buff-bar");
    buffbar.style.transform = `rotate(${settings.bufftimerbar.rotation}deg)`;
    buffbar.style.transformOrigin = "center";

    ui.dragPosition["buff-timer-bar"] = {
        x: settings.bufftimerbar.x,
        y: settings.bufftimerbar.y,
    };

    bufftimerbar.classList.add("ltr");
    bufftimerbar.style.transform = `translate(${settings.bufftimerbar.x}px, ${settings.bufftimerbar.y}px)`;

    let stacksbar = element("stacks-bar");

    stacksbar.style.width = `${settings.stacksbar.scale * (4 * 25)}px`;
    stacksbar.style.height = `${settings.stacksbar.scale * 21}px`;

    let stackbgs = document.querySelectorAll<HTMLElement>(
        "[id^=stacks-background]",
    );
    stackbgs.forEach((stack) => {
        stack.style.marginLeft = `${0 - settings.stacksbar.scale * 4}px`;
    });

    stacksbar.style.setProperty(
        "--stacksColor",
        `var(${settings.stacksbar.color})`,
    );

    ui.dragPosition["stacks-bar"] = {
        x: settings.stacksbar.x,
        y: settings.stacksbar.y,
    };

    stacksbar.classList.add("ltr");
    stacksbar.style.transform = `translate(${settings.stacksbar.x}px, ${settings.stacksbar.y}px) scale(${settings.stacksbar.scale})`;

    stacksbar.style.display = settings.stacksbar.enabled ? "block" : "none";

    let raidbuffs = element("raid-buffs-bar");
    raidbuffs.style.display =
        !settings.raidbuffs.enabled || settings.raidbuffs.hidewhensolo
            ? "none"
            : "block";

    raidbuffs.style.fontFamily = settings.raidbuffs.font;

    ui.dragPosition["raid-buffs-bar"] = {
        x: settings.raidbuffs.x,
        y: settings.raidbuffs.y,
    };

    raidbuffs.classList.remove("ltr", "rtl");
    raidbuffs.classList.add(`${settings.raidbuffs.growleft ? "rtl" : "ltr"}`);
    raidbuffs.style.transform = `translate(${settings.raidbuffs.x}px, ${settings.raidbuffs.y}px)`;

    let mitigation = element("mitigation-bar");
    mitigation.style.display =
        !settings.mitigation.enabled || settings.mitigation.hidewhensolo
            ? "none"
            : "block";

    mitigation.style.fontFamily = settings.mitigation.font;

    ui.dragPosition["mitigation-bar"] = {
        x: settings.mitigation.x,
        y: settings.mitigation.y,
    };

    mitigation.classList.remove("ltr", "rtl");
    mitigation.classList.add(`${settings.mitigation.growleft ? "rtl" : "ltr"}`);
    mitigation.style.transform = `translate(${settings.mitigation.x}px, ${settings.mitigation.y}px)`;

    let party = element("party-bar");
    party.style.display =
        !settings.party.enabled || settings.party.hidewhensolo
            ? "none"
            : "block";

    party.style.fontFamily = settings.party.font;

    ui.dragPosition["party-bar"] = {
        x: settings.party.x,
        y: settings.party.y,
    };

    party.classList.remove("ltr", "rtl");
    party.classList.add(`${settings.party.growleft ? "rtl" : "ltr"}`);
    party.style.transform = `translate(${settings.party.x}px, ${settings.party.y}px)`;

    let customcd = element("customcd-bar");

    customcd.style.display =
        !settings.customcd.enabled || settings.customcd.hidewhensolo
            ? "none"
            : "block";

    customcd.style.fontFamily = settings.customcd.font;

    ui.dragPosition["customcd-bar"] = {
        x: settings.customcd.x,
        y: settings.customcd.y,
    };

    customcd.classList.remove("ltr", "rtl");
    customcd.classList.add(`${settings.customcd.growleft ? "rtl" : "ltr"}`);
    customcd.style.transform = `translate(${settings.customcd.x}px, ${settings.customcd.y}px)`;
    applyManaAttachments();
}
