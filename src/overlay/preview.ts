import type { Settings } from "../shared/settings";
import type { Ability } from "../shared/abilities";
import { isRecord, normalizeSettings } from "../shared/defaults";
import { element } from "../shared/dom";
import { abilityList } from "../data/abilities";
import { jobList } from "../data/jobs";
import { gameState, runtime, activeElements, ui } from "./state";
import { setLoadedElements } from "./preferences/load";
import { applyResourceFontSettings } from "./preferences/save";
import {
    handleHealthUpdate,
    handleManaUpdate,
    updateHealthTags,
    updateManaTags,
} from "./display/resources";
import { adjustJobStacks } from "./display/stacks";
import { generateIconBarElements } from "./cooldowns/render";
import { startAbilityIconTimers } from "./timers/icons";
import { startAbilityBarTimer, startBarTimer } from "./timers/bars";
import { resetTimers } from "./timers/lifecycle";

const modules = {
    targethealthbar: "target-health-bar",
    targetmanabar: "target-mana-bar",
    healthbar: "health-bar",
    manabar: "mana-bar",
    mpticker: "mp-ticker-bar",
    dotticker: "dot-ticker-bar",
    hotticker: "hot-ticker-bar",
    timerbar: "timer-bar",
    bufftimerbar: "buff-bar",
    dottimerbar: "dot-bar",
    stacksbar: "stacks-bar",
    raidbuffs: "raid-buffs-bar",
    mitigation: "mitigation-bar",
    party: "party-bar",
    customcd: "customcd-bar",
} as const;
export type PreviewModule = keyof typeof modules;

function isPreviewModule(value: string | null): value is PreviewModule {
    return (
        value !== null && Object.prototype.hasOwnProperty.call(modules, value)
    );
}

function send(message: object) {
    window.parent.postMessage(
        message,
        location.origin === "null" ? "*" : location.origin,
    );
}

function seedPlayer() {
    gameState.target = {
        ID: 2,
        Name: "Training Dummy",
        CurrentHP: 98500,
        MaxHP: 150000,
        CurrentMP: 6500,
        MaxMP: 10000,
    };
    const job = jobList.find((entry) => entry.name === "RDM");
    if (!job) throw new Error("Missing preview job");
    const player = {
        id: 1,
        name: "Sample Player",
        job: job.name,
        level: 100,
        jobDetail: null,
        currentHP: 64230,
        maxHP: 100000,
        currentMP: 7800,
        maxMP: 10000,
        currentCP: 0,
        maxCP: 0,
        currentGP: 0,
        maxGP: 0,
        currentShield: 0,
        pos: { x: 0, y: 0, z: 0 },
    };
    gameState.player = player;
    gameState.playerPrevious = { ...player, currentHP: 0, currentMP: 0 };
    gameState.inCombat = true;
    gameState.playerTags.job = "Red Mage";
    gameState.partyList = Array.from({ length: 8 }, (_, index) => ({
        id: String(index + 1),
        name: `Player ${index + 1}`,
        job,
        level: 100,
        inParty: true,
    }));
    ui.labels = { health: "", mana: "" };
    updateHealthTags();
    updateManaTags();
}

function pauseTimers() {
    activeElements.countdowns.forEach(clearInterval);
    activeElements.countdowns.clear();
    activeElements.tts.forEach(clearInterval);
    activeElements.tts.clear();
}

function samples(type: Ability["type"], settings: Settings): Ability[] {
    const custom = type === "CustomCooldown" ? settings.customcd.abilities : [];
    const source = custom.length
        ? custom
        : abilityList.filter(
              (ability) =>
                  ability.type ===
                  (type === "CustomCooldown" ? "Mitigation" : type),
          );
    const unique = new Map(source.map((ability) => [ability.id, ability]));
    return [...unique.values()]
        .slice(0, type === "Buff" || type === "DoT" ? 2 : 6)
        .map((ability, index) => ({
            ...(settings.override.abilities.find(
                (override) =>
                    override.id === ability.id && override.type === type,
            ) ?? ability),
            type,
            order: index + 1,
            duration: 18,
            cooldown: 60,
            tts: false,
            enabled: true,
        }));
}

