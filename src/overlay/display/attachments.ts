import { attachedBarPosition } from "../../shared/bar-attachment";
import { runtime, ui } from "../state";

const pairs = [
    ["healthbar", "manabar", "health-bar", "mana-bar"],
    [
        "targethealthbar",
        "targetmanabar",
        "target-health-bar",
        "target-mana-bar",
    ],
] as const;

export function applyManaAttachments() {
    for (const [healthKey, manaKey, healthId, manaId] of pairs) {
        const health = runtime.currentSettings[healthKey];
        const mana = runtime.currentSettings[manaKey];
        if (!mana.attachment.enabled) continue;
        const healthBar = document.getElementById(healthId);
        const manaBar = document.getElementById(manaId);
        if (!healthBar || !manaBar) continue;
        const geometry = (
            bar: HTMLElement,
            value: typeof health,
            id: string,
        ) => {
            const style = getComputedStyle(bar);
            const transform =
                style.transform === "none"
                    ? null
                    : new DOMMatrix(style.transform);
            const pixels = (property: string) =>
                parseFloat(style.getPropertyValue(property)) || 0;
            const extra = (axis: "width" | "height") => {
                if (style.boxSizing === "border-box") return 0;
                const sides =
                    axis === "width" ? ["left", "right"] : ["top", "bottom"];
                return sides.reduce(
                    (sum, side) =>
                        sum +
                        pixels(`padding-${side}`) +
                        pixels(`border-${side}-width`),
                    0,
                );
            };
            return {
                ...(transform
                    ? { x: transform.m41, y: transform.m42 }
                    : (ui.dragPosition[id] ?? value)),
                width:
                    (parseFloat(style.width) || value.scale * 160) +
                    extra("width"),
                height:
                    (parseFloat(style.height) || value.scale * 15) +
                    extra("height"),
                rotation: value.rotation,
            };
        };
        const position = attachedBarPosition(
            geometry(healthBar, health, healthId),
            geometry(manaBar, mana, manaId),
            mana.attachment,
        );
        ui.dragPosition[manaId] = position;
        manaBar.style.transform = `translate(${position.x}px, ${position.y}px) rotate(${mana.rotation}deg)`;
    }
}

export function dragAttachedMana(id: string, dx: number, dy: number) {
    const pair = pairs.find((entry) => entry[3] === id);
    if (!pair) return false;
    const attachment = runtime.currentSettings[pair[1]].attachment;
    if (!attachment.enabled) return false;
    attachment.x += dx;
    attachment.y += dy;
    applyManaAttachments();
    return true;
}
