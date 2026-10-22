import type { AbilityType } from "../../shared/abilities";
import type { Settings } from "../../shared/settings";
import { element, translate } from "../../shared/dom";
import { activeElements, gameState, runtime } from "../state";
import { toLog } from "../debug";
import { adjustJobStacks, initializeSmn } from "./stacks";
import { renderTargetBars } from "./target";
import {
    generateCustomCooldowns,
    generateMitigation,
    generatePartyCooldowns,
    generateRaidBuffs,
} from "../cooldowns/modules";

type IconType = Exclude<AbilityType, "DoT" | "Buff">;
type IconProperties = {
    id: string;
    settings: Omit<Settings["raidbuffs"], "columns" | "orderbypartymember"> & {
        columns?: number;
    };
    active: Map<string, string>;
};
type BarProperties = {
    id: string;
    settings: Settings["bufftimerbar"];
    active: Map<number, string>;
};
export function getSelectorProperties(selector: IconType): IconProperties;
export function getSelectorProperties(
    selector: AbilityType,
): IconProperties | BarProperties;
export function getSelectorProperties(
    selector: AbilityType,
): IconProperties | BarProperties {
    switch (selector) {
        case "RaidBuff":
            return {
                id: "raid-buffs",
                settings: runtime.currentSettings.raidbuffs,
                active: activeElements.raidBuffs,
            };
        case "Mitigation":
            return {
                id: "mitigation",
                settings: runtime.currentSettings.mitigation,
                active: activeElements.mitigations,
            };
        case "Party":
            return {
                id: "party",
                settings: runtime.currentSettings.party,
                active: activeElements.partyCooldowns,
            };
        case "CustomCooldown":
            return {
                id: "customcd",
                settings: runtime.currentSettings.customcd,
                active: activeElements.customCooldowns,
            };
        case "Buff":
            return {
                id: "buff",
                settings: runtime.currentSettings.bufftimerbar,
                active: activeElements.buffBars,
            };
        case "DoT":
            return {
                id: "dot",
                settings: runtime.currentSettings.dottimerbar,
                active: activeElements.dotBars,
            };
        default:
            throw new Error(`No timer module for ability type: ${selector}`);
    }
}

export function toggleHideOutOfCombatElements() {
    renderTargetBars();
    runtime.currentSettings.healthbar.hideoutofcombat && !gameState.inCombat
        ? element("health-bar").classList.add("hide-in-combat")
        : element("health-bar").classList.remove("hide-in-combat");
    runtime.currentSettings.manabar.hideoutofcombat && !gameState.inCombat
        ? element("mana-bar").classList.add("hide-in-combat")
        : element("mana-bar").classList.remove("hide-in-combat");
    runtime.currentSettings.mpticker.hideoutofcombat && !gameState.inCombat
        ? element("mp-ticker-bar").classList.add("hide-in-combat")
        : element("mp-ticker-bar").classList.remove("hide-in-combat");
    runtime.currentSettings.dotticker.hideoutofcombat && !gameState.inCombat
        ? element("dot-ticker-bar").classList.add("hide-in-combat")
        : element("dot-ticker-bar").classList.remove("hide-in-combat");
    runtime.currentSettings.hotticker.hideoutofcombat && !gameState.inCombat
        ? element("hot-ticker-bar").classList.add("hide-in-combat")
        : element("hot-ticker-bar").classList.remove("hide-in-combat");

    let bufftimers = document.querySelectorAll("[id$=buff-timer]");
    let bufftimerimages = document.querySelectorAll("[id$=buff-image]");
    if (
        runtime.currentSettings.bufftimerbar.hideoutofcombat &&
        !gameState.inCombat
    ) {
        bufftimers.forEach((bufftimer) => {
            bufftimer.classList.add("hide-in-combat");
        });
        bufftimerimages.forEach((bufftimerimage) => {
            bufftimerimage.classList.add("hide-in-combat");
        });
    } else {
        bufftimers.forEach((bufftimer) => {
            bufftimer.classList.remove("hide-in-combat");
        });
        bufftimerimages.forEach((bufftimerimage) => {
            bufftimerimage.classList.remove("hide-in-combat");
        });
    }

    let dottimers = document.querySelectorAll("[id$=dot-timer]");
    let dottimerimages = document.querySelectorAll("[id$=dot-image]");
    if (
        runtime.currentSettings.dottimerbar.hideoutofcombat &&
        !gameState.inCombat
    ) {
        dottimers.forEach((dottimer) => {
            dottimer.classList.add("hide-in-combat");
        });
        dottimerimages.forEach((dottimerimage) => {
            dottimerimage.classList.add("hide-in-combat");
        });
    } else {
        dottimers.forEach((dottimer) => {
            dottimer.classList.remove("hide-in-combat");
        });
        dottimerimages.forEach((dottimerimage) => {
            dottimerimage.classList.remove("hide-in-combat");
        });
    }

    runtime.currentSettings.stacksbar.hideoutofcombat && !gameState.inCombat
        ? element("stacks-bar").classList.add("hide-in-combat")
        : element("stacks-bar").classList.remove("hide-in-combat");
    runtime.currentSettings.raidbuffs.hideoutofcombat && !gameState.inCombat
        ? element("raid-buffs-bar").classList.add("hide-in-combat")
        : element("raid-buffs-bar").classList.remove("hide-in-combat");
    runtime.currentSettings.mitigation.hideoutofcombat && !gameState.inCombat
        ? element("mitigation-bar").classList.add("hide-in-combat")
        : element("mitigation-bar").classList.remove("hide-in-combat");
    runtime.currentSettings.customcd.hideoutofcombat && !gameState.inCombat
        ? element("customcd-bar").classList.add("hide-in-combat")
        : element("customcd-bar").classList.remove("hide-in-combat");
    runtime.currentSettings.party.hideoutofcombat && !gameState.inCombat
        ? element("party-bar").classList.add("hide-in-combat")
        : element("party-bar").classList.remove("hide-in-combat");
}

