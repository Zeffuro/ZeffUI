import { abilityList } from "../data/abilities";
import type { Ability, AbilityType } from "../shared/abilities";
import { generateAbilityIcon } from "./cooldowns/render";
import {
    getSelectorProperties,
    toggleHideOutOfCombatElements,
    toggleHideWhenSoloCombatElements,
} from "./display/visibility";
import {
    generateCustomCooldowns,
    generateMitigation,
    generatePartyCooldowns,
    generateRaidBuffs,
} from "./cooldowns/modules";
import { adjustJobStacks } from "./display/stacks";
import { applyFilterColorToElement } from "./display/layout";
import { handleHealthUpdate, handleManaUpdate } from "./display/resources";
import { setLoadedElements } from "./preferences/load";
import { applyResourceFontSettings } from "./preferences/save";
import { activeElements, gameState, runtime } from "./state";
import { processIconUrl } from "./timers/speech";
import { updateTargetMana } from "./display/target";

function refreshIcons(abilities: Ability[]) {
    for (const type of [
        "RaidBuff",
        "Mitigation",
        "Party",
        "CustomCooldown",
    ] as const) {
        const { id, settings } = getSelectorProperties(type);
        const root = document.getElementById(`${id}-bar`);
        if (!root) continue;
        root.querySelectorAll<HTMLElement>(".ability-row").forEach(
            (row) => (row.style.marginTop = `${settings.padding}px`),
        );
        root.querySelectorAll<HTMLElement>(".ability-box").forEach((box) =>
            box.classList.toggle("ability-reverse", settings.growleft),
        );
        for (const container of root.querySelectorAll<HTMLElement>(
            ".ability-container",
        )) {
            const match = container.id.match(/-(\d+)-(\d+)-container$/);
            const ability = match
                ? abilities.find(
                      (value) =>
                          value.id === Number(match[2]) && value.type === type,
                  )
                : undefined;
            if (!match || !ability) continue;
            const fresh = generateAbilityIcon(
                Number(match[1]),
                { ...ability },
                1,
            );
            for (const next of [
                fresh,
                ...fresh.querySelectorAll<HTMLElement>("[id]"),
            ]) {
                const current = document.getElementById(next.id);
                if (!current) continue;
                for (const name of Array.from(next.style)) {
                    if (name !== "display")
                        current.style.setProperty(
                            name,
                            next.style.getPropertyValue(name),
                        );
                }
                if (
                    current instanceof HTMLImageElement &&
                    next instanceof HTMLImageElement
                ) {
                    if (current.classList.contains("icon-overlay")) {
                        const cooldown = current.src.includes(
                            "icon-overlay-cooldown",
                        );
                        current.src = `skins/${runtime.currentSettings.skin}/images/icon-overlay${cooldown ? "-cooldown" : ""}.png`;
                    } else if (!current.classList.contains("ability-image"))
                        current.src = next.src;
                    else current.src = processIconUrl(current.src);
                    current.width = next.width;
                    current.height = next.height;
                }
                if (current.classList.contains("ability-text")) {
                    const duration = current.id.endsWith("-duration");
                    const outline = duration
                        ? settings.durationoutline
                        : settings.cooldownoutline;
                    current.style.webkitTextStroke = outline
                        ? `1.5px ${duration ? settings.durationoutlinecolor : settings.cooldownoutlinecolor}`
                        : "";
                }
            }
            container.style.display = ability.enabled ? "" : "none";
        }
        const containers = Array.from(
            root.querySelectorAll<HTMLElement>(".ability-container"),
        );
        const rows = new Map<number, HTMLElement>();
        root.replaceChildren();
        const columns = Math.max(1, Math.trunc(settings.columns ?? 20));
        containers.forEach((container, index) => {
            const member = container.id.match(
                /-(\d+)-(?:\d+|dummy)-container$/,
            );
            const rowIndex =
                type === "Party"
                    ? Number(member?.[1] ?? 0)
                    : Math.floor(index / columns);
            let box = rows.get(rowIndex);
            if (!box) {
                const row = document.createElement("div");
                row.id = `${id}-row-${rowIndex + 1}`;
                row.className = "ability-row";
                row.style.marginTop = `${settings.padding}px`;
                box = document.createElement("div");
                box.id = `${row.id}-box`;
                box.className = `ability-box${settings.growleft ? " ability-reverse" : ""}`;
                row.appendChild(box);
                root.appendChild(row);
                rows.set(rowIndex, box);
            }
            box.appendChild(container);
        });
    }
}

