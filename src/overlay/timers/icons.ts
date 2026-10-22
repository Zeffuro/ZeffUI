import type { Ability } from "../../shared/abilities";
import { element } from "../../shared/dom";
import { toLog } from "../debug";
import { handleAbilityTTS, processIconUrl } from "./speech";
import { getSelectorProperties } from "../display/visibility";
import { activeElements, runtime } from "../state";
import { stopAbilityTimer } from "./lifecycle";
import { generateAbilityIcon } from "../cooldowns/render";
import { startAbilityTimer } from "./bars";

export function startAbilityIconTimers(
    playerIndex: number,
    ability: Ability | undefined,
    onYou = true,
    abilityHolder: Ability | null | undefined = null,
    ignoreCooldown = false,
) {
    if (
        !ability ||
        ability.type === "DoT" ||
        ability.type === "Buff" ||
        ability.type === "Stacks" ||
        ability.type === "StackSpender"
    )
        return;
    toLog([
        `[StartAbilityIconTimers] PlayerIndex: ${playerIndex} On You: ${onYou} Ignore Cooldown: ${ignoreCooldown}`,
        ability,
        abilityHolder,
    ]);
    let abilityUsed = abilityHolder == null ? ability : abilityHolder;
    let usingAbilityHolder = abilityHolder != null;

    ability.icon = processIconUrl(ability.icon);
    if (abilityHolder) {
        abilityHolder.icon = processIconUrl(abilityHolder.icon);
    }

    let selectorProperties = getSelectorProperties(ability.type);
    let barSelector = selectorProperties.id;
    let selectedSettings = selectorProperties.settings;
    let selectedActive = selectorProperties.active;

    if (!selectedSettings.enabled) return;
    if (playerIndex == -1) return;
    if (barSelector === "customcd" && playerIndex !== 0) return;

    let selector = `${barSelector}-${playerIndex}-${abilityUsed.id}`;

    let abilityIndex = `${playerIndex}-${ability.id}`;
    let abilityHasCharges = false;
    if (ability.extra) {
        if (ability.extra.charges !== undefined) {
            abilityHasCharges = true;
            let max_charges = ability.extra.charges;
            if (!activeElements.currentCharges.has(abilityIndex)) {
                activeElements.currentCharges.set(
                    abilityIndex,
                    max_charges - 1,
                );
            } else {
                let currentCharges =
                    activeElements.currentCharges.get(abilityIndex);
                activeElements.currentCharges.set(
                    abilityIndex,
                    (currentCharges ?? max_charges) - 1,
                );
            }
        }
    }
    if (
        selectedActive.has(`${playerIndex}-${ability.id}`) &&
        !abilityHasCharges
    ) {
        if (activeElements.countdowns.has(`${selector}-duration`)) {
            clearInterval(
                activeElements.countdowns.get(`${selector}-duration`),
            );
            stopAbilityTimer(`${selector}-duration`, null);
        }
        if (
            activeElements.countdowns.has(`${selector}-cooldown`) &&
            !ignoreCooldown
        ) {
            clearInterval(
                activeElements.countdowns.get(`${selector}-cooldown`),
            );
        }
        if (!ignoreCooldown) stopAbilityTimer(`${selector}-cooldown`, null);
    }

    handleAbilityTTS(ability, selector, onYou);

    if (onYou) {
        if (!selectedSettings.alwaysshow) {
            let row = Math.ceil(
                selectedActive.size / (selectedSettings.columns ?? 20),
            );
            let abilityElement = generateAbilityIcon(
                playerIndex,
                ability,
                row,
                true,
            );
            if (row === 0) row = 1;
            if (!document.getElementById(`${selector}-container`)) {
                element(`${barSelector}-row-${row}-box`).appendChild(
                    abilityElement,
                );
            }
        }

        if (document.getElementById(`${selector}-overlay`))
            element(`${selector}-overlay`, HTMLImageElement).src =
                `skins/${runtime.currentSettings.skin}/images/icon-overlay.png`;

        if (document.getElementById(`${selector}-active`))
            element(`${selector}-active`).style.display = "block";
        if (document.getElementById(`${selector}-duration`)) {
            element(`${selector}-duration`).style.display = "block";
            element(`${selector}-duration`).textContent = String(
                ability.duration,
            );
        }

        if (document.getElementById(`${selector}-cooldown`))
            element(`${selector}-cooldown`).style.display = "none";

        if (abilityHolder) {
            let previousIcon = `${abilityHolder.icon}`;
            if (document.getElementById(`${selector}-image`)) {
                element(`${selector}-image`, HTMLImageElement).src =
                    ability.icon;
            }
            if (ability.duration !== undefined)
                startAbilityTimer(
                    ability.duration,
                    `${selector}-duration`,
                    previousIcon,
                    abilityIndex,
                );
        } else {
            if (ability.duration !== undefined)
                startAbilityTimer(
                    ability.duration,
                    `${selector}-duration`,
                    null,
                    abilityIndex,
                );
        }
    } else {
        if (document.getElementById(`${selector}-overlay`)) {
            element(`${selector}-overlay`, HTMLImageElement).src =
                (ability.cooldown ?? 0) > 0
                    ? `skins/${runtime.currentSettings.skin}/images/icon-overlay-cooldown.png`
                    : `skins/${runtime.currentSettings.skin}/images/icon-overlay.png`;
        }
        if (document.getElementById(`${selector}-cooldown`)) {
            element(`${selector}-cooldown`).style.display = "block";
            element(`${selector}-cooldown`).textContent = String(
                ability.cooldown,
            );
        }
    }
    if (
        selectedSettings.alwaysshow &&
        !ignoreCooldown &&
        ability.cooldown !== undefined
    )
        startAbilityTimer(
            ability.cooldown,
            `${selector}-cooldown`,
            null,
            abilityIndex,
        );

    selectedActive.set(`${playerIndex}-${ability.id}`, selector);
}
