import { runtime } from "./state";
import { onLogEvent } from "./events";

export function toLog(parameters: Iterable<unknown>, ..._unused: unknown[]) {
    if (runtime.hasSettings) {
        if (!runtime.currentSettings.debug.enabled) return;
        for (let parameter of parameters) {
            console.log(parameter);
        }
    }
}

export function testLog(logLine: string) {
    let logEvent = {
        type: "onLogEvent",
        detail: {
            logs: [logLine],
        },
    };
    onLogEvent(logEvent);
}
