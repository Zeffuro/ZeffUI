import type { Ability } from "../../shared/abilities";
import { element, translate } from "../../shared/dom";
import { toLog } from "../debug";
import {
    GAME_DATA,
    UPDATE_INTERVAL,
    activeElements,
    runtime,
    ui,
} from "../state";
import { handleAbilityTTS, processIconUrl } from "./speech";
import { applyFilterColorToElement } from "../display/layout";
import { removeTimerBar, stopAbilityTimer } from "./lifecycle";

export function startAbilityBarTimer(
    ability: Ability,
    duration: number,
    onYou: boolean,
    extends_duration = false,
    max_duration = 0,
    abilityHolder: Ability | null = null,
) {
    toLog([
        `[StartAbilityBarTimer] Duration: ${duration} On You: ${onYou}`,
        ability,
        abilityHolder,
    ]);
    if (ability.type !== "DoT" && ability.type !== "Buff") return;
    const settings =
        ability.type === "DoT"
            ? runtime.currentSettings.dottimerbar
            : runtime.currentSettings.bufftimerbar;
    let abilityUsed = abilityHolder === null ? ability : abilityHolder;
    let usingAbilityHolder = abilityHolder !== null;

    if (!settings.enabled) return;
    ability.icon = processIconUrl(ability.icon);
    if (abilityHolder) {
        abilityHolder.icon = processIconUrl(abilityHolder.icon);
    }
    let targetBarSelector = `${ability.type.toLowerCase()}-timer-bar`;
    let targetImageSelector = `${ability.type.toLowerCase()}-image`;
    let targetPosition =
        ui.dragPosition[`${ability.type.toLowerCase()}-timer-bar`];
    if (!targetPosition) return;
    let selectorBar = `${abilityUsed.id}-${ability.type.toLowerCase()}-timer`;
    let selectorImage = `${abilityUsed.id}-${ability.type.toLowerCase()}-image`;
    ability.duration = Math.trunc(duration);
    if (
        !activeElements.dotBars.has(abilityUsed.id) &&
        !activeElements.buffBars.has(abilityUsed.id)
    ) {
        switch (abilityUsed.type) {
            case "DoT": {
                activeElements.dotBars.set(abilityUsed.id, selectorBar);
                break;
            }
            case "Buff": {
                activeElements.buffBars.set(abilityUsed.id, selectorBar);
                break;
            }
        }
        let targetBar = element(targetBarSelector);
        let newBar = targetBar.cloneNode(true);
        if (!(newBar instanceof HTMLProgressElement))
            throw new Error("Invalid timer bar template");
        newBar.id = selectorBar;
        newBar.style.display = "block";
        newBar.classList.add(`bar-${ability.id}`);
        newBar.classList.add(`${ability.type.toLowerCase()}-font-size`);
        targetBar.insertAdjacentElement("afterend", newBar);

        let targetImage = element(targetImageSelector);
        let newImage = targetImage.cloneNode(true);
        if (!(newImage instanceof HTMLImageElement))
            throw new Error("Invalid timer image template");
        newImage.id = selectorImage;
        targetImage.insertAdjacentElement("afterend", newImage);

        applyFilterColorToElement(`bar-${ability.id}`, ability.color);

        newBar.setAttribute("data-font-size", String(settings.scale * 10));

        switch (settings.growdirection) {
            case 1: {
                newBar.style.transform = `translate(${targetPosition.x}px, ${
                    targetPosition.y + settings.padding * ability.order
                }px)`;
                break;
            }
            case 2: {
                newBar.style.transform = `translate(${targetPosition.x}px, ${
                    targetPosition.y - settings.padding * ability.order
                }px)`;
                break;
            }
            case 3: {
                newBar.style.transform = `translate(${
                    targetPosition.x - settings.padding * ability.order
                }px, ${targetPosition.y}px)`;
                break;
            }
            case 4: {
                newBar.style.transform = `translate(${
                    targetPosition.x + settings.padding * ability.order
                }px, ${targetPosition.y}px)`;
                break;
            }
        }

        if (settings.imageenabled) {
            newImage.style.display = "block";
            newImage.src = ability.icon;
            newImage.style.imageRendering =
                settings.scale > 1 ? "pixelated" : "-webkit-optimize-contrast";
            newImage.style.height = `${settings.scale * 22}px`;

            let left = targetPosition.x;
            let top = targetPosition.y;

            switch (settings.growdirection) {
                case 1: {
                    left = left - settings.scale * 30;
                    top =
                        top +
                        settings.padding * ability.order -
                        settings.scale * 4;
                    break;
                }
                case 2: {
                    left = left - settings.scale * 30;
                    top =
                        top -
                        settings.padding * ability.order -
                        settings.scale * 4;
                    break;
                }
                case 3: {
                    top = top - settings.scale * 4;
                    left =
                        left -
                        settings.padding * ability.order -
                        settings.scale * 30;
                    break;
                }
                case 4: {
                    top = top - settings.scale * 4;
                    left =
                        left +
                        settings.padding * ability.order -
                        settings.scale * 30;
                    break;
                }
            }
            newImage.style.transform = `translate(${left}px, ${top}px)`;
        }
    }
    if (usingAbilityHolder && settings.imageenabled)
        element(selectorImage, HTMLImageElement).src = ability.icon;
    if (abilityHolder)
        applyFilterColorToElement(`bar-${abilityUsed.id}`, ability.color);
    if (activeElements.countdowns.has(selectorBar) && extends_duration) {
        duration =
            parseInt(element(selectorBar).textContent ?? "0") / 1000 +
            Math.trunc(duration);
        if (duration > max_duration) duration = max_duration;
    }
    if (activeElements.countdowns.has(selectorBar))
        clearInterval(activeElements.countdowns.get(selectorBar));
    handleAbilityTTS(ability, selectorBar, onYou);
    startBarTimer(duration, selectorBar, settings.hidewhendroppedoff);
}

