// External Globals
/* global callOverlayHandler */

// Function to initialize setting property, thanks MikeMatrix for the help with this.
function checkAndInitializeSetting(settingsObject, setting, defaultValue) {
    if (settingsObject[setting] === undefined)
        settingsObject[setting] = defaultValue;
}

// Gets the set language in FFXIV Plugin Settings
async function getACTLocale() {
    let lang = await callOverlayHandler({ call: "getLanguage" });
    console.log(`Detected ACT Language: ${lang.language}`);
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
        case "TraditionalChinese":
            return "tc";
        case "default":
            return "en";
    }
}

/* exported checkAndInitializeDefaultSettingsObject */
async function checkAndInitializeDefaultSettingsObject(settings, lang = null) {
    // PROFILE SETTINGS
    checkAndInitializeSetting(settings, "profiles", {});
    checkAndInitializeSetting(settings.profiles, "currentprofile", "");
    checkAndInitializeSetting(settings.profiles, "profiles", {});
    checkAndInitializeSetting(settings.profiles, "jobprofiles", {});

    // LANGUAGE SETTINGS
    if (!lang) {
        lang = await getACTLocale();
    }
    checkAndInitializeSetting(settings, "language", lang);

    // OVERRIDE SETTINGS
    checkAndInitializeSetting(settings, "override", {});
    checkAndInitializeSetting(settings.override, "enabled", false);
    checkAndInitializeSetting(settings.override, "abilities", []);

    // GENERAL SETTINGS
    checkAndInitializeSetting(settings, "general", {});
    checkAndInitializeSetting(settings.general, "usewebtts", false);
    checkAndInitializeSetting(settings.general, "ttsearly", 5);
    checkAndInitializeSetting(settings.general, "preventdoubletts", true);
    checkAndInitializeSetting(settings.general, "usehdicons", false);
    checkAndInitializeSetting(settings.general, "customcss", "");

    // SKIN SETTINGS
    checkAndInitializeSetting(settings, "skin", "default");

    // FONT SETTINGS
    checkAndInitializeSetting(settings, "font", "Arial");
    checkAndInitializeSetting(settings, "customfonts", []);

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
			"WHM", "CNJ", "SCH", "AST", "SGE",
			// Melee DPS
			"MNK", "PGL", "DRG", "LNC", "NIN", "ROG", "SAM", "RPR", "VPR",
			// Physical Ranged DPS
			"BRD", "ARC", "MCH", "DNC",
			// Caster DPS
			"BLM", "THM", "SMN", "ACN", "RDM", "PCT", "BLU"]
	);

    checkAndInitializeSetting(settings, "rolepartyorder", {});

    checkAndInitializeSetting(
        settings.rolepartyorder,
        "tank",
        settings.partyorder,
    );
    checkAndInitializeSetting(
        settings.rolepartyorder,
        "healer",
        settings.partyorder,
    );
    checkAndInitializeSetting(
        settings.rolepartyorder,
        "dps",
        settings.partyorder,
    );
    checkAndInitializeSetting(
        settings.rolepartyorder,
        "other",
        settings.partyorder,
    );

    checkAndInsertMissingJobs(settings.partyorder);
    checkAndInsertMissingJobs(settings.rolepartyorder.tank);
    checkAndInsertMissingJobs(settings.rolepartyorder.healer);
    checkAndInsertMissingJobs(settings.rolepartyorder.dps);
    checkAndInsertMissingJobs(settings.rolepartyorder.other);

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
    checkAndInitializeSetting(settings.healthbar, "textformat", "");
    checkAndInitializeSetting(settings.healthbar, "scale", 1);
    checkAndInitializeSetting(settings.healthbar, "rotation", 0);
    checkAndInitializeSetting(settings.healthbar, "x", 30);
    checkAndInitializeSetting(settings.healthbar, "y", 216);
    checkAndInitializeSetting(settings.healthbar, "align", "left");
    checkAndInitializeSetting(settings.healthbar, "font", "Arial");
    checkAndInitializeSetting(settings.healthbar, "fontxoffset", 0);
    checkAndInitializeSetting(settings.healthbar, "fontyoffset", 0);
    checkAndInitializeSetting(settings.healthbar, "staticfontsize", false);
    checkAndInitializeSetting(settings.healthbar, "fontsize", 10);

    // MANABAR SETTINGS
    checkAndInitializeSetting(settings, "manabar", {});
    checkAndInitializeSetting(settings.manabar, "enabled", true);
    checkAndInitializeSetting(settings.manabar, "hideoutofcombat", false);
    checkAndInitializeSetting(settings.manabar, "textenabled", true);
    checkAndInitializeSetting(settings.manabar, "color", "--filter-light-pink");
    checkAndInitializeSetting(settings.manabar, "textformat", "");
    checkAndInitializeSetting(settings.manabar, "scale", 1);
    checkAndInitializeSetting(settings.manabar, "rotation", 0);
    checkAndInitializeSetting(settings.manabar, "x", 30);
    checkAndInitializeSetting(settings.manabar, "y", 232);
    checkAndInitializeSetting(settings.manabar, "align", "left");
    checkAndInitializeSetting(settings.manabar, "font", "Arial");
    checkAndInitializeSetting(settings.manabar, "fontxoffset", 0);
    checkAndInitializeSetting(settings.manabar, "fontyoffset", 0);
    checkAndInitializeSetting(settings.manabar, "staticfontsize", false);
    checkAndInitializeSetting(settings.manabar, "fontsize", 10);

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
    checkAndInitializeSetting(settings.mpticker, "alwaystick", false);

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
        "SGE",
        "MNK",
        "WHM",
    ]);

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
    checkAndInitializeSetting(settings.timerbar, "fontxoffset", 0);
    checkAndInitializeSetting(settings.timerbar, "fontyoffset", 0);
    checkAndInitializeSetting(settings.timerbar, "staticfontsize", false);
    checkAndInitializeSetting(settings.timerbar, "fontsize", 10);

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
    checkAndInitializeSetting(settings.dottimerbar, "fontxoffset", 0);
    checkAndInitializeSetting(settings.dottimerbar, "fontyoffset", 0);
    checkAndInitializeSetting(settings.dottimerbar, "staticfontsize", false);
    checkAndInitializeSetting(settings.dottimerbar, "fontsize", 10);

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
    checkAndInitializeSetting(settings.bufftimerbar, "fontxoffset", 0);
    checkAndInitializeSetting(settings.bufftimerbar, "fontyoffset", 0);
    checkAndInitializeSetting(settings.bufftimerbar, "staticfontsize", false);
    checkAndInitializeSetting(settings.bufftimerbar, "fontsize", 10);

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
    checkAndInitializeSetting(settings.raidbuffs, "fontxoffset", 0);
    checkAndInitializeSetting(settings.raidbuffs, "fontyoffset", 0);
    checkAndInitializeSetting(settings.raidbuffs, "staticfontsize", false);
    checkAndInitializeSetting(settings.raidbuffs, "fontsize", 24);
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
    checkAndInitializeSetting(settings.mitigation, "fontxoffset", 0);
    checkAndInitializeSetting(settings.mitigation, "fontyoffset", 0);
    checkAndInitializeSetting(settings.mitigation, "staticfontsize", false);
    checkAndInitializeSetting(settings.mitigation, "fontsize", 24);
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
    checkAndInitializeSetting(settings.party, "fontxoffset", 0);
    checkAndInitializeSetting(settings.party, "fontyoffset", 0);
    checkAndInitializeSetting(settings.party, "staticfontsize", false);
    checkAndInitializeSetting(settings.party, "fontsize", 24);
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
    checkAndInitializeSetting(settings.customcd, "fontxoffset", 0);
    checkAndInitializeSetting(settings.customcd, "fontyoffset", 0);
    checkAndInitializeSetting(settings.customcd, "staticfontsize", false);
    checkAndInitializeSetting(settings.customcd, "fontsize", 24);
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

    return settings;
}

function checkAndInsertMissingJobs(settingsObject) {
    // Check for missing jobs
    if (!settingsObject.includes("SGE")) {
        // Add missing SGE job
        settingsObject.splice(settingsObject.indexOf("AST") + 1, 0, "SGE");
    }

    if (!settingsObject.includes("RPR")) {
        // Add missing RPR job
        settingsObject.splice(settingsObject.indexOf("SAM") + 1, 0, "RPR");
    }

    if (!settingsObject.includes("PCT")) {
        // Add missing RPR job
        settingsObject.splice(settingsObject.indexOf("RDM") + 1, 0, "PCT");
    }

    if (!settingsObject.includes("VPR")) {
        // Add missing RPR job
        settingsObject.splice(settingsObject.indexOf("RPR") + 1, 0, "VPR");
    }

}
