import { isLocale } from "../shared/locale";
import { formValue } from "../shared/dom";
import { gameLanguage } from "../shared/language";
import type { Settings, WebTTSLanguage } from "../shared/settings";
import { speakText } from "../shared/speech";
import { state } from "./state";

export function readSpeechControls() {
    const selected = formValue("#webTTSLanguage");
    const webttslanguage: WebTTSLanguage =
        selected === "game" || isLocale(selected) ? selected : "game";
    return {
        usewebtts: formValue("#useWebTTS") === "baidu",
        webttslanguage,
        ttsfallback: $("#ttsFallback").is(":checked"),
    };
}

function syncSpeechControls() {
    const options = document.getElementById("baiduSpeechOptions");
    if (options) options.hidden = !readSpeechControls().usewebtts;
}

let testGeneration = 0;
let testController: AbortController | null = null;

function cancelTest() {
    testGeneration++;
    testController?.abort();
    testController = null;
}

export function populateSpeechControls(settings: Settings) {
    $("#useWebTTS").val(settings.general.usewebtts ? "baidu" : "act");
    $("#webTTSLanguage").val(settings.general.webttslanguage);
    $("#ttsFallback").prop("checked", settings.general.ttsfallback);
    syncSpeechControls();
    cancelTest();
    const status = document.getElementById("speechTestStatus");
    if (status) status.textContent = "";
}

export function initializeSpeechControls() {
    document
        .getElementById("useWebTTS")
        ?.addEventListener("change", syncSpeechControls);
    const button = document.getElementById("speechTestButton");
    const status = document.getElementById("speechTestStatus");
    if (!(button instanceof HTMLButtonElement) || !status) return;
    window.addEventListener("pagehide", cancelTest);
    button.addEventListener("click", async () => {
        cancelTest();
        const text = formValue("#speechTestText").trim();
        if (!text) {
            status.textContent = "Enter some text to test speech.";
            return;
        }
        const generation = testGeneration;
        const controller = new AbortController();
        testController = controller;
        status.textContent = "Sending test speech…";
        try {
            const result = await speakText(
                text,
                {
                    ...readSpeechControls(),
                    language: gameLanguage(state.currentSettings),
                },
                state.callCurrentOverlayHandler,
                controller.signal,
            );
            if (generation === testGeneration)
                status.textContent = result.fallback
                    ? `${result.fallbackReason ?? "Baidu could not play."} Sent to ACT.`
                    : result.provider === "act"
                      ? "Sent to ACT."
                      : "Playing Baidu speech.";
        } catch (error) {
            if (generation === testGeneration && !controller.signal.aborted)
                status.textContent =
                    error instanceof Error
                        ? `Test speech failed: ${error.message}`
                        : "Test speech failed. Try again.";
        }
    });
}
