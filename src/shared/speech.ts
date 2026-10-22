import type { OverlayHandler } from "../plugin/types";
import { callOverlayHandler } from "../plugin/bridge";
import type { Locale, WebTTSLanguage } from "./settings";

export interface SpeechOptions {
    usewebtts: boolean;
    webttslanguage: WebTTSLanguage;
    ttsfallback: boolean;
    language: Locale;
}

export interface SpeechResult {
    provider: "act" | "baidu";
    fallback: boolean;
    fallbackReason?: string;
}

const languages: Record<Locale, string> = {
    en: "en",
    de: "de",
    fr: "fra",
    jp: "jp",
    cn: "zh",
    kr: "kor",
    tc: "zh",
};
const cache = new Map<string, HTMLAudioElement>();
const playing = new Map<HTMLAudioElement, () => void>();
const actMethods = new WeakMap<OverlayHandler, "say" | "cactbotSay">();
const discovery = new WeakMap<OverlayHandler, Promise<"say" | "cactbotSay">>();

function cancelled() {
    const error = new Error("Speech cancelled.");
    error.name = "AbortError";
    return error;
}

function checkSignal(signal?: AbortSignal) {
    if (signal?.aborted) throw cancelled();
}

function message(error: unknown) {
    if (typeof error === "object" && error !== null) {
        if ("message" in error && typeof error.message === "string")
            return error.message;
        if ("$error" in error) return String(error.$error);
    }
    return String(error);
}

function playbackFailure(error: unknown) {
    const name =
        typeof error === "object" && error !== null && "name" in error
            ? error.name
            : undefined;
    if (name === "NotAllowedError")
        return "The browser blocked audio playback.";
    if (name === "NotSupportedError")
        return "Baidu audio could not be loaded or decoded.";
    return message(error);
}

function missingHandler(error: unknown) {
    return /(?:unknown|unrecognized|unsupported|missing|no)\s+(?:event\s+)?handler|handler.*(?:not found|not registered|not supported|does not exist)/i.test(
        message(error),
    );
}

function waitFor<T>(
    promise: Promise<T>,
    milliseconds: number,
    signal?: AbortSignal,
): Promise<T> {
    checkSignal(signal);
    return new Promise((resolve, reject) => {
        const finish = (callback: () => void) => {
            clearTimeout(timeout);
            signal?.removeEventListener("abort", abort);
            callback();
        };
        const abort = () => finish(() => reject(cancelled()));
        const timeout = setTimeout(
            () => finish(() => reject(new Error("Speech request timed out."))),
            milliseconds,
        );
        signal?.addEventListener("abort", abort, { once: true });
        promise.then(
            (value) => finish(() => resolve(value)),
            (error) => finish(() => reject(error)),
        );
    });
}

async function speakAct(
    text: string,
    handler: OverlayHandler,
    signal?: AbortSignal,
    onStart?: () => void,
) {
    const preferred =
        actMethods.get(handler) ?? (await discoverActMethod(handler));
    const send = async (call: "say" | "cactbotSay") => {
        checkSignal(signal);
        onStart?.();
        const response = await waitFor(handler({ call, text }), 8000, signal);
        if (
            typeof response === "object" &&
            response !== null &&
            "$error" in response
        )
            throw response;
    };
    try {
        await send(preferred);
    } catch (error) {
        checkSignal(signal);
        if (!missingHandler(error)) throw new Error(message(error));
        const alternate = preferred === "say" ? "cactbotSay" : "say";
        await send(alternate);
        actMethods.set(handler, alternate);
    }
}

function discoverActMethod(
    handler: OverlayHandler,
): Promise<"say" | "cactbotSay"> {
    let pending = discovery.get(handler);
    if (!pending) {
        pending = (async () => {
            try {
                const response = await waitFor(
                    Promise.resolve().then(() =>
                        handler({ call: "getVersion" }),
                    ),
                    800,
                );
                if (
                    typeof response === "object" &&
                    response !== null &&
                    "version" in response &&
                    typeof response.version === "string"
                ) {
                    const version = response.version.match(
                        /^v?(\d+)\.(\d+)(?:\.|$)/,
                    );
                    if (
                        version &&
                        (Number(version[1]) > 0 || Number(version[2]) >= 19)
                    )
                        return "say";
                }
            } catch {}
            return "cactbotSay";
        })();
        discovery.set(handler, pending);
    }
    return pending;
}

