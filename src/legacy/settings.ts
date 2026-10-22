import type { RawOverlayHandler } from "../plugin/types";

const pluginKey = "zeffUI-legacy";
const backupKey = "zeffUI-legacy-settings";

function hasData(value: unknown): value is { data: unknown } {
    return (
        typeof value === "object" &&
        value !== null &&
        "data" in value &&
        value.data != null
    );
}

function checkResult(value: unknown) {
    if (typeof value === "object" && value !== null && "$error" in value)
        throw new Error(String(value.$error));
}

export function isolateLegacySettings(
    handler: RawOverlayHandler,
    storage: Pick<Storage, "getItem" | "setItem">,
): RawOverlayHandler {
    if (storage.getItem(backupKey) === null) {
        const previous = storage.getItem("settings");
        if (previous !== null) storage.setItem(backupKey, previous);
    }
    let pending = Promise.resolve();
    return (request) => {
        if (
            (request.call !== "loadData" && request.call !== "saveData") ||
            request.key !== "zeffUI"
        )
            return handler(request);
        const operation = pending.then(async () => {
            const result = await handler({ ...request, key: pluginKey });
            checkResult(result);
            if (request.call !== "loadData" || hasData(result)) return result;
            const previous = await handler(request);
            checkResult(previous);
            let data = hasData(previous) ? previous.data : undefined;
            if (data === undefined) {
                const backup = storage.getItem(backupKey);
                if (backup !== null) {
                    try {
                        data = JSON.parse(backup);
                    } catch {}
                }
            }
            if (data == null) return result;
            const saved = await handler({
                call: "saveData",
                key: pluginKey,
                data,
            });
            checkResult(saved);
            storage.setItem(backupKey, JSON.stringify(data));
            return { data };
        });
        pending = operation.then(
            () => undefined,
            () => undefined,
        );
        return operation;
    };
}

window.callOverlayHandler = isolateLegacySettings(
    window.callOverlayHandler,
    localStorage,
);
