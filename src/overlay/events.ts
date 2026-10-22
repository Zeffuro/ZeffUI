import type {
    PlayerChangedDetail,
    CombatantsResponse,
    RawPartyMember,
} from "../plugin/types";
import { callOverlayHandler } from "../plugin/bridge";
import { element, translate } from "../shared/dom";
import { createLogDispatcher } from "../logs/dispatcher";
import { regexList } from "../logs/registry";
import { logHandlers } from "../logs/handlers";
import { gameState, runtime } from "./state";
import { checkAndSetZoneInfo } from "./handlers/combatants";
import { adjustJobStacks, initializeSmn } from "./display/stacks";
import { resetTimers } from "./timers/lifecycle";
import { cancelAllSpeech } from "./timers/speech";
import {
    reloadCooldownModules,
    setAndCheckTickers,
    toggleHideOutOfCombatElements,
    toggleHideWhenSoloCombatElements,
} from "./display/visibility";
import { toLog } from "./debug";
import { loadProfile } from "./preferences/menu";
import {
    checkForParty,
    findPlayerJob,
    generatePartyList,
    generateRawPartyList,
    parsePlayerJob,
    setCurrentRole,
} from "./party";
import { handleHealthUpdate, handleManaUpdate } from "./display/resources";
import { onTargetChanged } from "./display/target";

export function onChangeZone(e: { zoneID: number; zoneName: string }) {
    cancelAllSpeech();
    onTargetChanged({ Target: null });
    gameState.zone = {
        id: e.zoneID,
        name: e.zoneName,
        info: undefined,
        type: "Unspecified",
    };
    if (gameState.player === null) return;
    checkAndSetZoneInfo(e.zoneID);
    if (gameState.player.job === "SMN") {
        initializeSmn();
        adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
    }
    resetTimers();
}

export function onInCombatChangedEvent(e: {
    detail: { inGameCombat: boolean };
}) {
    if (gameState.inCombat === e.detail.inGameCombat) {
        return;
    }

    gameState.inCombat = e.detail.inGameCombat;
    toggleHideOutOfCombatElements();
}

const dispatchLogs = createLogDispatcher(regexList, logHandlers, toLog);

export function onLogEvent(e: { detail: { logs: string[] } }) {
    dispatchLogs(e.detail.logs);
}

export function onJobChange(job: string) {
    if (language.find((x) => x.id === job.toLowerCase())) {
        gameState.playerTags.job = translate(job.toLowerCase());
    }
    if (
        Object.prototype.hasOwnProperty.call(
            runtime.currentSettings.profiles.jobprofiles,
            job.toLowerCase(),
        )
    ) {
        loadProfile(
            runtime.currentSettings.profiles.jobprofiles[job.toLowerCase()],
        );
    }
    setAndCheckTickers();

    if (job === "SMN") {
        initializeSmn();
        adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
        if (runtime.currentSettings.stacksbar.enabled) {
            element("stacks-bar").style.display = "block";
        } else {
            element("stacks-bar").style.display = "none";
        }
    } else {
        if (runtime.currentSettings.stacksbar.enabled) {
            element("stacks-bar").style.display = "block";
        } else {
            element("stacks-bar").style.display = "none";
        }
    }
    resetTimers();
    if (gameState.partyList.length === 1) {
        gameState.partyList = [];
    }
}

export function onPartyChanged(e: { party: RawPartyMember[] }) {
    toLog(["[onPartyChanged]", e]);
    if (gameState.player === null) return;
    let partyList = e.party;
    if (partyList.length === 0) {
        partyList = generateRawPartyList(false);
    }
    generatePartyList(partyList);
    reloadCooldownModules();
    toggleHideWhenSoloCombatElements();
}

export function getPlayerChangedEventFromCombatants(
    details: CombatantsResponse,
) {
    if (details.combatants.length === 0) return;

    let player = details.combatants[0];
    const knownJob = findPlayerJob(player.Job);
    if (!knownJob) return;
    let job = knownJob.name;
    let e = {
        detail: {
            currentCP: player.CurrentMP,
            currentGP: player.CurrentMP,
            currentHP: player.CurrentHP,
            currentMP: player.CurrentMP,
            currentShield: 0,
            currentTP: 0,
            debugJob: null,
            id: player.ID,
            job: job,
            jobDetail: null,
            level: player.Level,
            maxCP: player.MaxMP,
            maxGP: player.MaxMP,
            maxHP: player.MaxHP,
            maxMP: player.MaxMP,
            name: player.Name,
            pos: {
                x: player.PosX,
                y: player.PosY,
                z: player.PosZ,
            },
        },
    };
    onPlayerChangedEvent(e);
}

export function onPlayerChangedEvent(e: { detail: PlayerChangedDetail }) {
    if (!window.language || !findPlayerJob(e.detail.job)) return;
    if (gameState.player !== null && gameState.player.job !== e.detail.job) {
        onJobChange(e.detail.job);
        setCurrentRole(e.detail.job);
    }
    gameState.playerPrevious = gameState.player ? gameState.player : e.detail;
    gameState.player = e.detail;
    if (gameState.currentrole === null) {
        onJobChange(e.detail.job);
        setCurrentRole(e.detail.job);
    }
    if (gameState.partyList.length === 0) {
        setAndCheckTickers();
        callOverlayHandler({ call: "getCombatants" }).then((e) =>
            checkForParty(e),
        );
    }

    // Check for CP/GP
    if (gameState.player.maxGP) {
        gameState.player.currentMP = gameState.player.currentGP;
        gameState.player.maxMP = gameState.player.maxGP;
    }
    if (gameState.player.maxCP) {
        gameState.player.currentMP = gameState.player.currentCP;
        gameState.player.maxMP = gameState.player.maxCP;
    }

    handleHealthUpdate(gameState.player.currentHP, gameState.player.maxHP);
    handleManaUpdate(gameState.player.currentMP, gameState.player.maxMP);
}