function rebuildIdleIcons(abilities: Ability[]) {
    if (!gameState.player) return;
    const active = Array.from(
        document.querySelectorAll<HTMLElement>(".ability-container"),
    ).filter((node) => {
        const selector = node.id.replace(/-container$/, "");
        return (
            activeElements.countdowns.has(`${selector}-duration`) ||
            activeElements.countdowns.has(`${selector}-cooldown`)
        );
    });
    generateCustomCooldowns();
    if (gameState.zone.type !== "Pvp") {
        generateRaidBuffs();
        generateMitigation();
        generatePartyCooldowns();
    }
    const types = {
        "raid-buffs": "RaidBuff",
        mitigation: "Mitigation",
        party: "Party",
        customcd: "CustomCooldown",
    } as const;
    for (const node of active) {
        const match = node.id.match(
            /^(raid-buffs|mitigation|party|customcd)-(\d+)-(\d+)-container$/,
        );
        const type = match ? types[match[1] as keyof typeof types] : undefined;
        const ability = match
            ? abilities.find(
                  (value) =>
                      value.id === Number(match[3]) && value.type === type,
              )
            : undefined;
        if (!match || !ability) continue;
        const replacement = document.getElementById(node.id);
        if (replacement) replacement.replaceWith(node);
        else document.getElementById(`${match[1]}-bar`)?.appendChild(node);
    }
}

function refreshBars(
    type: Extract<AbilityType, "DoT" | "Buff">,
    abilities: Ability[],
) {
    const prefix = type.toLowerCase();
    const settings =
        type === "DoT"
            ? runtime.currentSettings.dottimerbar
            : runtime.currentSettings.bufftimerbar;
    const active =
        type === "DoT" ? activeElements.dotBars : activeElements.buffBars;
    for (const [id, selector] of active) {
        const bar = document.getElementById(selector);
        if (!(bar instanceof HTMLProgressElement)) continue;
        const ability = abilities.find(
            (value) => value.id === id && value.type === type,
        );
        const order = ability?.order ?? 0;
        const template = document.getElementById(`${prefix}-timer-bar`);
        if (template) {
            for (const name of Array.from(template.style)) {
                if (name !== "display" && name !== "transform")
                    bar.style.setProperty(
                        name,
                        template.style.getPropertyValue(name),
                    );
            }
        }
        const delta = settings.padding * order;
        const x =
            settings.x +
            (settings.growdirection === 3
                ? -delta
                : settings.growdirection === 4
                  ? delta
                  : 0);
        const y =
            settings.y +
            (settings.growdirection === 1
                ? delta
                : settings.growdirection === 2
                  ? -delta
                  : 0);
        bar.style.transform = `translate(${x}px, ${y}px)`;
        bar.style.display =
            settings.enabled && ability?.enabled !== false ? "block" : "none";
        const image = document.getElementById(
            selector.replace("timer", "image"),
        );
        if (ability) applyFilterColorToElement(`bar-${id}`, ability.color);
        if (image instanceof HTMLImageElement) {
            image.style.display =
                settings.enabled &&
                settings.imageenabled &&
                ability?.enabled !== false
                    ? "block"
                    : "none";
            image.style.height = `${settings.scale * 22}px`;
            image.style.transform = `translate(${x - settings.scale * 30}px, ${y - settings.scale * 4}px)`;
            image.src = processIconUrl(image.src);
        }
        if (!settings.textenabled) bar.setAttribute("data-label", "");
    }
}

export function refreshOverlayAppearance() {
    setLoadedElements();
    applyResourceFontSettings();
    void updateTargetMana();
    const timer = document.getElementById("timer-bar");
    if (timer instanceof HTMLProgressElement) {
        timer.style.display =
            runtime.currentSettings.timerbar.enabled &&
            activeElements.countdowns.has("timer-bar") &&
            timer.value > 0
                ? "block"
                : "none";
        if (!runtime.currentSettings.timerbar.textenabled)
            timer.setAttribute("data-label", "");
    }
    const abilities = [
        ...abilityList,
        ...runtime.currentSettings.customcd.abilities,
    ].map(
        (ability) =>
            runtime.currentSettings.override.abilities.find(
                (override) =>
                    override.id === ability.id &&
                    override.type === ability.type,
            ) ?? ability,
    );
    rebuildIdleIcons(abilities);
    refreshIcons(abilities);
    refreshBars("DoT", abilities);
    refreshBars("Buff", abilities);
    adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks, true);
    const player = gameState.player;
    if (player) {
        const previous = gameState.playerPrevious;
        gameState.playerPrevious = { ...player, currentHP: -1, currentMP: -1 };
        handleHealthUpdate(player.currentHP, player.maxHP);
        handleManaUpdate(player.currentMP, player.maxMP, false);
        gameState.playerPrevious = previous;
        for (const key of ["mp", "dot", "hot"] as const) {
            const settings = runtime.currentSettings[`${key}ticker`];
            if (
                settings.specificjobsenabled &&
                !settings.specificjobs.includes(player.job)
            ) {
                const bar = document.getElementById(`${key}-ticker-bar`);
                if (bar) bar.style.display = "none";
            }
        }
    }
    toggleHideOutOfCombatElements();
    toggleHideWhenSoloCombatElements();
}
