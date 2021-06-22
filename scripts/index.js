// ZeffUI globals
/* global abilityList, jobList, regexList, language, zone_info, content_type */

// External Globals
/* global addOverlayListener, startOverlayEvents, interact, callOverlayHandler */

// UI related global variables
var ui = {
    locked: true,
    gridshown: false,
    dragPosition: {},
};

// Global variables for maintaining gamestate and settings
var currentSettings = null;

var gameState = {
    inCombat: false,
    blockRuinGained: false,
    player: null,
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
var activeElements = {
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
	EFFECT_TICK: 3.0,
	MP_DATA: {
		normal: 0.06,
		combat: 0.02,
		umbral_1: 0.30,
		umbral_2: 0.45,
		umbral_3: 0.60,
		tick: 3.0
	},
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

// Add OverlayListeners
addOverlayListener("onPlayerChangedEvent", (e) => onPlayerChangedEvent(e));
addOverlayListener("onLogEvent", (e) => onLogEvent(e));
addOverlayListener("onPartyWipe", () => onPartyWipe());
addOverlayListener("onInCombatChangedEvent", (e) => onInCombatChangedEvent(e));
addOverlayListener("ChangeZone", (e) => onChangeZone(e));
addOverlayListener("PartyChanged", (e) => onPartyChanged(e));

$(function () {
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

function initializeContentZoneImports() {
    Object.assign(GAME_DATA.CONTENT_TYPE, content_type);
    Object.assign(GAME_DATA.ZONE_INFO, zone_info);
    if (gameState.zone !== undefined) checkAndSetZoneInfo(gameState.zone.id);
}

// Settings
function checkAndInitializeSetting(settingsObject, setting, defaultValue) {
    // Thanks MikeMatrix
    if (settingsObject[setting] === undefined)
        settingsObject[setting] = defaultValue;
}

function initializeSettings() {
    if (localStorage.getItem("settings") !== null) {
        return JSON.parse(localStorage.getItem("settings"));
    } else {
        return {};
    }
}

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

    // OVERRIDE SETTINGS
    checkAndInitializeSetting(settings, "override", {});
    checkAndInitializeSetting(settings.override, "enabled", false);
    checkAndInitializeSetting(settings.override, "abilities", []);

    // GENERAL SETTINGS
    checkAndInitializeSetting(settings, "general", {});
    checkAndInitializeSetting(settings.general, "usewebtts", false);
    checkAndInitializeSetting(settings.general, "ttsearly", 5);

    // SKIN SETTINGS
    checkAndInitializeSetting(settings, "skin", "default");

    // FONT SETTINGS
    checkAndInitializeSetting(settings, "font", "Arial");
    $("*").css("--defaultFont", `${settings.font}`);

    if ($("#skin").length == 0) {
        $("head").append(
            `<link id="skin" rel="stylesheet" href="skins/${settings.skin}/styles/resources.css">`,
        );
    } else {
        $("#skin").attr("href", `skins/${settings.skin}/styles/resources.css`);
    }

    // DEBUG SETTINGS
    checkAndInitializeSetting(settings, "debug", {});
    checkAndInitializeSetting(settings.debug, "enabled", false);

    // GLOBAL SETTINGS
    /* prettier-ignore */
    checkAndInitializeSetting(settings, "partyorder",
		[
		// Tanks
			"PLD", "GLA", "WAR", "MRD", "DRK", "GNB",
			// Healers
			"WHM", "CNJ", "SCH", "AST",
			// Melee DPS
			"MNK", "PGL", "DRG", "LNC", "NIN", "ROG", "SAM",
			// Physical Ranged DPS
			"BRD", "ARC", "MCH", "DNC",
			// Caster DPS
			"BLM", "THM", "SMN", "ACN", "RDM", "BLU"]
	);

    // LANGUAGE SETTINGS
    let actLang = await getACTLocale();
    checkAndInitializeSetting(settings, "language", actLang);

    if ($("#language").length == 0) {
        $.getScript(`data/language/${settings.language}.js`, function () {
            loadContextMenu();
        });
    } else {
        $("#language").attr("src", `data/language/${settings.language}.js`);
    }

    // HEALTHBAR SETTINGS
    checkAndInitializeSetting(settings, "healthbar", {});
    checkAndInitializeSetting(settings.healthbar, "enabled", true);
    checkAndInitializeSetting(settings.healthbar, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.healthbar, "textenabled", true);
    checkAndInitializeSetting(
        settings.healthbar,
        "color",
        "--filter-dark-green",
    );
    checkAndInitializeSetting(settings.healthbar, "scale", 1);
    checkAndInitializeSetting(settings.healthbar, "rotation", 0);
    checkAndInitializeSetting(settings.healthbar, "x", 30);
    checkAndInitializeSetting(settings.healthbar, "y", 216);
    checkAndInitializeSetting(settings.healthbar, "font", "Arial");

    settings.healthbar.enabled
        ? $("#health-bar").show()
        : $("#health-bar").hide();

    $("#health-bar").css(
        "--healthBarColor",
        `var(${settings.healthbar.color})`,
    );
    $("#health-bar").css("width", settings.healthbar.scale * 160);
    $("#health-bar").css("height", settings.healthbar.scale * 15);
    $("#health-bar").css("--healthFont", settings.healthbar.font);
    $("#health-bar").css(
        "-webkit-transform",
        `rotate(${settings.healthbar.rotation}deg)`,
    );
    $("#health-bar").css("transform-origin", "top left");
    ui.dragPosition["health-bar"] = {
        x: settings.healthbar.x,
        y: settings.healthbar.y,
    };
    $("#health-bar").addClass("ltr");
    $("#health-bar").css(
        "transform",
        `translate(${settings.healthbar.x}px, ${settings.healthbar.y}px)`,
    );

    // MANABAR SETTINGS
    checkAndInitializeSetting(settings, "manabar", {});
    checkAndInitializeSetting(settings.manabar, "enabled", true);
    checkAndInitializeSetting(settings.manabar, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.manabar, "textenabled", true);
    checkAndInitializeSetting(settings.manabar, "color", "--filter-light-pink");
    checkAndInitializeSetting(settings.manabar, "scale", 1);
    checkAndInitializeSetting(settings.manabar, "rotation", 0);
    checkAndInitializeSetting(settings.manabar, "x", 30);
    checkAndInitializeSetting(settings.manabar, "y", 232);
    checkAndInitializeSetting(settings.manabar, "font", "Arial");

    checkAndInitializeSetting(settings.manabar, "jobthresholdsenabled", true);
    checkAndInitializeSetting(
        settings.manabar,
        "lowcolor",
        "--filter-dark-red",
    );
    checkAndInitializeSetting(
        settings.manabar,
        "medcolor",
        "--filter-light-blue",
    );

    checkAndInitializeSetting(settings.manabar, "BLM", {});
    checkAndInitializeSetting(settings.manabar.BLM, "low", 2399);
    checkAndInitializeSetting(settings.manabar.BLM, "med", 3999);

    checkAndInitializeSetting(settings.manabar, "PLD", {});
    checkAndInitializeSetting(settings.manabar.PLD, "low", 3600);
    checkAndInitializeSetting(settings.manabar.PLD, "med", 9400);

    checkAndInitializeSetting(settings.manabar, "DRK", {});
    checkAndInitializeSetting(settings.manabar.DRK, "low", 2999);
    checkAndInitializeSetting(settings.manabar.DRK, "med", 5999);

    settings.manabar.enabled ? $("#mana-bar").show() : $("#mana-bar").hide();

    $("#mana-bar").css("--manaBarColor", `var(${settings.manabar.color})`);
    $("#mana-bar").css("width", settings.manabar.scale * 160);
    $("#mana-bar").css("height", settings.manabar.scale * 15);
    $("#mana-bar").css("--manaFont", settings.manabar.font);
    $("#mana-bar").css(
        "-webkit-transform",
        `rotate(${settings.manabar.rotation}deg)`,
    );
    $("#mana-bar").css("transform-origin", "top left");
    ui.dragPosition["mana-bar"] = {
        x: settings.manabar.x,
        y: settings.manabar.y,
    };
    $("#mana-bar").addClass("ltr");
    $("#mana-bar").css(
        "transform",
        `translate(${settings.manabar.x}px, ${settings.manabar.y}px)`,
    );

    // MP TICKER SETTINGS
    checkAndInitializeSetting(settings, "mpticker", {});
    checkAndInitializeSetting(settings.mpticker, "enabled", false);
    checkAndInitializeSetting(settings.mpticker, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.mpticker, "color", "--filter-grey");
    checkAndInitializeSetting(settings.mpticker, "scale", 1);
    checkAndInitializeSetting(settings.mpticker, "rotation", 0);
    checkAndInitializeSetting(settings.mpticker, "x", 30);
    checkAndInitializeSetting(settings.mpticker, "y", 248);
    checkAndInitializeSetting(settings.mpticker, "specificjobsenabled", true);
    checkAndInitializeSetting(settings.mpticker, "specificjobs", ["BLM"]);

    settings.mpticker.enabled
        ? $("#mp-ticker-bar").show()
        : $("#mp-ticker-bar").hide();

    $("#mp-ticker-bar").css(
        "--mptickerColor",
        `var(${settings.mpticker.color})`,
    );
    $("#mp-ticker-bar").css("width", settings.mpticker.scale * 160);
    $("#mp-ticker-bar").css("height", settings.mpticker.scale * 15);
    $("#mp-ticker-bar").css(
        "-webkit-transform",
        `rotate(${settings.mpticker.rotation}deg)`,
    );
    $("#mp-ticker-bar").css("transform-origin", "top left");
    ui.dragPosition["mp-ticker-bar"] = {
        x: settings.mpticker.x,
        y: settings.mpticker.y,
    };
    $("#mp-ticker-bar").addClass("ltr");
    $("#mp-ticker-bar").css(
        "transform",
        `translate(${settings.mpticker.x}px, ${settings.mpticker.y}px)`,
    );

    // DOT TICKER SETTINGS
    checkAndInitializeSetting(settings, "dotticker", {});
    checkAndInitializeSetting(settings.dotticker, "enabled", false);
    checkAndInitializeSetting(settings.dotticker, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.dotticker, "color", "--filter-grey");
    checkAndInitializeSetting(settings.dotticker, "scale", 1);
    checkAndInitializeSetting(settings.dotticker, "rotation", 0);
    checkAndInitializeSetting(settings.dotticker, "x", 30);
    checkAndInitializeSetting(settings.dotticker, "y", 264);
    checkAndInitializeSetting(settings.dotticker, "specificjobsenabled", true);
    checkAndInitializeSetting(settings.dotticker, "specificjobs", ["BRD"]);

    settings.dotticker.enabled
        ? $("#dot-ticker-bar").show()
        : $("#dot-ticker-bar").hide();

    $("#dot-ticker-bar").css(
        "--dottickerColor",
        `var(${settings.dotticker.color})`,
    );
    $("#dot-ticker-bar").css("width", settings.dotticker.scale * 160);
    $("#dot-ticker-bar").css("height", settings.dotticker.scale * 15);
    $("#dot-ticker-bar").css(
        "-webkit-transform",
        `rotate(${settings.dotticker.rotation}deg)`,
    );
    $("#dot-ticker-bar").css("transform-origin", "top left");
    ui.dragPosition["dot-ticker-bar"] = {
        x: settings.dotticker.x,
        y: settings.dotticker.y,
    };
    $("#dot-ticker-bar").addClass("ltr");
    $("#dot-ticker-bar").css(
        "transform",
        `translate(${settings.dotticker.x}px, ${settings.dotticker.y}px)`,
    );

    // HOT TICKER SETTINGS
    checkAndInitializeSetting(settings, "hotticker", {});
    checkAndInitializeSetting(settings.hotticker, "enabled", false);
    checkAndInitializeSetting(settings.hotticker, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.hotticker, "color", "--filter-grey");
    checkAndInitializeSetting(settings.hotticker, "scale", 1);
    checkAndInitializeSetting(settings.hotticker, "rotation", 0);
    checkAndInitializeSetting(settings.hotticker, "x", 30);
    checkAndInitializeSetting(settings.hotticker, "y", 280);
    checkAndInitializeSetting(settings.hotticker, "specificjobsenabled", true);
    checkAndInitializeSetting(settings.hotticker, "specificjobs", [
        "AST",
        "SCH",
        "MKN",
        "WHM",
    ]);

    settings.hotticker.enabled
        ? $("#hot-ticker-bar").show()
        : $("#hot-ticker-bar").hide();

    $("#hot-ticker-bar").css(
        "--hottickerColor",
        `var(${settings.hotticker.color})`,
    );
    $("#hot-ticker-bar").css("width", settings.hotticker.scale * 160);
    $("#hot-ticker-bar").css("height", settings.hotticker.scale * 15);
    $("#hot-ticker-bar").css(
        "-webkit-transform",
        `rotate(${settings.hotticker.rotation}deg)`,
    );
    $("#hot-ticker-bar").css("transform-origin", "top left");
    ui.dragPosition["hot-ticker-bar"] = {
        x: settings.hotticker.x,
        y: settings.hotticker.y,
    };
    $("#hot-ticker-bar").addClass("ltr");
    $("#hot-ticker-bar").css(
        "transform",
        `translate(${settings.hotticker.x}px, ${settings.hotticker.y}px)`,
    );

    // PULLTIMER SETTINGS
    checkAndInitializeSetting(settings, "timerbar", {});
    checkAndInitializeSetting(settings.timerbar, "enabled", true);
    checkAndInitializeSetting(settings.timerbar, "textenabled", true);
    checkAndInitializeSetting(settings.timerbar, "color", "--filter-dark-red");
    checkAndInitializeSetting(settings.timerbar, "scale", 1);
    checkAndInitializeSetting(settings.timerbar, "rotation", 0);
    checkAndInitializeSetting(settings.timerbar, "x", 30);
    checkAndInitializeSetting(settings.timerbar, "y", 200);
    checkAndInitializeSetting(settings.timerbar, "font", "Arial");

    $("#timer-bar").css(
        "--pulltimerBarColor",
        `var(${settings.timerbar.color})`,
    );
    $("#timer-bar").css("width", settings.timerbar.scale * 160);
    $("#timer-bar").css("height", settings.timerbar.scale * 15);
    $("#timer-bar").css("--timerFont", settings.timerbar.font);
    $("#timer-bar").css(
        "-webkit-transform",
        `rotate(${settings.timerbar.rotation}deg)`,
    );
    $("#timer-bar").css("transform-origin", "top left");
    ui.dragPosition["timer-bar"] = {
        x: settings.timerbar.x,
        y: settings.timerbar.y,
    };
    $("#timer-bar").addClass("ltr");
    $("#timer-bar").css(
        "transform",
        `translate(${settings.timerbar.x}px, ${settings.timerbar.y}px)`,
    );

    // DOT TIMER SETTINGS
    checkAndInitializeSetting(settings, "dottimerbar", {});
    checkAndInitializeSetting(settings.dottimerbar, "enabled", true);
    checkAndInitializeSetting(settings.dottimerbar, "hideoutofcombat", false);
    checkAndInitializeSetting(
        settings.dottimerbar,
        "hidewhendroppedoff",
        false,
    );
    checkAndInitializeSetting(settings.dottimerbar, "textenabled", true);
    checkAndInitializeSetting(settings.dottimerbar, "imageenabled", true);
    checkAndInitializeSetting(settings.dottimerbar, "ttsenabled", false);
    checkAndInitializeSetting(settings.dottimerbar, "multidotenabled", true);
    checkAndInitializeSetting(settings.dottimerbar, "growdirection", 1);
    checkAndInitializeSetting(settings.dottimerbar, "padding", 20);
    checkAndInitializeSetting(settings.dottimerbar, "scale", 1);
    checkAndInitializeSetting(settings.dottimerbar, "rotation", 0);
    checkAndInitializeSetting(settings.dottimerbar, "x", 30);
    checkAndInitializeSetting(settings.dottimerbar, "y", 50);
    checkAndInitializeSetting(settings.dottimerbar, "font", "Arial");

    $("#dot-timer-bar").css("width", settings.dottimerbar.scale * 160);
    $("#dot-timer-bar").css("height", settings.dottimerbar.scale * 15);
    $("#dot-timer-bar").css("--dotFont", settings.dottimerbar.font);
    $("#dot-bar").css(
        "-webkit-transform",
        `rotate(${settings.dottimerbar.rotation}deg)`,
    );
    $("#dot-bar").css("transform-origin", "center");
    ui.dragPosition["dot-timer-bar"] = {
        x: settings.dottimerbar.x,
        y: settings.dottimerbar.y,
    };
    $("#dot-timer-bar").addClass("ltr");
    $("#dot-timer-bar").css(
        "transform",
        `translate(${settings.dottimerbar.x}px, ${settings.dottimerbar.y}px)`,
    );

    // BUFF TIMER SETTINGS
    checkAndInitializeSetting(settings, "bufftimerbar", {});
    checkAndInitializeSetting(settings.bufftimerbar, "enabled", true);
    checkAndInitializeSetting(settings.bufftimerbar, "hideoutofcombat", false);
    checkAndInitializeSetting(
        settings.bufftimerbar,
        "hidewhendroppedoff",
        false,
    );
    checkAndInitializeSetting(settings.bufftimerbar, "textenabled", true);
    checkAndInitializeSetting(settings.bufftimerbar, "imageenabled", true);
    checkAndInitializeSetting(settings.bufftimerbar, "ttsenabled", false);
    checkAndInitializeSetting(settings.bufftimerbar, "growdirection", 1);
    checkAndInitializeSetting(settings.bufftimerbar, "padding", 20);
    checkAndInitializeSetting(settings.bufftimerbar, "scale", 1);
    checkAndInitializeSetting(settings.bufftimerbar, "rotation", 0);
    checkAndInitializeSetting(settings.bufftimerbar, "x", 30);
    checkAndInitializeSetting(settings.bufftimerbar, "y", 100);
    checkAndInitializeSetting(settings.bufftimerbar, "font", "Arial");

    $("#buff-timer-bar").css("width", settings.bufftimerbar.scale * 154);
    $("#buff-timer-bar").css("height", settings.bufftimerbar.scale * 15);
    $("#buff-timer-bar").css("--buffFont", settings.bufftimerbar.font);
    $("#buff-bar").css(
        "-webkit-transform",
        `rotate(${settings.bufftimerbar.rotation}deg)`,
    );
    $("#buff-bar").css("transform-origin", "center");
    ui.dragPosition["buff-timer-bar"] = {
        x: settings.bufftimerbar.x,
        y: settings.bufftimerbar.y,
    };
    $("#buff-timer-bar").addClass("ltr");
    $("#buff-timer-bar").css(
        "transform",
        `translate(${settings.bufftimerbar.x}px, ${settings.bufftimerbar.y}px)`,
    );

    // STACKBAR SETTINGS
    checkAndInitializeSetting(settings, "stacksbar", {});
    checkAndInitializeSetting(settings.stacksbar, "enabled", true);
    checkAndInitializeSetting(settings.stacksbar, "hideoutofcombat", false);
    checkAndInitializeSetting(
        settings.stacksbar,
        "color",
        "--filter-bright-red",
    );
    checkAndInitializeSetting(settings.stacksbar, "scale", 1);
    checkAndInitializeSetting(settings.stacksbar, "x", 30);
    checkAndInitializeSetting(settings.stacksbar, "y", 170);

    settings.stacksbar.enabled
        ? $("#stacks-bar").show()
        : $("#stacks-bar").hide();

    $("#stacks-bar").attr("width", settings.stacksbar.scale * (4 * 25));
    $("#stacks-bar").attr("height", settings.stacksbar.scale * 21);
    $("#stacks-bar").css("transform", `scale(${settings.stacksbar.scale})`);
    $("[id^=stacks-background]").css(
        "margin-left",
        0 - settings.stacksbar.scale * 4,
    );
    $("#stacks-bar").css("--stacksColor", `var(${settings.stacksbar.color})`);
    ui.dragPosition["stacks-bar"] = {
        x: settings.stacksbar.x,
        y: settings.stacksbar.y,
    };
    $("#stacks-bar").addClass("ltr");
    $("#stacks-bar").css(
        "transform",
        `translate(${settings.stacksbar.x}px, ${settings.stacksbar.y}px)`,
    );

    // RAIDBUFF SETTINGS
    checkAndInitializeSetting(settings, "raidbuffs", {});
    checkAndInitializeSetting(settings.raidbuffs, "enabled", true);
    checkAndInitializeSetting(settings.raidbuffs, "ttsenabled", false);
    checkAndInitializeSetting(settings.raidbuffs, "alwaysshow", true);
    checkAndInitializeSetting(settings.raidbuffs, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.raidbuffs, "hidewhensolo", false);
    checkAndInitializeSetting(settings.raidbuffs, "orderbypartymember", true);
    checkAndInitializeSetting(settings.raidbuffs, "growleft", false);
    checkAndInitializeSetting(settings.raidbuffs, "padding", 0);
    checkAndInitializeSetting(settings.raidbuffs, "scale", 1);
    checkAndInitializeSetting(settings.raidbuffs, "columns", 8);
    checkAndInitializeSetting(settings.raidbuffs, "x", 30);
    checkAndInitializeSetting(settings.raidbuffs, "y", 240);
    checkAndInitializeSetting(settings.raidbuffs, "font", "Arial");
    checkAndInitializeSetting(settings.raidbuffs, "durationoutline", true);
    checkAndInitializeSetting(settings.raidbuffs, "cooldownoutline", true);
    checkAndInitializeSetting(settings.raidbuffs, "durationbold", true);
    checkAndInitializeSetting(settings.raidbuffs, "cooldownbold", true);
    checkAndInitializeSetting(settings.raidbuffs, "durationcolor", "#FFA500");
    checkAndInitializeSetting(settings.raidbuffs, "cooldowncolor", "#FFFFFF");
    checkAndInitializeSetting(
        settings.raidbuffs,
        "durationoutlinecolor",
        "#000000",
    );
    checkAndInitializeSetting(
        settings.raidbuffs,
        "cooldownoutlinecolor",
        "#000000",
    );

    settings.raidbuffs.enabled
        ? $("#raid-buffs-bar").show()
        : $("#raid-buffs-bar").hide();
    settings.raidbuffs.hidewhensolo
        ? $("#raid-buffs-bar").hide()
        : $("#raid-buffs-bar").show();

    $("#raid-buffs-bar").css("font-family", settings.raidbuffs.font);
    ui.dragPosition["raid-buffs-bar"] = {
        x: settings.raidbuffs.x,
        y: settings.raidbuffs.y,
    };
    $("#raid-buffs-bar").addClass(
        `${settings.raidbuffs.growleft ? "rtl" : "ltr"}`,
    );
    $("#raid-buffs-bar").css(
        "transform",
        `translate(${settings.raidbuffs.x}px, ${settings.raidbuffs.y}px)`,
    );

    // MITIGATION SETTINGS
    checkAndInitializeSetting(settings, "mitigation", {});
    checkAndInitializeSetting(settings.mitigation, "enabled", true);
    checkAndInitializeSetting(settings.mitigation, "ttsenabled", false);
    checkAndInitializeSetting(settings.mitigation, "alwaysshow", true);
    checkAndInitializeSetting(settings.mitigation, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.mitigation, "hidewhensolo", false);
    checkAndInitializeSetting(settings.mitigation, "growleft", false);
    checkAndInitializeSetting(settings.mitigation, "padding", 0);
    checkAndInitializeSetting(settings.mitigation, "scale", 1);
    checkAndInitializeSetting(settings.mitigation, "columns", 8);
    checkAndInitializeSetting(settings.mitigation, "x", 30);
    checkAndInitializeSetting(settings.mitigation, "y", 280);
    checkAndInitializeSetting(settings.mitigation, "font", "Arial");
    checkAndInitializeSetting(settings.mitigation, "durationoutline", true);
    checkAndInitializeSetting(settings.mitigation, "cooldownoutline", true);
    checkAndInitializeSetting(settings.mitigation, "durationbold", true);
    checkAndInitializeSetting(settings.mitigation, "cooldownbold", true);
    checkAndInitializeSetting(settings.mitigation, "durationcolor", "#FFA500");
    checkAndInitializeSetting(settings.mitigation, "cooldowncolor", "#FFFFFF");
    checkAndInitializeSetting(
        settings.mitigation,
        "durationoutlinecolor",
        "#000000",
    );
    checkAndInitializeSetting(
        settings.mitigation,
        "cooldownoutlinecolor",
        "#000000",
    );

    settings.mitigation.enabled
        ? $("#mitigation-bar").show()
        : $("#mitigation-bar").hide();
    settings.mitigation.hidewhensolo
        ? $("#mitigation-bar").hide()
        : $("#mitigation-bar").show();

    $("#mitigation-bar").css("font-family", settings.mitigation.font);
    ui.dragPosition["mitigation-bar"] = {
        x: settings.mitigation.x,
        y: settings.mitigation.y,
    };
    $("#mitigation-bar").addClass(
        `${settings.mitigation.growleft ? "rtl" : "ltr"}`,
    );
    $("#mitigation-bar").css(
        "transform",
        `translate(${settings.mitigation.x}px, ${settings.mitigation.y}px)`,
    );

    // PARTY COOLDOWN SETTINGS
    checkAndInitializeSetting(settings, "party", {});
    checkAndInitializeSetting(settings.party, "enabled", true);
    checkAndInitializeSetting(settings.party, "ttsenabled", false);
    checkAndInitializeSetting(settings.party, "alwaysshow", true);
    checkAndInitializeSetting(settings.party, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.party, "hidewhensolo", false);
    checkAndInitializeSetting(settings.party, "growleft", false);
    checkAndInitializeSetting(settings.party, "padding", 0);
    checkAndInitializeSetting(settings.party, "scale", 0.8);
    checkAndInitializeSetting(settings.party, "x", 30);
    checkAndInitializeSetting(settings.party, "y", 320);
    checkAndInitializeSetting(settings.party, "font", "Arial");
    checkAndInitializeSetting(settings.party, "durationoutline", true);
    checkAndInitializeSetting(settings.party, "cooldownoutline", true);
    checkAndInitializeSetting(settings.party, "durationbold", true);
    checkAndInitializeSetting(settings.party, "cooldownbold", true);
    checkAndInitializeSetting(settings.party, "durationcolor", "#FFA500");
    checkAndInitializeSetting(settings.party, "cooldowncolor", "#FFFFFF");
    checkAndInitializeSetting(
        settings.party,
        "durationoutlinecolor",
        "#000000",
    );
    checkAndInitializeSetting(
        settings.party,
        "cooldownoutlinecolor",
        "#000000",
    );

    settings.party.enabled ? $("#party-bar").show() : $("#party-bar").hide();
    settings.party.hidewhensolo
        ? $("#party-bar").hide()
        : $("#party-bar").show();

    $("#party-bar").css("font-family", settings.party.font);
    ui.dragPosition["party-bar"] = {
        x: settings.party.x,
        y: settings.party.y,
    };
    $("#party-bar").addClass(`${settings.party.growleft ? "rtl" : "ltr"}`);
    $("#party-bar").css(
        "transform",
        `translate(${settings.party.x}px, ${settings.party.y}px)`,
    );

    // CUSTOM COOLDOWN SETTINGS
    checkAndInitializeSetting(settings, "customcd", {});
    checkAndInitializeSetting(settings.customcd, "abilities", []);
    checkAndInitializeSetting(settings.customcd, "enabled", true);
    checkAndInitializeSetting(settings.customcd, "ttsenabled", false);
    checkAndInitializeSetting(settings.customcd, "alwaysshow", true);
    checkAndInitializeSetting(settings.customcd, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.customcd, "hidewhensolo", false);
    checkAndInitializeSetting(settings.customcd, "growleft", false);
    checkAndInitializeSetting(settings.customcd, "padding", 0);
    checkAndInitializeSetting(settings.customcd, "scale", 1);
    checkAndInitializeSetting(settings.customcd, "columns", 8);
    checkAndInitializeSetting(settings.customcd, "x", 30);
    checkAndInitializeSetting(settings.customcd, "y", 320);
    checkAndInitializeSetting(settings.customcd, "font", "Arial");
    checkAndInitializeSetting(settings.customcd, "durationoutline", true);
    checkAndInitializeSetting(settings.customcd, "cooldownoutline", true);
    checkAndInitializeSetting(settings.customcd, "durationbold", true);
    checkAndInitializeSetting(settings.customcd, "cooldownbold", true);
    checkAndInitializeSetting(settings.customcd, "durationcolor", "#FFA500");
    checkAndInitializeSetting(settings.customcd, "cooldowncolor", "#FFFFFF");
    checkAndInitializeSetting(
        settings.customcd,
        "durationoutlinecolor",
        "#000000",
    );
    checkAndInitializeSetting(
        settings.customcd,
        "cooldownoutlinecolor",
        "#000000",
    );

    settings.customcd.enabled
        ? $("#customcd-bar").show()
        : $("#customcd-bar").hide();
    settings.customcd.hidewhensolo
        ? $("#customcd-bar").hide()
        : $("#customcd-bar").show();

    $("#customcd-bar").css("font-family", settings.customcd.font);
    ui.dragPosition["customcd-bar"] = {
        x: settings.customcd.x,
        y: settings.customcd.y,
    };
    $("#customcd-bar").addClass(
        `${settings.customcd.growleft ? "rtl" : "ltr"}`,
    );
    $("#customcd-bar").css(
        "transform",
        `translate(${settings.customcd.x}px, ${settings.customcd.y}px)`,
    );

    currentSettings = settings;
    saveSettings();
}

async function saveSettings() {
    currentSettings.healthbar.x = parseInt(ui.dragPosition["health-bar"].x);
    currentSettings.healthbar.y = parseInt(ui.dragPosition["health-bar"].y);
    $("#health-bar").css(
        "--healthFontSize",
        currentSettings.healthbar.scale * 10,
    );
    $("#health-bar").css("--healthFontX", currentSettings.healthbar.scale * 5);
    $("#health-bar").css(
        "--healthFontY",
        currentSettings.healthbar.scale * -14,
    );

    currentSettings.manabar.x = parseInt(ui.dragPosition["mana-bar"].x);
    currentSettings.manabar.y = parseInt(ui.dragPosition["mana-bar"].y);
    $("#mana-bar").css("--manaFontSize", currentSettings.manabar.scale * 10);
    $("#mana-bar").css("--manaFontX", currentSettings.manabar.scale * 5);
    $("#mana-bar").css("--manaFontY", currentSettings.manabar.scale * -14);

    currentSettings.mpticker.x = parseInt(ui.dragPosition["mp-ticker-bar"].x);
    currentSettings.mpticker.y = parseInt(ui.dragPosition["mp-ticker-bar"].y);

    currentSettings.dotticker.x = parseInt(ui.dragPosition["dot-ticker-bar"].x);
    currentSettings.dotticker.y = parseInt(ui.dragPosition["dot-ticker-bar"].y);

    currentSettings.hotticker.x = parseInt(ui.dragPosition["hot-ticker-bar"].x);
    currentSettings.hotticker.y = parseInt(ui.dragPosition["hot-ticker-bar"].y);

    currentSettings.timerbar.x = parseInt(ui.dragPosition["timer-bar"].x);
    currentSettings.timerbar.y = parseInt(ui.dragPosition["timer-bar"].y);
    $("#timer-bar").css("--timerFontSize", currentSettings.timerbar.scale * 10);
    $("#timer-bar").css("--timerFontX", currentSettings.timerbar.scale * 5);
    $("#timer-bar").css("--timerFontY", currentSettings.timerbar.scale * -14);

    currentSettings.dottimerbar.x = parseInt(
        ui.dragPosition["dot-timer-bar"].x,
    );
    currentSettings.dottimerbar.y = parseInt(
        ui.dragPosition["dot-timer-bar"].y,
    );
    $("#dot-timer-bar").css(
        "--dotFontSize",
        currentSettings.dottimerbar.scale * 10,
    );
    $("#dot-timer-bar").css(
        "--dotFontX",
        currentSettings.dottimerbar.scale * 5,
    );
    $("#dot-timer-bar").css(
        "--dotFontY",
        currentSettings.dottimerbar.scale * -14,
    );

    currentSettings.bufftimerbar.x = parseInt(
        ui.dragPosition["buff-timer-bar"].x,
    );
    currentSettings.bufftimerbar.y = parseInt(
        ui.dragPosition["buff-timer-bar"].y,
    );
    $("#buff-timer-bar").css(
        "--buffFontSize",
        currentSettings.bufftimerbar.scale * 10,
    );
    $("#buff-timer-bar").css(
        "--buffFontX",
        currentSettings.bufftimerbar.scale * 5,
    );
    $("#buff-timer-bar").css(
        "--buffFontY",
        currentSettings.bufftimerbar.scale * -14,
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

    await callOverlayHandler({
        call: "saveData",
        key: "zeffUI",
        data: currentSettings,
    });
    localStorage.setItem("settings", JSON.stringify(currentSettings));
}

// UI Elements and functions
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
                    let parameters = new URLSearchParams(
                        window.location.search,
                    );
                    let settingsUrl = parameters.has("OVERLAY_WS")
                        ? `settings.html?OVERLAY_WS=${parameters.get(
                              "OVERLAY_WS",
                          )}`
                        : "settings.html";
                    let openSettings = window.open(settingsUrl, "settings");
                    openSettings.onload = function () {
                        this.onbeforeunload = function () {
                            loadSettings().then(() => {
                                if (gameState.player === null) return;
                                location.reload();
                            });
                        };
                    };
                    break;
                }
                case "en": {
                    currentSettings.language = "en";
                    saveSettings();
                    location.reload();
                    break;
                }
                case "de": {
                    currentSettings.language = "de";
                    saveSettings();
                    location.reload();
                    break;
                }
                case "fr": {
                    currentSettings.language = "fr";
                    saveSettings();
                    location.reload();
                    break;
                }
                case "jp": {
                    currentSettings.language = "jp";
                    saveSettings();
                    location.reload();
                    break;
                }
                case "cn": {
                    currentSettings.language = "cn";
                    saveSettings();
                    location.reload();
                    break;
                }
                case "kr": {
                    currentSettings.language = "kr";
                    saveSettings();
                    location.reload();
                    break;
                }
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

function drawGrid() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let canvas = $("#grid").attr({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    let canvasContext = canvas.get(0).getContext("2d");
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
    let canvas = $("#grid").attr({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    let canvasContext = $("#grid").get(0).getContext("2d");
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
}

function toggleGrid() {
    if (!ui.gridshown) {
        drawGrid();
        ui.gridshown = true;
    } else {
        clearGrid();
        ui.gridshown = false;
    }
}

function toggleLock() {
    interact("[id$=bar]").draggable({
        enabled: ui.locked,
        listeners: {
            move(event) {
                ui.dragPosition[event.target.id].x += event.dx;
                ui.dragPosition[event.target.id].y += event.dy;

                event.target.style.transform = `translate(${parseInt(
                    ui.dragPosition[event.target.id].x,
                )}px, ${parseInt(ui.dragPosition[event.target.id].y)}px)`;
            },
            end() {
                saveSettings();
            },
        },
    });
    if (ui.locked) {
        let tickerTypes = ["mp", "dot", "hot"];
        for (let tickerType of tickerTypes) {
            if (!currentSettings[`${tickerType}ticker`].enabled)
                $(`#${tickerType}-ticker-bar`).show();
            if (currentSettings[`${tickerType}ticker`].specificjobsenabled) {
                if (gameState.player) {
                    if (
                        !currentSettings[
                            `${tickerType}ticker`
                        ].specificjobs.includes(gameState.player.job)
                    )
                        $(`#${tickerType}-ticker-bar`).show();
                }
            }
            $(`#${tickerType}-ticker-bar`).attr(
                "data-label",
                language.find((x) => x.id === `${tickerType}ticker`).string,
            );
        }
        $("#timer-bar").show();
        $("#timer-bar").prop(
            "data-label",
            language.find((x) => x.id === "pulltimer").string,
        );
        $("#dot-timer-bar").show();
        $("#dot-timer-bar").prop(
            "data-label",
            language.find((x) => x.id === "dot-anchor").string,
        );
        $("#buff-timer-bar").show();
        $("#buff-timer-bar").prop(
            "data-label",
            language.find((x) => x.id === "buff-anchor").string,
        );
        $("#raid-buffs-bar").append(
            `<span id="raid-buffs-anchor" class="anchor-text">${
                language.find((x) => x.id === "raidbuffs-anchor").string
            }</span>`,
        );
        $("#mitigation-bar").append(
            `<span id="mitigation-anchor" class="anchor-text">${
                language.find((x) => x.id === "mitigation-anchor").string
            }</span>`,
        );
        $("#customcd-bar").append(
            `<span id="customcd-anchor" class="anchor-text">${
                language.find((x) => x.id === "customcd-anchor").string
            }</span>`,
        );
        if ($("#party-bar>div").length === 0) {
            $("#party-bar").append(
                `<span id="party-anchor" class="anchor-text">${
                    language.find((x) => x.id === "party-anchor").string
                }</span>`,
            );
        } else {
            $("#party-bar>div:eq(0)").append(
                `<span id="party-anchor" class="anchor-text">${
                    language.find((x) => x.id === "party-anchor").string
                }</span>`,
            );
        }
        toggleHideWhenSoloCombatElements(true);

        //$("[id$=bar]").draggable("enable");
        adjustJobStacks(2, 4, true);
        if (!gameState.inCombat) {
            toggleHideOutOfCombatElements();
        }
        ui.locked = false;
        $("html").css("border", "solid");
    } else {
        let tickerTypes = ["mp", "dot", "hot"];
        for (let tickerType of tickerTypes) {
            if (!currentSettings[`${tickerType}ticker`].enabled)
                $(`#${tickerType}-ticker-bar`).hide();
            if (currentSettings[`${tickerType}ticker`].specificjobsenabled) {
                if (gameState.player) {
                    if (
                        !currentSettings[
                            `${tickerType}ticker`
                        ].specificjobs.includes(gameState.player.job)
                    )
                        $(`#${tickerType}-ticker-bar`).hide();
                }
            }
            $(`#${tickerType}-ticker-bar`).attr("data-label", "");
        }
        $("#timer-bar").hide();
        $("#dot-timer-bar").hide();
        $("#buff-timer-bar").hide();
        $("#raid-buffs-anchor").remove();
        $("#mitigation-anchor").remove();
        $("#customcd-anchor").remove();
        $("#party-anchor").remove();
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
        $("html").css("border", "none");
    }
}

// Helper functions
function applyFilterColorToElement(classId, filterColor) {
    $("style").append(
        `.${classId}::-webkit-progress-value { filter: var(${filterColor}); }`,
    );
}

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
    }
    return object;
}

async function getACTLocale() {
    let lang = await callOverlayHandler({ call: "getLanguage" });
    switch (lang.language) {
        case "English":
            return "en";
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
        case "default":
            return "en";
    }
}

function toggleHideOutOfCombatElements() {
    currentSettings.healthbar.hideoutofcombat && !gameState.inCombat
        ? $("#health-bar").addClass("hide-in-combat")
        : $("#health-bar").removeClass("hide-in-combat");
    currentSettings.manabar.hideoutofcombat && !gameState.inCombat
        ? $("#mana-bar").addClass("hide-in-combat")
        : $("#mana-bar").removeClass("hide-in-combat");
    currentSettings.mpticker.hideoutofcombat && !gameState.inCombat
        ? $("#mp-ticker-bar").addClass("hide-in-combat")
        : $("#mp-ticker-bar").removeClass("hide-in-combat");
    currentSettings.dotticker.hideoutofcombat && !gameState.inCombat
        ? $("#dot-ticker-bar").addClass("hide-in-combat")
        : $("#dot-ticker-bar").removeClass("hide-in-combat");
    currentSettings.hotticker.hideoutofcombat && !gameState.inCombat
        ? $("#hot-ticker-bar").addClass("hide-in-combat")
        : $("#hot-ticker-bar").removeClass("hide-in-combat");
    currentSettings.dottimerbar.hideoutofcombat && !gameState.inCombat
        ? $("[id$=dot-timer]").addClass("hide-in-combat")
        : $("[id$=dot-timer]").removeClass("hide-in-combat");
    currentSettings.dottimerbar.hideoutofcombat && !gameState.inCombat
        ? $("[id$=dot-image]").addClass("hide-in-combat")
        : $("[id$=dot-image]").removeClass("hide-in-combat");
    currentSettings.bufftimerbar.hideoutofcombat && !gameState.inCombat
        ? $("[id$=buff-timer]").addClass("hide-in-combat")
        : $("[id$=buff-timer]").removeClass("hide-in-combat");
    currentSettings.bufftimerbar.hideoutofcombat && !gameState.inCombat
        ? $("[id$=buff-image]").addClass("hide-in-combat")
        : $("[id$=buff-image]").removeClass("hide-in-combat");
    currentSettings.stacksbar.hideoutofcombat && !gameState.inCombat
        ? $("#stacks-bar").addClass("hide-in-combat")
        : $("#stacks-bar").removeClass("hide-in-combat");
    currentSettings.raidbuffs.hideoutofcombat && !gameState.inCombat
        ? $("#raid-buffs-bar").addClass("hide-in-combat")
        : $("#raid-buffs-bar").removeClass("hide-in-combat");
    currentSettings.mitigation.hideoutofcombat && !gameState.inCombat
        ? $("#mitigation-bar").addClass("hide-in-combat")
        : $("#mitigation-bar").removeClass("hide-in-combat");
    currentSettings.customcd.hideoutofcombat && !gameState.inCombat
        ? $("#customcd-bar").addClass("hide-in-combat")
        : $("#customcd-bar").removeClass("hide-in-combat");
    currentSettings.party.hideoutofcombat && !gameState.inCombat
        ? $("#party-bar").addClass("hide-in-combat")
        : $("#party-bar").removeClass("hide-in-combat");
}

function toggleHideWhenSoloCombatElements(toggleLock = false) {
    let show = gameState.partyList.length !== 1;
    if (toggleLock) show = true;
    if (currentSettings.raidbuffs.hidewhensolo)
        show ? $("#raid-buffs-bar").show() : $("#raid-buffs-bar").hide();
    if (currentSettings.mitigation.hidewhensolo)
        show ? $("#mitigation-bar").show() : $("#mitigation-bar").hide();
    if (currentSettings.customcd.hidewhensolo)
        show ? $("#customcd-bar").show() : $("#customcd-bar").hide();
    if (currentSettings.party.hidewhensolo)
        show ? $("#party-bar").show() : $("#party-bar").hide();
}

// UI Generation for Job Stacks
function generateJobStacks() {
    $("#stacks-bar").empty();
    for (let i = 1; i <= 4; i++) {
        $("#stacks-bar").append(
            `<div id="stacks-background-${i}" class="stack-background stack-hidden">
				<img id="stacks-${i}" class="stack-color" src="skins/${currentSettings.skin}/images/arrow-fill-empty.png" />
			</div>`,
        );
    }
}

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
    $("#customcd-bar").empty();
    let playerIndex = 0;
    let currentJob = jobList.find((x) => x.name === gameState.player.job);
    if (currentSettings.customcd.abilities.length === 0) return;
    for (let ability of currentSettings.customcd.abilities.filter(
        (x) => x.type === "CustomCooldown" && x.level <= gameState.player.level,
    )) {
        let pushAbility = false;
        if (
            ability.job === currentJob.name ||
            ability.job === currentJob.type ||
            ability.job === currentJob.position_type
        ) {
            pushAbility = true;
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

function generateMitigation() {
    toLog(["[generateMitigation]"]);
    let mitigationAbilityList = [];
    $("#mitigation-bar").empty();
    let playerIndex = 0;
    let currentJob = jobList.find((x) => x.name === gameState.player.job);
    for (let ability of abilityList.filter(
        (x) => x.type === "Mitigation" && x.level <= gameState.player.level,
    )) {
        if (
            currentSettings.override.abilities.some(
                (x) => x.name === ability.name,
            )
        ) {
            ability = currentSettings.override.abilities.find(
                (x) => x.name === ability.name,
            );
        }
        let pushAbility = false;
        if (
            ability.job === currentJob.name ||
            ability.job === currentJob.type
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

function generatePartyCooldowns() {
    toLog(["[generatePartyCooldowns]"]);
    let partyAbilityList = [];
    $("#party-bar").empty();
    let playerIndex = 0;
    for (let partyMember of gameState.partyList) {
        for (let ability of abilityList.filter(
            (x) =>
                x.type === "Party" &&
                (x.job === partyMember.job.name ||
                    x.job === partyMember.job.type ||
                    x.job === partyMember.job.position_type) &&
                x.level <= gameState.player.level,
        )) {
            if (
                currentSettings.override.abilities.some(
                    (x) => x.name === ability.name,
                )
            ) {
                ability = currentSettings.override.abilities.find(
                    (x) => x.name === ability.name,
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

function generateRaidBuffs() {
    toLog(["[generateRaidBuffs]"]);
    let raidAbilityList = [];
    $("#raid-buffs-bar").empty();
    let playerIndex = 0;
    for (let partyMember of gameState.partyList) {
        for (let ability of abilityList.filter(
            (x) =>
                x.type === "RaidBuff" &&
                x.job === partyMember.job.name &&
                x.level <= gameState.player.level,
        )) {
            if (
                currentSettings.override.abilities.some(
                    (x) => x.name === ability.name,
                )
            ) {
                ability = currentSettings.override.abilities.find(
                    (x) => x.name === ability.name,
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

function generateIconBarElements(selector, iconAbilityList, columns) {
    let selectorProperties = getSelectorProperties(selector);
    let barSelector = selectorProperties.id;
    let selectedSettings = selectorProperties.settings;

    let rows = Math.ceil(iconAbilityList.length / columns);
    let abilityIndex = 0;
    if (selector !== "Party") {
        for (let i = 1; i <= rows; i++) {
            $(`#${barSelector}-bar`).append(
                `<div id="${barSelector}-row-${i}" class="ability-row" style="padding-top: ${selectedSettings.padding}px;">
					<div id="${barSelector}-row-${i}-box" class="ability-box">
					</div>
				</div>`,
            );
            for (let j = 1; j <= columns; j++) {
                let ability = iconAbilityList[abilityIndex];
                generateAbilityIcon(ability.playerIndex, ability.ability, i);
                if (abilityIndex == iconAbilityList.length - 1) break;
                abilityIndex++;
            }
        }
    } else {
        let currentPlayerIndex = 0;
        let players = 8;
        if (currentSettings.includealliance) players = 24;
        for (let i = 1; i <= players; i++) {
            $(`#${barSelector}-bar`).append(
                `<div id="${barSelector}-row-${i}" class="ability-row" style="padding-top: ${selectedSettings.padding}px;">
					<div id="${barSelector}-row-${i}-box" class="ability-box">
					</div>
				</div>`,
            );
            if (
                iconAbilityList.filter(
                    (ability) => ability.playerIndex === i - 1,
                ).length === 0
            ) {
                $(`#${barSelector}-row-${i}-box`).append(
                    `<div id="${barSelector}-${i}-dummy-container" class="ability-container" style="width: ${
                        selectedSettings.scale * 48
                    }px; height: ${
                        selectedSettings.scale * 48
                    }px; padding-right: ${selectedSettings.padding}px;"></div>`,
                );
                $(`#${barSelector}-${i}-dummy-container`).append(
                    `<img id="${barSelector}-${i}-dummy-image" class="ability-image" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" width="${
                        selectedSettings.scale * 40
                    }px" height="${
                        selectedSettings.scale * 40
                    }px" style="top: ${selectedSettings.scale * 2}px;" />`,
                );
            }
        }
        for (let ability of iconAbilityList) {
            if (currentPlayerIndex != ability.playerIndex)
                currentPlayerIndex = ability.playerIndex;
            generateAbilityIcon(
                ability.playerIndex,
                ability.ability,
                ability.playerIndex + 1,
            );
        }
    }
}

function generateAbilityIcon(playerIndex, ability, row, generateRow = false) {
    let selectorProperties = getSelectorProperties(ability.type);
    let barSelector = selectorProperties.id;
    let selectedSettings = selectorProperties.settings;
    if (generateRow) {
        if (row === 0) row = 1;
        if ($(`#${barSelector}-row-${row}`).length === 0)
            $(`#${barSelector}-bar`).append(
                `<div id="${barSelector}-row-${row}" class="ability-row" style="padding-top: ${selectedSettings.padding}px;">
					<div id="${barSelector}-row-${row}-box" class="ability-box">
					</div>
				</div>`,
            );
    }

    let iconWidth = selectedSettings.scale * 40;
    let iconHeight = selectedSettings.scale * 40;
    let activeWidth = selectedSettings.scale * 42;
    let activeHeight = selectedSettings.scale * 42;
    let boxWidth = selectedSettings.scale * 48;
    let boxHeight = selectedSettings.scale * 48;
    let overlayWidth = selectedSettings.scale * 48;
    let overlayHeight = selectedSettings.scale * 48;
    let lineHeight = selectedSettings.scale * 44;

    let abilitySelector = `${barSelector}-${playerIndex}-${ability.id}`;
    let containerSelector = `#${abilitySelector}-container`;

    $(`#${barSelector}-row-${row}-box`).append(
        `<div id="${abilitySelector}-container" class="ability-container" style="width: ${boxWidth}px; height: ${boxHeight}px; padding-right: ${selectedSettings.padding}px;"></div>`,
    );
    $(containerSelector).append(
        `<img id="${abilitySelector}-image" class="ability-image" src="${
            ability.icon
        }" width="${iconWidth}px" height="${iconHeight}px" style="top: ${
            selectedSettings.scale * 2
        }px;" />`,
    );
    $(containerSelector).append(
        `<img id="${abilitySelector}-active" class="icon-active" src="skins/${
            currentSettings.skin
        }/images/combo.gif" width="${activeWidth}px" height="${activeHeight}px" style="top: ${
            selectedSettings.scale * 1
        }px; display: none;" />`,
    );
    $(containerSelector).append(
        `<img id="${abilitySelector}-overlay" class="icon-overlay" src="skins/${currentSettings.skin}/images/icon-overlay.png" width="${overlayWidth}px" height="${overlayHeight}px" />`,
    );
    $(containerSelector).append(
        `<span id="${abilitySelector}-cooldown" class="ability-text" style="line-height: ${lineHeight}px; padding-left: ${
            selectedSettings.scale * 2
        }px; ${
            selectedSettings.cooldownoutline
                ? `-webkit-text-stroke: 1.5px ${selectedSettings.durationoutlinecolor};`
                : ""
        } color: ${selectedSettings.cooldowncolor}; font-size: ${
            selectedSettings.scale * 24
        }px; font-weight:${
            selectedSettings.cooldownbold ? "bold" : "normal"
        }"></span>`,
    );
    $(containerSelector).append(
        `<span id="${abilitySelector}-duration" class="ability-text" style="line-height: ${lineHeight}px; padding-left: ${
            selectedSettings.scale * 2
        }px; ${
            selectedSettings.durationoutline
                ? `-webkit-text-stroke: 1.5px ${selectedSettings.durationoutlinecolor};`
                : ""
        } color: ${selectedSettings.durationcolor}; font-size: ${
            selectedSettings.scale * 24
        }px; font-weight:${
            selectedSettings.durationbold ? "bold" : "normal"
        };"></span>`,
    );
}

// Handlers for creating/maintaining party list
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
                name: partyMember.name,
                worldId: partyMember.worldId,
            });
        }
    }
    let jobOrder = currentSettings.partyorder;
    let currentPlayerElement = gameState.partyList.find(
        (x) => x.name === gameState.player.name,
    );
    gameState.partyList.sort((a, b) => a.id - b.id);
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

function checkForParty(e) {
    let combatants = e.combatants;
    if (combatants === undefined || gameState.player === undefined) return;
    let player = combatants.find((x) => x.ID === gameState.player.id);
    let partyList = generateRawPartyList(player.PartyType !== 0, combatants);
    generatePartyList(partyList);
    reloadCooldownModules();
}

// Timer and TTS handlers
function startAbilityIconTimers(
    playerIndex,
    ability,
    onYou = true,
    abilityHolder = null,
) {
    toLog([
        `[StartAbilityIconTimers] PlayerIndex: ${playerIndex} On You: ${onYou}`,
        ability,
        abilityHolder,
    ]);
    let abilityUsed = abilityHolder === null ? ability : abilityHolder;
    let usingAbilityHolder = abilityHolder !== null;

    let selectorProperties = getSelectorProperties(ability.type);
    let barSelector = selectorProperties.id;
    let selectedSettings = selectorProperties.settings;
    let selectedActive = selectorProperties.active;

    let selector = `#${barSelector}-${playerIndex}-${abilityUsed.id}`;

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
        }
        if (activeElements.countdowns.has(`${selector}-cooldown`)) {
            clearInterval(
                activeElements.countdowns.get(`${selector}-cooldown`),
            );
        }
        stopAbilityTimer(`${selector}-cooldown`, null);
        stopAbilityTimer(`${selector}-duration`, null);
    }

    handleAbilityTTS(ability, selector, onYou);

    if (onYou) {
        if (!selectedSettings.alwaysshow) {
            generateAbilityIcon(
                playerIndex,
                ability,
                Math.ceil(selectedActive.size / selectedSettings.columns),
                true,
            );
        }
        $(`${selector}-overlay`).attr(
            "src",
            `skins/${currentSettings.skin}/images/icon-overlay.png`,
        );
        $(`${selector}-active`).show();
        $(`${selector}-duration`).show();
        $(`${selector}-duration`).text(ability.duration);
        $(`${selector}-cooldown`).hide();
        if (usingAbilityHolder) {
            let previousIcon = `${abilityHolder.icon}`;
            $(`${selector}-image`).attr("src", `${ability.icon}`);
            startAbilityTimer(
                ability.duration,
                `${selector}-duration`,
                previousIcon,
            );
        } else {
            startAbilityTimer(ability.duration, `${selector}-duration`);
        }
    } else {
        $(`${selector}-overlay`).attr(
            "src",
            ability.cooldown > 0
                ? `skins/${currentSettings.skin}/images/icon-overlay-cooldown.png`
                : `skins/${currentSettings.skin}/images/icon-overlay.png`,
        );
        $(`${selector}-cooldown`).show();
        $(`${selector}-cooldown`).text(ability.cooldown);
    }
    if (selectedSettings.alwaysshow)
        startAbilityTimer(ability.cooldown, `${selector}-cooldown`);

    selectedActive.set(`${playerIndex}-${ability.id}`, selector);
}

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
    let targetBarSelector = `#${ability.type.toLowerCase()}-timer-bar`;
    let targetImageSelector = `#${ability.type.toLowerCase()}-image`;
    let targetPosition =
        ui.dragPosition[`${ability.type.toLowerCase()}-timer-bar`];
    let selectorBar = `#${abilityUsed.id}-${ability.type.toLowerCase()}-timer`;
    let selectorImage = `#${
        abilityUsed.id
    }-${ability.type.toLowerCase()}-image`;
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
        let newBar = $(targetBarSelector)
            .clone()
            .prop("id", selectorBar.replace("#", ""));
        $(targetBarSelector).after(newBar);
        let newImage = $(targetImageSelector)
            .clone()
            .prop("id", selectorImage.replace("#", ""));
        $(targetImageSelector).after(newImage);

        $(selectorBar).show();
        $(selectorBar).addClass(`bar-${ability.id}`);
        $(selectorBar).addClass(`${ability.type.toLowerCase()}-font-size`);
        applyFilterColorToElement(`bar-${ability.id}`, ability.color);

        $(targetBarSelector).attr(
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
                $(selectorBar).css(
                    "transform",
                    `translate(${targetPosition.x}px, ${
                        targetPosition.y +
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .padding *
                            ability.order
                    }px)`,
                );
                break;
            }
            case 2: {
                // Up
                $(selectorBar).css(
                    "transform",
                    `translate(${targetPosition.x}px, ${
                        targetPosition.y -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .padding *
                            ability.order
                    }px)`,
                );
                break;
            }
            case 3: {
                // Left
                $(selectorBar).css(
                    "transform",
                    `translate(${
                        targetPosition.x -
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .padding *
                            ability.order
                    }px, ${targetPosition.y}px)`,
                );
                break;
            }
            case 4: {
                // Right
                $(selectorBar).css(
                    "transform",
                    `translate(${
                        targetPosition.x +
                        currentSettings[`${ability.type.toLowerCase()}timerbar`]
                            .padding *
                            ability.order
                    }px, ${targetPosition.y}px)`,
                );
                break;
            }
        }

        if (
            currentSettings[`${ability.type.toLowerCase()}timerbar`]
                .imageenabled
        ) {
            $(selectorImage).show();
            $(selectorImage).attr("src", `${ability.icon}`);
            $(selectorImage).css(
                "image-rendering",
                currentSettings[`${ability.type.toLowerCase()}timerbar`].scale >
                    1
                    ? "pixelated"
                    : "-webkit-optimize-contrast",
            );
            $(selectorImage).css(
                "height",
                currentSettings[`${ability.type.toLowerCase()}timerbar`].scale *
                    22,
            );

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

            $(selectorImage).css("transform", `translate(${left}px, ${top}px)`);
        }
    }
    if (
        usingAbilityHolder &&
        currentSettings[`${ability.type.toLowerCase()}timerbar`].imageenabled
    )
        $(selectorImage).attr("src", `${ability.icon}`);
    if (usingAbilityHolder)
        applyFilterColorToElement(`bar-${abilityUsed.id}`, ability.color);
    if (activeElements.countdowns.has(selectorBar) && extends_duration) {
        duration = parseInt($(selectorBar).val()) / 1000 + parseInt(duration);
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

function startAbilityTimer(duration, selector, previousIcon = null) {
    let timems = duration * 1000;

    $(selector).text(duration);

    let timeLeft = timems;
    let countdownTimer = setInterval(function () {
        timeLeft -= UPDATE_INTERVAL;

        $(selector).text((timeLeft / 1000).toFixed(0));
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            setTimeout(function () {
                stopAbilityTimer(selector, previousIcon);
            }, UPDATE_INTERVAL);
        }
    }, UPDATE_INTERVAL);
    activeElements.countdowns.set(selector, countdownTimer);
}

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
    $(selector).attr("max", timems);
    $(selector).attr("value", reverseBar ? 0 : timems);
    if (!selector.endsWith("ticker-bar"))
        $(selector).attr("data-label", timems);

    if (hideTimer) $(selector).show();

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

        $(selector).attr("value", visualTime);
        if (!selector.endsWith("ticker-bar"))
            $(selector).attr("data-label", (timeLeft / 1000).toFixed(1));
        if (timeLeft <= 0 && !loop) {
            clearInterval(countdownTimer);
            setTimeout(function () {
                if (hideTimer) {
                    if (selector !== "#timer-bar") {
                        removeTimerBar(selector);
                    } else {
                        $(selector).hide();
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

function stopAbilityTimer(selector, previousIcon = null) {
    if (currentSettings.raidbuffs.alwaysshow) {
        $(selector).text("");
        if (selector.endsWith("duration")) {
            if (previousIcon !== null)
                $(selector.replace("duration", "image")).attr(
                    "src",
                    previousIcon,
                );
            $(selector.replace("duration", "cooldown")).show();
            $(selector.replace("duration", "active")).hide();

            if (
                $(selector.replace("duration", "cooldown")).text().length !== 0
            ) {
                $(selector.replace("duration", "overlay")).attr(
                    "src",
                    `skins/${currentSettings.skin}/images/icon-overlay-cooldown.png`,
                );
            }
        }
        if (selector.endsWith("cooldown")) {
            $(selector.replace("cooldown", "overlay")).attr(
                "src",
                `skins/${currentSettings.skin}/images/icon-overlay.png`,
            );
        }
    } else {
        $(selector.replace("-duration", "").replace("-cooldown", "")).remove();
        activeElements.countdowns.delete(selector);
    }
}

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

function removeTimerBar(selector) {
    $(selector).remove();
    $(selector.replace("timer", "image")).remove();
    if (activeElements.buffBars.has(parseInt(selector.match(/[0-9]+/g)[0])))
        activeElements.buffBars.delete(parseInt(selector.match(/[0-9]+/g)[0]));
    if (activeElements.dotBars.has(parseInt(selector.match(/[0-9]+/g)[0])))
        activeElements.dotBars.delete(parseInt(selector.match(/[0-9]+/g)[0]));
}

function resetTimers() {
    let tickerTypes = ["mp", "dot", "hot"];
    for (let tickerType of tickerTypes) {
        $(`#${tickerType}-ticker-bar`).attr("value", 0);
        $(`#${tickerType}-ticker-bar`).attr("data-label", "");
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

function setWebTTS(text) {
    let iframe = document.createElement("iframe");
    iframe.removeAttribute("sandbox");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    let encText = encodeURIComponent(text);

    /*
    let ttsLang = currentSettings.language;
    if (currentSettings.language == "jp") ttsLang = "ja";
    */

    // For CN User
    // https://fanyi.baidu.com/gettts?lan=zh&spd=5&source=web&text=
    iframe.contentDocument.body.innerHTML =
        '<audio src="https://fanyi.baidu.com/gettts?lan=zh&spd=5&source=web&text=' +
        encText +
        '" id="TTS">';

    this.item = iframe.contentDocument.body.firstElementChild;
    return this.item;
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
        let backgroundSelector = `#stacks-background-${i}`;
        let selector = `#stacks-${i}`;
        if (i <= max) {
            if ($(backgroundSelector).hasClass("stack-hidden")) {
                $(backgroundSelector).removeClass("stack-hidden");
            }
        } else {
            if (!$(backgroundSelector).hasClass("stack-hidden")) {
                $(backgroundSelector).addClass("stack-hidden");
            }
        }
        $(selector).attr(
            "src",
            i <= value
                ? `skins/${currentSettings.skin}/images/arrow-fill.png`
                : `skins/${currentSettings.skin}/images/arrow-fill-empty.png`,
        );
    }
}

function initializeSmn(addStack = false) {
    gameState.stats.stacks = addStack ? 1 : 0;
    gameState.stats.maxStacks = 4;
}

// OverlayPlugin and Cactbot Event Handlers
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

function onInCombatChangedEvent(e) {
    if (gameState.inCombat === e.detail.inGameCombat) {
        return;
    }

    gameState.inCombat = e.detail.inGameCombat;
    toggleHideOutOfCombatElements();
}

function onLogEvent(e) {
    for (let logLine of e.detail.logs) {
        toLog([logLine]);
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

document.addEventListener("onOverlayStateUpdate", function (e) {
    if (!e.detail.isLocked) {
        $(":root").css("background", "rgba(0,0,255,0.5)");
    } else {
        $(":root").css("background", "");
    }
});

function onJobChange(job) {
    let tickerTypes = ["mp", "dot", "hot"];
    for (let tickerType of tickerTypes) {
        if (currentSettings[`${tickerType}ticker`].enabled) {
            if (currentSettings[`${tickerType}ticker`].specificjobsenabled) {
                if (
                    currentSettings[
                        `${tickerType}ticker`
                    ].specificjobs.includes(job)
                ) {
                    $(`#${tickerType}-ticker-bar`).show();
                } else {
                    $(`#${tickerType}-ticker-bar`).hide();
                }
            } else {
                $(`#${tickerType}-ticker-bar`).hide();
            }
        } else {
            $(`#${tickerType}-ticker-bar`).hide();
        }
    }

    if (job === "SMN") {
        initializeSmn();
        adjustJobStacks(gameState.stats.stacks, gameState.stats.maxStacks);
        $("#stacks-bar").show();
    } else {
        $("#stacks-bar").hide();
    }
    resetTimers();
    if (gameState.partyList.length === 1) {
        gameState.partyList = [];
    }
}

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

function onPartyWipe() {
    if (gameState.player === null) return;
    resetTimers();
    reloadCooldownModules();
}

function onPlayerChangedEvent(e) {
    if (gameState.player !== null && gameState.player.job !== e.detail.job) {
        onJobChange(e.detail.job);
    }
    gameState.player = e.detail;
    if (gameState.partyList.length === 0) {
        let tickerTypes = ["mp", "dot", "hot"];
        for (let tickerType of tickerTypes) {
            if (currentSettings[`${tickerType}ticker`].enabled) {
                if (
                    currentSettings[`${tickerType}ticker`].specificjobsenabled
                ) {
                    if (
                        currentSettings[
                            `${tickerType}ticker`
                        ].specificjobs.includes(e.detail.job)
                    ) {
                        $(`#${tickerType}-ticker-bar`).show();
                    } else {
                        $(`#${tickerType}-ticker-bar`).hide();
                    }
                }
            }
        }
        window
            .callOverlayHandler({ call: "getCombatants" })
            .then((e) => checkForParty(e));
    }

    $("#health-bar").attr("max", gameState.player.maxHP);
    $("#health-bar").attr("value", gameState.player.currentHP);
    $("#health-bar").attr(
        "data-label",
        currentSettings.healthbar.textenabled
            ? `${gameState.player.currentHP} / ${gameState.player.maxHP}`
            : "",
    );

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

/* exported handleCountdownTimer */
function handleCountdownTimer(parameters) {
    if (!currentSettings.timerbar.enabled) return;
    startBarTimer(parameters.seconds, "#timer-bar", true);
}

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
    if (!activeElements.countdowns.has(`#${type}-ticker-bar`)) {
        startBarTimer(
            GAME_DATA.EFFECT_TICK,
            `#${type}-ticker-bar`,
            false,
            true,
            true,
        );
    }
}

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
    if (duration > 0) startBarTimer(duration, "#mp-ticker-bar", false, true);
}

function handleManaUpdate(current, max) {
    handleManaTick(current, max);
    $("#mana-bar").attr("max", max);
    $("#mana-bar").attr("value", current);
    $("#mana-bar").attr(
        "data-label",
        currentSettings.manabar.textenabled ? `${current} / ${max}` : "",
    );

    if (!currentSettings.manabar.jobthresholdsenabled) return;
    if (
        gameState.player.job === "BLM" ||
        gameState.player.job === "DRK" ||
        gameState.player.job === "PLD"
    ) {
        if (current <= currentSettings.manabar[gameState.player.job].low) {
            $("#mana-bar").css(
                "--manaBarColor",
                `var(${currentSettings.manabar.lowcolor})`,
            );
        } else if (
            current <= currentSettings.manabar[gameState.player.job].med
        ) {
            $("#mana-bar").css(
                "--manaBarColor",
                `var(${currentSettings.manabar.medcolor})`,
            );
        } else {
            $("#mana-bar").css(
                "--manaBarColor",
                `var(${currentSettings.manabar.color})`,
            );
        }
    }
}

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
    for (ability of abilityList.filter(
        (x) => x.id == parseInt(parameters.skillid, 16),
    )) {
        if (ability === undefined) return;
        if (
            currentSettings.override.abilities.some(
                (x) => x.id == parseInt(parameters.skillid, 16),
            )
        ) {
            ability = currentSettings.override.abilities.find(
                (x) => x.id == parseInt(parameters.skillid, 16),
            );
        }
        if (!ability.enabled) return;
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
                    let abilityHolder = abilityList.find(
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
                    let abilityHolder = abilityList.find(
                        (x) => x.name === "Song",
                    );
                    if (byYou) {
                        if (!currentSettings.raidbuffs.alwaysshow) {
                            for (let song of abilityList.filter(
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
                                let selector = `#raid-buffs-${playerIndex}-${song.id}`;
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
                    let abilityHolder = abilityList.find((x) => x.id === 15997);
                    startAbilityIconTimers(
                        playerIndex,
                        ability,
                        true,
                        currentSettings.raidbuffs.alwaysshow
                            ? abilityHolder
                            : ability,
                    );
                }
                if (ability.extra.is_ts) {
                    let abilityHolder = abilityList.find((x) => x.id === 16004);
                    startAbilityIconTimers(
                        playerIndex,
                        ability,
                        true,
                        currentSettings.raidbuffs.alwaysshow
                            ? abilityHolder
                            : ability,
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
    }
    if (currentSettings.customcd.abilities.length > 0) {
        for (ability of currentSettings.customcd.abilities.filter(
            (x) => x.id == parseInt(parameters.skillid, 16),
        )) {
            if (byYou) startAbilityIconTimers(playerIndex, ability, true);
        }
    }
}

/* exported handleGainEffect */
function handleGainEffect(parameters) {
    if (gameState.player === null) return;
    let byYou = parameters.player === gameState.player.name;
    let onYou = parameters.target === gameState.player.name;
    let playerIndex = gameState.partyList.findIndex(
        (x) => x.name === parameters.player,
    );
    let ability = undefined;
    for (ability of abilityList.filter(
        (x) =>
            x[`name_${currentSettings.language}`].toLowerCase() ==
            parameters.effect.toLowerCase(),
    )) {
        if (ability === undefined) return;
        if (
            currentSettings.override.abilities.some(
                (x) => x.name === ability.name,
            )
        ) {
            ability = currentSettings.override.abilities.find(
                (x) => x.name === ability.name,
            );
        }
        if (!ability.enabled) return;
        if (ability.type === "RaidBuff") {
            if (
                ability.name === "Standard Step" ||
                ability.name === "Technical Step" ||
                ability.name === "Embolden"
            )
                return;
            if (Object.prototype.hasOwnProperty.call(ability, "extra")) {
                if (ability.extra.is_song) {
                    let abilityHolder = abilityList.find(
                        (x) => x.name === "Song",
                    );
                    if (byYou) {
                        return;
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
                            abilityList.find(
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
                        abilityList.find(
                            (x) => x.id === ability.extra.shares_cooldown,
                        ),
                    );
                    return;
                }
                if (ability.extra.extends_duration) {
                    startAbilityBarTimer(
                        ability,
                        parameters.duration,
                        onYou,
                        true,
                        ability.extra.max_duration,
                    );
                    return;
                }
            }
            startAbilityBarTimer(ability, parameters.duration, onYou);
        }
    }
}

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
        let selectorProperties = getSelectorProperties(ability.type);
        let barSelector = selectorProperties.id;
        let abilitySelector = `#${barSelector}-${playerIndex}-${ability.id}`;

        if (activeElements.countdowns.has(`${abilitySelector}-duration`)) {
            clearInterval(
                activeElements.countdowns.get(`${abilitySelector}-duration`),
            );
        }
        stopAbilityTimer(`${abilitySelector}-duration`, null);
    }
}

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
