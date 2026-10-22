export type AbilityType =
    | "DoT"
    | "Buff"
    | "RaidBuff"
    | "Mitigation"
    | "Party"
    | "CustomCooldown"
    | "Stacks"
    | "StackSpender";
export interface AbilityExtra {
    is_trait_enhanced_dur?: [number, number];
    is_trait_enhanced_cd?: [number, number];
    is_card?: boolean;
    shares_cooldown?: number;
    is_song?: boolean;
    cooldown_only?: boolean;
    is_ss?: boolean;
    status?: number;
    status_text?: string;
    is_ts?: boolean;
    hide_at_level?: number;
    isPetAbility?: boolean;
    hide?: boolean;
    charges?: number;
    extends_duration?: boolean;
    max_duration?: number;
}

export interface Ability {
    id: number;
    name: string;
    name_cn: string;
    name_de: string;
    name_en: string;
    name_fr: string;
    name_jp: string;
    name_kr: string;
    name_tc: string;
    enabled: boolean;
    tts: boolean;
    ttstype: number;
    job: string;
    level?: number;
    duration?: number;
    cooldown?: number;
    type: AbilityType;
    icon: string;
    color: string;
    order: number;
    extra?: AbilityExtra;
}

export interface AbilitySearchResult {
    ID: number;
    Name: string;
    Name_cn: string;
    Name_de: string;
    Name_en: string;
    Name_fr: string;
    Name_jp: string;
    Name_kr: string;
    Name_tc: string;
    Icon: string;
    ClassJobLevel: number;
    IsPlayerAction: boolean;
    IsPvP: boolean;
    ClassJob: { Abbreviation: string | null };
    Duration: number;
    Cooldown: number;
    Charges: number;
}

export function isAbilityType(value: unknown): value is AbilityType {
    return (
        value === "DoT" ||
        value === "Buff" ||
        value === "RaidBuff" ||
        value === "Mitigation" ||
        value === "Party" ||
        value === "CustomCooldown" ||
        value === "Stacks" ||
        value === "StackSpender"
    );
}

export function parseAbilitySearchResults(
    value: unknown,
): AbilitySearchResult[] {
    if (!Array.isArray(value))
        throw new TypeError("Invalid ability search response");
    return value.map((entry: unknown) => {
        if (typeof entry !== "object" || entry === null)
            throw new TypeError("Invalid ability search entry");
        const record: Record<string, unknown> = Object.fromEntries(
            Object.entries(entry),
        );
        const text = (key: string): string =>
            typeof record[key] === "string" ? record[key] : "";
        const number = (key: string): number => {
            const raw = record[key];
            const result =
                typeof raw === "number" ||
                (typeof raw === "string" && raw.trim())
                    ? Number(raw)
                    : NaN;
            if (!Number.isFinite(result))
                throw new TypeError(`Invalid ability search field: ${key}`);
            return result;
        };
        const flag = (key: string): boolean => {
            const raw = record[key];
            if (raw === true || raw === 1 || raw === "1") return true;
            if (raw === false || raw === 0 || raw === "0") return false;
            throw new TypeError(`Invalid ability search field: ${key}`);
        };
        const name = text("Name") || text("Name_en");
        const icon = text("Icon");
        if (!name || !icon)
            throw new TypeError(
                "Ability search entry is missing its name or icon",
            );
        const job =
            typeof record.ClassJob === "object" && record.ClassJob !== null
                ? Object.fromEntries(Object.entries(record.ClassJob))
                : {};
        const optionalNumber = (key: string): number =>
            record[key] == null ? 0 : number(key);
        return {
            ID: number("ID"),
            Name: name,
            Name_cn: text("Name_cn") || name,
            Name_de: text("Name_de") || name,
            Name_en: text("Name_en") || name,
            Name_fr: text("Name_fr") || name,
            Name_jp: text("Name_jp") || text("Name_ja") || name,
            Name_kr: text("Name_kr") || name,
            Name_tc: text("Name_tc") || text("Name_cn") || name,
            Icon: icon,
            ClassJobLevel: number("ClassJobLevel"),
            IsPlayerAction: flag("IsPlayerAction"),
            IsPvP: flag("IsPvP"),
            ClassJob: {
                Abbreviation:
                    typeof job.Abbreviation === "string"
                        ? job.Abbreviation
                        : null,
            },
            Duration: optionalNumber("Duration"),
            Cooldown:
                record.Cooldown == null
                    ? optionalNumber("Recast100ms") / 10
                    : number("Cooldown"),
            Charges: optionalNumber("Charges"),
        };
    });
}
