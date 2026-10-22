import type {
    Combatant,
    OverlayEvents,
    OverlayHandler,
    OverlayRequest,
    RawOverlayHandler,
} from "./types";
import { eventParsers, parseCombatants, record } from "./parsers";

export function createOverlayHandler(raw: RawOverlayHandler): OverlayHandler {
    function call(
        request: Extract<OverlayRequest, { call: "getCombatants" }>,
    ): Promise<{ combatants: Combatant[] }>;
    function call(
        request: Extract<OverlayRequest, { call: "getLanguage" }>,
    ): Promise<{ language: string }>;
    function call(
        request: Extract<OverlayRequest, { call: "loadData" }>,
    ): Promise<{ data?: unknown } | null>;
    function call(
        request: Extract<
            OverlayRequest,
            { call: "getVersion" | "saveData" | "cactbotSay" | "say" }
        >,
    ): Promise<unknown>;
    async function call(request: OverlayRequest): Promise<unknown> {
        const response = await raw(request);
        switch (request.call) {
            case "getCombatants":
                return parseCombatants(response);
            case "getLanguage": {
                const result = record(response);
                if (typeof result.language !== "string")
                    throw new TypeError("Invalid plugin language response");
                return { language: result.language };
            }
            case "loadData":
                return response == null ? null : record(response);
            default:
                return response;
        }
    }
    return call;
}

export const callOverlayHandler = createOverlayHandler((request) =>
    window.callOverlayHandler(request),
);

export function openerOverlayHandler(): OverlayHandler | null {
    const opener: unknown = window.opener;
    if (typeof opener !== "object" || opener === null) return null;
    const handler: unknown = Reflect.get(opener, "callOverlayHandler");
    if (typeof handler !== "function") return null;
    return createOverlayHandler(async (request) => {
        const result: unknown = Reflect.apply(handler, opener, [request]);
        return await result;
    });
}

export function addOverlayListener<K extends keyof OverlayEvents>(
    name: K,
    handler: (event: OverlayEvents[K]) => void,
): void {
    window.addOverlayListener(name, (value: unknown) =>
        handler(eventParsers[name](value)),
    );
}
