import type { LogGroups } from "../../logs/dispatcher";
import { activeElements, gameState, runtime } from "../state";
import { abilityList } from "../../data/abilities";
import { adjustJobStacks } from "../display/stacks";
import { startAbilityIconTimers } from "../timers/icons";
import { stopAbilityTimer } from "../timers/lifecycle";

export function handleSkill(parameters: LogGroups) {
    if (!parameters) return;
    if (gameState.player === null) return;
    let byYou = parameters.player === gameState.player.name;
    let onYou = false;
    if (parameters.target) {
        if (parameters.target === gameState.player.name) onYou = true;
    }

    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );

    let mergedAbilityList = abilityList.concat(
        runtime.currentSettings.customcd.abilities,
    );

    for (let ability of mergedAbilityList.filter(
        (x) => x.id == parseInt(parameters.skillid, 16),
    )) {
        if (ability === undefined) continue;
        if (
            runtime.currentSettings.override.abilities.some(
                (x) => x.id == ability.id && x.type == ability.type,
            )
        ) {
            ability =
                runtime.currentSettings.override.abilities.find(
                    (x) => x.id == ability.id && x.type == ability.type,
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
                    ability.duration = ability.extra.is_trait_enhanced_dur[1];
                }
            }
        }
        if (ability.name === "Shoha" && byYou) {
            adjustJobStacks(0, gameState.stats.maxStacks);
        }
        if (ability.name === "Ruin IV" && byYou) {
            adjustJobStacks(
                gameState.stats.stacks - 1,
                gameState.stats.maxStacks,
            );
            gameState.blockRuinGained = true;
            setTimeout(function () {
                gameState.blockRuinGained = false;
            }, 1000);
        }
        if (ability.type === "RaidBuff") {
            if (ability.extra) {
                if (ability.extra.is_card) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.name === "Play",
                    );
                    if (onYou) {
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
                if (ability.extra.cooldown_only) {
                    startAbilityIconTimers(playerIndex, ability, false);
                }
                if (ability.extra.is_song) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.name === "Song",
                    );
                    if (byYou) {
                        if (!runtime.currentSettings.raidbuffs.alwaysshow) {
                            for (let song of mergedAbilityList.filter(
                                (x) =>
                                    Object.prototype.hasOwnProperty.call(
                                        x,
                                        "extra",
                                    ) &&
                                    Object.prototype.hasOwnProperty.call(
                                        x.extra,
                                        "is_song",
                                    ),
                            )) {
                                let selector = `raid-buffs-${playerIndex}-${song.id}`;
                                if (
                                    activeElements.countdowns.has(
                                        `${selector}-duration`,
                                    )
                                ) {
                                    clearInterval(
                                        activeElements.countdowns.get(
                                            `${selector}-duration`,
                                        ),
                                    );
                                }
                                if (
                                    activeElements.countdowns.has(
                                        `${selector}-cooldown`,
                                    )
                                ) {
                                    clearInterval(
                                        activeElements.countdowns.get(
                                            `${selector}-cooldown`,
                                        ),
                                    );
                                }
                                stopAbilityTimer(`${selector}-cooldown`, null);
                                stopAbilityTimer(`${selector}-duration`, null);
                            }
                        }
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
                if (ability.extra.is_ss) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.id === 15997,
                    );
                    startAbilityIconTimers(
                        playerIndex,
                        ability,
                        true,
                        runtime.currentSettings.raidbuffs.alwaysshow
                            ? abilityHolder
                            : ability,
                        true,
                    );
                }
                if (ability.extra.is_ts) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.id === 15998,
                    );
                    startAbilityIconTimers(
                        playerIndex,
                        ability,
                        true,
                        runtime.currentSettings.raidbuffs.alwaysshow
                            ? abilityHolder
                            : ability,
                        byYou,
                    );
                }
            } else {
                if (
                    (!onYou && ability.name === "Dragon Sight") ||
                    (byYou && ability.name === "Battle Voice")
                ) {
                    onYou = false;
                } else {
                    onYou = true;
                }
                startAbilityIconTimers(playerIndex, ability, onYou);
            }
        }
        if (ability.type === "Mitigation") {
            if (onYou || byYou)
                startAbilityIconTimers(playerIndex, ability, true);
        }
        if (ability.type === "Party") {
            startAbilityIconTimers(playerIndex, ability, true);
        }
        if (ability.type === "CustomCooldown") {
            if (ability.extra) {
                if (ability.extra.shares_cooldown) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.id === ability.extra?.shares_cooldown,
                    );
                    startAbilityIconTimers(
                        playerIndex,
                        ability,
                        true,
                        runtime.currentSettings.customcd.alwaysshow
                            ? abilityHolder
                            : ability,
                    );
                    continue;
                }
            }
            startAbilityIconTimers(playerIndex, ability, true);
        }
    }
}
