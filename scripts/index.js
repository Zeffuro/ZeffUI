// ZeffUI globals
/* global abilityList, jobList, regexList, language, zone_info, content_type, checkAndInitializeDefaultSettingsObject */

// External Globals
/* global addOverlayListener, startOverlayEvents, interact, callOverlayHandler */

// UI related global variables
let ui = {
    locked: true,
    actlocked: false,
    gridshown: false,
    dragPosition: {},
    activeSettingsWindow: null,
    labels: {},
};

// Global variables for maintaining gamestate and settings
let currentSettings = null;

let gameState = {
    inCombat: false,
    blockRuinGained: false,
    player: null,
    playerPrevious: null,
    playerTags: {},
    currentrole: null,
    zone: {},
    partyList: [],
    rawPartyList: [],
    stats: {
        skillSpeed: 0,
        spellSpeed: 0,
        stacks: 0,
        maxStacks: 0,
    },
    previous_MP: 0,
};

// Global variables for maintaining active timers and elements that get reused
let activeElements = {
    dotBars: new Map(),
    buffBars: new Map(),
    raidBuffs: new Map(),
    mitigations: new Map(),
    partyCooldowns: new Map(),
    customCooldowns: new Map(),
    countdowns: new Map(),
    currentCharges: new Map(),
    tts: new Map(),
    ttsElements: new Map(),
};

/* prettier-ignore */
const GAME_DATA = {
	CONTENT_TYPE: [],
    // MP Data copied from cactbot constants: https://github.com/quisquous/cactbot/blob/ecfa4665ba7652e9d4a278e360cc2aadab54bb5a/ui/jobs/constants.ts
	EFFECT_TICK: 3.0,
	MP_DATA: {
		normal: 0.06,
		combat: 0.02,
		umbral_1: 0.30,
		umbral_2: 0.45,
		umbral_3: 0.60,
		tick: 3.0
	},
    // Comes from https://www.akhmorning.com/allagan-studies/stats/speed/, will need to be updated when Endwalker comes out
	SPEED_LOOKUP: new Map(
		[
			[1, 56], [2, 57],  [3, 60], [4, 62], [5, 65], [6, 68], [7, 70], [8, 73], [9, 76], [10, 78], 
			[11, 82], [12, 85], [13, 89], [14, 93], [15, 96], [16, 100], [17, 104], [18, 109], [19, 113], [20, 116], 
			[21, 122], [22, 127], [23, 133], [24, 138], [25, 144], [26, 150], [27, 155], [28, 162], [29, 168], [30, 173], 
			[31, 181], [32, 188], [33, 194], [34, 202], [35, 209], [36, 215], [37, 223], [38, 229], [39, 236], [40, 244], 
			[41, 253], [42, 263], [43, 272], [44, 283], [45, 292], [46, 302], [47, 311], [48, 322], [49, 331], [50, 341], 
			[51, 342], [52, 344], [53, 345], [54, 346], [55, 347], [56, 349], [57, 350], [58, 351], [59, 352], [60, 354], 
			[61, 355], [62, 356], [63, 357], [64, 358], [65, 359], [66, 360], [67, 361], [68, 362], [69, 363], [70, 364], 
			[71, 365], [72, 366], [73, 367], [74, 368], [75, 370], [76, 372], [77, 374], [78, 376], [79, 378], [80, 380]
		]),
	ZONE_INFO: []
};

const UPDATE_INTERVAL = 10;

// Add OverlayListeners, some events are found in Cactbot, others in OverlayPlugin itself.
// Overlay Plugin Events: https://ngld.github.io/OverlayPlugin/devs/event_types and https://github.com/ngld/OverlayPlugin/tree/0da98d8045ec220d6c3d64f4dcf0edd3cd44a8f3/OverlayPlugin.Core/EventSources
// Cactbot Events: https://github.com/quisquous/cactbot/blob/8615b69424360f69892bf81907d9cbdf3e752592/plugin/CactbotEventSource/CactbotEventSource.cs
addOverlayListener("onPlayerChangedEvent", (e) => onPlayerChangedEvent(e));
addOverlayListener("onLogEvent", (e) => onLogEvent(e));
addOverlayListener("onPartyWipe", () => onPartyWipe());
addOverlayListener("onInCombatChangedEvent", (e) => onInCombatChangedEvent(e));
addOverlayListener("ChangeZone", (e) => onChangeZone(e));
addOverlayListener("PartyChanged", (e) => onPartyChanged(e));

$(document).ready(() => {
    startZeffUI();
});

async function startZeffUI() {
    initializeContentZoneImports();
    startOverlayEvents();
    await loadSettings();
    generateJobStacks();
    toggleHideOutOfCombatElements();
    console.log("ZeffUI fully loaded.");
}

// Imports zone information constants into GAME_DATA for checking if PvP is in effect.
function initializeContentZoneImports() {
    // Content manually placed over from https://github.com/quisquous/cactbot/blob/main/resources/zone_info.ts because this project doesn't support typescript
    Object.assign(GAME_DATA.CONTENT_TYPE, content_type);
    // Content manually placed over from https://github.com/quisquous/cactbot/blob/main/resources/content_type.ts because this project doesn't support typescript
    Object.assign(GAME_DATA.ZONE_INFO, zone_info);
    if (gameState.zone !== undefined) checkAndSetZoneInfo(gameState.zone.id);
}

// SETTINGS
// Legacy location for the settings, left in so people who hasn't played for a long time still have their settings. Also functions as a backup location for settings.
function initializeSettings() {
    if (localStorage.getItem("settings") !== null) {
        return JSON.parse(localStorage.getItem("settings"));
    } else {
        return {};
    }
}

// Load settings through OverlayPlugin, these settings are stored in %appdata%\Advanced Combat Tracker\Config\RainbowMage.OverlayPlugin.config.json
async function loadSettings() {
    let settings = {};
    settings = await callOverlayHandler({ call: "loadData", key: "zeffUI" });
    if (settings == null) {
        settings = initializeSettings();
    } else if (settings.data === undefined) {
        settings = initializeSettings();
    } else if (settings.data === null) {
        settings = initializeSettings();
    } else {
        settings = settings.data;
    }

    settings = await checkAndInitializeDefaultSettingsObject(settings);

    if (document.getElementById("language") === null) {
        getScript(`data/language/${settings.language}.js`, () => {
            loadContextMenu();

            let reminder = document.getElementById("lock-overlay-reminder");
            reminder.textContent = language.find(
                (x) => x.id === "lockoverlay",
            ).string;

            reminder.style.display = "none";
        });
    } else {
        document.getElementById(
            "language",
        ).src = `data/language/${settings.language}.js`;
    }

    // Check and load profiles
    if (settings.profiles.profiles.length !== 0) {
        let profiles = settings.profiles;
        if (profiles.currentprofile) {
            settings = JSON.parse(
                JSON.stringify(profiles.profiles[profiles.currentprofile]),
            );
            settings.profiles = profiles;
        }
    }

    currentSettings = settings;
    setLoadedElements();
    saveSettings();
}

