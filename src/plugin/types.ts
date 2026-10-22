export interface Combatant {
    ID: number;
    Name: string;
    Job: number;
    Level: number;
    OwnerID?: number;
    WorldID?: number;
    PartyType?: number;
    CurrentHP: number;
    MaxHP: number;
    CurrentMP: number;
    MaxMP: number;
    PosX: number;
    PosY: number;
    PosZ: number;
}

export interface CombatantsResponse {
    combatants: Combatant[];
}

export interface PlayerChangedDetail {
    id: number;
    name: string;
    level: number;
    job: string;
    jobDetail: { umbralStacks?: number } | null;
    currentHP: number;
    maxHP: number;
    currentMP: number;
    maxMP: number;
    currentCP: number;
    maxCP: number;
    currentGP: number;
    maxGP: number;
    currentShield: number;
    currentTP?: number;
    debugJob?: string | null;
    pos: { x: number; y: number; z: number };
}

export interface RawPartyMember {
    id: string;
    name: string;
    job: number;
    inParty: boolean;
    worldId?: number | null;
    level?: number;
}

export interface TargetCombatant {
    ID: number;
    Name: string;
    CurrentHP: number;
    MaxHP: number;
    CurrentMP?: number;
    MaxMP?: number;
}

export interface OverlayEvents {
    EnmityTargetData: { Target: TargetCombatant | null };
    onPlayerChangedEvent: { detail: PlayerChangedDetail };
    onLogEvent: { detail: { logs: string[] } };
    onInCombatChangedEvent: {
        detail: { inGameCombat: boolean; inACTCombat?: boolean };
    };
    ChangeZone: { zoneID: number; zoneName: string };
    PartyChanged: { party: RawPartyMember[] };
}

export type OverlayRequest =
    | { call: "getCombatants"; ids?: number[]; names?: string[] }
    | { call: "getLanguage" }
    | { call: "getVersion" }
    | { call: "loadData"; key: string }
    | { call: "saveData"; key: string; data: unknown }
    | { call: "cactbotSay" | "say"; text: string };

export interface OverlayHandler {
    (
        request: Extract<OverlayRequest, { call: "getCombatants" }>,
    ): Promise<{ combatants: Combatant[] }>;
    (
        request: Extract<OverlayRequest, { call: "getLanguage" }>,
    ): Promise<{ language: string }>;
    (
        request: Extract<OverlayRequest, { call: "loadData" }>,
    ): Promise<{ data?: unknown } | null>;
    (
        request: Extract<
            OverlayRequest,
            { call: "getVersion" | "saveData" | "cactbotSay" | "say" }
        >,
    ): Promise<unknown>;
}

export type RawOverlayHandler = (request: OverlayRequest) => Promise<unknown>;
export type PartyMember = Omit<RawPartyMember, "job" | "level"> & {
    job: import("../data/jobs").Job;
    level: number;
    base?: string;
};
