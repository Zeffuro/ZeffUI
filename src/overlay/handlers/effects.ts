import type { LogGroups } from "../../logs/dispatcher";
import { gameLanguage } from "../../shared/language";
import { activeElements, gameState, runtime } from "../state";
import { abilityList } from "../../data/abilities";
import { startAbilityIconTimers } from "../timers/icons";
import { adjustJobStacks, initializeSmn } from "../display/stacks";
import { startAbilityBarTimer } from "../timers/bars";
import { getSelectorProperties } from "../display/visibility";
import {
    stopAbilityTimer,
    stopBarTimer,
    stopPlayerDurationTimers,
} from "../timers/lifecycle";

export function handleGainEffect(parameters: LogGroups) {
    if (!parameters) return;
    if (gameState.player === null) return;
    let byYou = parameters.player === gameState.player.name;
    let onYou = parameters.target === gameState.player.name;
    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );

    let mergedAbilityList = abilityList.concat(
        runtime.currentSettings.customcd.abilities,
    );

    for (let ability of mergedAbilityList.filter(
        (x) =>
            (
                x[`name_${gameLanguage(runtime.currentSettings)}`] ||
                x.name_en ||
                x.name ||
                ""
            ).toLowerCase() == parameters.effect.toLowerCase(),
    )) {
        if (ability === undefined) continue;
        if (
            runtime.currentSettings.override.abilities.some(
                (x) => x.name === ability.name && x.type == ability.type,
            )
        ) {
            ability =
                runtime.currentSettings.override.abilities.find(
                    (x) => x.name === ability.name && x.type == ability.type,
                ) ?? ability;
        }
        if (!ability.enabled) continue;
        if (ability.extra) {
            if (ability.extra.is_trait_enhanced_cd !== undefined) {
                if (
                    gameState.partyList[playerIndex]?.level >=
                    ability.extra.is_trait_enhanced_cd[0]
                ) {
                    ability.cooldown = ability.extra.is_trait_enhanced_cd[1];
                }
            }
            if (ability.extra.is_trait_enhanced_dur !== undefined) {
                if (
                    gameState.partyList[playerIndex]?.level >=
                    ability.extra.is_trait_enhanced_dur[0]
                ) {
                    if (
                        Object.prototype.hasOwnProperty.call(
                            ability,
                            "duration",
                        )
                    ) {
                        ability.duration =
                            ability.extra.is_trait_enhanced_dur[1];
                    }
                }
            }
        }
        if (ability.type === "RaidBuff") {
            if (
                ability.name === "Standard Step" ||
                ability.name === "Technical Step" ||
                ability.name === "Embolden"
            )
                continue;
            if (ability.extra) {
                if (ability.extra.isPetAbility) {
                    let pet = gameState.playerPets.find(
                        (x) => x.id == parameters.playerId,
                    );
                    if (pet) {
                        playerIndex = gameState.partyList.findIndex(
                            (x) => x.id == pet.ownerId,
                        );
                        startAbilityIconTimers(playerIndex, ability, true);
                    }
                }
                if (ability.extra.is_card) continue;
                if (ability.extra.is_song) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.name === "Song",
                    );
                    if (byYou) {
                        continue;
                    }
                    if (onYou) {
                        ability.duration = 5;
                        startAbilityIconTimers(
                            playerIndex,
                            ability,
                            true,
                            runtime.currentSettings.raidbuffs.alwaysshow
                                ? abilityHolder
                                : ability,
                        );
                    }
                }
            }
            if (onYou) startAbilityIconTimers(playerIndex, ability, true);
        }
        if (ability.type === "Mitigation") {
            if (onYou || byYou) {
                if (ability.extra) {
                    if (ability.extra.shares_cooldown) {
                        startAbilityIconTimers(playerIndex, ability, true);
                        startAbilityIconTimers(
                            playerIndex,
                            mergedAbilityList.find(
                                (x) => x.id === ability.extra?.shares_cooldown,
                            ),
                            false,
                        );
                    }
                } else {
                    startAbilityIconTimers(playerIndex, ability, true);
                }
            }
        }
        if (ability.type === "Stacks" && byYou) {
            if (!gameState.blockRuinGained)
                adjustJobStacks(
                    gameState.stats.stacks + 1,
                    gameState.stats.maxStacks,
                );
        }
        if (
            (ability.type === "DoT" && byYou) ||
            (ability.type === "Buff" && byYou)
        ) {
            ability.duration = Number(parameters.duration);
            if (ability.extra) {
                if (ability.extra.shares_cooldown) {
                    startAbilityBarTimer(
                        ability,
                        Number(parameters.duration),
                        onYou,
                        false,
                        0,
                        mergedAbilityList.find(
                            (x) => x.id === ability.extra?.shares_cooldown,
                        ),
                    );
                    continue;
                }
                if (ability.extra.extends_duration) {
                    startAbilityBarTimer(
                        ability,
                        Number(parameters.duration),
                        onYou,
                        true,
                        ability.extra.max_duration,
                    );
                    continue;
                }
            }
            startAbilityBarTimer(ability, Number(parameters.duration), onYou);
        }
    }
}

export function handleLoseEffect(parameters: LogGroups) {
    if (!parameters) return;
    if (gameState.player === null) return;

    let onYou = parameters.target === gameState.player.name;
    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );
    let mergedAbilityList = abilityList.concat(
        runtime.currentSettings.customcd.abilities,
    );
    for (let ability of mergedAbilityList.filter(
        (x) =>
            (
                x[`name_${gameLanguage(runtime.currentSettings)}`] ||
                x.name_en ||
                x.name ||
                ""
            ).toLowerCase() == parameters.effect.toLowerCase(),
    )) {
        if (ability.name == "Standard Step") return;
        if (ability.name == "Technical Step") return;
        if (ability.type == "RaidBuff" && !onYou) return;
        if (ability.type === "Stacks" || ability.type === "StackSpender")
            continue;
        let selectorProperties = getSelectorProperties(ability.type);
        let barSelector = selectorProperties.id;
        let abilitySelector = `${barSelector}-${playerIndex}-${ability.id}`;

        if (activeElements.countdowns.has(`${abilitySelector}-duration`)) {
            clearInterval(
                activeElements.countdowns.get(`${abilitySelector}-duration`),
            );
            stopAbilityTimer(`${abilitySelector}-duration`, null);
        }
        if (activeElements.countdowns.has(`${ability.id}-buff-timer`)) {
            clearInterval(
                activeElements.countdowns.get(`${ability.id}-buff-timer`),
            );
            let hideTimer =
                "hidewhendroppedoff" in selectorProperties.settings &&
                selectorProperties.settings.hidewhendroppedoff;
            stopBarTimer(`${ability.id}-buff-timer`, hideTimer);
        }
    }
}

export function handleDeath(parameters: LogGroups) {
    if (!parameters || !gameState.player) return;
    let you = parameters.target === gameState.player.name;
    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );
    stopPlayerDurationTimers(playerIndex);
    if (you) {
        if (gameState.player.job === "SMN") {
            initializeSmn();
            adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
        }
    }
}
