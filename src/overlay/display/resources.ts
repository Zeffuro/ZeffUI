import { element } from "../../shared/dom";
import { GAME_DATA, activeElements, gameState, runtime, ui } from "../state";
import { startBarTimer } from "../timers/bars";
import type { PlayerChangedDetail } from "../../plugin/types";

export function handleManaTick(current: number, max: number) {
    if (!gameState.player) return;
    if (!runtime.currentSettings.mpticker.enabled) return;
    if (runtime.currentSettings.mpticker.specificjobsenabled) {
        if (
            !runtime.currentSettings.mpticker.specificjobs.includes(
                gameState.player.job,
            )
        )
            return;
    }
    let delta = current - gameState.previous_MP;
    gameState.previous_MP = current;

    let tick = gameState.inCombat
        ? GAME_DATA.MP_DATA.combat
        : GAME_DATA.MP_DATA.normal;

    let umbralTick = 0;
    if (gameState.player.job === "BLM") {
        switch (gameState.player.jobDetail?.umbralStacks) {
            case -1: {
                umbralTick = GAME_DATA.MP_DATA.umbral_1;
                break;
            }
            case -2: {
                umbralTick = GAME_DATA.MP_DATA.umbral_2;
                break;
            }
            case -3: {
                umbralTick = GAME_DATA.MP_DATA.umbral_3;
                break;
            }
        }
    }

    let manaTick = Math.floor(max * tick) + Math.floor(max * umbralTick);
    let duration = 0;

    if (delta === manaTick) {
        duration = GAME_DATA.MP_DATA.tick;
        if (
            gameState.player.job === "BLM" &&
            (gameState.player.jobDetail?.umbralStacks ?? 0) > 0
        )
            duration = 0;
    }

    if (duration > 0) {
        if (
            runtime.currentSettings.mpticker.alwaystick &&
            activeElements.countdowns.get("mp-ticker-bar") == undefined
        ) {
            startBarTimer(duration, "mp-ticker-bar", false, true, true);
        }
        if (!runtime.currentSettings.mpticker.alwaystick) {
            startBarTimer(duration, "mp-ticker-bar", false, true, false);
        }
    }
}

export function updateHealthTags() {
    if (!gameState.player) return;
    gameState.playerTags.percentHP = Math.round(
        (100 * gameState.player.currentHP) / gameState.player.maxHP,
    );
    gameState.playerTags.deficitHP = `-${
        gameState.player.maxHP - gameState.player.currentHP
    }`;
    gameState.playerTags.currentMaxHP = `${gameState.player.currentHP} / ${gameState.player.maxHP}`;
}

export function updateManaTags() {
    if (!gameState.player) return;
    gameState.playerTags.percentMP = Math.round(
        (100 * gameState.player.currentMP) / gameState.player.maxMP,
    );
    gameState.playerTags.deficitMP = `-${
        gameState.player.maxMP - gameState.player.currentMP
    }`;
    gameState.playerTags.currentMaxMP = `${gameState.player.currentMP} / ${gameState.player.maxMP}`;
}

export function abbreviateNumber(num: number) {
    return Math.abs(num) > 999
        ? Math.sign(num) * Number((Math.abs(num) / 1000).toFixed(1)) + "k"
        : Math.sign(num) * Math.abs(num);
}

