import type { Ability, AbilityExtra } from "./abilities";
import { isAbilityType } from "./abilities";

function record(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
        ? Object.fromEntries(Object.entries(value))
        : {};
}
function number(value: unknown, fallback = 0): number {
    const parsed =
        typeof value === "string" && value.trim() ? Number(value) : value;
    return typeof parsed === "number" && Number.isFinite(parsed)
        ? parsed
        : fallback;
}
function text(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}
function flag(value: unknown, fallback: boolean): boolean {
    return typeof value === "boolean" ? value : fallback;
}
function tuple(value: unknown): [number, number] | undefined {
    if (!Array.isArray(value) || value.length !== 2) return undefined;
    const first = number(value[0], NaN),
        second = number(value[1], NaN);
    return Number.isFinite(first) && Number.isFinite(second)
        ? [first, second]
        : undefined;
}
function extra(value: unknown): AbilityExtra | undefined {
    if (typeof value !== "object" || value === null || Array.isArray(value))
        return undefined;
    const source = record(value);
    const result: AbilityExtra = { ...source };
    for (const key of [
        "is_trait_enhanced_dur",
        "is_trait_enhanced_cd",
        "is_card",
        "shares_cooldown",
        "is_song",
        "cooldown_only",
        "is_ss",
        "status",
        "status_text",
        "is_ts",
        "hide_at_level",
        "isPetAbility",
        "hide",
        "charges",
        "extends_duration",
        "max_duration",
    ] as const)
        delete result[key];
    for (const key of [
        "is_card",
        "is_song",
        "cooldown_only",
        "is_ss",
        "is_ts",
        "isPetAbility",
        "hide",
        "extends_duration",
    ] as const) {
        if (typeof source[key] === "boolean") result[key] = source[key];
    }
    for (const key of [
        "shares_cooldown",
        "status",
        "hide_at_level",
        "charges",
        "max_duration",
    ] as const) {
        const parsed = number(source[key], NaN);
        if (Number.isFinite(parsed)) result[key] = parsed;
    }
    if (typeof source.status_text === "string")
        result.status_text = source.status_text;
    const duration = tuple(source.is_trait_enhanced_dur),
        cooldown = tuple(source.is_trait_enhanced_cd);
    if (duration) result.is_trait_enhanced_dur = duration;
    if (cooldown) result.is_trait_enhanced_cd = cooldown;
    return result;
}

export function normalizeAbilities(value: unknown): Ability[] {
    if (!Array.isArray(value)) return [];
    const abilities: Ability[] = [];
    for (const entry of value) {
        const source = record(entry);
        const id = number(source.id, NaN);
        if (
            !Number.isFinite(id) ||
            !isAbilityType(source.type) ||
            typeof source.icon !== "string"
        )
            continue;
        const name = text(source.name, text(source.name_en));
        if (!name) continue;
        abilities.push({
            ...source,
            id,
            name,
            name_en: text(source.name_en, name),
            name_cn: text(source.name_cn, name),
            name_de: text(source.name_de, name),
            name_fr: text(source.name_fr, name),
            name_jp: text(source.name_jp, name),
            name_kr: text(source.name_kr, name),
            name_tc: text(source.name_tc, text(source.name_cn, name)),
            enabled: flag(source.enabled, true),
            tts: flag(source.tts, true),
            ttstype: number(source.ttstype),
            job: text(source.job, "Tank"),
            level: number(source.level),
            duration: number(source.duration),
            cooldown: number(source.cooldown),
            type: source.type,
            icon: source.icon,
            color: text(source.color, "--filter-light-blue"),
            order: number(source.order),
            extra: extra(source.extra),
        });
    }
    return abilities;
}