function setLoadedElements() {
    let head = document.getElementsByTagName("head")[0];

    let settings = currentSettings;

    if (document.getElementById("customcss"))
        document.getElementById("customcss").remove();
    if (settings.general.customcss) {
        let style = document.createElement("style");
        style.id = "customcss";
        style.textContent = settings.general.customcss;
        head.appendChild(style);
    }

    document.documentElement.style.setProperty("--defaultFont", settings.font);

    if (document.getElementById("skin") === null) {
        let link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = `skins/${settings.skin}/styles/resources.css`;
        link.id = "skin";
        head.append(link);
    } else {
        document.getElementById(
            "skin",
        ).href = `skins/${settings.skin}/styles/resources.css`;
    }

    // HEALTHBAR SETTINGS
    let healthbar = document.getElementById("health-bar");
    settings.healthbar.enabled
        ? (healthbar.style.display = "")
        : (healthbar.style.display = "none");

    healthbar.style.setProperty(
        "--healthBarColor",
        `var(${settings.healthbar.color})`,
    );
    healthbar.style.width = settings.healthbar.scale * 160;
    healthbar.style.height = settings.healthbar.scale * 15;
    healthbar.style.setProperty("--healthFont", settings.healthbar.font);
    healthbar.style.transformOrigin = "top left";

    ui.dragPosition["health-bar"] = {
        x: settings.healthbar.x,
        y: settings.healthbar.y,
    };
    healthbar.classList.add("ltr");
    healthbar.style.transform = `translate(${settings.healthbar.x}px, ${
        settings.healthbar.y
    }px)${
        settings.healthbar.rotation
            ? ` rotate(${settings.healthbar.rotation}deg`
            : ""
    }`;

    healthbar.setAttribute(
        "data-label",
        currentSettings.healthbar.textenabled ? ui.labels.health : "",
    );

    // MANABAR SETTINGS
    let manabar = document.getElementById("mana-bar");
    settings.manabar.enabled
        ? (manabar.style.display = "")
        : (manabar.style.display = "none");

    manabar.style.setProperty(
        "--manaBarColor",
        `var(${settings.manabar.color})`,
    );
    manabar.style.width = settings.manabar.scale * 160;
    manabar.style.height = settings.manabar.scale * 15;
    manabar.style.setProperty("--manaFont", settings.manabar.font);

    manabar.style.transformOrigin = "top left";
    ui.dragPosition["mana-bar"] = {
        x: settings.manabar.x,
        y: settings.manabar.y,
    };

    manabar.classList.add("ltr");
    manabar.style.transform = `translate(${settings.manabar.x}px, ${
        settings.manabar.y
    }px)${
        settings.manabar.rotation
            ? ` rotate(${settings.manabar.rotation}deg`
            : ""
    }`;

    manabar.setAttribute(
        "data-label",
        currentSettings.manabar.textenabled ? ui.labels.mana : "",
    );

    // MP TICKER SETTINGS
    let mpticker = document.getElementById("mp-ticker-bar");
    settings.mpticker.enabled
        ? (mpticker.style.display = "")
        : (mpticker.style.display = "none");

    mpticker.style.setProperty(
        "--mptickerColor",
        `var(${settings.mpticker.color})`,
    );

    mpticker.style.width = settings.mpticker.scale * 160;
    mpticker.style.height = settings.mpticker.scale * 15;

    mpticker.style.transformOrigin = "top left";
    ui.dragPosition["mp-ticker-bar"] = {
        x: settings.mpticker.x,
        y: settings.mpticker.y,
    };
    mpticker.classList.add("ltr");
    mpticker.style.transform = `translate(${settings.mpticker.x}px, ${
        settings.mpticker.y
    }px)${
        settings.mpticker.rotation
            ? ` rotate(${settings.mpticker.rotation}deg`
            : ""
    }`;

    // DOT TICKER SETTINGS
    let dotticker = document.getElementById("dot-ticker-bar");
    dotticker.style.display = settings.dotticker.enabled ? "block" : "none";

    dotticker.style.setProperty(
        "--dottickerColor",
        `var(${settings.dotticker.color})`,
    );
    dotticker.style.width = settings.dotticker.scale * 160;
    dotticker.style.height = settings.dotticker.scale * 15;

    dotticker.style.transformOrigin = "top left";
    ui.dragPosition["dot-ticker-bar"] = {
        x: settings.dotticker.x,
        y: settings.dotticker.y,
    };
    dotticker.classList.add("ltr");
    dotticker.style.transform = `translate(${settings.dotticker.x}px, ${
        settings.dotticker.y
    }px)${
        settings.dotticker.rotation
            ? ` rotate(${settings.dotticker.rotation}deg`
            : ""
    }`;

    // HOT TICKER SETTINGS
    let hotticker = document.getElementById("hot-ticker-bar");
    hotticker.style.display = settings.hotticker.enabled ? "block" : "none";

    hotticker.style.setProperty(
        "--hottickerColor",
        `var(${settings.hotticker.color})`,
    );
    hotticker.style.width = settings.hotticker.scale * 160;
    hotticker.style.height = settings.hotticker.scale * 15;

    hotticker.style.transformOrigin = "top left";
    ui.dragPosition["hot-ticker-bar"] = {
        x: settings.hotticker.x,
        y: settings.hotticker.y,
    };
    hotticker.classList.add("ltr");
    hotticker.style.transform = `translate(${settings.hotticker.x}px, ${
        settings.hotticker.y
    }px)${
        settings.hotticker.rotation
            ? ` rotate(${settings.hotticker.rotation}deg`
            : ""
    }`;

    // PULL TIMER SETTINGS
    let timerbar = document.getElementById("timer-bar");
    timerbar.style.setProperty(
        "--pulltimerBarColor",
        `var(${settings.timerbar.color})`,
    );

    timerbar.style.width = settings.timerbar.scale * 160;
    timerbar.style.height = settings.timerbar.scale * 15;
    timerbar.style.setProperty("--timerFont", settings.timerbar.font);
    timerbar.style.transformOrigin = "top left";

    ui.dragPosition["timer-bar"] = {
        x: settings.timerbar.x,
        y: settings.timerbar.y,
    };

    timerbar.classList.add("ltr");
    timerbar.style.transform = `translate(${settings.timerbar.x}px, ${
        settings.timerbar.y
    }px)${
        settings.timerbar.rotation
            ? ` rotate(${settings.timerbar.rotation}deg`
            : ""
    }`;

    // DOT TIMER SETTINGS
    let dottimerbar = document.getElementById("dot-timer-bar");
    dottimerbar.style.width = settings.dottimerbar.scale * 160;
    dottimerbar.style.height = settings.dottimerbar.scale * 15;
    dottimerbar.style.setProperty("--dotFont", settings.dottimerbar.font);

    let dotbar = document.getElementById("dot-bar");
    dotbar.style.transform = `rotate(${settings.dottimerbar.rotation}deg)`;
    dotbar.style.transformOrigin = "center";

    ui.dragPosition["dot-timer-bar"] = {
        x: settings.dottimerbar.x,
        y: settings.dottimerbar.y,
    };

    dottimerbar.classList.add("ltr");
    dottimerbar.style.transform = `translate(${settings.dottimerbar.x}px, ${settings.dottimerbar.y}px)`;

    // BUFF TIMER SETTINGS
    let bufftimerbar = document.getElementById("buff-timer-bar");
    bufftimerbar.style.width = settings.bufftimerbar.scale * 160;
    bufftimerbar.style.height = settings.bufftimerbar.scale * 15;
    bufftimerbar.style.setProperty("--buffFont", settings.bufftimerbar.font);

    let buffbar = document.getElementById("buff-bar");
    buffbar.style.transform = `rotate(${settings.bufftimerbar.rotation}deg)`;
    buffbar.style.transformOrigin = "center";

    ui.dragPosition["buff-timer-bar"] = {
        x: settings.bufftimerbar.x,
        y: settings.bufftimerbar.y,
    };

    bufftimerbar.classList.add("ltr");
    bufftimerbar.style.transform = `translate(${settings.bufftimerbar.x}px, ${settings.bufftimerbar.y}px)`;

    // STACKBAR SETTINGS
    let stacksbar = document.getElementById("stacks-bar");
    stacksbar.style.display = settings.stacksbar.enabled ? "block" : "none";

    stacksbar.style.width = settings.stacksbar.scale * (4 * 25);
    stacksbar.style.height = settings.stacksbar.scale * 21;

    let stackbgs = document.querySelectorAll("[id^=stacks-background]");
    Array.prototype.forEach.call(stackbgs, (stack) => {
        stack.style.marginLeft = 0 - settings.stacksbar.scale * 4;
    });

    stacksbar.style.setProperty(
        "--stacksColor",
        `var(${settings.stacksbar.color})`,
    );

    ui.dragPosition["stacks-bar"] = {
        x: settings.stacksbar.x,
        y: settings.stacksbar.y,
    };

    stacksbar.classList.add("ltr");
    stacksbar.style.transform = `translate(${settings.stacksbar.x}px, ${settings.stacksbar.y}px) scale(${settings.stacksbar.scale})`;

    // RAIDBUFF SETTINGS
    let raidbuffs = document.getElementById("raid-buffs-bar");
    raidbuffs.style.display = settings.raidbuffs.enabled ? "block" : "none";
    raidbuffs.style.display = settings.raidbuffs.hidewhensolo
        ? "none"
        : "block";

    raidbuffs.style.fontFamily = settings.raidbuffs.font;

    ui.dragPosition["raid-buffs-bar"] = {
        x: settings.raidbuffs.x,
        y: settings.raidbuffs.y,
    };

    raidbuffs.classList.remove("ltr", "rtl");
    raidbuffs.classList.add(`${settings.raidbuffs.growleft ? "rtl" : "ltr"}`);
    raidbuffs.style.transform = `translate(${settings.raidbuffs.x}px, ${settings.raidbuffs.y}px)`;

    // MITIGATION SETTINGS
    let mitigation = document.getElementById("mitigation-bar");
    mitigation.style.display = settings.mitigation.enabled ? "block" : "none";
    mitigation.style.display = settings.mitigation.hidewhensolo
        ? "none"
        : "block";

    mitigation.style.fontFamily = settings.mitigation.font;

    ui.dragPosition["mitigation-bar"] = {
        x: settings.mitigation.x,
        y: settings.mitigation.y,
    };

    mitigation.classList.remove("ltr", "rtl");
    mitigation.classList.add(`${settings.mitigation.growleft ? "rtl" : "ltr"}`);
    mitigation.style.transform = `translate(${settings.mitigation.x}px, ${settings.mitigation.y}px)`;

    // PARTY COOLDOWN SETTINGS
    let party = document.getElementById("party-bar");
    party.style.display = settings.party.enabled ? "block" : "none";
    party.style.display = settings.party.hidewhensolo ? "none" : "block";

    party.style.fontFamily = settings.party.font;

    ui.dragPosition["party-bar"] = {
        x: settings.party.x,
        y: settings.party.y,
    };

    party.classList.remove("ltr", "rtl");
    party.classList.add(`${settings.party.growleft ? "rtl" : "ltr"}`);
    party.style.transform = `translate(${settings.party.x}px, ${settings.party.y}px)`;

    // CUSTOM COOLDOWN SETTINGS
    let customcd = document.getElementById("customcd-bar");

    customcd.style.display = settings.customcd.enabled ? "block" : "none";
    customcd.style.display = settings.customcd.hidewhensolo ? "none" : "block";

    customcd.style.fontFamily = settings.customcd.font;

    ui.dragPosition["customcd-bar"] = {
        x: settings.customcd.x,
        y: settings.customcd.y,
    };

    customcd.classList.remove("ltr", "rtl");
    customcd.classList.add(`${settings.customcd.growleft ? "rtl" : "ltr"}`);
    customcd.style.transform = `translate(${settings.customcd.x}px, ${settings.customcd.y}px)`;
}

// Parse all current locations of components and then save them in localStorage (legacy) and OverlayPlugin located in %appdata%\Advanced Combat Tracker\Config\RainbowMage.OverlayPlugin.config.json
async function saveSettings() {
    currentSettings.healthbar.x = parseInt(ui.dragPosition["health-bar"].x);
    currentSettings.healthbar.y = parseInt(ui.dragPosition["health-bar"].y);

    let healthbar = document.getElementById("health-bar");
    healthbar.style.textAlign = currentSettings.healthbar.align;
    switch (currentSettings.healthbar.align) {
        case "left":
            healthbar.style.setProperty(
                "--healthFontX",
                currentSettings.healthbar.scale * 8 +
                    currentSettings.healthbar.fontxoffset,
            );
            break;
        case "center":
            healthbar.style.setProperty(
                "--healthFontX",
                0 + currentSettings.healthbar.fontxoffset,
            );
            break;
        case "right":
            healthbar.style.setProperty(
                "--healthFontX",
                -Math.abs(
                    currentSettings.healthbar.scale * 8 +
                        currentSettings.healthbar.fontxoffset,
                ),
            );
            break;
        default:
            healthbar.style.setProperty(
                "--healthFontX",
                currentSettings.healthbar.scale * 8 +
                    currentSettings.healthbar.fontxoffset,
            );
    }

    healthbar.style.setProperty(
        "--healthFontSize",
        currentSettings.healthbar.staticfontsize
            ? currentSettings.healthbar.fontsize
            : currentSettings.healthbar.scale * 10,
    );

    healthbar.style.setProperty(
        "--healthFontY",
        currentSettings.healthbar.scale * -14 +
            currentSettings.healthbar.fontyoffset,
    );

    currentSettings.manabar.x = parseInt(ui.dragPosition["mana-bar"].x);
    currentSettings.manabar.y = parseInt(ui.dragPosition["mana-bar"].y);

    let manabar = document.getElementById("mana-bar");
    manabar.style.textAlign = currentSettings.manabar.align;
    switch (currentSettings.manabar.align) {
        case "left":
            manabar.style.setProperty(
                "--manaFontX",
                currentSettings.manabar.scale * 8 +
                    currentSettings.manabar.fontxoffset,
            );
            break;
        case "center":
            manabar.style.setProperty(
                "--manaFontX",
                0 + currentSettings.manabar.fontxoffset,
            );
            break;
        case "right":
            manabar.style.setProperty(
                "--manaFontX",
                -Math.abs(
                    currentSettings.manabar.scale * 8 +
                        currentSettings.manabar.fontxoffset,
                ),
            );
            break;
        default:
            manabar.style.setProperty(
                "--manaFontX",
                currentSettings.manabar.scale * 8 +
                    currentSettings.manabar.fontxoffset,
            );
    }

    manabar.style.setProperty(
        "--manaFontSize",
        currentSettings.manabar.staticfontsize
            ? currentSettings.manabar.fontsize
            : currentSettings.manabar.scale * 10,
    );
    manabar.style.setProperty(
        "--manaFontY",
        currentSettings.manabar.scale * -14 +
            currentSettings.manabar.fontyoffset,
    );

    currentSettings.mpticker.x = parseInt(ui.dragPosition["mp-ticker-bar"].x);
    currentSettings.mpticker.y = parseInt(ui.dragPosition["mp-ticker-bar"].y);

    currentSettings.dotticker.x = parseInt(ui.dragPosition["dot-ticker-bar"].x);
    currentSettings.dotticker.y = parseInt(ui.dragPosition["dot-ticker-bar"].y);

    currentSettings.hotticker.x = parseInt(ui.dragPosition["hot-ticker-bar"].x);
    currentSettings.hotticker.y = parseInt(ui.dragPosition["hot-ticker-bar"].y);

    currentSettings.timerbar.x = parseInt(ui.dragPosition["timer-bar"].x);
    currentSettings.timerbar.y = parseInt(ui.dragPosition["timer-bar"].y);

    let timerbar = document.getElementById("timer-bar");
    timerbar.style.setProperty(
        "--timerFontSize",
        currentSettings.timerbar.staticfontsize
            ? currentSettings.timerbar.fontsize
            : currentSettings.timerbar.scale * 10,
    );
    timerbar.style.setProperty(
        "--timerFontX",
        currentSettings.timerbar.scale * 8 +
            currentSettings.timerbar.fontxoffset,
    );
    timerbar.style.setProperty(
        "--timerFontY",
        currentSettings.timerbar.scale * -14 +
            currentSettings.timerbar.fontyoffset,
    );

    currentSettings.dottimerbar.x = parseInt(
        ui.dragPosition["dot-timer-bar"].x,
    );
    currentSettings.dottimerbar.y = parseInt(
        ui.dragPosition["dot-timer-bar"].y,
    );

    let dottimerbar = document.getElementById("dot-timer-bar");
    dottimerbar.style.setProperty(
        "--dotFontSize",
        currentSettings.dottimerbar.staticfontsize
            ? currentSettings.dottimerbar.fontsize
            : currentSettings.dottimerbar.scale * 10,
    );
    dottimerbar.style.setProperty(
        "--dotFontX",
        currentSettings.dottimerbar.scale * 8 +
            currentSettings.dottimerbar.fontxoffset,
    );
    dottimerbar.style.setProperty(
        "--dotFontY",
        currentSettings.dottimerbar.scale * -14 +
            currentSettings.dottimerbar.fontyoffset,
    );

    currentSettings.bufftimerbar.x = parseInt(
        ui.dragPosition["buff-timer-bar"].x,
    );
    currentSettings.bufftimerbar.y = parseInt(
        ui.dragPosition["buff-timer-bar"].y,
    );

    let bufftimerbar = document.getElementById("buff-timer-bar");
    bufftimerbar.style.setProperty(
        "--buffFontSize",
        currentSettings.bufftimerbar.staticfontsize
            ? currentSettings.bufftimerbar.fontsize
            : currentSettings.bufftimerbar.scale * 10,
    );
    bufftimerbar.style.setProperty(
        "--buffFontX",
        currentSettings.bufftimerbar.scale * 8 +
            currentSettings.bufftimerbar.fontxoffset,
    );
    bufftimerbar.style.setProperty(
        "--buffFontY",
        currentSettings.bufftimerbar.scale * -14 +
            currentSettings.bufftimerbar.fontyoffset,
    );

    currentSettings.stacksbar.x = parseInt(ui.dragPosition["stacks-bar"].x);
    currentSettings.stacksbar.y = parseInt(ui.dragPosition["stacks-bar"].y);

    currentSettings.raidbuffs.x = parseInt(ui.dragPosition["raid-buffs-bar"].x);
    currentSettings.raidbuffs.y = parseInt(ui.dragPosition["raid-buffs-bar"].y);

    currentSettings.mitigation.x = parseInt(
        ui.dragPosition["mitigation-bar"].x,
    );
    currentSettings.mitigation.y = parseInt(
        ui.dragPosition["mitigation-bar"].y,
    );

    currentSettings.customcd.x = parseInt(ui.dragPosition["customcd-bar"].x);
    currentSettings.customcd.y = parseInt(ui.dragPosition["customcd-bar"].y);

    currentSettings.party.x = parseInt(ui.dragPosition["party-bar"].x);
    currentSettings.party.y = parseInt(ui.dragPosition["party-bar"].y);

    if (currentSettings.profiles.currentprofile) {
        let saveSettings = JSON.parse(JSON.stringify(currentSettings));
        delete saveSettings.profiles;
        currentSettings.profiles.profiles[
            currentSettings.profiles.currentprofile
        ] = saveSettings;
    }

    await callOverlayHandler({
        call: "saveData",
        key: "zeffUI",
        data: currentSettings,
    });
    localStorage.setItem("settings", JSON.stringify(currentSettings));
}

// UI Elements and functions
// Generate Profile options for context menu
function generateProfileItems() {
    let profileItems = {};
    for (let profile in currentSettings.profiles.profiles) {
        profileItems[`profile_${profile}`] = {};
        profileItems[`profile_${profile}`].name = profile;
    }
    return profileItems;
}

// Opens settings
function handleSettings() {
    // This way of opening the settings window and propegate the made changes to the settings is a bit scuffed but currently can't think of a better way.
    if (ui.activeSettingsWindow === null) {
        openSettingsWindow();
    } else {
        if (
            confirm(
                language.find((x) => x.id === "activesettingswindow").string,
            )
        ) {
            ui.activeSettingsWindow.close();
            ui.activeSettingsWindow = null;
            openSettingsWindow();
        }
    }
}

// Context menu whenever someone rightclicks any UI component
function loadContextMenu() {
    $(":root").contextMenu({
        selector: "body",
        callback: function (key) {
            switch (key) {
                case "lock": {
                    toggleLock();
                    break;
                }
                case "grid": {
                    toggleGrid();
                    break;
                }
                case "reload": {
                    location.reload();
                    break;
                }
                case "settings": {
                    handleSettings();
                    break;
                }
                case "en": {
                    setUILanguageAndReload("en");
                    break;
                }
                case "de": {
                    setUILanguageAndReload("de");
                    break;
                }
                case "fr": {
                    setUILanguageAndReload("fr");
                    break;
                }
                case "jp": {
                    setUILanguageAndReload("jp");
                    break;
                }
                case "cn": {
                    setUILanguageAndReload("cn");
                    break;
                }
                case "kr": {
                    setUILanguageAndReload("kr");
                    break;
                }
            }
            if (key.includes("profile_")) {
                let profile = key.split("_")[1];
                loadProfile(profile);
            }
        },
        items: {
            lock: {
                name: language.find((x) => x.id === "lock").string,
                icon: "fas fa-lock-open",
            },
            grid: {
                name: language.find((x) => x.id === "grid").string,
                icon: "fas fa-border-all",
            },
            reload: {
                name: language.find((x) => x.id === "reload").string,
                icon: "fas fa-sync-alt",
            },
            settings: {
                name: language.find((x) => x.id === "settings").string,
                icon: "fas fa-cog",
            },
            profiles: {
                name: language.find((x) => x.id === "profiles").string,
                icon: "fas fa-user",
                items: generateProfileItems(),
            },
            fold1: {
                name: language.find((x) => x.id === "language").string,
                icon: "fas fa-globe-americas",
                items: {
                    en: { name: "English (default)", icon: "en" },
                    de: { name: "Deutsch", icon: "de" },
                    fr: { name: "Français", icon: "fr" },
                    jp: { name: "日本語", icon: "jp" },
                    cn: { name: "中文", icon: "cn" },
                    kr: { name: "한국어", icon: "kr" },
                },
            },
            sep1: "---------",
            quit: {
                name: language.find((x) => x.id === "close").string,
                icon: function () {
                    return "context-menu-icon context-menu-icon-quit";
                },
            },
        },
    });
}

// Sets the game language, saves the current settings and reloads the UI
function setUILanguageAndReload(language) {
    currentSettings.language = language;
    saveSettings();
    location.reload();
}

// Loads profile
function loadProfile(profileName) {
    saveSettings();
    currentSettings.profiles.currentprofile = profileName;

    let settings = JSON.parse(
        JSON.stringify(currentSettings.profiles.profiles[profileName]),
    );

    settings.profiles = currentSettings.profiles;
    currentSettings = JSON.parse(JSON.stringify(settings));

    setLoadedElements();
    reloadCooldownModules();
    saveSettings();
    //location.reload();
}

// Opens the settings window and tries to keep track to see if it's opened, also takes OVERLAY_WS parameters into account.
function openSettingsWindow() {
    let parameters = new URLSearchParams(window.location.search);
    let settingsUrl = parameters.has("OVERLAY_WS")
        ? `settings.html?OVERLAY_WS=${parameters.get("OVERLAY_WS")}`
        : "settings.html";
    ui.activeSettingsWindow = window.open(settingsUrl, "zeffui_settings");
    ui.activeSettingsWindow.onbeforeunload = onSettingsWindowClose;
    /*
    ui.activeSettingsWindow.onload = function () {
        this.onbeforeunload = function () {
            loadSettings().then(() => {
                if (gameState.player === null) {
                    ui.activeSettingsWindow = null;
                    return;
                }
                location.reload();
            });
        };
    };
    */
}

function onSettingsWindowClose() {
    ui.activeSettingsWindow = null;
    location.reload();
}

// Draws a grid over the whole area for easier placement. It would be better if we could make all lines consistent and not depend on placement of Overlay in OverlayPlugin
function drawGrid() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let grid = document.getElementById("grid");
    grid.width = window.innerWidth;
    grid.height = window.innerHeight;

    let canvasContext = grid.getContext("2d");
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

function clearGrid() {
    let grid = document.getElementById("grid");
    grid.width = window.innerWidth;
    grid.height = window.innerHeight;

    let canvasContext = grid.getContext("2d");
    canvasContext.clearRect(0, 0, grid.width, grid.height);
}

// Toggles the grid on and off (and draws them on demand)
function toggleGrid() {
    if (!ui.gridshown) {
        drawGrid();
        ui.gridshown = true;
    } else {
        clearGrid();
        ui.gridshown = false;
    }
}

// Tries to show all components available when user unlocks/locks the UI and saves the locations of all the UI components
function toggleLock() {
    interact("[id$=bar]").draggable({
        enabled: ui.locked,
        listeners: {
            move(event) {
                //let settings =
                ui.dragPosition[event.target.id].x += event.dx;
                ui.dragPosition[event.target.id].y += event.dy;

                let rotate = null;
                if (event.target.style.transform.includes("rotate"))
                    rotate = event.target.style.transform.split("rotate").pop();

                event.target.style.transform = `translate(${parseInt(
                    ui.dragPosition[event.target.id].x,
                )}px, ${parseInt(ui.dragPosition[event.target.id].y)}px)${
                    rotate ? `rotate${rotate}` : ""
                }`;
            },
            end() {
                saveSettings();
            },
        },
    });
    if (ui.locked) {
        if (!ui.actlocked) {
            document.getElementById("lock-overlay-reminder").style.display =
                "block";
        }

        setAndCheckTickers(true);

        let timerbar = document.getElementById("timer-bar");
        timerbar.style.display = "block";
        timerbar.setAttribute(
            "data-label",
            language.find((x) => x.id === "pulltimer").string,
        );

        let dottimerbar = document.getElementById("dot-timer-bar");
        dottimerbar.style.display = "block";
        dottimerbar.setAttribute(
            "data-label",
            language.find((x) => x.id === "dot-anchor").string,
        );

        let bufftimerbar = document.getElementById("buff-timer-bar");
        bufftimerbar.style.display = "block";
        bufftimerbar.setAttribute(
            "data-label",
            language.find((x) => x.id === "buff-anchor").string,
        );

        let raidbuffAnchor = document.createElement("span");
        raidbuffAnchor.id = "raid-buffs-anchor";
        raidbuffAnchor.className = "anchor-text";
        raidbuffAnchor.textContent = language.find(
            (x) => x.id === "raidbuffs-anchor",
        ).string;
        document.getElementById("raid-buffs-bar").appendChild(raidbuffAnchor);

        let mitigationAnchor = document.createElement("span");
        mitigationAnchor.id = "mitigation-anchor";
        mitigationAnchor.className = "anchor-text";
        mitigationAnchor.textContent = language.find(
            (x) => x.id === "mitigation-anchor",
        ).string;
        document.getElementById("mitigation-bar").appendChild(mitigationAnchor);

        let customcdAnchor = document.createElement("span");
        customcdAnchor.id = "customcd-anchor";
        customcdAnchor.className = "anchor-text";
        customcdAnchor.textContent = language.find(
            (x) => x.id === "customcd-anchor",
        ).string;
        document.getElementById("customcd-bar").appendChild(customcdAnchor);

        let partyAnchor = document.createElement("span");
        partyAnchor.id = "party-anchor";
        partyAnchor.className = "anchor-text";
        partyAnchor.textContent = language.find(
            (x) => x.id === "party-anchor",
        ).string;

        if (document.querySelectorAll("#party-bar>div").length === 0) {
            document.getElementById("party-bar").appendChild(partyAnchor);
        } else {
            document.getElementById("party-row-1").appendChild(partyAnchor);
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

        document.getElementById("timer-bar").style.display = "none";
        document.getElementById("dot-timer-bar").style.display = "none";
        document.getElementById("buff-timer-bar").style.display = "none";
        document.getElementById("buff-timer-bar").style.display = "none";
        document.getElementById("raid-buffs-anchor").remove();
        document.getElementById("mitigation-anchor").remove();
        document.getElementById("customcd-anchor").remove();
        document.getElementById("party-anchor").remove();
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
        document.getElementById("lock-overlay-reminder").style.display = "none";
        document.documentElement.style.border = "none";
    }
}

// Helper functions
// Puts a color filter over a HTML5 progress bar that's colorcoded in sepia colors so the bars actually gets colored
function applyFilterColorToElement(classId, filterColor) {
    let barcolors = document.getElementById("bar-colors");
    let filter = `.${classId}::-webkit-progress-value { filter: var(${filterColor}); }`;
    barcolors.sheet.insertRule(filter);
}

// Vanilla JS way of loading a script and getting a callback
function getScript(scriptUrl, callback) {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.onload = callback;

    document.body.appendChild(script);
}

// Gets the correct settings/elements/active components for given selector
function getSelectorProperties(selector) {
    let object = {};
    switch (selector) {
        case "RaidBuff": {
            object = {
                id: "raid-buffs",
                settings: currentSettings.raidbuffs,
                active: activeElements.raidBuffs,
            };
            break;
        }
        case "Mitigation": {
            object = {
                id: "mitigation",
                settings: currentSettings.mitigation,
                active: activeElements.mitigations,
            };
            break;
        }
        case "Party": {
            object = {
                id: "party",
                settings: currentSettings.party,
                active: activeElements.partyCooldowns,
            };
            break;
        }
        case "CustomCooldown": {
            object = {
                id: "customcd",
                settings: currentSettings.customcd,
                active: activeElements.customCooldowns,
            };
            break;
        }
        case "Buff": {
            object = {
                id: "buff",
                settings: currentSettings.bufftimerbar,
                active: activeElements.buffBars,
            };
            break;
        }
    }

    return object;
}

// Handles showing/hiding of component based on player settings and if he's in combat
function toggleHideOutOfCombatElements() {
    currentSettings.healthbar.hideoutofcombat && !gameState.inCombat
        ? document.getElementById("health-bar").classList.add("hide-in-combat")
        : document
              .getElementById("health-bar")
              .classList.remove("hide-in-combat");
    currentSettings.manabar.hideoutofcombat && !gameState.inCombat
        ? document.getElementById("mana-bar").classList.add("hide-in-combat")
        : document
              .getElementById("mana-bar")
              .classList.remove("hide-in-combat");
    currentSettings.mpticker.hideoutofcombat && !gameState.inCombat
        ? document
              .getElementById("mp-ticker-bar")
              .classList.add("hide-in-combat")
        : document
              .getElementById("mp-ticker-bar")
              .classList.remove("hide-in-combat");
    currentSettings.dotticker.hideoutofcombat && !gameState.inCombat
        ? document
              .getElementById("dot-ticker-bar")
              .classList.add("hide-in-combat")
        : document
              .getElementById("dot-ticker-bar")
              .classList.remove("hide-in-combat");
    currentSettings.hotticker.hideoutofcombat && !gameState.inCombat
        ? document
              .getElementById("hot-ticker-bar")
              .classList.add("hide-in-combat")
        : document
              .getElementById("hot-ticker-bar")
              .classList.remove("hide-in-combat");

    let bufftimers = document.querySelectorAll("[id$=buff-timer]");
    let bufftimerimages = document.querySelectorAll("[id$=buff-image]");
    if (currentSettings.bufftimerbar.hideoutofcombat && !gameState.inCombat) {
        Array.prototype.forEach.call(bufftimers, (bufftimer) => {
            bufftimer.classList.add("hide-in-combat");
        });
        Array.prototype.forEach.call(bufftimerimages, (bufftimerimage) => {
            bufftimerimage.classList.add("hide-in-combat");
        });
    } else {
        Array.prototype.forEach.call(bufftimers, (bufftimer) => {
            bufftimer.classList.remove("hide-in-combat");
        });
        Array.prototype.forEach.call(bufftimerimages, (bufftimerimage) => {
            bufftimerimage.classList.remove("hide-in-combat");
        });
    }

    let dottimers = document.querySelectorAll("[id$=dot-timer]");
    let dottimerimages = document.querySelectorAll("[id$=dot-image]");
    if (currentSettings.dottimerbar.hideoutofcombat && !gameState.inCombat) {
        Array.prototype.forEach.call(dottimers, (dottimer) => {
            dottimer.classList.add("hide-in-combat");
        });
        Array.prototype.forEach.call(dottimerimages, (dottimerimage) => {
            dottimerimage.classList.add("hide-in-combat");
        });
    } else {
        Array.prototype.forEach.call(dottimers, (dottimer) => {
            dottimer.classList.remove("hide-in-combat");
        });
        Array.prototype.forEach.call(dottimerimages, (dottimerimage) => {
            dottimerimage.classList.remove("hide-in-combat");
        });
    }

    currentSettings.stacksbar.hideoutofcombat && !gameState.inCombat
        ? document.getElementById("stacks-bar").classList.add("hide-in-combat")
        : document
              .getElementById("stacks-bar")
              .classList.remove("hide-in-combat");
    currentSettings.raidbuffs.hideoutofcombat && !gameState.inCombat
        ? document
              .getElementById("raid-buffs-bar")
              .classList.add("hide-in-combat")
        : document
              .getElementById("raid-buffs-bar")
              .classList.remove("hide-in-combat");
    currentSettings.mitigation.hideoutofcombat && !gameState.inCombat
        ? document
              .getElementById("mitigation-bar")
              .classList.add("hide-in-combat")
        : document
              .getElementById("mitigation-bar")
              .classList.remove("hide-in-combat");
    currentSettings.customcd.hideoutofcombat && !gameState.inCombat
        ? document
              .getElementById("customcd-bar")
              .classList.add("hide-in-combat")
        : document
              .getElementById("customcd-bar")
              .classList.remove("hide-in-combat");
    currentSettings.party.hideoutofcombat && !gameState.inCombat
        ? document.getElementById("party-bar").classList.add("hide-in-combat")
        : document
              .getElementById("party-bar")
              .classList.remove("hide-in-combat");
}

// Handles showing/hiding of component based on player settings and if he's in a party
function toggleHideWhenSoloCombatElements(toggleLock = false) {
    let show = gameState.partyList.length !== 1;
    if (toggleLock) show = true;
    if (currentSettings.raidbuffs.hidewhensolo)
        document.getElementById("raid-buffs-bar").style.display = show
            ? "block"
            : "none";
    if (currentSettings.mitigation.hidewhensolo)
        document.getElementById("mitigation-bar").style.display = show
            ? "block"
            : "none";
    if (currentSettings.customcd.hidewhensolo)
        document.getElementById("customcd-bar").style.display = show
            ? "block"
            : "none";
    if (currentSettings.party.hidewhensolo)
        document.getElementById("party-bar").style.display = show
            ? "block"
            : "none";
}

// UI Generation for Job Stacks
function generateJobStacks() {
    let stacks = document.getElementById("stacks-bar");
    let range = document.createRange();
    range.selectNodeContents(stacks);
    range.deleteContents();

    let stackfragment = document.createDocumentFragment();

    for (let i = 1; i <= 4; i++) {
        let stackbg = document.createElement("div");
        stackbg.id = `stacks-background-${i}`;
        stackbg.classList.add("stack-background", "stack-hidden");

        let stack = document.createElement("img");
        stack.id = `stacks-${i}`;
        stack.className = "stack-color";
        stack.src = `skins/${currentSettings.skin}/images/arrow-fill-empty.png`;

        stackbg.appendChild(stack);
        stackfragment.appendChild(stackbg);
    }
    stacks.appendChild(stackfragment);
}

// Check ticker settings and set the correct properties
function setAndCheckTickers(setAnchor = false) {
    let tickerTypes = ["mp", "dot", "hot"];
    for (let tickerType of tickerTypes) {
        let tickerBar = document.getElementById(`${tickerType}-ticker-bar`);

        if (setAnchor) {
            tickerBar.style.display = "block";
            tickerBar.setAttribute(
                "data-label",
                language.find((x) => x.id === `${tickerType}ticker`).string,
            );
        } else {
            tickerBar.style.display = "none";
            tickerBar.setAttribute("data-label", "");
        }

        if (currentSettings[`${tickerType}ticker`].enabled) {
            if (currentSettings[`${tickerType}ticker`].specificjobsenabled) {
                if (
                    currentSettings[
                        `${tickerType}ticker`
                    ].specificjobs.includes(gameState.player.job)
                ) {
                    tickerBar.style.display = "block";
                } else {
                    tickerBar.style.display = "none";
                }
            }
        }
    }
}

// Handles reloading all the modules (after for example changing settings or coming into a battle live)
function reloadCooldownModules() {
    toLog([
        `[reloadCooldownModules] Zone: ${gameState.zone.type} CurrentPartyList:`,
        gameState.partyList,
    ]);
    if (gameState.player.job === "SMN") {
        initializeSmn();
        adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
    }
    generateCustomCooldowns();
    if (gameState.zone.type == "Pvp") return;
    generateRaidBuffs();
    generateMitigation();
    generatePartyCooldowns();
}

// UI Generation / Handling for all modules that use normal ability icons
function generateCustomCooldowns() {
    toLog(["[generateCustomCooldowns]"]);
    let customAbilityList = [];

    let customcd = document.getElementById("customcd-bar");
    let range = document.createRange();
    range.selectNodeContents(customcd);
    range.deleteContents();

    let playerIndex = 0;
    let currentJob = jobList.find((x) => x.name === gameState.player.job);
    if (currentSettings.customcd.abilities.length === 0) return;
    for (let ability of currentSettings.customcd.abilities.filter(
        (x) => x.type === "CustomCooldown" && x.level <= gameState.player.level,
    )) {
        let pushAbility = false;
        let base = "";
        if (currentJob.base) base = currentJob.base;
        if (
            ability.job === currentJob.name ||
            ability.job === currentJob.type ||
            ability.job === currentJob.position_type ||
            ability.job === base
        ) {
            if (ability.extra.hide !== true) pushAbility = true;
        }
        if (pushAbility && ability.enabled) {
            customAbilityList.push({
                player: gameState.player.name,
                playerIndex: playerIndex,
                ability: ability,
            });
        }
    }
    if (currentSettings.customcd.alwaysshow && currentSettings.customcd.enabled)
        generateIconBarElements(
            "CustomCooldown",
            customAbilityList,
            currentSettings.customcd.columns,
        );
}

// Sets up all the abilities for mitigation and then generates them
function generateMitigation() {
    toLog(["[generateMitigation]"]);
    let mitigationAbilityList = [];

    let mitigation = document.getElementById("mitigation-bar");
    let range = document.createRange();
    range.selectNodeContents(mitigation);
    range.deleteContents();

    let playerIndex = 0;

    let mergedAbilityList = abilityList.concat(
        currentSettings.customcd.abilities,
    );

    let currentJob = jobList.find((x) => x.name === gameState.player.job);
    for (let ability of mergedAbilityList.filter(
        (x) => x.type === "Mitigation" && x.level <= gameState.player.level,
    )) {
        if (
            currentSettings.override.abilities.some(
                (x) => x.id === ability.id && x.type === ability.type,
            )
        ) {
            ability = currentSettings.override.abilities.find(
                (x) => x.id === ability.id && x.type === ability.type,
            );
        }
        let pushAbility = false;
        let base = "";
        if (currentJob.base) base = currentJob.base;
        if (
            ability.job === currentJob.name ||
            ability.job === currentJob.type ||
            ability.job === base
        ) {
            pushAbility = true;
        }
        if (pushAbility && ability.enabled) {
            mitigationAbilityList.push({
                player: gameState.player.name,
                playerIndex: playerIndex,
                ability: ability,
            });
        }
    }
    if (
        currentSettings.mitigation.alwaysshow &&
        currentSettings.mitigation.enabled
    )
        generateIconBarElements(
            "Mitigation",
            mitigationAbilityList,
            currentSettings.mitigation.columns,
        );
}

// Sets up all the abilities for party cooldowns and then generates them
function generatePartyCooldowns() {
    toLog(["[generatePartyCooldowns]"]);
    let partyAbilityList = [];

    let party = document.getElementById("party-bar");
    let range = document.createRange();
    range.selectNodeContents(party);
    range.deleteContents();

    let playerIndex = 0;

    let mergedAbilityList = abilityList.concat(
        currentSettings.customcd.abilities,
    );

    for (let partyMember of gameState.partyList) {
        let base = "";
        if (partyMember.base) base = partyMember.base;
        for (let ability of mergedAbilityList.filter(
            (x) =>
                x.type === "Party" &&
                (x.job === partyMember.job.name ||
                    x.job === partyMember.job.type ||
                    x.job === partyMember.job.position_type ||
                    x.job === base) &&
                x.level <= gameState.player.level,
        )) {
            if (
                currentSettings.override.abilities.some(
                    (x) => x.id === ability.id && x.type == ability.type,
                )
            ) {
                ability = currentSettings.override.abilities.find(
                    (x) => x.name === ability.name && x.type == ability.type,
                );
            }
            let pushAbility = true;
            if (pushAbility && ability.enabled) {
                partyAbilityList.push({
                    player: partyMember,
                    playerIndex: playerIndex,
                    ability: ability,
                });
            }
        }
        playerIndex++;
    }
    if (currentSettings.party.alwaysshow && currentSettings.party.enabled)
        generateIconBarElements("Party", partyAbilityList, 20);
}

// Sets up all the abilities for raidbuffs and then generates them
function generateRaidBuffs() {
    toLog(["[generateRaidBuffs]"]);
    let raidAbilityList = [];

    let raidbuffs = document.getElementById("raid-buffs-bar");
    let range = document.createRange();
    range.selectNodeContents(raidbuffs);
    range.deleteContents();

    let playerIndex = 0;

    let mergedAbilityList = abilityList.concat(
        currentSettings.customcd.abilities,
    );

    for (let partyMember of gameState.partyList) {
        let base = "";
        if (partyMember.base) base = partyMember.base;
        for (let ability of mergedAbilityList.filter(
            (x) =>
                x.type === "RaidBuff" &&
                (x.job === partyMember.job.name ||
                    x.job === partyMember.job.type ||
                    x.job === partyMember.job.position_type ||
                    x.job === base) &&
                x.level <= gameState.player.level,
        )) {
            if (
                currentSettings.override.abilities.some(
                    (x) => x.id === ability.id && x.type == ability.type,
                )
            ) {
                ability = currentSettings.override.abilities.find(
                    (x) => x.id === ability.id && x.type == ability.type,
                );
            }
            let pushAbility = true;
            if (Object.prototype.hasOwnProperty.call(ability, "extra")) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        ability.extra,
                        "is_card",
                    ) ||
                    Object.prototype.hasOwnProperty.call(
                        ability.extra,
                        "is_song",
                    ) ||
                    Object.prototype.hasOwnProperty.call(
                        ability.extra,
                        "is_ss",
                    ) ||
                    Object.prototype.hasOwnProperty.call(ability.extra, "is_ts")
                ) {
                    pushAbility = false;
                }
            }
            if (pushAbility && ability.enabled) {
                raidAbilityList.push({
                    player: partyMember,
                    playerIndex: playerIndex,
                    ability: ability,
                });
            }
        }
        playerIndex++;
    }
    if (!currentSettings.raidbuffs.orderbypartymember)
        raidAbilityList.sort((a, b) => a.ability.order - b.ability.order);
    if (
        currentSettings.raidbuffs.alwaysshow &&
        currentSettings.raidbuffs.enabled
    )
        generateIconBarElements(
            "RaidBuff",
            raidAbilityList,
            currentSettings.raidbuffs.columns,
        );
}

// Generates all the needed HTML elements for current abilities that are relevant for the current job
function generateIconBarElements(selector, iconAbilityList, columns) {
    iconAbilityList.sort((a, b) => {
        return (
            a.playerIndex - b.playerIndex || a.ability.order - b.ability.order
        );
    });
    let selectorProperties = getSelectorProperties(selector);
    let barSelector = selectorProperties.id;
    let selectedSettings = selectorProperties.settings;

    let rows = Math.ceil(iconAbilityList.length / columns);
    let abilityIndex = 0;

    let barElement = document.getElementById(`${barSelector}-bar`);
    let barFragment = document.createDocumentFragment();

    if (selector !== "Party") {
        for (let i = 1; i <= rows; i++) {
            let barRow = document.createElement("div");
            barRow.id = `${barSelector}-row-${i}`;
            barRow.className = "ability-row";
            barRow.style.marginTop = `${selectedSettings.padding}px`;

            let barBox = document.createElement("div");
            barBox.id = `${barSelector}-row-${i}-box`;
            barBox.className = "ability-box";
            if (selectedSettings.growleft)
                barBox.classList.add("ability-reverse");

            for (let j = 1; j <= columns; j++) {
                let ability = iconAbilityList[abilityIndex];
                barBox.appendChild(
                    generateAbilityIcon(
                        ability.playerIndex,
                        ability.ability,
                        i,
                    ),
                );
                if (abilityIndex == iconAbilityList.length - 1) break;
                abilityIndex++;
            }
            barRow.appendChild(barBox);
            barFragment.appendChild(barRow);
        }
        barElement.appendChild(barFragment);
    } else {
        let currentPlayerIndex = 0;
        let players = 8;
        if (currentSettings.includealliance) players = 24;
        let barRowArray = [];
        let barBoxArray = [];
        for (let i = 1; i <= players; i++) {
            let barRow = document.createElement("div");
            barRow.id = `${barSelector}-row-${i}`;
            barRow.className = "ability-row";
            barRow.style.marginTop = `${selectedSettings.padding}px`;

            let barBox = document.createElement("div");
            barBox.id = `${barSelector}-row-${i}-box`;
            barBox.className = "ability-box";
            if (selectedSettings.growleft)
                barBox.classList.add("ability-reverse");

            if (
                iconAbilityList.filter(
                    (ability) => ability.playerIndex === i - 1,
                ).length === 0
            ) {
                let dummyContainer = document.createElement("div");
                dummyContainer.id = `${barSelector}-${i}-dummy-container`;
                dummyContainer.className = "ability-container";
                dummyContainer.style.width = `${selectedSettings.scale * 48}px`;
                dummyContainer.style.height = `${
                    selectedSettings.scale * 48
                }px`;
                dummyContainer.style.marginRight = `${selectedSettings.padding}px`;

                let dummyImage = document.createElement("img");
                dummyImage.id = `${barSelector}-${i}-dummy-image`;
                dummyImage.className = "ability-image";
                dummyImage.src =
                    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
                dummyImage.width = selectedSettings.scale * 40;
                dummyImage.height = selectedSettings.scale * 40;
                dummyImage.style.top = `${selectedSettings.scale * 3}px`;

                dummyContainer.appendChild(dummyImage);
                barBox.appendChild(dummyContainer);
            }

            barRow.appendChild(barBox);
            barBoxArray.push(barBox);
            barRowArray.push(barRow);
        }
        for (let ability of iconAbilityList) {
            if (currentPlayerIndex != ability.playerIndex)
                currentPlayerIndex = ability.playerIndex;
            barBoxArray[ability.playerIndex].appendChild(
                generateAbilityIcon(
                    ability.playerIndex,
                    ability.ability,
                    ability.playerIndex + 1,
                ),
            );
        }
        Array.prototype.forEach.call(barRowArray, (barRow) => {
            barFragment.appendChild(barRow);
        });
        barElement.appendChild(barFragment);
    }
}

// Generates a single ability icon based on player and ability
function generateAbilityIcon(playerIndex, ability, row, generateRow = false) {
    ability.icon = processIconUrl(ability.icon);

    let selectorProperties = getSelectorProperties(ability.type);
    let barSelector = selectorProperties.id;
    let selectedSettings = selectorProperties.settings;

    if (generateRow) {
        if (row === 0) row = 1;
        if (
            document.querySelectorAll(`#${barSelector}-row-${row}`).length === 0
        ) {
            let barElement = document.createElement("div");
            barElement.id = `${barSelector}-row-${row}`;
            barElement.className = "ability-row";
            barElement.style.marginTop = `${selectedSettings.padding}px`;

            let barBox = document.createElement("div");
            barBox.id = `${barSelector}-row-${row}-box`;
            barBox.className = "ability-box";
            barBox.style.marginTop = `${selectedSettings.padding}px`;
            if (selectedSettings.growleft)
                barBox.classList.add("ability-reverse");

            barElement.appendChild(barBox);

            document
                .getElementById(`${barSelector}-bar`)
                .appendChild(barElement);
        }
    }

    let iconWidth = Math.ceil(selectedSettings.scale * 40);
    let iconHeight = Math.ceil(selectedSettings.scale * 40);
    let activeWidth = Math.ceil(selectedSettings.scale * 42);
    let activeHeight = Math.ceil(selectedSettings.scale * 42);
    let boxWidth = Math.ceil(selectedSettings.scale * 48);
    let boxHeight = Math.ceil(selectedSettings.scale * 48);
    let overlayWidth = Math.ceil(selectedSettings.scale * 48);
    let overlayHeight = Math.ceil(selectedSettings.scale * 48);
    let lineHeight = Math.ceil(selectedSettings.scale * 44);

    let abilitySelector = `${barSelector}-${playerIndex}-${ability.id}`;

    let abilityContainer = document.createElement("div");
    abilityContainer.id = `${abilitySelector}-container`;
    abilityContainer.className = "ability-container";
    abilityContainer.style.width = `${boxWidth}px`;
    abilityContainer.style.height = `${boxHeight}px`;
    abilityContainer.style.marginRight = `${selectedSettings.padding}px`;

    let abilityImage = document.createElement("img");
    abilityImage.id = `${abilitySelector}-image`;
    abilityImage.className = "ability-image";
    abilityImage.src = ability.icon;
    abilityImage.width = iconWidth;
    abilityImage.height = iconHeight;
    abilityImage.style.top = `${selectedSettings.scale * 2}px`;

    abilityContainer.appendChild(abilityImage);

    let abilityActive = document.createElement("img");
    abilityActive.id = `${abilitySelector}-active`;
    abilityActive.className = "icon-active";
    abilityActive.src = `skins/${currentSettings.skin}/images/combo.gif`;
    abilityActive.width = activeWidth;
    abilityActive.height = activeHeight;
    abilityActive.style.top = `${selectedSettings.scale * 1}px`;
    abilityActive.style.display = "none";

    abilityContainer.appendChild(abilityActive);

    let abilityOverlay = document.createElement("img");
    abilityOverlay.id = `${abilitySelector}-overlay`;
    abilityOverlay.className = "icon-overlay";
    abilityOverlay.src = `skins/${currentSettings.skin}/images/icon-overlay.png`;
    abilityOverlay.width = overlayWidth;
    abilityOverlay.height = overlayHeight;

    abilityContainer.appendChild(abilityOverlay);

    let abilityCooldown = document.createElement("span");
    abilityCooldown.id = `${abilitySelector}-cooldown`;
    abilityCooldown.className = "ability-text";
    abilityCooldown.style.lineHeight = `${lineHeight}px`;
    abilityCooldown.style.marginLeft = `${
        selectedSettings.scale * 2 + selectedSettings.fontxoffset
    }px`;
    abilityCooldown.style.marginTop = `${selectedSettings.fontyoffset}px`;
    abilityCooldown.style.color = selectedSettings.cooldowncolor;
    abilityCooldown.style.fontSize = selectedSettings.staticfontsize
        ? selectedSettings.fontsize
        : selectedSettings.scale * 24;
    abilityCooldown.style.fontWeight = selectedSettings.cooldownbold
        ? "bold"
        : "normal";

    if (selectedSettings.cooldownoutline) {
        abilityCooldown.style.webkitTextStroke = `1.5px ${selectedSettings.durationoutlinecolor}`;
    }

    abilityContainer.appendChild(abilityCooldown);

    let abilityDuration = document.createElement("span");
    abilityDuration.id = `${abilitySelector}-duration`;
    abilityDuration.className = "ability-text";
    abilityDuration.style.lineHeight = `${lineHeight}px`;
    abilityDuration.style.marginLeft = `${
        selectedSettings.scale * 2 + selectedSettings.fontxoffset
    }px`;
    abilityDuration.style.marginTop = `${selectedSettings.fontyoffset}px`;
    abilityDuration.style.color = selectedSettings.durationcolor;
    abilityDuration.style.fontSize = selectedSettings.staticfontsize
        ? selectedSettings.fontsize
        : selectedSettings.scale * 24;
    abilityDuration.style.fontWeight = selectedSettings.durationbold
        ? "bold"
        : "normal";

    if (selectedSettings.durationoutline) {
        abilityDuration.style.webkitTextStroke = `1.5px ${selectedSettings.durationoutlinecolor}`;
    }

    abilityContainer.appendChild(abilityDuration);

    return abilityContainer;
}

// Handlers for creating/maintaining party list
// Generates "raw" partylist that's in the format that generatePartyList expects, made for cases where a player joins late and other sources needs to be used to determine what job classes are in the players party
function generateRawPartyList(fromCombatants, combatants = null) {
    if (fromCombatants) {
        let partyList = combatants.filter((x) => x.PartyType !== 0);
        let rawList = [];
        for (let partyMember of partyList) {
            rawList.push({
                id: parseInt(partyMember.ID).toString(16).toUpperCase(),
                inParty: partyMember.PartyType === 1,
                job: partyMember.Job,
                level: partyMember.Level,
                name: partyMember.Name,
                worldId: partyMember.WorldID,
            });
        }
        return rawList;
    }
    return [
        {
            id: parseInt(gameState.player.id).toString(16).toUpperCase(),
            inParty: false,
            job: jobList.find((x) => x.name === gameState.player.job).id,
            level: gameState.player.level,
            name: gameState.player.name,
            worldId: null,
        },
    ];
}

// Generate partylist with extra metadata (for example player jobs and what type the job is)
function generatePartyList(party) {
    toLog(["[GeneratePartyList] RawPartyList:", party]);
    gameState.rawPartyList = party;
    gameState.partyList = [];
    for (let partyMember of party) {
        if (
            !(
                !partyMember.inParty &&
                !currentSettings.includealliance &&
                partyMember.name !== gameState.player.name
            )
        ) {
            gameState.partyList.push({
                id: partyMember.id,
                inParty: partyMember.inParty,
                job: jobList.find((x) => x.id === partyMember.job),
                level: partyMember.level,
                name: partyMember.name,
                worldId: partyMember.worldId,
            });
        }
    }

    let jobOrder = currentSettings.rolepartyorder[gameState.currentrole];
    let currentPlayerElement = gameState.partyList.find(
        (x) => x.name === gameState.player.name,
    );
    gameState.partyList.sort((a, b) => b.id - a.id);
    gameState.partyList.sort(
        (a, b) => jobOrder.indexOf(a.job.name) - jobOrder.indexOf(b.job.name),
    );
    gameState.partyList = gameState.partyList.filter(
        (x) => x !== currentPlayerElement,
    );
    if (currentSettings.includealliance) {
        let ownParty = gameState.partyList.filter((x) => x.inParty);
        let alliance = gameState.partyList.filter((x) => !x.inParty);
        gameState.partyList = ownParty.concat(alliance);
    }
    gameState.partyList.unshift(currentPlayerElement);
}

// Manual party check from getCombatants in case the players party is null (for example when player reloaded the UI)
function checkForParty(e) {
    let combatants = e.combatants;
    if (combatants === undefined || gameState.player === undefined) return;
    let player = combatants.find((x) => x.ID === gameState.player.id);
    let partyList = generateRawPartyList(player.PartyType !== 0, combatants);
    generatePartyList(partyList);
    reloadCooldownModules();
}

// Timer and TTS handlers
// Handle ability timers when ability is used
function startAbilityIconTimers(
    playerIndex,
    ability,
    onYou = true,
    abilityHolder = null,
    ignoreCooldown = false,
) {
    toLog([
        `[StartAbilityIconTimers] PlayerIndex: ${playerIndex} On You: ${onYou} Ignore Cooldown: ${ignoreCooldown}`,
        ability,
        abilityHolder,
    ]);
    let abilityUsed = abilityHolder === null ? ability : abilityHolder;
    let usingAbilityHolder = abilityHolder !== null;

    if (
        currentSettings.general.usehdicons &&
        !ability.icon.includes("_hr1.png")
    ) {
        ability.icon = ability.icon.replace(".png", "_hr1.png");
        if (usingAbilityHolder && !abilityHolder.icon.includes("_hr1.png"))
            abilityHolder.icon = abilityHolder.icon.replace(".png", "_hr1.png");
    }
    if (usingAbilityHolder) {
        abilityHolder.icon = processIconUrl(abilityHolder.icon);
    } else {
        ability.icon = processIconUrl(ability.icon);
    }

    let selectorProperties = getSelectorProperties(ability.type);
    let barSelector = selectorProperties.id;
    let selectedSettings = selectorProperties.settings;
    let selectedActive = selectorProperties.active;

    if (!selectedSettings.enabled) return;
    if (playerIndex == -1) return;
    if (barSelector === "customcd" && playerIndex !== 0) return;

    let selector = `${barSelector}-${playerIndex}-${abilityUsed.id}`;

    let abilityIndex = `${playerIndex}-${ability.id}`;
    let abilityHasCharges = false;
    if (Object.prototype.hasOwnProperty.call(ability, "extra")) {
        if (Object.prototype.hasOwnProperty.call(ability.extra, "charges")) {
            abilityHasCharges = true;
            let max_charges = ability.extra.charges;
            if (!activeElements.currentCharges.has(abilityIndex)) {
                activeElements.currentCharges.set(
                    abilityIndex,
                    max_charges - 1,
                );
            } else {
                let currentCharges = activeElements.currentCharges.get(
                    abilityIndex,
                );
                activeElements.currentCharges.set(
                    abilityIndex,
                    currentCharges - 1,
                );
            }
        }
    }
    if (
        selectedActive.has(`${playerIndex}-${ability.id}`) &&
        !abilityHasCharges
    ) {
        if (activeElements.countdowns.has(`${selector}-duration`)) {
            clearInterval(
                activeElements.countdowns.get(`${selector}-duration`),
            );
            stopAbilityTimer(`${selector}-duration`, null);
        }
        if (
            activeElements.countdowns.has(`${selector}-cooldown`) &&
            !ignoreCooldown
        ) {
            clearInterval(
                activeElements.countdowns.get(`${selector}-cooldown`),
            );
        }
        if (!ignoreCooldown) stopAbilityTimer(`${selector}-cooldown`, null);
    }

    handleAbilityTTS(ability, selector, onYou);

    if (onYou) {
        if (!selectedSettings.alwaysshow) {
            let row = Math.ceil(selectedActive.size / selectedSettings.columns);
            let abilityElement = generateAbilityIcon(
                playerIndex,
                ability,
                row,
                true,
            );
            if (row === 0) row = 1;
            if (!document.getElementById(`${selector}-container`)) {
                document
                    .getElementById(`${barSelector}-row-${row}-box`)
                    .appendChild(abilityElement);
            }
        }

        if (document.getElementById(`${selector}-overlay`))
            document.getElementById(
                `${selector}-overlay`,
            ).src = `skins/${currentSettings.skin}/images/icon-overlay.png`;

        document.getElementById(`${selector}-active`).style.display = "block";
        document.getElementById(`${selector}-duration`).style.display = "block";
        document.getElementById(`${selector}-duration`).textContent =
            ability.duration;
        if (document.getElementById(`${selector}-cooldown`))
            document.getElementById(`${selector}-cooldown`).style.display =
                "none";

        if (usingAbilityHolder) {
            let previousIcon = `${abilityHolder.icon}`;
            document.getElementById(`${selector}-image`).src = ability.icon;
            startAbilityTimer(
                ability.duration,
                `${selector}-duration`,
                previousIcon,
                abilityIndex,
            );
        } else {
            startAbilityTimer(
                ability.duration,
                `${selector}-duration`,
                null,
                abilityIndex,
            );
        }
    } else {
        if (document.getElementById(`${selector}-overlay`)) {
            document.getElementById(`${selector}-overlay`).src =
                ability.cooldown > 0
                    ? `skins/${currentSettings.skin}/images/icon-overlay-cooldown.png`
                    : `skins/${currentSettings.skin}/images/icon-overlay.png`;
        }
        if (document.getElementById(`${selector}-cooldown`)) {
            document.getElementById(`${selector}-cooldown`).style.display =
                "block";
            document.getElementById(`${selector}-cooldown`).textContent =
                ability.cooldown;
        }
    }
    if (selectedSettings.alwaysshow && !ignoreCooldown)
        startAbilityTimer(
            ability.cooldown,
            `${selector}-cooldown`,
            null,
            abilityIndex,
        );

    selectedActive.set(`${playerIndex}-${ability.id}`, selector);
}

// Handle ability bar timers when effects occur or certain cooldowns are used
function startAbilityBarTimer(
    ability,
    duration,
    onYou,
    extends_duration = false,
    max_duration = 0,
    abilityHolder = null,
) {
    toLog([
        `[StartAbilityBarTimer] Duration: ${duration} On You: ${onYou}`,
        ability,
        abilityHolder,
    ]);
    let abilityUsed = abilityHolder === null ? ability : abilityHolder;
    let usingAbilityHolder = abilityHolder !== null;

    if (!currentSettings[`${ability.type.toLowerCase()}timerbar`].enabled)
        return;
    let targetBarSelector = `${ability.type.toLowerCase()}-timer-bar`;
    let targetImageSelector = `${ability.type.toLowerCase()}-image`;
    let targetPosition =
        ui.dragPosition[`${ability.type.toLowerCase()}-timer-bar`];
    let selectorBar = `${abilityUsed.id}-${ability.type.toLowerCase()}-timer`;
    let selectorImage = `${abilityUsed.id}-${ability.type.toLowerCase()}-image`;
    ability.duration = parseInt(duration);
    if (
        !activeElements.dotBars.has(abilityUsed.id) &&
        !activeElements.buffBars.has(abilityUsed.id)
    ) {
        switch (abilityUsed.type) {
            case "DoT": {
                activeElements.dotBars.set(abilityUsed.id, selectorBar);
                break;
            }
            case "Buff": {
                activeElements.buffBars.set(abilityUsed.id, selectorBar);
                break;
            }
        }
        let targetBar = document.getElementById(targetBarSelector);
        let newBar = targetBar.cloneNode(true);
        newBar.id = selectorBar;
        newBar.style.display = "block";
        newBar.classList.add(`bar-${ability.id}`);
        newBar.classList.add(`${ability.type.toLowerCase()}-font-size`);
        targetBar.insertAdjacentElement("afterend", newBar);

        let targetImage = document.getElementById(targetImageSelector);
        let newImage = targetImage.cloneNode(true);
        newImage.id = selectorImage;
        targetImage.insertAdjacentElement("afterend", newImage);

        applyFilterColorToElement(`bar-${ability.id}`, ability.color);

        newBar.setAttribute(
            "data-font-size",
            currentSettings[`${ability.type.toLowerCase()}timerbar`].scale * 10,
        );

        switch (
            parseInt(
                currentSettings[`${ability.type.toLowerCase()}timerbar`]
                    .growdirection,
            )
        ) {
            case 1: {
                // Down
                newBar.style.transform = `translate(${targetPosition.x}px, ${
                    targetPosition.y +
                    currentSettings[`${ability.type.toLowerCase()}timerbar`]
                        .padding *
                        ability.order
                }px)`;
                break;
            }
            case 2: {
                // Up
                newBar.style.transform = `translate(${targetPosition.x}px, ${
                    targetPosition.y -
                    currentSettings[`${ability.type.toLowerCase()}timerbar`]
                        .padding *
                        ability.order
                }px)`;
                break;
            }
            case 3: {
                // Left
                newBar.style.transform = `translate(${
                    targetPosition.x -
                    currentSettings[`${ability.type.toLowerCase()}timerbar`]
                        .padding *
                        ability.order
                }px, ${targetPosition.y}px)`;
                break;
            }
            case 4: {
                // Right
                newBar.style.transform = `translate(${
                    targetPosition.x +
                    currentSettings[`${ability.type.toLowerCase()}timerbar`]
                        .padding *
                        ability.order
                }px, ${targetPosition.y}px)`;
                break;
            }
        }

        if (
            currentSettings[`${ability.type.toLowerCase()}timerbar`]
                .imageenabled
        ) {
            newImage.style.display = "block";
            newImage.src = ability.icon;
            newImage.style.imageRendering =
                currentSettings[`${ability.type.toLowerCase()}timerbar`].scale >
                1
                    ? "pixelated"
                    : "-webkit-optimize-contrast";
            newImage.style.height =
                currentSettings[`${ability.type.toLowerCase()}timerbar`].scale *
                22;

            let left = targetPosition.x;
            let top = targetPosition.y;

            switch (
                parseInt(
                    currentSettings[`${ability.type.toLowerCase()}timerbar`]
                        .growdirection,
                )
            ) {
                case 1: {
                    // Down
                    left =
                        left -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .scale *
                            30;
                    top =
                        top +
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .padding *
                            ability.order -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .scale *
                            4;
                    break;
                }
                case 2: {
                    // Up
                    left =
                        left -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .scale *
                            30;
                    top =
                        top -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .padding *
                            ability.order -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .scale *
                            4;
                    break;
                }
                case 3: {
                    // Left
                    top =
                        top -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .scale *
                            4;
                    left =
                        left -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .padding *
                            ability.order -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .scale *
                            30;
                    break;
                }
                case 4: {
                    // Right
                    top =
                        top -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .scale *
                            4;
                    left =
                        left +
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .padding *
                            ability.order -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .scale *
                            30;
                    break;
                }
            }
            newImage.style.transform = `translate(${left}px, ${top}px)`;
        }
    }
    if (
        usingAbilityHolder &&
        currentSettings[`${ability.type.toLowerCase()}timerbar`].imageenabled
    )
        document.getElementById(selectorImage).src = ability.icon;
    if (usingAbilityHolder)
        applyFilterColorToElement(`bar-${abilityUsed.id}`, ability.color);
    if (activeElements.countdowns.has(selectorBar) && extends_duration) {
        duration =
            parseInt(document.getElementById(selectorBar).textContent) / 1000 +
            parseInt(duration);
        if (duration > max_duration) duration = max_duration;
    }
    if (activeElements.countdowns.has(selectorBar))
        clearInterval(activeElements.countdowns.get(selectorBar));
    handleAbilityTTS(ability, selectorBar, onYou);
    startBarTimer(
        duration,
        selectorBar,
        currentSettings[`${ability.type.toLowerCase()}timerbar`]
            .hidewhendroppedoff,
    );
}

// Start and handle actual timer for ability
function startAbilityTimer(
    duration,
    selector,
    previousIcon = null,
    abilityIndex = null,
) {
    let timems = duration * 1000;

    let abilityElement = document.getElementById(selector);
    abilityElement.textContent = duration;

    let timeLeft = timems;
    let countdownTimer = setInterval(function () {
        timeLeft -= UPDATE_INTERVAL;
        abilityElement.textContent = (timeLeft / 1000).toFixed(0);
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            setTimeout(function () {
                stopAbilityTimer(selector, previousIcon, abilityIndex);
            }, UPDATE_INTERVAL);
        }
    }, UPDATE_INTERVAL);
    activeElements.countdowns.set(selector, countdownTimer);
}

function toggleTimerBarDisplay(selector, display) {
    let bar = document.getElementById(selector);
    let image = document.getElementById(selector.replace("timer", "image"));
    if (bar) bar.style.display = display ? "block" : "none";
    if (image) image.style.display = display ? "block" : "none";
}

// Start and handle actual timer for bars/effects
function startBarTimer(
    duration,
    selector,
    hideTimer = false,
    reverseBar = false,
    loop = false,
) {
    toLog([
        `[StartBarTimer] Duration: ${duration} Selector: ${selector} Hidetimer: ${hideTimer} Reverse: ${reverseBar} Loop: ${loop}`,
    ]);
    let timems = duration * 1000;
    let barElement = document.getElementById(selector);
    barElement.value = reverseBar ? 0 : timems;
    barElement.max = timems;
    if (!selector.endsWith("ticker-bar"))
        barElement.setAttribute("data-label", timems);

    if (hideTimer) toggleTimerBarDisplay(selector, true);

    let timeLeft = timems;
    let maxTime = timems;
    let countdownTimer = setInterval(function () {
        timeLeft -= UPDATE_INTERVAL;
        let visualTime = 0;
        if (reverseBar) {
            visualTime = maxTime - timeLeft;
        } else {
            visualTime = timeLeft - UPDATE_INTERVAL;
        }

        if (barElement.value != visualTime) barElement.value = visualTime;

        if (!selector.endsWith("ticker-bar"))
            barElement.setAttribute("data-label", (timeLeft / 1000).toFixed(1));
        if (timeLeft <= 0 && !loop) {
            clearInterval(countdownTimer);
            setTimeout(function () {
                if (hideTimer) {
                    if (selector !== "timer-bar") {
                        removeTimerBar(selector);
                    } else {
                        toggleTimerBarDisplay(selector, false);
                    }
                }
            }, UPDATE_INTERVAL);
        }
        if (timeLeft <= 0 && loop) {
            timeLeft = GAME_DATA.EFFECT_TICK * 1000;
        }
    }, UPDATE_INTERVAL);
    activeElements.countdowns.set(selector, countdownTimer);
}

function getElementType(selector) {
    if (selector.startsWith("raid-buffs")) return "raidbuffs";
    if (selector.startsWith("mitigation")) return "mitigation";
    if (selector.startsWith("party")) return "party";
    if (selector.startsWith("customcd")) return "customcd";
    return "undefined";
}

// Stop active ability timer right away and handles the visual aspect of it
function stopAbilityTimer(selector, previousIcon = null, abilityIndex = null) {
    let elementType = getElementType(selector);
    if (selector.endsWith("duration")) {
        let cooldown = selector.replace("duration", "cooldown");
        let image = selector.replace("duration", "image");
        let active = selector.replace("duration", "active");
        let overlay = selector.replace("duration", "overlay");
        let container = selector.replace("duration", "container");

        if (!currentSettings[elementType].alwaysshow) {
            if (document.getElementById(container)) {
                document.getElementById(container).remove();
            }
        }
        if (document.getElementById(selector))
            document.getElementById(selector).textContent = "";

        if (previousIcon !== null && currentSettings[elementType].alwaysshow) {
            document.getElementById(image).src = previousIcon;
        }
        if (document.getElementById(cooldown)) {
            document.getElementById(cooldown).style.display = "block";
        }
        if (document.getElementById(active)) {
            document.getElementById(active).style.display = "none";
        }
        if (document.getElementById(cooldown)) {
            if (document.getElementById(cooldown).textContent.length !== 0) {
                document.getElementById(
                    overlay,
                ).src = `skins/${currentSettings.skin}/images/icon-overlay-cooldown.png`;
            }
        }
    }
    if (selector.endsWith("cooldown")) {
        if (abilityIndex) {
            if (activeElements.currentCharges.has(abilityIndex)) {
                activeElements.currentCharges.set(
                    abilityIndex,
                    parseInt(activeElements.currentCharges.get(abilityIndex)) +
                        1,
                );
            }
        }
        if (!currentSettings[elementType].alwaysshow) {
            if (document.getElementById(selector))
                document.getElementById(selector).remove();
            return;
        }
        if (document.getElementById(selector)) {
            document.getElementById(selector).textContent = "";
            document.getElementById(
                selector.replace("cooldown", "overlay"),
            ).src = `skins/${currentSettings.skin}/images/icon-overlay.png`;
        }
    }
}

function stopBarTimer(selector, hideTimer) {
    if (document.getElementById(selector)) {
        document.getElementById(selector).value = 0;
        document.getElementById(selector).setAttribute("data-label", "");
        if (hideTimer) toggleTimerBarDisplay(selector, false);
    }
}

// Stop all active timers for certain player in your party (when he for example dies)
function stopPlayerDurationTimers(playerindex) {
    activeElements.partyCooldowns.forEach((value, key) => {
        if (key.split("-")[0] == playerindex) {
            if (activeElements.countdowns.has(`${value}-duration`)) {
                clearInterval(
                    activeElements.countdowns.get(`${value}-duration`),
                );
            }
            stopAbilityTimer(`${value}-duration`, null);
        }
    });

    if (playerindex === 0) {
        activeElements.countdowns.forEach((value, key) => {
            let split = key.split("-");
            let last = split[split.length - 1];
            if (last == "duration") {
                clearInterval(activeElements.countdowns.get(key));
                stopAbilityTimer(key, null);
            }
        });
    }
}

// Stop remove active bar
function removeTimerBar(selector) {
    document.getElementById(selector).remove();
    document.getElementById(selector.replace("timer", "image")).remove();
    if (activeElements.buffBars.has(parseInt(selector.match(/[0-9]+/g)[0])))
        activeElements.buffBars.delete(parseInt(selector.match(/[0-9]+/g)[0]));
    if (activeElements.dotBars.has(parseInt(selector.match(/[0-9]+/g)[0])))
        activeElements.dotBars.delete(parseInt(selector.match(/[0-9]+/g)[0]));
}

// Reset all timers
function resetTimers() {
    let tickerTypes = ["mp", "dot", "hot"];
    for (let tickerType of tickerTypes) {
        document.getElementById(`${tickerType}-ticker-bar`).value = 0;
        document
            .getElementById(`${tickerType}-ticker-bar`)
            .setAttribute("data-label", "");
    }
    for (let [, countdownTimer] of activeElements.countdowns) {
        clearInterval(countdownTimer);
    }
    for (let [, selector] of activeElements.buffBars) {
        removeTimerBar(selector);
    }
    for (let [, selector] of activeElements.dotBars) {
        removeTimerBar(selector);
    }
    activeElements.buffBars.clear();
    activeElements.dotBars.clear();
    activeElements.countdowns.clear();
}

// Set actual timer for when TTS needs to be played for certain abilities
function startTTSTimer(
    duration,
    selector,
    text,
    timeWhen = currentSettings.general.ttsearly * 1000,
) {
    toLog([
        `[StartTTSTimer] Duration: ${duration} Selector: ${selector} Text: ${text} TimeWhen: ${timeWhen}`,
    ]);
    if (!activeElements.ttsElements.has(selector)) {
        if (currentSettings.general.usewebtts)
            activeElements.ttsElements[selector] = setWebTTS(text);
    }

    let timems = duration * 1000;
    let timeLeft = timems;
    let ttsTimer = setInterval(function () {
        timeLeft -= UPDATE_INTERVAL;
        if (timeLeft <= timeWhen) {
            currentSettings.general.usewebtts
                ? activeElements.ttsElements[selector].play()
                : callOverlayHandler({ call: "cactbotSay", text: text });
            clearInterval(ttsTimer);
            setTimeout(function () {}, UPDATE_INTERVAL);
        }
    }, UPDATE_INTERVAL);
    activeElements.tts.set(selector, ttsTimer);
}

// Set up event for when TTS needs to occur for certain abilities
function handleAbilityTTS(ability, selector, onYou = true) {
    if (activeElements.tts.has(selector))
        clearInterval(activeElements.tts.get(selector));
    switch (ability.type) {
        case "DoT":
            if (!currentSettings.dottimerbar.ttsenabled) return;
            break;
        case "Buff":
            if (!currentSettings.bufftimerbar.ttsenabled) return;
            break;
        case "RaidBuff":
            if (!currentSettings.raidbuffs.ttsenabled) return;
            break;
        case "Mitigation":
            if (!currentSettings.mitigation.ttsenabled) return;
            break;
        case "Party":
            if (!currentSettings.party.ttsenabled) return;
            break;
        case "CustomCooldown":
            if (!currentSettings.customcd.ttsenabled) return;
            break;
        default:
            break;
    }

    let name = ability.name;
    switch (currentSettings.language) {
        case "en":
            name = ability.name_en;
            break;
        case "cn":
            name = ability.name_cn;
            break;
        case "de":
            name = ability.name_de;
            break;
        case "fr":
            name = ability.name_fr;
            break;
        case "jp":
            name = ability.name_jp;
            break;
        case "kr":
            name = ability.name_kr;
            break;
        default:
            break;
    }
    if (ability.tts) {
        switch (ability.ttstype) {
            case 0:
                startTTSTimer(ability.cooldown, selector, name);
                break;
            case 1:
                startTTSTimer(ability.duration, selector, name);
                break;
            case 2:
                if (!onYou && ability.type == "RaidBuff") return;
                startTTSTimer(0, selector, name, 0);
                break;
            default:
                break;
        }
    }
}

// Replace icon based on settings
function processIconUrl(icon) {
    if (
        currentSettings.general.usehdicons &&
        !icon.includes("_hr1.png") &&
        currentSettings.language != "cn"
    )
        icon = icon.replace(".png", "_hr1.png");
    if (currentSettings.language == "cn") {
        icon = icon.replace("xivapi", "cafemaker.wakingsands");
    }

    return icon;
}

// Originally used for google TTS but this hack stopped working, still relevant for the TTS from Baidu
function setWebTTS(text) {
    let iframe = document.createElement("iframe");
    iframe.removeAttribute("sandbox");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    let encText = encodeURIComponent(text);

    // For CN User
    // https://fanyi.baidu.com/gettts?lan=zh&spd=5&source=web&text=
    iframe.contentDocument.body.innerHTML =
        '<audio src="https://fanyi.baidu.com/gettts?lan=zh&spd=5&source=web&text=' +
        encText +
        '" id="TTS">';

    this.item = iframe.contentDocument.body.firstElementChild;
    return this.item;
}

// Sets Party Role based on current job
function setCurrentRole(job) {
    if (job === null) return;
    console.log(job);
    gameState.currentrole = jobList
        .find((x) => x.name === job)
        .type.toLowerCase();
    if (gameState.currentrole.includes("dps")) gameState.currentrole = "dps";
    if (
        gameState.currentrole != "tank" &&
        gameState.currentrole != "healer" &&
        gameState.currentrole != "dps"
    ) {
        gameState.currentrole = "other";
    }
}

// Stack maintaining functions
function adjustJobStacks(value, max, noAdd = false) {
    if (!noAdd) {
        gameState.stats.stacks = value;
        if (gameState.player.job === "SMN" && gameState.stats.maxStacks === 0) {
            initializeSmn(true);
            max = 4;
        }
    }

    for (let i = 1; i <= 4; i++) {
        let backgroundElement = document.getElementById(
            `stacks-background-${i}`,
        );
        if (i <= max) {
            if (backgroundElement.classList.contains("stack-hidden")) {
                backgroundElement.classList.remove("stack-hidden");
            }
        } else {
            if (!backgroundElement.classList.contains("stack-hidden")) {
                backgroundElement.classList.add("stack-hidden");
            }
        }
        document.getElementById(`stacks-${i}`).src =
            i <= value
                ? `skins/${currentSettings.skin}/images/arrow-fill.png`
                : `skins/${currentSettings.skin}/images/arrow-fill-empty.png`;
    }
}

// Handles Ruin IV stacks for summoner
function initializeSmn(addStack = false) {
    gameState.stats.stacks = addStack ? 1 : 0;
    gameState.stats.maxStacks = 4;
}

// OverlayPlugin and Cactbot Event Handlers
// When user changes zones
function onChangeZone(e) {
    gameState.zone = {
        id: e.zoneID,
        name: e.zoneName,
        info: {},
        type: "Unspecified",
    };
    if (gameState.player === null) return;
    checkAndSetZoneInfo(e.zoneID);
    if (gameState.player.job === "SMN") {
        initializeSmn();
        adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
    }
    resetTimers();
}

// When user enters / leaves combat
function onInCombatChangedEvent(e) {
    if (gameState.inCombat === e.detail.inGameCombat) {
        return;
    }

    gameState.inCombat = e.detail.inGameCombat;
    toggleHideOutOfCombatElements();
}

// When any log event occurs, then process them and forwards them to corresponding event
function onLogEvent(e) {
    for (let logLine of e.detail.logs) {
        toLog([`[OnLogEvent] ${logLine}`]);
        for (let logType of Object.keys(regexList)) {
            let regexObject = regexList[logType];
            let regex = new RegExp(regexObject.regex);
            if (regex.test(logLine)) {
                let matches = regexObject.matches;
                for (let match of Object.keys(matches)) {
                    let matchObject = matches[match];
                    let innerRegex = new RegExp(matchObject.regex);
                    let regexMatch = innerRegex.exec(logLine);
                    if (regexMatch !== null) {
                        let logFunction = window[matchObject.function];
                        if (typeof logFunction === "function") {
                            toLog([
                                `Executing function ${matchObject.function}`,
                                regexMatch.groups,
                            ]);
                            logFunction(regexMatch.groups);
                        }
                    }
                }
            }
        }
    }
}

// Listens for user unlocks/locks the overlay in OverlayPlugin
document.addEventListener("onOverlayStateUpdate", function (e) {
    let element = document.getElementById("lock-overlay-reminder");
    if (!e.detail.isLocked) {
        document.documentElement.style.background = "rgba(0,0,255,0.5)";
        if (!ui.locked) element.style.display = "block";
    } else {
        document.documentElement.style.background = "";
        if (!ui.locked) element.style.display = "none";
    }

    ui.actlocked = e.detail.isLocked;
});

// When user switches jobs
function onJobChange(job) {
    if (language.find((x) => x.id === job.toLowerCase())) {
        gameState.playerTags.job = language.find(
            (x) => x.id === job.toLowerCase(),
        ).string;
    }
    if (
        Object.prototype.hasOwnProperty.call(
            currentSettings.profiles.jobprofiles,
            job.toLowerCase(),
        )
    ) {
        loadProfile(currentSettings.profiles.jobprofiles[job.toLowerCase()]);
    }
    setAndCheckTickers();

    if (job === "SMN") {
        initializeSmn();
        adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
        document.getElementById("stacks-bar").style.display = "block";
    } else {
        document.getElementById("stacks-bar").style.display = "none";
    }
    resetTimers();
    if (gameState.partyList.length === 1) {
        gameState.partyList = [];
    }
}

// When anyone joins/leaves party
function onPartyChanged(e) {
    toLog(["[onPartyChanged]", e]);
    if (gameState.player === null) return;
    let partyList = e.party;
    if (partyList.length === 0) {
        partyList = generateRawPartyList(false);
    }
    generatePartyList(partyList);
    reloadCooldownModules();
    toggleHideWhenSoloCombatElements();
}

// When the party wipes on an encounter
function onPartyWipe() {
    if (gameState.player === null) return;
    resetTimers();
    reloadCooldownModules();
}

// When any change occurs to the player/players resources, mostly used for HP/MP and detecting job changes
function onPlayerChangedEvent(e) {
    if (gameState.player !== null && gameState.player.job !== e.detail.job) {
        onJobChange(e.detail.job);
        setCurrentRole(e.detail.job);
    }
    gameState.playerPrevious = gameState.playerPrevious
        ? gameState.player
        : e.detail;
    gameState.player = e.detail;
    if (gameState.currentrole === null) {
        onJobChange(e.detail.job);
        setCurrentRole(e.detail.job);
    }
    if (gameState.partyList.length === 0) {
        setAndCheckTickers();
        window
            .callOverlayHandler({ call: "getCombatants" })
            .then((e) => checkForParty(e));
    }

    // Check for CP/GP
    if (gameState.player.maxGP) {
        gameState.player.currentMP = gameState.player.currentGP;
        gameState.player.maxMP = gameState.player.maxGP;
    }
    if (gameState.player.maxCP) {
        gameState.player.currentMP = gameState.player.currentCP;
        gameState.player.maxMP = gameState.player.maxCP;
    }

    handleHealthUpdate(gameState.player.currentHP, gameState.player.maxHP);
    handleManaUpdate(gameState.player.currentMP, gameState.player.maxMP);
}

// Regex Event Handlers from ../data/regex.js
/* exported onInstanceStart */
function onInstanceStart() {
    generatePartyList(gameState.rawPartyList);
    reloadCooldownModules();
}

/* exported onInstanceEnd */
function onInstanceEnd() {
    resetTimers();
    reloadCooldownModules();
}

// Checks if current zone is available in static zone_info and sets it in the current gamestate
function checkAndSetZoneInfo(zoneId) {
    if (GAME_DATA.ZONE_INFO[zoneId] !== undefined) {
        gameState.zone.info = GAME_DATA.ZONE_INFO[zoneId];
        if (gameState.zone.info.contentType !== undefined)
            gameState.zone.type = Object.keys(GAME_DATA.CONTENT_TYPE).find(
                (x) =>
                    GAME_DATA.CONTENT_TYPE[x] ===
                    gameState.zone.info.contentType,
            );
    }
}

/* exported handleAddNewCombatant */
function handleAddNewCombatant(parameters) {
    if (gameState.partyList.filter((x) => x.id == parameters.id).length == 0)
        return;
    let job = jobList.find((x) => x.name === parameters.job.toUpperCase());
    let player = gameState.partyList.find((x) => x.id == parameters.id);
    let reload = false;
    if (player.job != job) {
        player.job = job;
        reload = true;
        toLog(
            "[handleAddNewCombatant] Party Member Job Changed, cooldowns will be reloaded",
            job,
        );
    }
    if (player.level != parseInt(parameters.level)) {
        player.level = parseInt(parameters.level);
        reload = true;
        toLog(
            "[handleAddNewCombatant] Party Member Level Changed, cooldowns will be reloaded",
            parseInt(parameters.level),
        );
    }
    if (reload) reloadCooldownModules();
}

// When user uses /countdown or /cd
/* exported handleCountdownTimer */
function handleCountdownTimer(parameters) {
    if (!currentSettings.timerbar.enabled) return;
    startBarTimer(parameters.seconds, "timer-bar", true);
}

// Whenever any DoT/HoT ticks
/* exported handleEffectTick */
function handleEffectTick(parameters) {
    let type = parameters.effect.toLowerCase();
    if (!currentSettings[`${type}ticker`].enabled) return;
    if (currentSettings[`${type}ticker`].specificjobsenabled) {
        if (
            !currentSettings[`${type}ticker`].specificjobs.includes(
                gameState.player.job,
            )
        )
            return;
    }
    if (!activeElements.countdowns.has(`${type}-ticker-bar`)) {
        startBarTimer(
            GAME_DATA.EFFECT_TICK,
            `${type}-ticker-bar`,
            false,
            true,
            true,
        );
    }
}

// When user's mana changes
function handleManaTick(current, max) {
    if (!currentSettings.mpticker.enabled) return;
    if (currentSettings.mpticker.specificjobsenabled) {
        if (
            !currentSettings.mpticker.specificjobs.includes(
                gameState.player.job,
            )
        )
            return;
    }
    let delta = current - gameState.previous_MP;
    gameState.previous_MP = current;

    let tick = gameState.inCombat
        ? GAME_DATA.MP_DATA.combat
        : GAME_DATA.MP_DATA.normal;

    let umbralTick = 0;
    if (gameState.player.job === "BLM") {
        switch (gameState.player.jobDetail.umbralStacks) {
            case -1: {
                umbralTick = GAME_DATA.MP_DATA.umbral_1;
                break;
            }
            case -2: {
                umbralTick = GAME_DATA.MP_DATA.umbral_2;
                break;
            }
            case -3: {
                umbralTick = GAME_DATA.MP_DATA.umbral_3;
                break;
            }
        }
    }

    let manaTick = Math.floor(max * tick) + Math.floor(max * umbralTick);
    let duration = 0;

    if (delta === manaTick) {
        duration = GAME_DATA.MP_DATA.tick;
        if (
            gameState.player.job === "BLM" &&
            gameState.player.jobDetail.umbralStacks > 0
        )
            duration = 0;
    }

    if (duration > 0) {
        if (
            currentSettings.mpticker.alwaystick &&
            activeElements.countdowns.get("mp-ticker-bar") == undefined
        ) {
            startBarTimer(duration, "mp-ticker-bar", false, true, true);
        }
        if (!currentSettings.mpticker.alwaystick) {
            startBarTimer(duration, "mp-ticker-bar", false, true, false);
        }
    }
}

// Prepare health tags in ui object
function updateHealthTags() {
    gameState.playerTags.percentHP = Math.round(
        (100 * gameState.player.currentHP) / gameState.player.maxHP,
    );
    gameState.playerTags.deficitHP = `-${
        gameState.player.maxHP - gameState.player.currentHP
    }`;
    gameState.playerTags.currentMaxHP = `${gameState.player.currentHP} / ${gameState.player.maxHP}`;
}

// Prepare mana tags in ui object
function updateManaTags() {
    gameState.playerTags.percentMP = Math.round(
        (100 * gameState.player.currentMP) / gameState.player.maxMP,
    );
    gameState.playerTags.deficitMP = `-${
        gameState.player.maxMP - gameState.player.currentMP
    }`;
    gameState.playerTags.currentMaxMP = `${gameState.player.currentMP} / ${gameState.player.maxMP}`;
}

function abbreviateNumber(num) {
    return Math.abs(num) > 999
        ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "k"
        : Math.sign(num) * Math.abs(num);
}

// Loop through all possible tags and returns text
function processTextFormat(text) {
    let tagMap = {
        "[health:current]": gameState.player.currentHP,
        "[health:current-short]": abbreviateNumber(gameState.player.currentHP),
        "[health:current-percent]":
            gameState.player.currentHP === gameState.player.maxHP
                ? `${gameState.player.currentHP}`
                : `${gameState.player.currentHP} - ${gameState.playerTags.percentHP}%`,
        "[health:current-percent-short]":
            gameState.player.currentHP === gameState.player.maxHP
                ? `${abbreviateNumber(gameState.player.currentHP)}`
                : `${abbreviateNumber(gameState.player.currentHP)} - ${
                      gameState.playerTags.percentHP
                  }%`,
        "[health:current-max]": gameState.playerTags.currentMaxHP,
        "[health:max]": gameState.player.maxHP,
        "[health:max-short]": abbreviateNumber(gameState.player.maxHP),
        "[health:percent]": gameState.playerTags.percentHP,
        "[health:deficit]": gameState.playerTags.deficitHP,
        "[mana:current]": gameState.player.currentMP,
        "[mana:current-short]": abbreviateNumber(gameState.player.currentMP),
        "[mana:current-percent]":
            gameState.player.currentMP === gameState.player.maxMP
                ? `${gameState.player.currentMP}`
                : `${gameState.player.currentMP} - ${gameState.playerTags.percentMP}%`,
        "[mana:current-percent-short]":
            gameState.player.currentMP === gameState.player.maxMP
                ? `${abbreviateNumber(gameState.player.currentMP)}`
                : `${abbreviateNumber(gameState.player.currentMP)} - ${
                      gameState.playerTags.percentMP
                  }%`,
        "[mana:current-max]": gameState.playerTags.currentMaxMP,
        "[mana:max]": gameState.player.maxMP,
        "[mana:max-short]": abbreviateNumber(gameState.player.maxMP),
        "[mana:percent]": gameState.playerTags.percentMP,
        "[mana:deficit]": gameState.playerTags.deficitMP,
        "[name]": gameState.player.name,
        "[name:veryshort]": gameState.player.name.substr(0, 5),
        "[name:short]": gameState.player.name.substr(0, 10),
        "[name:medium]": gameState.player.name.substr(0, 15),
        "[name:long]": gameState.player.name.substr(0, 20),
        "[job]": gameState.playerTags.job,
        "[job:short]": gameState.player.job,
        " ": " ",
    };
    for (let [key, value] of Object.entries(tagMap)) {
        text = text.split(key).join(value);
    }
    return text;
}

// When user's health changes
function handleHealthUpdate(current, max) {
    if (
        gameState.playerPrevious.currentHP !== current ||
        gameState.playerPrevious.maxHP !== max ||
        !ui.labels.health
    ) {
        let health = document.getElementById("health-bar");
        health.value = current;
        health.max = max;
        ui.labels.health = `${gameState.player.currentHP} / ${gameState.player.maxHP}`;
        if (currentSettings.healthbar.textformat) {
            updateHealthTags();
            ui.labels.health = processTextFormat(
                currentSettings.healthbar.textformat,
            );
        }
        health.setAttribute(
            "data-label",
            currentSettings.healthbar.textenabled ? ui.labels.health : "",
        );
    }
}

// When user's mana changes
function handleManaUpdate(current, max) {
    let mana = document.getElementById("mana-bar");
    handleManaTick(current, max);
    if (
        gameState.playerPrevious.currentMP !== current ||
        gameState.playerPrevious.maxMP !== max ||
        !ui.labels.mana
    ) {
        mana.value = current;
        mana.max = max;
        ui.labels.mana = `${gameState.player.currentMP} / ${gameState.player.maxMP}`;
        if (currentSettings.manabar.textformat) {
            updateManaTags();
            ui.labels.mana = processTextFormat(
                currentSettings.manabar.textformat,
            );
        }
        mana.setAttribute(
            "data-label",
            currentSettings.manabar.textenabled ? ui.labels.mana : "",
        );
    }

    if (!currentSettings.manabar.jobthresholdsenabled) return;
    if (
        gameState.player.job === "BLM" ||
        gameState.player.job === "DRK" ||
        gameState.player.job === "PLD"
    ) {
        if (current <= currentSettings.manabar[gameState.player.job].low) {
            mana.style.setProperty(
                "--manaBarColor",
                `var(${currentSettings.manabar.lowcolor})`,
            );
        } else if (
            current <= currentSettings.manabar[gameState.player.job].med
        ) {
            mana.style.setProperty(
                "--manaBarColor",
                `var(${currentSettings.manabar.medcolor})`,
            );
        } else {
            mana.style.setProperty(
                "--manaBarColor",
                `var(${currentSettings.manabar.color})`,
            );
        }
    }
}

// Handles majority of the logic on 15/16 log lines
/* exported handleSkill */
function handleSkill(parameters) {
    if (gameState.player === null) return;
    let byYou = parameters.player === gameState.player.name;
    let onYou = false;
    if (parameters.target) {
        if (parameters.target === gameState.player.name) onYou = true;
    }

    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );
    let ability = undefined;

    let mergedAbilityList = abilityList.concat(
        currentSettings.customcd.abilities,
    );

    for (ability of mergedAbilityList.filter(
        (x) => x.id == parseInt(parameters.skillid, 16),
    )) {
        if (ability === undefined) continue;
        if (
            currentSettings.override.abilities.some(
                (x) => x.id == ability.id && x.type == ability.type,
            )
        ) {
            ability = currentSettings.override.abilities.find(
                (x) => x.id == ability.id && x.type == ability.type,
            );
        }
        if (!ability.enabled) continue;
        if (ability.name === "Shoha" && byYou) {
            adjustJobStacks(0, gameState.stats.maxStacks);
        }
        if (ability.name === "Ruin IV" && byYou) {
            adjustJobStacks(
                gameState.stats.stacks - 1,
                gameState.stats.maxStacks,
            );
            gameState.blockRuinGained = true;
            setTimeout(function () {
                gameState.blockRuinGained = false;
            }, 1000);
        }
        if (ability.type === "RaidBuff") {
            if (Object.prototype.hasOwnProperty.call(ability, "extra")) {
                if (ability.extra.is_card) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.name === "Play",
                    );
                    if (onYou) {
                        startAbilityIconTimers(
                            playerIndex,
                            ability,
                            true,
                            currentSettings.raidbuffs.alwaysshow
                                ? abilityHolder
                                : ability,
                        );
                    }
                }
                if (ability.extra.cooldown_only) {
                    startAbilityIconTimers(playerIndex, ability, false);
                }
                if (ability.extra.is_song) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.name === "Song",
                    );
                    if (byYou) {
                        if (!currentSettings.raidbuffs.alwaysshow) {
                            for (let song of mergedAbilityList.filter(
                                (x) =>
                                    Object.prototype.hasOwnProperty.call(
                                        x,
                                        "extra",
                                    ) &&
                                    Object.prototype.hasOwnProperty.call(
                                        x.extra,
                                        "is_song",
                                    ),
                            )) {
                                let selector = `raid-buffs-${playerIndex}-${song.id}`;
                                if (
                                    activeElements.countdowns.has(
                                        `${selector}-duration`,
                                    )
                                ) {
                                    clearInterval(
                                        activeElements.countdowns.get(
                                            `${selector}-duration`,
                                        ),
                                    );
                                }
                                if (
                                    activeElements.countdowns.has(
                                        `${selector}-cooldown`,
                                    )
                                ) {
                                    clearInterval(
                                        activeElements.countdowns.get(
                                            `${selector}-cooldown`,
                                        ),
                                    );
                                }
                                stopAbilityTimer(`${selector}-cooldown`, null);
                                stopAbilityTimer(`${selector}-duration`, null);
                            }
                        }
                        startAbilityIconTimers(
                            playerIndex,
                            ability,
                            true,
                            currentSettings.raidbuffs.alwaysshow
                                ? abilityHolder
                                : ability,
                        );
                    }
                }
                if (ability.extra.is_ss) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.id === 15997,
                    );
                    startAbilityIconTimers(
                        playerIndex,
                        ability,
                        true,
                        currentSettings.raidbuffs.alwaysshow
                            ? abilityHolder
                            : ability,
                        true,
                    );
                }
                if (ability.extra.is_ts) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.id === 15998,
                    );
                    startAbilityIconTimers(
                        playerIndex,
                        ability,
                        true,
                        currentSettings.raidbuffs.alwaysshow
                            ? abilityHolder
                            : ability,
                        byYou,
                    );
                }
            } else {
                if (
                    (!onYou && ability.name === "Dragon Sight") ||
                    (byYou && ability.name === "Battle Voice")
                ) {
                    onYou = false;
                } else {
                    onYou = true;
                }
                startAbilityIconTimers(playerIndex, ability, onYou);
            }
        }
        if (ability.type === "Mitigation") {
            if (onYou || byYou)
                startAbilityIconTimers(playerIndex, ability, true);
        }
        if (ability.type === "Party") {
            startAbilityIconTimers(playerIndex, ability, true);
        }
        if (ability.type === "CustomCooldown") {
            if (Object.prototype.hasOwnProperty.call(ability, "extra")) {
                if (ability.extra.shares_cooldown) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.id === ability.extra.shares_cooldown,
                    );
                    startAbilityIconTimers(
                        playerIndex,
                        ability,
                        true,
                        currentSettings.customcd.alwaysshow
                            ? abilityHolder
                            : ability,
                    );
                    continue;
                }
            }
            startAbilityIconTimers(playerIndex, ability, true);
        }
    }
}

