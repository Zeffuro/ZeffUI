import type { OverlayHandler } from "../plugin/types";
import type { Locale } from "./settings";

export function isLocale(value: unknown): value is Locale {
    return (
        typeof value === "string" &&
        ["en", "de", "fr", "jp", "cn", "kr", "tc"].includes(value)
    );
}

export async function getACTLocale(handler: OverlayHandler): Promise<Locale> {
    const { language } = await handler({ call: "getLanguage" });
    console.log(`Detected ACT Language: ${language}`);
    switch (language) {
        case "German":
            return "de";
        case "French":
            return "fr";
        case "Japanese":
            return "jp";
        case "Chinese":
            return "cn";
        case "Korean":
            return "kr";
        case "TraditionalChinese":
            return "tc";
        default:
            return "en";
    }
}