export function toggleHideWhenSoloCombatElements(toggleLock = false) {
    const show = gameState.partyList.length !== 1 || toggleLock;
    for (const [key, id] of [
        ["raidbuffs", "raid-buffs"],
        ["mitigation", "mitigation"],
        ["customcd", "customcd"],
        ["party", "party"],
    ] as const) {
        const settings = runtime.currentSettings[key];
        element(`${id}-bar`).style.display =
            settings.enabled && (!settings.hidewhensolo || show)
                ? "block"
                : "none";
    }
}

export function generateJobStacks() {
    let stacks = element("stacks-bar");
    let range = document.createRange();
    range.selectNodeContents(stacks);
    range.deleteContents();

    let stackfragment = document.createDocumentFragment();

    for (let i = 1; i <= 4; i++) {
        let stackbg = document.createElement("div");
        stackbg.id = `stacks-background-${i}`;
        stackbg.classList.add("stack-background", "stack-hidden");

        let stack = document.createElement("img");
        stack.id = `stacks-${i}`;
        stack.className = "stack-color";
        stack.src = `skins/${runtime.currentSettings.skin}/images/arrow-fill-empty.png`;

        stackbg.appendChild(stack);
        stackfragment.appendChild(stackbg);
    }
    stacks.appendChild(stackfragment);
}

export function setAndCheckTickers(setAnchor = false) {
    const tickerTypes = ["mp", "dot", "hot"] as const;
    for (let tickerType of tickerTypes) {
        let tickerBar = element(`${tickerType}-ticker-bar`);

        if (setAnchor) {
            tickerBar.style.display = "block";
            tickerBar.setAttribute(
                "data-label",
                translate(`${tickerType}ticker`),
            );
        } else {
            tickerBar.style.display = "none";
            tickerBar.setAttribute("data-label", "");
        }

        if (runtime.currentSettings[`${tickerType}ticker`].enabled) {
            if (
                runtime.currentSettings[`${tickerType}ticker`]
                    .specificjobsenabled
            ) {
                if (
                    runtime.currentSettings[
                        `${tickerType}ticker`
                    ].specificjobs.includes(gameState.player?.job ?? "")
                ) {
                    tickerBar.style.display = "block";
                } else {
                    tickerBar.style.display = "none";
                }
            }
        }
    }
}

export function reloadCooldownModules() {
    toLog([
        `[reloadCooldownModules] Zone: ${gameState.zone.type} CurrentPartyList:`,
        gameState.partyList,
    ]);
    if (gameState.player?.job === "SMN") {
        initializeSmn();
        adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
    }
    generateCustomCooldowns();
    if (gameState.zone.type == "Pvp") return;
    generateRaidBuffs();
    generateMitigation();
    generatePartyCooldowns();
}
