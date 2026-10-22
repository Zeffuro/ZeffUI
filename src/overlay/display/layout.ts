import { element, translate } from "../../shared/dom";
import { gameState, ui } from "../state";
import { saveSettings } from "../preferences/save";
import {
    setAndCheckTickers,
    toggleHideOutOfCombatElements,
    toggleHideWhenSoloCombatElements,
} from "./visibility";
import { adjustJobStacks } from "./stacks";
import { renderTargetBars } from "./target";
import { applyManaAttachments, dragAttachedMana } from "./attachments";

export function drawGrid() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let grid = element("grid", HTMLCanvasElement);
    grid.width = window.innerWidth;
    grid.height = window.innerHeight;

    let canvasContext = grid.getContext("2d");
    if (!canvasContext) return;
    canvasContext.beginPath();

    for (let x = 0; x <= width; x += 25) {
        canvasContext.moveTo(0.5 + x, 0);
        canvasContext.lineTo(0.5 + x, height);
    }

    for (let y = 0; y <= height; y += 25) {
        canvasContext.moveTo(0, 0.5 + y);
        canvasContext.lineTo(width, 0.5 + y);
    }

    canvasContext.strokeStyle = "black";
    canvasContext.stroke();
}

export function waitFor(variable: "language", callback: () => void) {
    var interval = setInterval(function () {
        if (window[variable]) {
            clearInterval(interval);
            callback();
        }
    }, 200);
}

export function clearGrid() {
    let grid = element("grid", HTMLCanvasElement);
    grid.width = window.innerWidth;
    grid.height = window.innerHeight;

    let canvasContext = grid.getContext("2d");
    if (!canvasContext) return;
    canvasContext.clearRect(0, 0, grid.width, grid.height);
}

export function toggleGrid() {
    if (!ui.gridshown) {
        drawGrid();
        ui.gridshown = true;
    } else {
        clearGrid();
        ui.gridshown = false;
    }
}

export function toggleLock() {
    interact("[id$=bar]").draggable({
        enabled: ui.locked,
        listeners: {
            move(event) {
                const target: unknown = event.target;
                if (!(target instanceof HTMLElement)) return;
                if (dragAttachedMana(target.id, event.dx, event.dy)) return;
                const position = ui.dragPosition[target.id];
                if (!position) return;
                position.x += event.dx;
                position.y += event.dy;

                let rotate: string | undefined;
                if (target.style.transform.includes("rotate"))
                    rotate = target.style.transform.split("rotate").pop();
                target.style.transform = `translate(${Math.trunc(position.x)}px, ${Math.trunc(position.y)}px)${rotate ? `rotate${rotate}` : ""}`;
                applyManaAttachments();
            },
            end() {
                saveSettings();
            },
        },
    });
    if (ui.locked) {
        if (!ui.actlocked) {
            element("lock-overlay-reminder").style.display = "block";
        }

        setAndCheckTickers(true);

        let timerbar = element("timer-bar");
        timerbar.style.display = "block";
        timerbar.setAttribute("data-label", translate("pulltimer"));

        let dottimerbar = element("dot-timer-bar");
        dottimerbar.style.display = "block";
        dottimerbar.setAttribute("data-label", translate("dot-anchor"));

        let bufftimerbar = element("buff-timer-bar");
        bufftimerbar.style.display = "block";
        bufftimerbar.setAttribute("data-label", translate("buff-anchor"));

        let raidbuffAnchor = document.createElement("span");
        raidbuffAnchor.id = "raid-buffs-anchor";
        raidbuffAnchor.className = "anchor-text";
        raidbuffAnchor.textContent = translate("raidbuffs-anchor");
        element("raid-buffs-bar").appendChild(raidbuffAnchor);

        let mitigationAnchor = document.createElement("span");
        mitigationAnchor.id = "mitigation-anchor";
        mitigationAnchor.className = "anchor-text";
        mitigationAnchor.textContent = translate("mitigation-anchor");
        element("mitigation-bar").appendChild(mitigationAnchor);

        let customcdAnchor = document.createElement("span");
        customcdAnchor.id = "customcd-anchor";
        customcdAnchor.className = "anchor-text";
        customcdAnchor.textContent = translate("customcd-anchor");
        element("customcd-bar").appendChild(customcdAnchor);

        let partyAnchor = document.createElement("span");
        partyAnchor.id = "party-anchor";
        partyAnchor.className = "anchor-text";
        partyAnchor.textContent = translate("party-anchor");

        if (document.querySelectorAll("#party-bar>div").length === 0) {
            element("party-bar").appendChild(partyAnchor);
        } else {
            element("party-row-1").appendChild(partyAnchor);
        }
        toggleHideWhenSoloCombatElements(true);

        adjustJobStacks(2, 4, true);
        if (!gameState.inCombat) {
            toggleHideOutOfCombatElements();
        }
        ui.locked = false;
        document.documentElement.style.border = "solid";
    } else {
        setAndCheckTickers();

        element("timer-bar").style.display = "none";
        element("dot-timer-bar").style.display = "none";
        element("buff-timer-bar").style.display = "none";
        element("buff-timer-bar").style.display = "none";
        element("raid-buffs-anchor").remove();
        element("mitigation-anchor").remove();
        element("customcd-anchor").remove();
        element("party-anchor").remove();
        toggleHideWhenSoloCombatElements();
        adjustJobStacks(
            gameState.stats.stacks,
            gameState.stats.maxStacks,
            true,
        );
        if (!gameState.inCombat) {
            toggleHideOutOfCombatElements();
        }
        ui.locked = true;
        element("lock-overlay-reminder").style.display = "none";
        document.documentElement.style.border = "none";
    }
    renderTargetBars();
}

export function applyFilterColorToElement(
    classId: string,
    filterColor: string,
) {
    let barcolors = element("bar-colors", HTMLStyleElement);
    let filter = `.${classId}::-webkit-progress-value { filter: var(${filterColor}); }`;
    barcolors.sheet?.insertRule(filter);
}

export function getScript(scriptUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
        document.getElementById("language")?.remove();
        const script = document.createElement("script");
        script.id = "language";
        script.src = scriptUrl;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${scriptUrl}`));
        document.body.appendChild(script);
    });
}