// Handles majority of the logic on 1A log lines
/* exported handleGainEffect */
function handleGainEffect(parameters) {
    if (gameState.player === null) return;
    let byYou = parameters.player === gameState.player.name;
    let onYou = parameters.target === gameState.player.name;
    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );
    let ability = undefined;

    let mergedAbilityList = abilityList.concat(
        currentSettings.customcd.abilities,
    );

    for (ability of mergedAbilityList.filter(
        (x) =>
            x[`name_${currentSettings.language}`].toLowerCase() ==
            parameters.effect.toLowerCase(),
    )) {
        if (ability === undefined) continue;
        if (
            currentSettings.override.abilities.some(
                (x) => x.name === ability.name && x.type == ability.type,
            )
        ) {
            ability = currentSettings.override.abilities.find(
                (x) => x.name === ability.name && x.type == ability.type,
            );
        }
        if (!ability.enabled) continue;
        if (ability.type === "RaidBuff") {
            if (
                ability.name === "Standard Step" ||
                ability.name === "Technical Step" ||
                ability.name === "Embolden"
            )
                continue;
            if (Object.prototype.hasOwnProperty.call(ability, "extra")) {
                if (ability.extra.is_card) continue;
                if (ability.extra.is_song) {
                    let abilityHolder = mergedAbilityList.find(
                        (x) => x.name === "Song",
                    );
                    if (byYou) {
                        continue;
                    }
                    if (onYou) {
                        ability.duration = 5;
                        startAbilityIconTimers(
                            playerIndex,
                            ability,
                            true,
                            currentSettings.raidbuffs.alwaysshow
                                ? abilityHolder
                                : ability,
                        );
                    }
                }
            }
            if (onYou) startAbilityIconTimers(playerIndex, ability, true);
        }
        if (ability.type === "Mitigation") {
            if (onYou || byYou) {
                if (Object.prototype.hasOwnProperty.call(ability, "extra")) {
                    if (ability.extra.shares_cooldown) {
                        startAbilityIconTimers(playerIndex, ability, true);
                        startAbilityIconTimers(
                            playerIndex,
                            mergedAbilityList.find(
                                (x) => x.id === ability.extra.shares_cooldown,
                            ),
                            false,
                        );
                    }
                } else {
                    startAbilityIconTimers(playerIndex, ability, true);
                }
            }
        }
        if (ability.type === "Stacks" && byYou) {
            if (!gameState.blockRuinGained)
                adjustJobStacks(
                    gameState.stats.stacks + 1,
                    gameState.stats.maxStacks,
                );
        }
        if (
            (ability.type === "DoT" && byYou) ||
            (ability.type === "Buff" && byYou)
        ) {
            if (Object.prototype.hasOwnProperty.call(ability, "extra")) {
                if (ability.extra.shares_cooldown) {
                    startAbilityBarTimer(
                        ability,
                        parameters.duration,
                        onYou,
                        false,
                        0,
                        mergedAbilityList.find(
                            (x) => x.id === ability.extra.shares_cooldown,
                        ),
                    );
                    continue;
                }
                if (ability.extra.extends_duration) {
                    startAbilityBarTimer(
                        ability,
                        parameters.duration,
                        onYou,
                        true,
                        ability.extra.max_duration,
                    );
                    continue;
                }
            }
            startAbilityBarTimer(ability, parameters.duration, onYou);
        }
    }
}

