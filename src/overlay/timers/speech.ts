import type { Ability } from "../../shared/abilities";
import { gameLanguage } from "../../shared/language";
import { getAbilityIconUrl } from "../../shared/icons";
import { prepareSpeech, speakText, disposeSpeech } from "../../shared/speech";
import { UPDATE_INTERVAL, activeElements, runtime } from "../state";
import { toLog } from "../debug";

interface SpeechJob {
    controller: AbortController;
    mode?: number;
}
const jobs = new Map<string, SpeechJob>();
const clock = () =>
    typeof performance === "object" ? performance.now() : Date.now();

function options() {
    return {
        ...runtime.currentSettings.general,
        language: gameLanguage(runtime.currentSettings),
    };
}

export function cancelTTSTimer(selector: string, mode?: number) {
    const job = jobs.get(selector);
    if (mode !== undefined && job?.mode !== mode) return;
    clearInterval(activeElements.tts.get(selector));
    activeElements.tts.delete(selector);
    job?.controller.abort();
    jobs.delete(selector);
}

export function cancelAllSpeech() {
    for (const selector of new Set([
        ...jobs.keys(),
        ...activeElements.tts.keys(),
    ]))
        cancelTTSTimer(selector);
    activeElements.ttsLastCalled.clear();
    disposeSpeech();
}

export function cancelPlayerDurationSpeech(playerIndex: number) {
    if (playerIndex < 0) return;
    for (const [selector, job] of jobs) {
        if (
            job.mode === 1 &&
            (playerIndex === 0 ||
                Number(selector.match(/-(\d+)-\d+$/)?.[1]) === playerIndex)
        )
            cancelTTSTimer(selector);
    }
}

export function startTTSTimer(
    duration: number,
    selector: string,
    text: string | (() => string),
    timeWhen = runtime.currentSettings.general.ttsearly * 1000,
    mode?: number,
    enabled = () => true,
) {
    cancelTTSTimer(selector);
    if (!Number.isFinite(duration) || !Number.isFinite(timeWhen)) return;
    const content = () =>
        typeof text === "function" ? text().trim() : text.trim();
    if (!content()) return;
    const startedAt = clock();
    const speakAt = startedAt + Math.max(0, duration * 1000 - timeWhen);
    const expiresAt = startedAt + Math.max(0, duration * 1000) + 2000;
    const job: SpeechJob = { controller: new AbortController(), mode };
    jobs.set(selector, job);
    prepareSpeech(content(), options());
    const check = () => {
        if (jobs.get(selector) !== job) return;
        if (clock() < speakAt) return;
        clearInterval(activeElements.tts.get(selector));
        activeElements.tts.delete(selector);
        if (clock() > expiresAt || !enabled()) {
            cancelTTSTimer(selector);
            return;
        }
        const last = activeElements.ttsLastCalled.get(selector);
        if (
            runtime.currentSettings.general.preventdoubletts &&
            last !== undefined &&
            Date.now() < last + 2000
        ) {
            cancelTTSTimer(selector);
            return;
        }
        const value = content();
        if (!value) {
            cancelTTSTimer(selector);
            return;
        }
        void speakText(
            value,
            options(),
            undefined,
            job.controller.signal,
            () => {
                activeElements.ttsLastCalled.delete(selector);
                activeElements.ttsLastCalled.set(selector, Date.now());
                if (activeElements.ttsLastCalled.size > 256) {
                    const oldest = activeElements.ttsLastCalled
                        .keys()
                        .next().value;
                    if (oldest !== undefined)
                        activeElements.ttsLastCalled.delete(oldest);
                }
            },
        )
            .catch((error) => {
                if (!job.controller.signal.aborted)
                    console.warn("Speech could not be played.", error);
            })
            .finally(() => {
                if (jobs.get(selector) === job) jobs.delete(selector);
            });
    };
    activeElements.tts.set(selector, setInterval(check, UPDATE_INTERVAL));
    check();
}

function speechEnabled(ability: Ability) {
    const key = {
        DoT: "dottimerbar",
        Buff: "bufftimerbar",
        RaidBuff: "raidbuffs",
        Mitigation: "mitigation",
        Party: "party",
        CustomCooldown: "customcd",
    } as const;
    if (!(ability.type in key)) return false;
    const module =
        runtime.currentSettings[key[ability.type as keyof typeof key]];
    const current =
        runtime.currentSettings.override.abilities.find(
            (entry) => entry.id === ability.id && entry.type === ability.type,
        ) ?? ability;
    return (
        module.enabled && module.ttsenabled && current.enabled && current.tts
    );
}

export function handleAbilityTTS(
    ability: Ability,
    selector: string,
    onYou = true,
) {
    toLog([
        `[HandleAbilityTTS] Ability: ${ability.name} Selector: ${selector} OnYou: ${onYou}`,
    ]);
    cancelTTSTimer(selector);
    if (!speechEnabled(ability)) return;
    const text = () =>
        ability[`name_${gameLanguage(runtime.currentSettings)}`] ||
        ability.name_en ||
        ability.name;
    const mode = ability.ttstype;
    const enabled = () => speechEnabled(ability);
    if (mode === 0 && ability.cooldown !== undefined)
        startTTSTimer(
            ability.cooldown,
            selector,
            text,
            undefined,
            mode,
            enabled,
        );
    else if (mode === 1 && ability.duration !== undefined)
        startTTSTimer(
            ability.duration,
            selector,
            text,
            undefined,
            mode,
            enabled,
        );
    else if (mode === 2 && (onYou || ability.type !== "RaidBuff"))
        startTTSTimer(0, selector, text, 0, mode, enabled);
}

export function processIconUrl(icon: string) {
    return getAbilityIconUrl(icon, runtime.currentSettings);
}

if (typeof window.addEventListener === "function")
    window.addEventListener("pagehide", cancelAllSpeech);
