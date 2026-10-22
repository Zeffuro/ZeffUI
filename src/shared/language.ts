import type { Locale, Settings } from "./settings";

export function gameLanguage(
    settings: Pick<Settings, "language" | "gamelanguage">,
): Locale {
    return settings.gamelanguage ?? settings.language;
}
