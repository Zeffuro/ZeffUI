import type { TargetCombatant } from "../../plugin/types";
import { callOverlayHandler } from "../../plugin/bridge";
import { gameState, runtime, ui } from "../state";
import { processTextFormat } from "./resources";

const bars = [
    ["targethealthbar", "target-health-bar", "targetHealth", "health"],
    ["targetmanabar", "target-mana-bar", "targetMana", "mana"],
] as const;
let pendingMana = false;
let targetRevision = 0;

const sampleTarget: TargetCombatant = {
    ID: 1,
    Name: "Target",
    CurrentHP: 75,
    MaxHP: 100,
    CurrentMP: 80,
    MaxMP: 100,
};

export function applyTargetBarSettings() {
    for (const [key, id, prefix] of bars) {
        const bar = document.getElementById(id);
        if (!bar) continue;
        const settings = runtime.currentSettings[key];
        ui.dragPosition[id] = { x: settings.x, y: settings.y };
        bar.style.width = `${settings.scale * 160}px`;
        bar.style.height = `${settings.scale * 15}px`;
        bar.style.transformOrigin = "top left";
        bar.style.transform = `translate(${settings.x}px, ${settings.y}px) rotate(${settings.rotation}deg)`;
        bar.style.textAlign = settings.align;
        bar.style.setProperty(`--${prefix}BarColor`, `var(${settings.color})`);
        bar.style.setProperty(`--${prefix}Font`, settings.font);
        bar.style.setProperty(
            `--${prefix}FontSize`,
            `${settings.staticfontsize ? settings.fontsize : settings.scale * 10}px`,
        );
        const offset = settings.scale * 8 + settings.fontxoffset;
        const x =
            settings.align === "center"
                ? settings.fontxoffset
                : settings.align === "right"
                  ? -Math.abs(offset)
                  : offset;
        bar.style.setProperty(`--${prefix}FontX`, `${x}px`);
        bar.style.setProperty(
            `--${prefix}FontY`,
            `${settings.scale * -14 + settings.fontyoffset}px`,
        );
    }
    renderTargetBars();
}

export function renderTargetBars() {
    const target = gameState.target ?? (!ui.locked ? sampleTarget : null);
    for (const [key, id, , resource] of bars) {
        const bar = document.getElementById(id);
        if (!(bar instanceof HTMLProgressElement)) continue;
        const settings = runtime.currentSettings[key];
        const max =
            resource === "health" ? (target?.MaxHP ?? 0) : (target?.MaxMP ?? 0);
        const current =
            resource === "health"
                ? (target?.CurrentHP ?? 0)
                : (target?.CurrentMP ?? 0);
        const visible = settings.enabled && target !== null && max > 0;
        bar.style.display = visible ? "block" : "none";
        bar.classList.toggle(
            "hide-in-combat",
            settings.hideoutofcombat && !gameState.inCombat,
        );
        bar.max = max > 0 ? max : 1;
        bar.value = Math.max(0, Math.min(current, max));
        if (!visible || !settings.textenabled || !target) {
            bar.setAttribute("data-label", "");
            continue;
        }
        const player = {
            name: target.Name,
            job: "",
            currentHP: target.CurrentHP,
            maxHP: target.MaxHP,
            currentMP: target.CurrentMP ?? 0,
            maxMP: target.MaxMP ?? 0,
        };
        const tags = {
            job: "",
            percentHP:
                player.maxHP > 0
                    ? Math.round((100 * player.currentHP) / player.maxHP)
                    : 0,
            percentMP:
                player.maxMP > 0
                    ? Math.round((100 * player.currentMP) / player.maxMP)
                    : 0,
            currentMaxHP: `${player.currentHP} / ${player.maxHP}`,
            currentMaxMP: `${player.currentMP} / ${player.maxMP}`,
            deficitHP: `-${player.maxHP - player.currentHP}`,
            deficitMP: `-${player.maxMP - player.currentMP}`,
        };
        bar.setAttribute(
            "data-label",
            settings.textformat
                ? processTextFormat(settings.textformat, player, tags)
                : `${current} / ${max}`,
        );
    }
}

export function onTargetChanged(event: { Target: TargetCombatant | null }) {
    const previous = gameState.target;
    const target = event.Target;
    if (
        target?.ID !== previous?.ID ||
        (target?.CurrentMP !== undefined && target.MaxMP !== undefined)
    )
        targetRevision++;
    gameState.target =
        target && target.ID === previous?.ID
            ? {
                  ...target,
                  CurrentMP: target.CurrentMP ?? previous.CurrentMP,
                  MaxMP: target.MaxMP ?? previous.MaxMP,
              }
            : target;
    renderTargetBars();
    if (
        target &&
        (target.CurrentMP === undefined || target.MaxMP === undefined)
    )
        void updateTargetMana(true);
}

export async function updateTargetMana(refresh = false) {
    const target = gameState.target;
    if (
        !target ||
        pendingMana ||
        !runtime.currentSettings.targetmanabar.enabled
    )
        return;
    if (
        !refresh &&
        target.CurrentMP !== undefined &&
        target.MaxMP !== undefined
    )
        return;
    pendingMana = true;
    const revision = targetRevision;
    try {
        const result = await callOverlayHandler({
            call: "getCombatants",
            ids: [target.ID],
        });
        const combatant = result.combatants.find(
            (value) => value.ID === target.ID,
        );
        if (
            combatant &&
            gameState.target?.ID === target.ID &&
            targetRevision === revision
        ) {
            gameState.target.CurrentMP = combatant.CurrentMP;
            gameState.target.MaxMP = combatant.MaxMP;
            renderTargetBars();
        }
    } catch (error) {
        console.warn("Could not read target MP.", error);
    } finally {
        pendingMana = false;
    }
}
