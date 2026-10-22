import { callOverlayHandler } from "../plugin/bridge";
import { loadSettings } from "./preferences/load";
import {
    generateJobStacks,
    toggleHideOutOfCombatElements,
} from "./display/visibility";
import { GAME_DATA, gameState } from "./state";
import { getPlayerChangedEventFromCombatants } from "./events";
import { content_type } from "../data/content-type";
import { zone_info } from "../data/zones";
import { checkAndSetZoneInfo } from "./handlers/combatants";

export async function startZeffUI() {
    initializeContentZoneImports();
    startOverlayEvents();
    await loadSettings();
    generateJobStacks();
    toggleHideOutOfCombatElements();
    console.log("ZeffUI fully loaded.");
}

export async function initializePlayerFallback() {
    if (gameState.player !== null) return;
    const combatants = await callOverlayHandler({ call: "getCombatants" });
    if (gameState.player === null)
        getPlayerChangedEventFromCombatants(combatants);
}

export function initializeContentZoneImports() {
    Object.assign(GAME_DATA.CONTENT_TYPE, content_type);
    Object.assign(GAME_DATA.ZONE_INFO, zone_info);
    if (gameState.zone !== undefined) checkAndSetZoneInfo(gameState.zone.id);
}
