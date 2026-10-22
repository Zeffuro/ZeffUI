export type SettingsAction = "hello" | "preview" | "commit" | "close";
export interface SettingsPacket {
    type: "zeffui-settings";
    session: string;
    action: SettingsAction;
    settings?: unknown;
}

export function settingsPacket(value: unknown): SettingsPacket | null {
    if (typeof value !== "object" || value === null) return null;
    const record = Object.fromEntries(Object.entries(value));
    if (record.type !== "zeffui-settings" || typeof record.session !== "string")
        return null;
    const action = record.action;
    if (
        action !== "hello" &&
        action !== "preview" &&
        action !== "commit" &&
        action !== "close"
    )
        return null;
    return {
        type: "zeffui-settings",
        session: record.session,
        action,
        settings: record.settings,
    };
}

export const settingsOrigin =
    location.origin === "null" ? "*" : location.origin;
