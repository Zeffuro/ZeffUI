import type { Settings, Role } from "../shared/settings";
import type { Ability, AbilitySearchResult } from "../shared/abilities";
import type { OverlayHandler } from "../plugin/types";

let currentSettings: Settings | null = null;
let handler: OverlayHandler | null = null;

export interface SettingsState {
    currentSettings: Settings;
    currentFont: Record<string, string>;
    currentPartyRole: Role;
    foundAbilities: AbilitySearchResult[];
    removedAbility: Ability | undefined;
    callCurrentOverlayHandler: OverlayHandler;
}

export const state: SettingsState = {
    get currentSettings() {
        if (!currentSettings) throw new Error("Settings have not loaded yet");
        return currentSettings;
    },
    set currentSettings(value: Settings) {
        currentSettings = value;
    },
    currentFont: {},
    currentPartyRole: "tank",
    foundAbilities: [],
    removedAbility: undefined,
    get callCurrentOverlayHandler() {
        if (!handler)
            throw new Error("Overlay plugin handler has not initialized");
        return handler;
    },
    set callCurrentOverlayHandler(value: OverlayHandler) {
        handler = value;
    },
};

export function translation(id: string): string {
    return language.find((entry) => entry.id === id)?.string ?? id;
}

/* prettier-ignore */
export const defaultJobOrder = [
	// Tanks
	"PLD", "GLA", "WAR", "MRD", "DRK", "GNB",
	// Healers
	"WHM", "CNJ", "SCH", "AST", "SGE",
	// Melee DPS
	"MNK", "PGL", "DRG", "LNC", "NIN", "ROG", "SAM", "RPR", "VPR", "BST",
	// Physical Ranged DPS
	"BRD", "ARC", "MCH", "DNC",
	// Caster DPS
	"BLM", "THM", "SMN", "ACN", "RDM", "PCT", "BLU"
];