export function processTextFormat(
    text: string,
    player: Pick<
        PlayerChangedDetail,
        "name" | "job" | "currentHP" | "maxHP" | "currentMP" | "maxMP"
    > | null = gameState.player,
    tags = gameState.playerTags,
) {
    if (!player) return text;
    let tagMap = {
        "[health:current]": player.currentHP,
        "[health:current-short]": abbreviateNumber(player.currentHP),
        "[health:current-percent]":
            player.currentHP === player.maxHP
                ? `${player.currentHP}`
                : `${player.currentHP} - ${tags.percentHP}%`,
        "[health:current-percent-short]":
            player.currentHP === player.maxHP
                ? `${abbreviateNumber(player.currentHP)}`
                : `${abbreviateNumber(player.currentHP)} - ${tags.percentHP}%`,
        "[health:current-max]": tags.currentMaxHP,
        "[health:max]": player.maxHP,
        "[health:max-short]": abbreviateNumber(player.maxHP),
        "[health:percent]": tags.percentHP,
        "[health:deficit]": tags.deficitHP,
        "[mana:current]": player.currentMP,
        "[mana:current-short]": abbreviateNumber(player.currentMP),
        "[mana:current-percent]":
            player.currentMP === player.maxMP
                ? `${player.currentMP}`
                : `${player.currentMP} - ${tags.percentMP}%`,
        "[mana:current-percent-short]":
            player.currentMP === player.maxMP
                ? `${abbreviateNumber(player.currentMP)}`
                : `${abbreviateNumber(player.currentMP)} - ${tags.percentMP}%`,
        "[mana:current-max]": tags.currentMaxMP,
        "[mana:max]": player.maxMP,
        "[mana:max-short]": abbreviateNumber(player.maxMP),
        "[mana:percent]": tags.percentMP,
        "[mana:deficit]": tags.deficitMP,
        "[name]": player.name,
        "[name:veryshort]": player.name.substr(0, 5),
        "[name:short]": player.name.substr(0, 10),
        "[name:medium]": player.name.substr(0, 15),
        "[name:long]": player.name.substr(0, 20),
        "[job]": tags.job,
        "[job:short]": player.job,
        " ": " ",
    };
    for (let [key, value] of Object.entries(tagMap)) {
        text = text
            .split(key)
            .join(value === undefined ? undefined : String(value));
    }
    return text;
}

export function handleHealthUpdate(current: number, max: number) {
    if (!gameState.player || !gameState.playerPrevious) return;
    if (
        gameState.playerPrevious.currentHP !== current ||
        gameState.playerPrevious.maxHP !== max ||
        !ui.labels.health
    ) {
        let health = element("health-bar", HTMLProgressElement);
        health.value = current;
        health.max = max;
        ui.labels.health = `${gameState.player.currentHP} / ${gameState.player.maxHP}`;
        if (runtime.currentSettings.healthbar.textformat) {
            updateHealthTags();
            ui.labels.health = processTextFormat(
                runtime.currentSettings.healthbar.textformat,
            );
        }
        health.setAttribute(
            "data-label",
            runtime.currentSettings.healthbar.textenabled
                ? ui.labels.health
                : "",
        );
    }
}

export function handleManaUpdate(
    current: number,
    max: number,
    detectTick = true,
) {
    if (!gameState.player || !gameState.playerPrevious) return;
    let mana = element("mana-bar", HTMLProgressElement);
    if (detectTick) handleManaTick(current, max);
    if (
        gameState.playerPrevious.currentMP !== current ||
        gameState.playerPrevious.maxMP !== max ||
        !ui.labels.mana
    ) {
        mana.value = current;
        mana.max = max;
        ui.labels.mana = `${gameState.player.currentMP} / ${gameState.player.maxMP}`;
        if (runtime.currentSettings.manabar.textformat) {
            updateManaTags();
            ui.labels.mana = processTextFormat(
                runtime.currentSettings.manabar.textformat,
            );
        }
        mana.setAttribute(
            "data-label",
            runtime.currentSettings.manabar.textenabled ? ui.labels.mana : "",
        );
    }

    if (!runtime.currentSettings.manabar.jobthresholdsenabled) return;
    if (
        gameState.player.job === "BLM" ||
        gameState.player.job === "DRK" ||
        gameState.player.job === "PLD"
    ) {
        if (
            current <= runtime.currentSettings.manabar[gameState.player.job].low
        ) {
            mana.style.setProperty(
                "--manaBarColor",
                `var(${runtime.currentSettings.manabar.lowcolor})`,
            );
        } else if (
            current <= runtime.currentSettings.manabar[gameState.player.job].med
        ) {
            mana.style.setProperty(
                "--manaBarColor",
                `var(${runtime.currentSettings.manabar.medcolor})`,
            );
        } else {
            mana.style.setProperty(
                "--manaBarColor",
                `var(${runtime.currentSettings.manabar.color})`,
            );
        }
    }
}
