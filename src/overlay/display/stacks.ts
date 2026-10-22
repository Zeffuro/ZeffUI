import { element } from "../../shared/dom";
import { gameState, runtime } from "../state";

export function adjustJobStacks(value: number, max: number, noAdd = false) {
    if (!noAdd) {
        gameState.stats.stacks = value;
        if (
            gameState.player?.job === "SMN" &&
            gameState.stats.maxStacks === 0
        ) {
            initializeSmn(true);
            max = 4;
        }
    }

    for (let i = 1; i <= 4; i++) {
        let backgroundElement = element(`stacks-background-${i}`);
        if (i <= max) {
            if (backgroundElement.classList.contains("stack-hidden")) {
                backgroundElement.classList.remove("stack-hidden");
            }
        } else {
            if (!backgroundElement.classList.contains("stack-hidden")) {
                backgroundElement.classList.add("stack-hidden");
            }
        }
        element(`stacks-${i}`, HTMLImageElement).src =
            i <= value
                ? `skins/${runtime.currentSettings.skin}/images/arrow-fill.png`
                : `skins/${runtime.currentSettings.skin}/images/arrow-fill-empty.png`;
    }
}

export function initializeSmn(addStack = false) {
    gameState.stats.stacks = addStack ? 1 : 0;
    gameState.stats.maxStacks = 4;
}
