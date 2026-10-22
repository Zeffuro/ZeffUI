import type {
    Combatant,
    CombatantsResponse,
    RawPartyMember,
} from "../plugin/types";
import { gameState, runtime } from "./state";
import { jobList } from "../data/jobs";
import { addPlayerPet } from "./handlers/combatants";
import { toLog } from "./debug";
import { reloadCooldownModules } from "./display/visibility";

export function generateRawPartyList(
    fromCombatants: boolean,
    combatants: Combatant[] = [],
): RawPartyMember[] {
    if (fromCombatants) {
        let partyList = combatants.filter((x) => x.PartyType !== 0);
        let rawList = [];
        for (let partyMember of partyList) {
            rawList.push({
                id: Number(partyMember.ID).toString(16).toUpperCase(),
                inParty: partyMember.PartyType === 1,
                job: partyMember.Job,
                level: partyMember.Level,
                name: partyMember.Name,
                worldId: partyMember.WorldID,
            });
        }
        return rawList;
    }
    if (!gameState.player) return [];
    const player = gameState.player;
    return [
        {
            id: Number(gameState.player.id).toString(16).toUpperCase(),
            inParty: false,
            job: parsePlayerJob(gameState.player.job).id,
            level: player.level,
            name: player.name,
            worldId: null,
        },
    ];
}

export function findPlayerJob(job: number | string | null) {
    return typeof job === "number" || (job !== null && !isNaN(Number(job)))
        ? jobList.find((x) => x.id === Number(job))
        : jobList.find((x) => x.name === job);
}

export function parsePlayerJob(job: number | string | null) {
    const parsed = findPlayerJob(job);
    if (!parsed) throw new Error(`Unknown player job: ${job}`);
    return parsed;
}

export function extractPlayerPets(combatants: Combatant[]) {
    gameState.playerPets = [];
    for (let combatant of combatants) {
        let ownerId = Number(combatant.OwnerID).toString(16).toUpperCase();
        if (gameState.partyList.filter((x) => x.id == ownerId).length > 0) {
            addPlayerPet({
                name: combatant.Name,
                id: Number(combatant.ID).toString(16).toUpperCase(),
                ownerId: ownerId,
            });
        }
    }
}

export function generatePartyList(party: RawPartyMember[]) {
    if (!gameState.player) return;
    const player = gameState.player;
    toLog(["[GeneratePartyList] RawPartyList:", party]);
    gameState.rawPartyList = party;
    gameState.partyList = [];
    for (let partyMember of party) {
        if (!findPlayerJob(partyMember.job)) continue;
        if (!(
            !partyMember.inParty &&
            !runtime.currentSettings.includealliance &&
            partyMember.name !== player.name
        )) {
            if (partyMember.level == undefined)
                partyMember.level = player.level;
            gameState.partyList.push({
                id: partyMember.id,
                inParty: partyMember.inParty,
                job: parsePlayerJob(partyMember.job),
                level: partyMember.level,
                name: partyMember.name,
                worldId: partyMember.worldId,
            });
        }
    }

    let jobOrder =
        runtime.currentSettings.rolepartyorder[
            gameState.currentrole ?? "other"
        ];
    let currentPlayerElement = gameState.partyList.find(
        (x) => x.name === player.name,
    );
    gameState.partyList.sort((a, b) => Number(b.id) - Number(a.id));
    gameState.partyList.sort(
        (a, b) => jobOrder.indexOf(a.job.name) - jobOrder.indexOf(b.job.name),
    );
    gameState.partyList = gameState.partyList.filter(
        (x) => x !== currentPlayerElement,
    );
    if (runtime.currentSettings.includealliance) {
        let ownParty = gameState.partyList.filter((x) => x.inParty);
        let alliance = gameState.partyList.filter((x) => !x.inParty);
        gameState.partyList = ownParty.concat(alliance);
    }
    if (currentPlayerElement) gameState.partyList.unshift(currentPlayerElement);
}

export function checkForParty(e: CombatantsResponse) {
    let combatants = e.combatants;
    if (combatants === undefined || !gameState.player) return;
    const playerId = gameState.player.id;
    let player = combatants.find((x) => x.ID === playerId);
    if (!player) return;
    let hasCombatants = false;
    if (Object.prototype.hasOwnProperty.call(player, "PartyType")) {
        hasCombatants = player.PartyType !== 0;
    }
    let partyList = generateRawPartyList(hasCombatants, combatants);
    generatePartyList(partyList);
    extractPlayerPets(combatants);
    reloadCooldownModules();
}

export function setCurrentRole(job: number | string | null) {
    if (job === null) return;

    const type = parsePlayerJob(job).type.toLowerCase();
    gameState.currentrole =
        type === "tank" || type === "healer"
            ? type
            : type.includes("dps")
              ? "dps"
              : "other";
}
