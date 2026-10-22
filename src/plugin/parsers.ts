import type {
    Combatant,
    OverlayEvents,
    PlayerChangedDetail,
    RawPartyMember,
} from "./types";

export function record(value: unknown): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value))
        throw new TypeError("Expected a plugin object");
    return Object.fromEntries(Object.entries(value));
}

function number(value: unknown): number {
    if (typeof value !== "number" || !Number.isFinite(value))
        throw new TypeError("Expected a finite plugin number");
    return value;
}

function string(value: unknown): string {
    if (typeof value !== "string") throw new TypeError("Expected plugin text");
    return value;
}

function boolean(value: unknown): boolean {
    if (typeof value !== "boolean")
        throw new TypeError("Expected a plugin boolean");
    return value;
}

function array(value: unknown): unknown[] {
    if (!Array.isArray(value)) throw new TypeError("Expected a plugin array");
    return value;
}

export function parseCombatants(value: unknown): { combatants: Combatant[] } {
    return {
        combatants: array(record(value).combatants).map((value): Combatant => {
            const item = record(value);
            return {
                ID: number(item.ID),
                Name: string(item.Name),
                Job: number(item.Job),
                Level: number(item.Level),
                CurrentHP: number(item.CurrentHP),
                MaxHP: number(item.MaxHP),
                CurrentMP: number(item.CurrentMP),
                MaxMP: number(item.MaxMP),
                PosX: number(item.PosX),
                PosY: number(item.PosY),
                PosZ: number(item.PosZ),
                ...(item.OwnerID === undefined
                    ? {}
                    : { OwnerID: number(item.OwnerID) }),
                ...(item.WorldID === undefined
                    ? {}
                    : { WorldID: number(item.WorldID) }),
                ...(item.PartyType === undefined
                    ? {}
                    : { PartyType: number(item.PartyType) }),
            };
        }),
    };
}

function parsePlayer(value: unknown): PlayerChangedDetail {
    const item = record(value);
    const pos = record(item.pos);
    const detail = item.jobDetail == null ? null : record(item.jobDetail);
    return {
        id: number(item.id),
        name: string(item.name),
        level: number(item.level),
        job: string(item.job),
        jobDetail:
            detail === null
                ? null
                : detail.umbralStacks === undefined
                  ? {}
                  : { umbralStacks: number(detail.umbralStacks) },
        currentHP: number(item.currentHP),
        maxHP: number(item.maxHP),
        currentMP: number(item.currentMP),
        maxMP: number(item.maxMP),
        currentCP: number(item.currentCP),
        maxCP: number(item.maxCP),
        currentGP: number(item.currentGP),
        maxGP: number(item.maxGP),
        currentShield: number(item.currentShield),
        pos: { x: number(pos.x), y: number(pos.y), z: number(pos.z) },
        ...(item.currentTP === undefined
            ? {}
            : { currentTP: number(item.currentTP) }),
        ...(item.debugJob === undefined
            ? {}
            : {
                  debugJob:
                      item.debugJob === null ? null : string(item.debugJob),
              }),
    };
}

function parseParty(value: unknown): RawPartyMember[] {
    return array(value).map((value) => {
        const item = record(value);
        return {
            id: string(item.id),
            name: string(item.name),
            job: number(item.job),
            inParty: boolean(item.inParty),
            ...(item.worldId === undefined
                ? {}
                : {
                      worldId:
                          item.worldId === null ? null : number(item.worldId),
                  }),
            ...(item.level === undefined ? {} : { level: number(item.level) }),
        };
    });
}

export const eventParsers: {
    [K in keyof OverlayEvents]: (value: unknown) => OverlayEvents[K];
} = {
    EnmityTargetData: (value) => {
        const target = record(value).Target;
        if (target == null) return { Target: null };
        const item = record(target);
        return {
            Target: {
                ID: number(item.ID),
                Name: string(item.Name),
                CurrentHP: number(item.CurrentHP),
                MaxHP: number(item.MaxHP),
                ...(item.CurrentMP == null
                    ? {}
                    : { CurrentMP: number(item.CurrentMP) }),
                ...(item.MaxMP == null ? {} : { MaxMP: number(item.MaxMP) }),
            },
        };
    },
    onPlayerChangedEvent: (value) => ({
        detail: parsePlayer(record(value).detail),
    }),
    onLogEvent: (value) => ({
        detail: { logs: array(record(record(value).detail).logs).map(string) },
    }),
    onInCombatChangedEvent: (value) => {
        const detail = record(record(value).detail);
        return {
            detail: {
                inGameCombat: boolean(detail.inGameCombat),
                ...(detail.inACTCombat === undefined
                    ? {}
                    : { inACTCombat: boolean(detail.inACTCombat) }),
            },
        };
    },
    ChangeZone: (value) => {
        const item = record(value);
        return { zoneID: number(item.zoneID), zoneName: string(item.zoneName) };
    },
    PartyChanged: (value) => ({ party: parseParty(record(value).party) }),
};