function renderSamples(module: PreviewModule, settings: Settings) {
    if (module === "targethealthbar" || module === "targetmanabar") {
        pauseTimers();
        return;
    }
    if (module === "healthbar") handleHealthUpdate(64230, 100000);
    else if (module === "manabar") handleManaUpdate(7800, 10000);
    else if (module === "stacksbar") adjustJobStacks(2, 4, true);
    else if (module === "bufftimerbar" || module === "dottimerbar") {
        samples(module === "bufftimerbar" ? "Buff" : "DoT", settings).forEach(
            (ability) => {
                startAbilityBarTimer(ability, 30, true);
                const bar = element(
                    `${ability.id}-${ability.type.toLowerCase()}-timer`,
                    HTMLProgressElement,
                );
                bar.value = 18000;
                bar.setAttribute(
                    "data-label",
                    settings[module].textenabled ? "18.0" : "",
                );
            },
        );
    } else if (
        module === "raidbuffs" ||
        module === "mitigation" ||
        module === "party" ||
        module === "customcd"
    ) {
        const type =
            module === "raidbuffs"
                ? "RaidBuff"
                : module === "mitigation"
                  ? "Mitigation"
                  : module === "party"
                    ? "Party"
                    : "CustomCooldown";
        const entries = samples(type, settings).map((ability, index) => ({
            ability,
            playerIndex: module === "party" ? Math.floor(index / 2) : 0,
        }));
        const columns = module === "party" ? 20 : settings[module].columns;
        generateIconBarElements(type, entries, Math.max(1, columns));
        entries.forEach(({ ability, playerIndex }, index) => {
            const onYou = !settings[module].alwaysshow || index % 2 === 0;
            startAbilityIconTimers(playerIndex, ability, onYou);
        });
    } else {
        const selector = modules[module];
        startBarTimer(module === "timerbar" ? 10 : 3, selector);
        const bar = element(selector, HTMLProgressElement);
        bar.value = module === "timerbar" ? 6000 : 1800;
        if (module === "timerbar")
            bar.setAttribute(
                "data-label",
                settings.timerbar.textenabled ? "6.0" : "",
            );
    }
    pauseTimers();
}

function labelBounds(bar: HTMLElement): DOMRect | null {
    const text = bar.getAttribute("data-label");
    if (!text || !bar.parentElement) return null;
    const mirror = document.createElement("div");
    const label = document.createElement("span");
    for (const [node, computed] of [
        [mirror, getComputedStyle(bar)],
        [label, getComputedStyle(bar, "::after")],
    ] as const) {
        for (const property of Array.from(computed))
            node.style.setProperty(
                property,
                computed.getPropertyValue(property),
            );
    }
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";
    label.style.content = "normal";
    label.textContent = text;
    mirror.appendChild(label);
    bar.parentElement.appendChild(mirror);
    const bounds = label.getBoundingClientRect();
    mirror.remove();
    return bounds;
}

function fit(
    stage: HTMLElement,
    roots: HTMLElement[],
    viewport: { width: number; height: number },
) {
    stage.style.transform = "";
    const targets = roots.flatMap((root) => [
        ...(root.matches("progress, #stacks-bar") ? [root] : []),
        ...root.querySelectorAll<HTMLElement>(
            "progress, img, .ability-container, .stack-background",
        ),
    ]);
    const boxes = targets
        .filter(
            (target) =>
                getComputedStyle(target).display !== "none" &&
                getComputedStyle(target).visibility !== "hidden",
        )
        .flatMap((target) => {
            const bounds = [target.getBoundingClientRect()];
            if (target instanceof HTMLProgressElement) {
                const label = labelBounds(target);
                if (label) bounds.push(label);
            }
            return bounds;
        })
        .filter((box) => box.width > 0 && box.height > 0);
    if (!boxes.length) return;
    const padding = 16;
    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));
    const contentWidth = Math.max(...boxes.map((box) => box.right)) - left;
    const contentHeight = Math.max(...boxes.map((box) => box.bottom)) - top;
    const scale = Math.min(
        1,
        Math.max(1, viewport.width - padding * 2) / contentWidth,
        Math.max(1, viewport.height - padding * 2) / contentHeight,
    );
    const width = Math.min(
        viewport.width,
        Math.max(160, Math.ceil(contentWidth * scale + padding * 2)),
    );
    const height = Math.min(
        viewport.height,
        Math.max(90, Math.ceil(contentHeight * scale + padding * 2)),
    );
    stage.style.transformOrigin = "top left";
    stage.style.transform = `translate(${(width - contentWidth * scale) / 2 - left * scale}px, ${(height - contentHeight * scale) / 2 - top * scale}px) scale(${scale})`;
    send({ type: "zeffui-preview-size", width, height, scale });
}

