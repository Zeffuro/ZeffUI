import { addOverlayListener } from "../plugin/bridge";
import { element } from "../shared/dom";
import { testLog } from "./debug";
import {
    onChangeZone,
    onInCombatChangedEvent,
    onLogEvent,
    onPartyChanged,
    onPlayerChangedEvent,
} from "./events";
import { initializePlayerFallback, startZeffUI } from "./bootstrap";
import { createStartupQueue } from "./startup";
import { ui } from "./state";
import { initializeSettingsReceiver } from "./live-settings";
import { onTargetChanged } from "./display/target";

Object.assign(window, { testLog });
initializeSettingsReceiver();

const startup = createStartupQueue((error) =>
    console.error("ZeffUI event failed.", error),
);

addOverlayListener("onPlayerChangedEvent", (e) =>
    startup.enqueue(() => onPlayerChangedEvent(e)),
);

addOverlayListener("onLogEvent", (e) => startup.enqueue(() => onLogEvent(e)));

addOverlayListener("onInCombatChangedEvent", (e) =>
    startup.enqueue(() => onInCombatChangedEvent(e)),
);

addOverlayListener("ChangeZone", (e) => startup.enqueue(() => onChangeZone(e)));

addOverlayListener("PartyChanged", (e) =>
    startup.enqueue(() => onPartyChanged(e)),
);

addOverlayListener("EnmityTargetData", (e) =>
    startup.enqueue(() => onTargetChanged(e)),
);

$(document).ready(() => {
    void startZeffUI().then(
        () => {
            startup.release();
            void initializePlayerFallback().catch((error: unknown) =>
                console.error("ZeffUI player initialization failed.", error),
            );
        },
        (error: unknown) =>
            console.error("ZeffUI initialization failed.", error),
    );
});

document.addEventListener(
    "onOverlayStateUpdate",
    function (e: CustomEvent<{ isLocked: boolean }>) {
        const reminder = element("lock-overlay-reminder");
        if (!e.detail.isLocked) {
            document.documentElement.style.background = "rgba(0,0,255,0.5)";
            if (!ui.locked) reminder.style.display = "block";
        } else {
            document.documentElement.style.background = "";
            if (!ui.locked) reminder.style.display = "none";
        }

        ui.actlocked = e.detail.isLocked;
    },
);