export function startAbilityTimer(
    duration: number,
    selector: string,
    previousIcon: string | null = null,
    abilityIndex: string | null = null,
) {
    if (!Number.isFinite(duration)) return;
    let timems = duration * 1000;

    let abilityElement = document.getElementById(selector);
    if (abilityElement) abilityElement.textContent = String(duration);

    let timeLeft = timems;
    let countdownTimer = setInterval(function () {
        timeLeft -= UPDATE_INTERVAL;
        if (abilityElement)
            abilityElement.textContent = (timeLeft / 1000).toFixed(0);
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            setTimeout(function () {
                stopAbilityTimer(selector, previousIcon, abilityIndex);
            }, UPDATE_INTERVAL);
        }
    }, UPDATE_INTERVAL);
    activeElements.countdowns.set(selector, countdownTimer);
}

export function toggleTimerBarDisplay(selector: string, display: boolean) {
    const bar = document.getElementById(selector);
    const image = document.getElementById(selector.replace("timer", "image"));
    if (bar) bar.style.display = display ? "block" : "none";
    if (image) image.style.display = display ? "block" : "none";
}

export function startBarTimer(
    duration: number,
    selector: string,
    hideTimer = false,
    reverseBar = false,
    loop = false,
) {
    toLog([
        `[StartBarTimer] Duration: ${duration} Selector: ${selector} Hidetimer: ${hideTimer} Reverse: ${reverseBar} Loop: ${loop}`,
    ]);
    if (!Number.isFinite(duration)) return;
    let timems = duration * 1000;
    let barElement = element(selector, HTMLProgressElement);
    barElement.value = reverseBar ? 0 : timems;
    barElement.max = timems;
    const textEnabled = () => {
        const settings =
            selector === "timer-bar"
                ? runtime.currentSettings.timerbar
                : selector.endsWith("-dot-timer")
                  ? runtime.currentSettings.dottimerbar
                  : runtime.currentSettings.bufftimerbar;
        return settings.textenabled;
    };
    if (!selector.endsWith("ticker-bar"))
        barElement.setAttribute(
            "data-label",
            textEnabled() ? String(timems) : "",
        );

    if (hideTimer) toggleTimerBarDisplay(selector, true);

    let timeLeft = timems;
    let maxTime = timems;
    let countdownTimer = setInterval(function () {
        timeLeft -= UPDATE_INTERVAL;
        let visualTime = 0;
        if (reverseBar) {
            visualTime = maxTime - timeLeft;
        } else {
            visualTime = timeLeft - UPDATE_INTERVAL;
        }

        if (barElement.value != visualTime) barElement.value = visualTime;

        if (!selector.endsWith("ticker-bar"))
            barElement.setAttribute(
                "data-label",
                textEnabled() ? (timeLeft / 1000).toFixed(1) : "",
            );
        if (timeLeft <= 0 && !loop) {
            clearInterval(countdownTimer);
            setTimeout(function () {
                if (hideTimer) {
                    if (selector !== "timer-bar") {
                        removeTimerBar(selector);
                    } else {
                        toggleTimerBarDisplay(selector, false);
                    }
                }
            }, UPDATE_INTERVAL);
        }
        if (timeLeft <= 0 && loop) {
            timeLeft = GAME_DATA.EFFECT_TICK * 1000;
        }
    }, UPDATE_INTERVAL);
    activeElements.countdowns.set(selector, countdownTimer);
}
