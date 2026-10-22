export type LogGroups = Record<string, string> | undefined;
export type LogHandler = (groups: LogGroups) => void;
export type LogRegistry<Name extends string> = Record<
    string,
    { regex: RegExp; matches: ReadonlyArray<{ regex: RegExp; function: Name }> }
>;

export function createLogDispatcher<Name extends string>(
    registry: LogRegistry<Name>,
    handlers: Record<Name, LogHandler>,
    logger: (parameters: unknown[]) => void = () => {},
): (logs: readonly string[]) => void {
    const routes = Object.values(registry).map((route) => ({
        regex: new RegExp(route.regex),
        matches: route.matches.map((match) => ({
            regex: new RegExp(match.regex),
            name: match.function,
            handler: handlers[match.function],
        })),
    }));

    return (logs) => {
        for (const logLine of logs) {
            logger([`[OnLogEvent] ${logLine}`]);
            for (const route of routes) {
                route.regex.lastIndex = 0;
                if (!route.regex.test(logLine)) continue;

                for (const match of route.matches) {
                    match.regex.lastIndex = 0;
                    const result = match.regex.exec(logLine);
                    if (result === null) continue;
                    logger([`Executing function ${match.name}`, result.groups]);
                    match.handler(result.groups);
                }
            }
        }
    };
}
