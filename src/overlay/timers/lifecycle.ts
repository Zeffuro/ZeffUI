import { element } from "../../shared/dom";
import { activeElements, runtime } from "../state";
import { toggleTimerBarDisplay } from "./bars";
import {
    cancelAllSpeech,
    cancelTTSTimer,
    cancelPlayerDurationSpeech,
} from "./speech";

export function getElementType(
    selector: string,
): "raidbuffs" | "mitigation" | "party" | "customcd" | undefined {
    if (selector.startsWith("raid-buffs")) return "raidbuffs";
    if (selector.startsWith("mitigation")) return "mitigation";
    if (selector.startsWith("party")) return "party";
    if (selector.startsWith("customcd")) return "customcd";
    return undefined;
}

export function stopAbilityTimer(
    selector: string,
    previousIcon: string | null = null,
    abilityIndex: string | null = null,
) {
    let elementType = getElementType(selector);
    if (!elementType) return;
    if (selector.endsWith("-duration"))
        cancelTTSTimer(selector.slice(0, -9), 1);
    if (selector.endsWith("-cooldown"))
        cancelTTSTimer(selector.slice(0, -9), 0);
    if (selector.endsWith("duration")) {
        let cooldown = selector.replace("duration", "cooldown");
        let image = selector.replace("duration", "image");
        let active = selector.replace("duration", "active");
        let overlay = selector.replace("duration", "overlay");
        let container = selector.replace("duration", "container");

        if (!runtime.currentSettings[elementType].alwaysshow) {
            if (document.getElementById(container)) {
                element(container).remove();
            }
        }
        if (document.getElementById(selector))
            element(selector).textContent = "";

        if (
            previousIcon !== null &&
            runtime.currentSettings[elementType].alwaysshow
        ) {
            element(image, HTMLImageElement).src = previousIcon;
        }
        if (document.getElementById(cooldown)) {
            element(cooldown).style.display = "block";
        }
        if (document.getElementById(active)) {
            element(active).style.display = "none";
        }
        if (document.getElementById(cooldown)) {
            if ((element(cooldown).textContent ?? "").length !== 0) {
                element(overlay, HTMLImageElement).src =
                    `skins/${runtime.currentSettings.skin}/images/icon-overlay-cooldown.png`;
            }
        }
    }
    if (selector.endsWith("cooldown")) {
        if (abilityIndex) {
            if (activeElements.currentCharges.has(abilityIndex)) {
                activeElements.currentCharges.set(
                    abilityIndex,
                    (activeElements.currentCharges.get(abilityIndex) ?? 0) + 1,
                );
            }
        }
        if (!runtime.currentSettings[elementType].alwaysshow) {
            if (document.getElementById(selector)) element(selector).remove();
            return;
        }
        if (document.getElementById(selector)) {
            element(selector).textContent = "";
            element(
                selector.replace("cooldown", "overlay"),
                HTMLImageElement,
            ).src =
                `skins/${runtime.currentSettings.skin}/images/icon-overlay.png`;
        }
    }
}

export function stopBarTimer(selector: string, hideTimer: boolean) {
    cancelTTSTimer(selector, 1);
    if (document.getElementById(selector)) {
        element(selector, HTMLProgressElement).value = 0;
        element(selector).setAttribute("data-label", "");
        if (hideTimer) toggleTimerBarDisplay(selector, false);
    }
}

export function stopPlayerDurationTimers(playerindex: number) {
    cancelPlayerDurationSpeech(playerindex);
    activeElements.partyCooldowns.forEach((value, key) => {
        if (Number(key.split("-")[0]) == playerindex) {
            if (activeElements.countdowns.has(`${value}-duration`)) {
                clearInterval(
                    activeElements.countdowns.get(`${value}-duration`),
                );
            }
            stopAbilityTimer(`${value}-duration`, null);
        }
    });

    if (playerindex === 0) {
        activeElements.countdowns.forEach((value, key) => {
            let split = key.split("-");
            let last = split[split.length - 1];
            if (last == "duration") {
                clearInterval(activeElements.countdowns.get(key));
                stopAbilityTimer(key, null);
            }
        });
    }
}

export function removeTimerBar(selector: string) {
    cancelTTSTimer(selector, 1);
    document.getElementById(selector)?.remove();
    document.getElementById(selector.replace("timer", "image"))?.remove();
    const match = selector.match(/[0-9]+/);
    if (match) {
        const id = Number(match[0]);
        activeElements.buffBars.delete(id);
        activeElements.dotBars.delete(id);
    }
}

export function resetTimers() {
    cancelAllSpeech();
    let tickerTypes = ["mp", "dot", "hot"];
    for (let tickerType of tickerTypes) {
        element(`${tickerType}-ticker-bar`, HTMLProgressElement).value = 0;
        element(`${tickerType}-ticker-bar`).setAttribute("data-label", "");
    }
    for (let [, countdownTimer] of activeElements.countdowns) {
        clearInterval(countdownTimer);
    }
    for (let [, selector] of activeElements.buffBars) {
        removeTimerBar(selector);
    }
    for (let [, selector] of activeElements.dotBars) {
        removeTimerBar(selector);
    }
    activeElements.buffBars.clear();
    activeElements.dotBars.clear();
    activeElements.countdowns.clear();
}
