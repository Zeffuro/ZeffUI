import type { PlayerPet } from "../state";
import type { LogGroups } from "../../logs/dispatcher";
import { GAME_DATA, activeElements, gameState, runtime } from "../state";
import { resetTimers, stopBarTimer } from "../timers/lifecycle";
import { reloadCooldownModules } from "../display/visibility";
import { generatePartyList, findPlayerJob } from "../party";
import { toLog } from "../debug";
import { startBarTimer } from "../timers/bars";

export function onPartyWipe() {
    if (gameState.player === null) return;
    resetTimers();
    reloadCooldownModules();
}

export function onInstanceStart() {
    generatePartyList(gameState.rawPartyList);
    reloadCooldownModules();
}

export function onInstanceEnd() {
    resetTimers();
    reloadCooldownModules();
}

export function checkAndSetZoneInfo(zoneId: number | undefined) {
    if (zoneId === undefined) return;
    const info = GAME_DATA.ZONE_INFO[zoneId];
    if (info) {
        gameState.zone.info = info;
        if (info.contentType !== undefined) {
            const type = Object.entries(GAME_DATA.CONTENT_TYPE).find(
                ([, value]) => value === info.contentType,
            );
            if (type) gameState.zone.type = type[0];
        }
    }
}

export function addPlayerPet(pet: PlayerPet) {
    gameState.playerPets.push({
        name: pet.name,
        id: pet.id,
        ownerId: pet.ownerId,
    });
}

export function handleAddNewCombatant(parameters: LogGroups) {
    if (!parameters) return;
    if (
        gameState.partyList.filter((x) => x.id == parameters.ownerId).length > 0
    ) {
        addPlayerPet({
            name: parameters.name,
            id: parameters.id,
            ownerId: parameters.ownerId,
        });
    }
    if (gameState.partyList.filter((x) => x.id == parameters.id).length == 0) {
        return;
    }
    let job = findPlayerJob(parseInt(parameters.job, 16));
    if (!job) return;
    let player = gameState.partyList.find((x) => x.id == parameters.id);
    if (!player) return;
    let reload = false;
    if (player.job != job) {
        player.job = job;
        reload = true;
        toLog(
            "[handleAddNewCombatant] Party Member Job Changed, cooldowns will be reloaded",
            job,
        );
    }
    if (player.level != parseInt(parameters.level, 16)) {
        player.level = parseInt(parameters.level, 16);
        reload = true;
        toLog(
            "[handleAddNewCombatant] Party Member Level Changed, cooldowns will be reloaded",
            parseInt(parameters.level, 16),
        );
    }
    if (reload) reloadCooldownModules();
}

export function handleRemoveCombatant(parameters: LogGroups) {
    if (!parameters) return;
    let filter = gameState.playerPets.filter((x) => x.id == parameters.id);
    if (filter.length == 1) {
        gameState.playerPets.splice(gameState.playerPets.indexOf(filter[0]), 1);
    }
}

export function handleCountdownTimer(parameters: LogGroups) {
    if (!parameters) return;
    if (!runtime.currentSettings.timerbar.enabled) return;
    startBarTimer(Number(parameters.seconds), "timer-bar", true);
}

export function stopCountdownTimer() {
    if (!runtime.currentSettings.timerbar.enabled) return;
    clearInterval(activeElements.countdowns.get(`timer-bar`));
    stopBarTimer("timer-bar", true);
}

export function handleEffectTick(parameters: LogGroups) {
    if (!parameters) return;
    if (!gameState.player) return;
    const type = parameters.effect.toLowerCase();
    if (type !== "mp" && type !== "dot" && type !== "hot") return;
    if (!runtime.currentSettings[`${type}ticker`].enabled) return;
    if (runtime.currentSettings[`${type}ticker`].specificjobsenabled) {
        if (
            !runtime.currentSettings[`${type}ticker`].specificjobs.includes(
                gameState.player.job,
            )
        )
            return;
    }
    if (!activeElements.countdowns.has(`${type}-ticker-bar`)) {
        startBarTimer(
            GAME_DATA.EFFECT_TICK,
            `${type}-ticker-bar`,
            false,
            true,
            true,
        );
    }
}

export function handlePlayerStats(parameters: LogGroups) {
    if (!parameters) return;
    if (!gameState.player) return;
    const speed = GAME_DATA.SPEED_LOOKUP.get(gameState.player.level);
    if (speed === undefined) return;
    gameState.stats.skillSpeed =
        (1000 + Math.floor((130 * (Number(parameters.sks) - speed)) / 3300)) /
        1000;
    gameState.stats.spellSpeed =
        (1000 + Math.floor((130 * (Number(parameters.sps) - speed)) / 3300)) /
        1000;
}
