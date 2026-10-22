import { callOverlayHandler } from "../plugin/bridge";
import type { OverlayHandler } from "../plugin/types";
import {
    settingDefaults,
    type Settings,
    type Locale,
    type ProfileSettings,
} from "./settings";
import { normalizeAbilities } from "./settings-input";
import { normalizeBarAttachment } from "./bar-attachment";
import { getACTLocale, isLocale } from "./locale";
export { isLocale } from "./locale";

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectValue(value: unknown): Record<string, unknown> {
    return isRecord(value) ? value : {};
}
type FieldKeys<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];
function values<T extends object>(raw: unknown, defaults: T) {
    const source = objectValue(raw);
    return {
        source,
        number(key: FieldKeys<T, number>): number {
            const fallback = defaults[key];
            const value = source[String(key)];
            const parsed =
                typeof value === "string" && value.trim()
                    ? Number(value)
                    : value;
            return typeof parsed === "number" && Number.isFinite(parsed)
                ? parsed
                : typeof fallback === "number"
                  ? fallback
                  : 0;
        },
        string(key: FieldKeys<T, string>): string {
            const value = source[String(key)],
                fallback = defaults[key];
            return typeof value === "string"
                ? value
                : typeof fallback === "string"
                  ? fallback
                  : "";
        },
        boolean(key: FieldKeys<T, boolean>): boolean {
            const value = source[String(key)],
                fallback = defaults[key];
            return typeof value === "boolean"
                ? value
                : typeof fallback === "boolean"
                  ? fallback
                  : false;
        },
        strings(key: FieldKeys<T, string[]>): string[] {
            const value = source[String(key)],
                fallback = defaults[key];
            if (
                Array.isArray(value) &&
                value.every((item: unknown) => typeof item === "string")
            )
                return [...value];
            return Array.isArray(fallback) &&
                fallback.every((item: unknown) => typeof item === "string")
                ? [...fallback]
                : [];
        },
    };
}
function at(value: unknown, ...path: string[]): unknown {
    for (const key of path) value = isRecord(value) ? value[key] : undefined;
    return value;
}

function resourceBar(raw: unknown, defaults: Settings["healthbar"]) {
    const bar = values(raw, defaults);
    return {
        ...bar.source,
        enabled: bar.boolean("enabled"),
        hideoutofcombat: bar.boolean("hideoutofcombat"),
        textenabled: bar.boolean("textenabled"),
        color: bar.string("color"),
        textformat: bar.string("textformat"),
        scale: bar.number("scale"),
        rotation: bar.number("rotation"),
        x: bar.number("x"),
        y: bar.number("y"),
        align: bar.string("align"),
        font: bar.string("font"),
        fontxoffset: bar.number("fontxoffset"),
        fontyoffset: bar.number("fontyoffset"),
        staticfontsize: bar.boolean("staticfontsize"),
        fontsize: bar.number("fontsize"),
    };
}

function insertMissingJobs(jobs: string[]) {
    for (const [job, predecessor] of [
        ["SGE", "AST"],
        ["RPR", "SAM"],
        ["PCT", "RDM"],
        ["VPR", "RPR"],
        ["BST", "VPR"],
    ]) {
        if (!jobs.includes(job))
            jobs.splice(jobs.indexOf(predecessor) + 1, 0, job);
    }
}

