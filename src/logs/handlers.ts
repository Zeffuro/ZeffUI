import { handleSettings } from "../overlay/preferences/menu";
import { handleSkill } from "../overlay/handlers/actions";
import {
    handleGainEffect,
    handleLoseEffect,
    handleDeath,
} from "../overlay/handlers/effects";
import {
    handleAddNewCombatant,
    handleRemoveCombatant,
    handleCountdownTimer,
    stopCountdownTimer,
    onInstanceStart,
    onInstanceEnd,
    onPartyWipe,
    handleEffectTick,
    handlePlayerStats,
} from "../overlay/handlers/combatants";
import type { LogHandler } from "./dispatcher";
import type { LogHandlerName } from "./registry";

export const logHandlers = {
    handleSettings,
    handleSkill,
    handleGainEffect,
    handleLoseEffect,
    handleDeath,
    handleAddNewCombatant,
    handleRemoveCombatant,
    handleCountdownTimer,
    stopCountdownTimer,
    onInstanceStart,
    onInstanceEnd,
    onPartyWipe,
    handleEffectTick,
    handlePlayerStats,
} satisfies Record<LogHandlerName, LogHandler>;