// Handles majority of the logic on 1E log lines
/* exported handleLoseEffect */
function handleLoseEffect(parameters) {
    if (gameState.player === null) return;
    //let byYou = (parameters.player === currentPlayer.name);
    //let onYou = (parameters.target === currentPlayer.name);
    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );
    let ability = undefined;
    let mergedAbilityList = abilityList.concat(
        currentSettings.customcd.abilities,
    );
    for (ability of mergedAbilityList.filter(
        (x) =>
            x[`name_${currentSettings.language}`].toLowerCase() ==
            parameters.effect.toLowerCase(),
    )) {
        if (ability.name == "Standard Step") return;
        if (ability.name == "Technical Step") return;
        let selectorProperties = getSelectorProperties(ability.type);
        let barSelector = selectorProperties.id;
        let abilitySelector = `${barSelector}-${playerIndex}-${ability.id}`;

        if (activeElements.countdowns.has(`${abilitySelector}-duration`)) {
            clearInterval(
                activeElements.countdowns.get(`${abilitySelector}-duration`),
            );
            stopAbilityTimer(`${abilitySelector}-duration`, null);
        }
        if (activeElements.countdowns.has(`${ability.id}-buff-timer`)) {
            clearInterval(
                activeElements.countdowns.get(`${ability.id}-buff-timer`),
            );
            let hideTimer = selectorProperties.settings.hidewhendroppedoff;
            stopBarTimer(`${ability.id}-buff-timer`, hideTimer);
        }
    }
}