export function normalizeSettings(
    value: unknown,
    locale: Locale = "en",
    includeProfiles = true,
): Settings {
    const source = isRecord(value) ? value : {};
    const override = values(at(source, "override"), settingDefaults.override);
    const general = values(at(source, "general"), settingDefaults.general);
    const root = values(source, settingDefaults);
    const debug = values(at(source, "debug"), settingDefaults.debug);
    const rolepartyorder = values(
        at(source, "rolepartyorder"),
        settingDefaults.rolepartyorder,
    );
    const healthbar = values(
        at(source, "healthbar"),
        settingDefaults.healthbar,
    );
    const manabar = values(at(source, "manabar"), settingDefaults.manabar);
    const manabarBLM = values(
        at(source, "manabar", "BLM"),
        settingDefaults.manabar.BLM,
    );
    const manabarPLD = values(
        at(source, "manabar", "PLD"),
        settingDefaults.manabar.PLD,
    );
    const manabarDRK = values(
        at(source, "manabar", "DRK"),
        settingDefaults.manabar.DRK,
    );
    const mpticker = values(at(source, "mpticker"), settingDefaults.mpticker);
    const dotticker = values(
        at(source, "dotticker"),
        settingDefaults.dotticker,
    );
    const hotticker = values(
        at(source, "hotticker"),
        settingDefaults.hotticker,
    );
    const timerbar = values(at(source, "timerbar"), settingDefaults.timerbar);
    const dottimerbar = values(
        at(source, "dottimerbar"),
        settingDefaults.dottimerbar,
    );
    const bufftimerbar = values(
        at(source, "bufftimerbar"),
        settingDefaults.bufftimerbar,
    );
    const stacksbar = values(
        at(source, "stacksbar"),
        settingDefaults.stacksbar,
    );
    const raidbuffs = values(
        at(source, "raidbuffs"),
        settingDefaults.raidbuffs,
    );
    const mitigation = values(
        at(source, "mitigation"),
        settingDefaults.mitigation,
    );
    const party = values(at(source, "party"), settingDefaults.party);
    const customcd = values(at(source, "customcd"), settingDefaults.customcd);
    const settings: Settings = {
        ...source,
        profiles: { currentprofile: "", profiles: {}, jobprofiles: {} },
        language: isLocale(source.language) ? source.language : locale,
        gamelanguage: isLocale(source.gamelanguage)
            ? source.gamelanguage
            : null,
        override: {
            ...override.source,
            enabled: override.boolean("enabled"),
            abilities: normalizeAbilities(at(source, "override", "abilities")),
        },
        general: {
            ...general.source,
            usewebtts: general.boolean("usewebtts"),
            webttslanguage:
                general.source.webttslanguage === "game" ||
                isLocale(general.source.webttslanguage)
                    ? general.source.webttslanguage
                    : general.source.webttslanguage === undefined &&
                        general.boolean("usewebtts")
                      ? "cn"
                      : "game",
            ttsfallback: general.boolean("ttsfallback"),
            ttsearly: general.number("ttsearly"),
            preventdoubletts: general.boolean("preventdoubletts"),
            usehdicons: general.boolean("usehdicons"),
            customcss: general.string("customcss"),
        },
        skin: root.string("skin"),
        font: root.string("font"),
        customfonts: root.strings("customfonts"),
        debug: {
            ...debug.source,
            enabled: debug.boolean("enabled"),
        },
        partyorder: root.strings("partyorder"),
        rolepartyorder: {
            ...rolepartyorder.source,
            tank: rolepartyorder.strings("tank"),
            healer: rolepartyorder.strings("healer"),
            dps: rolepartyorder.strings("dps"),
            other: rolepartyorder.strings("other"),
        },
        targethealthbar: resourceBar(
            at(source, "targethealthbar"),
            settingDefaults.targethealthbar,
        ),
        targetmanabar: {
            ...resourceBar(
                at(source, "targetmanabar"),
                settingDefaults.targetmanabar,
            ),
            attachment: normalizeBarAttachment(
                at(source, "targetmanabar", "attachment"),
            ),
        },
        healthbar: {
            ...healthbar.source,
            enabled: healthbar.boolean("enabled"),
            hideoutofcombat: healthbar.boolean("hideoutofcombat"),
            textenabled: healthbar.boolean("textenabled"),
            color: healthbar.string("color"),
            textformat: healthbar.string("textformat"),
            scale: healthbar.number("scale"),
            rotation: healthbar.number("rotation"),
            x: healthbar.number("x"),
            y: healthbar.number("y"),
            align: healthbar.string("align"),
            font: healthbar.string("font"),
            fontxoffset: healthbar.number("fontxoffset"),
            fontyoffset: healthbar.number("fontyoffset"),
            staticfontsize: healthbar.boolean("staticfontsize"),
            fontsize: healthbar.number("fontsize"),
        },
        manabar: {
            ...manabar.source,
            attachment: normalizeBarAttachment(
                at(source, "manabar", "attachment"),
            ),
            enabled: manabar.boolean("enabled"),
            hideoutofcombat: manabar.boolean("hideoutofcombat"),
            textenabled: manabar.boolean("textenabled"),
            color: manabar.string("color"),
            textformat: manabar.string("textformat"),
            scale: manabar.number("scale"),
            rotation: manabar.number("rotation"),
            x: manabar.number("x"),
            y: manabar.number("y"),
            align: manabar.string("align"),
            font: manabar.string("font"),
            fontxoffset: manabar.number("fontxoffset"),
            fontyoffset: manabar.number("fontyoffset"),
            staticfontsize: manabar.boolean("staticfontsize"),
            fontsize: manabar.number("fontsize"),
            jobthresholdsenabled: manabar.boolean("jobthresholdsenabled"),
            lowcolor: manabar.string("lowcolor"),
            medcolor: manabar.string("medcolor"),
            BLM: {
                ...manabarBLM.source,
                low: manabarBLM.number("low"),
                med: manabarBLM.number("med"),
            },
            PLD: {
                ...manabarPLD.source,
                low: manabarPLD.number("low"),
                med: manabarPLD.number("med"),
            },
            DRK: {
                ...manabarDRK.source,
                low: manabarDRK.number("low"),
                med: manabarDRK.number("med"),
            },
        },
        mpticker: {
            ...mpticker.source,
            enabled: mpticker.boolean("enabled"),
            hideoutofcombat: mpticker.boolean("hideoutofcombat"),
            color: mpticker.string("color"),
            scale: mpticker.number("scale"),
            rotation: mpticker.number("rotation"),
            x: mpticker.number("x"),
            y: mpticker.number("y"),
            specificjobsenabled: mpticker.boolean("specificjobsenabled"),
            specificjobs: mpticker.strings("specificjobs"),
            alwaystick: mpticker.boolean("alwaystick"),
        },
        dotticker: {
            ...dotticker.source,
            enabled: dotticker.boolean("enabled"),
            hideoutofcombat: dotticker.boolean("hideoutofcombat"),
            color: dotticker.string("color"),
            scale: dotticker.number("scale"),
            rotation: dotticker.number("rotation"),
            x: dotticker.number("x"),
            y: dotticker.number("y"),
            specificjobsenabled: dotticker.boolean("specificjobsenabled"),
            specificjobs: dotticker.strings("specificjobs"),
        },
        hotticker: {
            ...hotticker.source,
            enabled: hotticker.boolean("enabled"),
            hideoutofcombat: hotticker.boolean("hideoutofcombat"),
            color: hotticker.string("color"),
            scale: hotticker.number("scale"),
            rotation: hotticker.number("rotation"),
            x: hotticker.number("x"),
            y: hotticker.number("y"),
            specificjobsenabled: hotticker.boolean("specificjobsenabled"),
            specificjobs: hotticker.strings("specificjobs"),
        },
        timerbar: {
            ...timerbar.source,
            enabled: timerbar.boolean("enabled"),
            textenabled: timerbar.boolean("textenabled"),
            color: timerbar.string("color"),
            scale: timerbar.number("scale"),
            rotation: timerbar.number("rotation"),
            x: timerbar.number("x"),
            y: timerbar.number("y"),
            font: timerbar.string("font"),
            fontxoffset: timerbar.number("fontxoffset"),
            fontyoffset: timerbar.number("fontyoffset"),
            staticfontsize: timerbar.boolean("staticfontsize"),
            fontsize: timerbar.number("fontsize"),
        },
        dottimerbar: {
            ...dottimerbar.source,
            enabled: dottimerbar.boolean("enabled"),
            hideoutofcombat: dottimerbar.boolean("hideoutofcombat"),
            hidewhendroppedoff: dottimerbar.boolean("hidewhendroppedoff"),
            textenabled: dottimerbar.boolean("textenabled"),
            imageenabled: dottimerbar.boolean("imageenabled"),
            ttsenabled: dottimerbar.boolean("ttsenabled"),
            multidotenabled: dottimerbar.boolean("multidotenabled"),
            growdirection: dottimerbar.number("growdirection"),
            padding: dottimerbar.number("padding"),
            scale: dottimerbar.number("scale"),
            rotation: dottimerbar.number("rotation"),
            x: dottimerbar.number("x"),
            y: dottimerbar.number("y"),
            font: dottimerbar.string("font"),
            fontxoffset: dottimerbar.number("fontxoffset"),
            fontyoffset: dottimerbar.number("fontyoffset"),
            staticfontsize: dottimerbar.boolean("staticfontsize"),
            fontsize: dottimerbar.number("fontsize"),
        },
        bufftimerbar: {
            ...bufftimerbar.source,
            enabled: bufftimerbar.boolean("enabled"),
            hideoutofcombat: bufftimerbar.boolean("hideoutofcombat"),
            hidewhendroppedoff: bufftimerbar.boolean("hidewhendroppedoff"),
            textenabled: bufftimerbar.boolean("textenabled"),
            imageenabled: bufftimerbar.boolean("imageenabled"),
            ttsenabled: bufftimerbar.boolean("ttsenabled"),
            growdirection: bufftimerbar.number("growdirection"),
            padding: bufftimerbar.number("padding"),
            scale: bufftimerbar.number("scale"),
            rotation: bufftimerbar.number("rotation"),
            x: bufftimerbar.number("x"),
            y: bufftimerbar.number("y"),
            font: bufftimerbar.string("font"),
            fontxoffset: bufftimerbar.number("fontxoffset"),
            fontyoffset: bufftimerbar.number("fontyoffset"),
            staticfontsize: bufftimerbar.boolean("staticfontsize"),
            fontsize: bufftimerbar.number("fontsize"),
        },
        stacksbar: {
            ...stacksbar.source,
            enabled: stacksbar.boolean("enabled"),
            hideoutofcombat: stacksbar.boolean("hideoutofcombat"),
            color: stacksbar.string("color"),
            scale: stacksbar.number("scale"),
            x: stacksbar.number("x"),
            y: stacksbar.number("y"),
        },
        raidbuffs: {
            ...raidbuffs.source,
            enabled: raidbuffs.boolean("enabled"),
            ttsenabled: raidbuffs.boolean("ttsenabled"),
            alwaysshow: raidbuffs.boolean("alwaysshow"),
            hideoutofcombat: raidbuffs.boolean("hideoutofcombat"),
            hidewhensolo: raidbuffs.boolean("hidewhensolo"),
            orderbypartymember: raidbuffs.boolean("orderbypartymember"),
            growleft: raidbuffs.boolean("growleft"),
            padding: raidbuffs.number("padding"),
            scale: raidbuffs.number("scale"),
            columns: raidbuffs.number("columns"),
            x: raidbuffs.number("x"),
            y: raidbuffs.number("y"),
            font: raidbuffs.string("font"),
            fontxoffset: raidbuffs.number("fontxoffset"),
            fontyoffset: raidbuffs.number("fontyoffset"),
            staticfontsize: raidbuffs.boolean("staticfontsize"),
            fontsize: raidbuffs.number("fontsize"),
            durationoutline: raidbuffs.boolean("durationoutline"),
            cooldownoutline: raidbuffs.boolean("cooldownoutline"),
            durationbold: raidbuffs.boolean("durationbold"),
            cooldownbold: raidbuffs.boolean("cooldownbold"),
            durationcolor: raidbuffs.string("durationcolor"),
            cooldowncolor: raidbuffs.string("cooldowncolor"),
            durationoutlinecolor: raidbuffs.string("durationoutlinecolor"),
            cooldownoutlinecolor: raidbuffs.string("cooldownoutlinecolor"),
        },
        mitigation: {
            ...mitigation.source,
            enabled: mitigation.boolean("enabled"),
            ttsenabled: mitigation.boolean("ttsenabled"),
            alwaysshow: mitigation.boolean("alwaysshow"),
            hideoutofcombat: mitigation.boolean("hideoutofcombat"),
            hidewhensolo: mitigation.boolean("hidewhensolo"),
            growleft: mitigation.boolean("growleft"),
            padding: mitigation.number("padding"),
            scale: mitigation.number("scale"),
            columns: mitigation.number("columns"),
            x: mitigation.number("x"),
            y: mitigation.number("y"),
            font: mitigation.string("font"),
            fontxoffset: mitigation.number("fontxoffset"),
            fontyoffset: mitigation.number("fontyoffset"),
            staticfontsize: mitigation.boolean("staticfontsize"),
            fontsize: mitigation.number("fontsize"),
            durationoutline: mitigation.boolean("durationoutline"),
            cooldownoutline: mitigation.boolean("cooldownoutline"),
            durationbold: mitigation.boolean("durationbold"),
            cooldownbold: mitigation.boolean("cooldownbold"),
            durationcolor: mitigation.string("durationcolor"),
            cooldowncolor: mitigation.string("cooldowncolor"),
            durationoutlinecolor: mitigation.string("durationoutlinecolor"),
            cooldownoutlinecolor: mitigation.string("cooldownoutlinecolor"),
        },
        party: {
            ...party.source,
            enabled: party.boolean("enabled"),
            ttsenabled: party.boolean("ttsenabled"),
            alwaysshow: party.boolean("alwaysshow"),
            hideoutofcombat: party.boolean("hideoutofcombat"),
            hidewhensolo: party.boolean("hidewhensolo"),
            growleft: party.boolean("growleft"),
            padding: party.number("padding"),
            scale: party.number("scale"),
            x: party.number("x"),
            y: party.number("y"),
            font: party.string("font"),
            fontxoffset: party.number("fontxoffset"),
            fontyoffset: party.number("fontyoffset"),
            staticfontsize: party.boolean("staticfontsize"),
            fontsize: party.number("fontsize"),
            durationoutline: party.boolean("durationoutline"),
            cooldownoutline: party.boolean("cooldownoutline"),
            durationbold: party.boolean("durationbold"),
            cooldownbold: party.boolean("cooldownbold"),
            durationcolor: party.string("durationcolor"),
            cooldowncolor: party.string("cooldowncolor"),
            durationoutlinecolor: party.string("durationoutlinecolor"),
            cooldownoutlinecolor: party.string("cooldownoutlinecolor"),
        },
        customcd: {
            ...customcd.source,
            abilities: normalizeAbilities(at(source, "customcd", "abilities")),
            enabled: customcd.boolean("enabled"),
            ttsenabled: customcd.boolean("ttsenabled"),
            alwaysshow: customcd.boolean("alwaysshow"),
            hideoutofcombat: customcd.boolean("hideoutofcombat"),
            hidewhensolo: customcd.boolean("hidewhensolo"),
            growleft: customcd.boolean("growleft"),
            padding: customcd.number("padding"),
            scale: customcd.number("scale"),
            columns: customcd.number("columns"),
            x: customcd.number("x"),
            y: customcd.number("y"),
            font: customcd.string("font"),
            fontxoffset: customcd.number("fontxoffset"),
            fontyoffset: customcd.number("fontyoffset"),
            staticfontsize: customcd.boolean("staticfontsize"),
            fontsize: customcd.number("fontsize"),
            durationoutline: customcd.boolean("durationoutline"),
            cooldownoutline: customcd.boolean("cooldownoutline"),
            durationbold: customcd.boolean("durationbold"),
            cooldownbold: customcd.boolean("cooldownbold"),
            durationcolor: customcd.string("durationcolor"),
            cooldowncolor: customcd.string("cooldowncolor"),
            durationoutlinecolor: customcd.string("durationoutlinecolor"),
            cooldownoutlinecolor: customcd.string("cooldownoutlinecolor"),
        },
        includealliance: root.boolean("includealliance"),
    };
    settings.language = isLocale(source.language) ? source.language : locale;
    settings.override.abilities = normalizeAbilities(
        isRecord(source.override) ? source.override.abilities : undefined,
    );
    settings.customcd.abilities = normalizeAbilities(
        isRecord(source.customcd) ? source.customcd.abilities : undefined,
    );
    for (const jobs of [
        settings.partyorder,
        settings.rolepartyorder.tank,
        settings.rolepartyorder.healer,
        settings.rolepartyorder.dps,
        settings.rolepartyorder.other,
    ])
        insertMissingJobs(jobs);
    const roleOrders = objectValue(source.rolepartyorder);
    for (const role of ["tank", "healer", "dps", "other"] as const) {
        const order = roleOrders[role];
        if (
            !Array.isArray(order) ||
            !order.every((job: unknown) => typeof job === "string")
        ) {
            settings.rolepartyorder[role] = [...settings.partyorder];
        }
    }
    settings.profiles = {
        ...objectValue(source.profiles),
        currentprofile: "",
        profiles: {},
        jobprofiles: {},
    };
    if (includeProfiles && isRecord(source.profiles)) {
        const profiles = source.profiles;
        if (isRecord(profiles.profiles)) {
            for (const [name, profile] of Object.entries(profiles.profiles)) {
                if (!isRecord(profile)) continue;
                const normalized = normalizeSettings(
                    profile,
                    settings.language,
                    false,
                );
                const { profiles: unused, ...snapshot } = normalized;
                Object.defineProperty(settings.profiles.profiles, name, {
                    value: snapshot,
                    enumerable: true,
                    writable: true,
                    configurable: true,
                });
            }
        }
        if (typeof profiles.currentprofile === "string")
            settings.profiles.currentprofile = profiles.currentprofile;
        if (isRecord(profiles.jobprofiles)) {
            for (const [job, name] of Object.entries(profiles.jobprofiles)) {
                if (typeof name === "string") {
                    Object.defineProperty(settings.profiles.jobprofiles, job, {
                        value: name,
                        enumerable: true,
                        writable: true,
                        configurable: true,
                    });
                }
            }
        }
    }
    return settings;
}

export function profileSnapshot(settings: Settings): ProfileSettings {
    const { profiles, ...snapshot } = normalizeSettings(
        settings,
        settings.language,
        false,
    );
    return snapshot;
}

export async function checkAndInitializeDefaultSettingsObject(
    settings: unknown,
    lang: Locale | null = null,
    handler: OverlayHandler = callOverlayHandler,
): Promise<Settings> {
    return normalizeSettings(settings, lang ?? (await getACTLocale(handler)));
}
