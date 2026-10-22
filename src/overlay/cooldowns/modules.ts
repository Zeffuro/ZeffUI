import type { IconAbility } from "./render";
import { element } from "../../shared/dom";
import { toLog } from "../debug";
import { parsePlayerJob } from "../party";
import { gameState, runtime } from "../state";
import { generateIconBarElements } from "./render";
import { abilityList } from "../../data/abilities";

export function generateCustomCooldowns() {
    if (!gameState.player) return;
    const player = gameState.player;
    toLog(["[generateCustomCooldowns]"]);
    let customAbilityList: IconAbility[] = [];

    let customcd = element("customcd-bar");
    let range = document.createRange();
    range.selectNodeContents(customcd);
    range.deleteContents();

    let playerIndex = 0;
    let currentJob = parsePlayerJob(player.job);
    if (runtime.currentSettings.customcd.abilities.length === 0) return;
    for (let ability of runtime.currentSettings.customcd.abilities.filter(
        (x) =>
            x.type === "CustomCooldown" &&
            x.level !== undefined &&
            x.level <= player.level,
    )) {
        let pushAbility = false;
        let base = "";
        if (currentJob.base) base = currentJob.base;
        if (
            ability.job === currentJob.name ||
            ability.job === currentJob.type ||
            ability.job === currentJob.position_type ||
            ability.job === base
        ) {
            if (ability.extra?.hide !== true) pushAbility = true;
        }
        if (pushAbility && ability.enabled) {
            customAbilityList.push({
                playerIndex: playerIndex,
                ability: ability,
            });
        }
    }
    if (
        runtime.currentSettings.customcd.alwaysshow &&
        runtime.currentSettings.customcd.enabled
    )
        generateIconBarElements(
            "CustomCooldown",
            customAbilityList,
            runtime.currentSettings.customcd.columns,
        );
}

export function generateMitigation() {
    if (!gameState.player) return;
    const player = gameState.player;
    toLog(["[generateMitigation]"]);
    let mitigationAbilityList: IconAbility[] = [];

    let mitigation = element("mitigation-bar");
    let range = document.createRange();
    range.selectNodeContents(mitigation);
    range.deleteContents();

    let playerIndex = 0;

    let mergedAbilityList = abilityList.concat(
        runtime.currentSettings.customcd.abilities,
    );

    let currentJob = parsePlayerJob(player.job);
    for (let ability of mergedAbilityList.filter(
        (x) =>
            x.type === "Mitigation" &&
            x.level !== undefined &&
            x.level <= player.level,
    )) {
        if (
            runtime.currentSettings.override.abilities.some(
                (x) => x.id === ability.id && x.type === ability.type,
            )
        ) {
            ability =
                runtime.currentSettings.override.abilities.find(
                    (x) => x.id === ability.id && x.type === ability.type,
                ) ?? ability;
        }
        let pushAbility = false;
        let base = "";
        if (currentJob.base) base = currentJob.base;
        if (
            ability.job === currentJob.name ||
            ability.job === currentJob.type ||
            ability.job === base
        ) {
            pushAbility = true;
        }
        if (pushAbility && ability.enabled) {
            mitigationAbilityList.push({
                playerIndex: playerIndex,
                ability: ability,
            });
        }
    }
    if (
        runtime.currentSettings.mitigation.alwaysshow &&
        runtime.currentSettings.mitigation.enabled
    )
        generateIconBarElements(
            "Mitigation",
            mitigationAbilityList,
            runtime.currentSettings.mitigation.columns,
        );
}

export function generatePartyCooldowns() {
    if (!gameState.player) return;
    const player = gameState.player;
    toLog(["[generatePartyCooldowns]"]);
    let partyAbilityList: IconAbility[] = [];

    let party = element("party-bar");
    let range = document.createRange();
    range.selectNodeContents(party);
    range.deleteContents();

    let playerIndex = 0;

    let mergedAbilityList = abilityList.concat(
        runtime.currentSettings.customcd.abilities,
    );

    for (let partyMember of gameState.partyList) {
        let base = "";
        if (partyMember.base) base = partyMember.base;
        for (let ability of mergedAbilityList.filter(
            (x) =>
                x.type === "Party" &&
                (x.job === partyMember.job.name ||
                    x.job === partyMember.job.type ||
                    x.job === partyMember.job.position_type ||
                    x.job === base) &&
                x.level !== undefined &&
                x.level <= player.level,
        )) {
            if (
                runtime.currentSettings.override.abilities.some(
                    (x) => x.id === ability.id && x.type == ability.type,
                )
            ) {
                ability =
                    runtime.currentSettings.override.abilities.find(
                        (x) =>
                            x.name === ability.name && x.type == ability.type,
                    ) ?? ability;
            }
            let pushAbility = true;
            if (
                ability.extra &&
                ability.extra.hide_at_level !== undefined &&
                partyMember.level >= ability.extra?.hide_at_level
            ) {
                pushAbility = false;
            }
            if (pushAbility && ability.enabled) {
                partyAbilityList.push({
                    playerIndex: playerIndex,
                    ability: ability,
                });
            }
        }
        playerIndex++;
    }
    if (
        runtime.currentSettings.party.alwaysshow &&
        runtime.currentSettings.party.enabled
    )
        generateIconBarElements("Party", partyAbilityList, 20);
}

export function generateRaidBuffs() {
    if (!gameState.player) return;
    const player = gameState.player;
    toLog(["[generateRaidBuffs]"]);
    let raidAbilityList: IconAbility[] = [];

    let raidbuffs = element("raid-buffs-bar");
    let range = document.createRange();
    range.selectNodeContents(raidbuffs);
    range.deleteContents();

    let playerIndex = 0;

    let mergedAbilityList = abilityList.concat(
        runtime.currentSettings.customcd.abilities,
    );

    for (let partyMember of gameState.partyList) {
        let base = "";
        if (partyMember.base) base = partyMember.base;
        for (let ability of mergedAbilityList.filter(
            (x) =>
                x.type === "RaidBuff" &&
                (x.job === partyMember.job.name ||
                    x.job === partyMember.job.type ||
                    x.job === partyMember.job.position_type ||
                    x.job === base) &&
                x.level !== undefined &&
                x.level <= player.level,
        )) {
            if (
                runtime.currentSettings.override.abilities.some(
                    (x) => x.id === ability.id && x.type == ability.type,
                )
            ) {
                ability =
                    runtime.currentSettings.override.abilities.find(
                        (x) => x.id === ability.id && x.type == ability.type,
                    ) ?? ability;
            }
            let pushAbility = true;
            if (ability.extra) {
                if (
                    ability.extra.is_card !== undefined ||
                    ability.extra.is_song !== undefined ||
                    ability.extra.is_ss !== undefined ||
                    ability.extra.is_ts !== undefined
                ) {
                    pushAbility = false;
                }
                if (
                    ability.extra &&
                    ability.extra.hide_at_level !== undefined &&
                    partyMember.level >= ability.extra?.hide_at_level
                ) {
                    pushAbility = false;
                }
            }
            if (pushAbility && ability.enabled) {
                raidAbilityList.push({
                    playerIndex: playerIndex,
                    ability: ability,
                });
            }
        }
        playerIndex++;
    }
    if (!runtime.currentSettings.raidbuffs.orderbypartymember)
        raidAbilityList.sort((a, b) => a.ability.order - b.ability.order);
    if (
        runtime.currentSettings.raidbuffs.alwaysshow &&
        runtime.currentSettings.raidbuffs.enabled
    )
        generateIconBarElements(
            "RaidBuff",
            raidAbilityList,
            runtime.currentSettings.raidbuffs.columns,
        );
}
