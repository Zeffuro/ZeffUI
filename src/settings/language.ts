import { isLocale } from "../shared/defaults";
import { formValue } from "../shared/dom";
import { gameLanguage } from "../shared/language";
import type { Settings } from "../shared/settings";
import { setOption } from "./save";

export function populateLanguageControls(settings: Settings) {
    $("#langSelect").val(settings.language);
    $("#linkGameLanguage").prop("checked", settings.gamelanguage === null);
    $("#gameLangSelect").val(gameLanguage(settings));
    syncGameLanguageControl();
}

export function syncGameLanguageControl() {
    const linked = $("#linkGameLanguage").is(":checked");
    $("#gameLangSelect").prop("disabled", linked);
    if (linked) $("#gameLangSelect").val(formValue("#langSelect"));
}

export function readGameLanguageControl() {
    const locale = formValue("#gameLangSelect");
    return $("#linkGameLanguage").is(":checked") || !isLocale(locale)
        ? null
        : locale;
}

export function initializeLanguageControls(refresh: () => void) {
    for (const id of ["linkGameLanguage", "gameLangSelect"]) {
        document.getElementById(id)?.addEventListener("change", () => {
            syncGameLanguageControl();
            setOption("gamelanguage", readGameLanguageControl());
            refresh();
        });
    }
}
