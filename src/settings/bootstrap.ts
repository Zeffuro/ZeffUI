import { callOverlayHandler, openerOverlayHandler } from "../plugin/bridge";
import { state } from "./state";
import { setPadding, setExampleColor } from "./appearance";
import { loadSettings } from "./load";

export function initializeOverlayPluginHandlers() {
    const opener = openerOverlayHandler();
    if (opener) {
        state.callCurrentOverlayHandler = opener;
        return;
    }
    startOverlayEvents();
    state.callCurrentOverlayHandler = callOverlayHandler;
}

export async function loadZeffUISettings(): Promise<void> {
    initializeOverlayPluginHandlers();

    $("[id$=Color]").each(function () {
        setExampleColor(this);
    });

    $("[id$=Color]")
        .off("change.settingsAppearance")
        .on("change.settingsAppearance", function () {
            setExampleColor(this);
        });

    $("[id$=GrowDirection]")
        .off("change.settingsAppearance")
        .on("change.settingsAppearance", function () {
            setPadding(this);
        });

    $("#dotScale")
        .off("change.settingsAppearance")
        .on("change.settingsAppearance", function () {
            setPadding($(`#${this.id.replace("Scale", "GrowDirection")}`));
        });

    $("#buffScale")
        .off("change.settingsAppearance")
        .on("change.settingsAppearance", function () {
            setPadding($(`#${this.id.replace("Scale", "GrowDirection")}`));
        });

    $("#customcdSearch")
        .off("keyup.settingsAppearance")
        .on("keyup.settingsAppearance", function (event) {
            if (event.keyCode == 13) {
                $("#customcdSearchButton").click();
            }
        });

    if (window.location.hash) shiftWindow();
    window.addEventListener("hashchange", shiftWindow);

    await loadSettings();
}

export function removeHashFromUrl() {
    var uri = window.location.toString();

    if (uri.indexOf("#") > 0) {
        var clean_uri = uri.substring(0, uri.indexOf("#"));

        window.history.replaceState({}, document.title, clean_uri);
    }
}

export function shiftWindow() {
    removeHashFromUrl();
}