export function initializeOverlayPreview() {
    const module = new URLSearchParams(location.search).get("module");
    if (!isPreviewModule(module) || window.parent === window) return;
    const stage = document.createElement("div");
    stage.id = "preview-stage";
    stage.style.cssText =
        "position:absolute;left:0;top:0;width:1000px;height:1000px;";
    while (document.body.firstChild)
        stage.appendChild(document.body.firstChild);
    document.body.appendChild(stage);
    document.body.style.margin = "0";
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
    let resizePreview = () => {};
    let viewport = { width: 560, height: 260 };
    stage.addEventListener("load", () => resizePreview(), true);
    const render = (value: unknown) => {
        const settings = normalizeSettings(value);
        const pair =
            module === "healthbar" || module === "manabar"
                ? (["healthbar", "manabar"] as const)
                : module === "targethealthbar" || module === "targetmanabar"
                  ? (["targethealthbar", "targetmanabar"] as const)
                  : null;
        const displayed: PreviewModule[] =
            pair && settings[pair[1]].attachment.enabled ? [...pair] : [module];
        pauseTimers();
        resetTimers();
        for (const key of Object.keys(modules)) {
            if (!isPreviewModule(key)) continue;
            settings[key].x = 0;
            settings[key].y = 0;
        }
        for (const key of displayed) settings[key].enabled = true;
        settings.general.usewebtts = false;
        for (const key of [
            "raidbuffs",
            "mitigation",
            "party",
            "customcd",
            "bufftimerbar",
            "dottimerbar",
        ] as const)
            settings[key].ttsenabled = false;
        runtime.currentSettings = settings;
        seedPlayer();
        for (const key of [
            "raidbuffs",
            "mitigation",
            "party",
            "customcd",
        ] as const)
            element(modules[key]).textContent = "";
        activeElements.raidBuffs.clear();
        activeElements.mitigations.clear();
        activeElements.partyCooldowns.clear();
        activeElements.customCooldowns.clear();
        element("bar-colors").textContent = "";
        setLoadedElements();
        applyResourceFontSettings();
        for (const key of Object.keys(modules)) {
            if (!isPreviewModule(key)) continue;
            element(modules[key]).style.display = displayed.includes(key)
                ? "block"
                : "none";
        }
        element("grid").style.display = "none";
        element("lock-overlay-reminder").style.display = "none";
        for (const key of displayed) renderSamples(key, settings);
        const updateSize = () =>
            fit(
                stage,
                displayed.map((key) => element(modules[key])),
                viewport,
            );
        resizePreview = updateSize;
        requestAnimationFrame(updateSize);
        element("skin", HTMLLinkElement).onload = updateSize;
        void document.fonts.ready.then(updateSize);
    };
    window.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (
            event.source !== window.parent ||
            event.origin !== location.origin ||
            !isRecord(event.data) ||
            event.data.type !== "zeffui-preview-settings"
        )
            return;
        const bounds = event.data.viewport;
        if (
            isRecord(bounds) &&
            typeof bounds.width === "number" &&
            typeof bounds.height === "number" &&
            Number.isFinite(bounds.width) &&
            Number.isFinite(bounds.height) &&
            bounds.width > 0 &&
            bounds.height > 0
        )
            viewport = { width: bounds.width, height: bounds.height };
        render(event.data.settings);
    });
    send({ type: "zeffui-preview-ready" });
}