function audioUrl(text: string, options: SpeechOptions) {
    const locale =
        options.webttslanguage === "game"
            ? options.language
            : options.webttslanguage;
    return `https://fanyi.baidu.com/gettts?lan=${languages[locale]}&spd=5&source=web&text=${encodeURIComponent(text)}`;
}

function release(audio: HTMLAudioElement) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
}

export function prepareSpeech(
    text: string,
    options: SpeechOptions,
): HTMLAudioElement | null {
    if (!options.usewebtts) {
        void discoverActMethod(callOverlayHandler);
        return null;
    }
    if (!text.trim()) return null;
    const url = audioUrl(text.trim(), options);
    let audio = cache.get(url);
    if (audio) cache.delete(url);
    else {
        audio = document.createElement("audio");
        audio.preload = "auto";
        audio.src = url;
    }
    cache.set(url, audio);
    if (cache.size > 32) {
        const oldest = cache.entries().next().value;
        if (oldest) {
            cache.delete(oldest[0]);
            if (!playing.has(oldest[1])) release(oldest[1]);
        }
    }
    return audio;
}

async function playWeb(
    text: string,
    options: SpeechOptions,
    signal?: AbortSignal,
) {
    checkSignal(signal);
    let audio = prepareSpeech(text, options);
    if (!audio) return;
    if (playing.has(audio)) audio = audio.cloneNode(true) as HTMLAudioElement;
    const player = audio;
    const playback = new AbortController();
    let started = false;
    let playbackError: Error | undefined;
    let watchdog: ReturnType<typeof setTimeout>;
    const cleanup = () => {
        clearTimeout(watchdog);
        player.removeEventListener("ended", cleanup);
        player.removeEventListener("error", failed);
        signal?.removeEventListener("abort", abort);
        playback.signal.removeEventListener("abort", stop);
        playing.delete(player);
        if (!Array.from(cache.values()).includes(player)) release(player);
    };
    const stop = () => {
        player.pause();
        if (!started)
            for (const [key, value] of cache)
                if (value === player) cache.delete(key);
        cleanup();
    };
    const abort = () => playback.abort();
    const failed = () => {
        if (started) cleanup();
        else {
            playbackError = new Error(
                player.error?.code === 2
                    ? "Baidu audio could not be downloaded."
                    : "Baidu audio could not be loaded or decoded.",
            );
            abort();
        }
    };
    playing.set(player, abort);
    playback.signal.addEventListener("abort", stop, { once: true });
    player.addEventListener("ended", cleanup, { once: true });
    player.addEventListener("error", failed, { once: true });
    signal?.addEventListener("abort", abort, { once: true });
    watchdog = setTimeout(abort, 120000);
    try {
        if (player.error) throw new Error("Baidu speech could not be loaded.");
        player.currentTime = 0;
        try {
            await waitFor(
                Promise.resolve(player.play()),
                3000,
                playback.signal,
            );
        } catch (error) {
            throw playbackError ?? error;
        }
        checkSignal(playback.signal);
        started = true;
    } finally {
        if (!started) {
            for (const [key, value] of cache)
                if (value === player) cache.delete(key);
            abort();
            release(player);
        }
    }
}

export async function speakText(
    text: string,
    options: SpeechOptions,
    handler: OverlayHandler = callOverlayHandler,
    signal?: AbortSignal,
    onStart?: () => void,
): Promise<SpeechResult> {
    checkSignal(signal);
    const value = text.trim();
    if (!value) throw new Error("Enter some text to speak.");
    let fallbackReason: string | undefined;
    if (options.usewebtts) {
        try {
            await playWeb(value, options, signal);
            checkSignal(signal);
            onStart?.();
            return { provider: "baidu", fallback: false };
        } catch (error) {
            checkSignal(signal);
            if (error instanceof Error && error.name === "AbortError")
                throw error;
            fallbackReason = playbackFailure(error);
            if (!options.ttsfallback) throw new Error(fallbackReason);
        }
    }
    await speakAct(value, handler, signal, onStart);
    return {
        provider: "act",
        fallback: options.usewebtts,
        ...(fallbackReason ? { fallbackReason } : {}),
    };
}

export function disposeSpeech() {
    for (const stop of playing.values()) stop();
    for (const audio of cache.values()) release(audio);
    cache.clear();
}

if (typeof window.addEventListener === "function")
    window.addEventListener("pagehide", disposeSpeech);