// Handles 19 log lines
/* exported handleDeath */
function handleDeath(parameters) {
    let you = parameters.target === gameState.player.name;
    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );
    stopPlayerDurationTimers(playerIndex);
    if (you) {
        if (gameState.player.job === "SMN") {
            initializeSmn();
            adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
        }
    }
}

// Handles changed player stats, mostly to keep the current SKS/SPS modifiers up to date
/* exported handlePlayerStats */
function handlePlayerStats(parameters) {
    gameState.stats.skillSpeed =
        (1000 +
            Math.floor(
                (130 *
                    (parameters.sks -
                        GAME_DATA.SPEED_LOOKUP.get(gameState.player.level))) /
                    3300,
            )) /
        1000;
    gameState.stats.spellSpeed =
        (1000 +
            Math.floor(
                (130 *
                    (parameters.sps -
                        GAME_DATA.SPEED_LOOKUP.get(gameState.player.level))) /
                    3300,
            )) /
        1000;
}

// Functions for debugging
function toLog(parameters) {
    if (currentSettings) {
        if (!currentSettings.debug.enabled) return;
        for (let parameter of parameters) {
            console.log(parameter);
        }
    }
}

/* exported testLog */
function testLog(logLine) {
    let logEvent = {
        type: "onLogEvent",
        detail: {
            logs: [logLine],
        },
    };
    onLogEvent(logEvent);
}
