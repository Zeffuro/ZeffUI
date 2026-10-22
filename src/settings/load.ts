import type { Settings } from "../shared/settings";
import { checkAndInitializeDefaultSettingsObject } from "../shared/defaults";
import { state } from "./state";
import { createProfileSelects, createJobProfileSelect } from "./profiles";
import { setPartyOrder, createSpecificJobs } from "./party";
import {
    setExampleColor,
    createColorSelects,
    createSkinSelects,
    createFontSelects,
    processLanguage,
    loadLanguageData,
} from "./appearance";
import { createOverrideSelects } from "./overrides";
import { switchCustomcdMode } from "./custom-cooldowns";
import { populateLanguageControls } from "./language";
import { populateBarAttachments } from "./bar-attachments";
import { initializeColorPickers } from "./color-picker";
import { populateSpeechControls } from "./speech";
import {
    initializeTargetBarControls,
    populateTargetBarControls,
} from "./target-bars";

export async function loadSettings(): Promise<void> {
    loadingStatus("Loading saved settings…");
    const response = await state.callCurrentOverlayHandler({
        call: "loadData",
        key: "zeffUI",
    });
    loadingStatus("Loading overlay language…");
    let settings = await checkAndInitializeDefaultSettingsObject(
        response?.data,
        null,
        state.callCurrentOverlayHandler,
    );
    const profiles = settings.profiles;
    const selected = Object.prototype.hasOwnProperty.call(
        profiles.profiles,
        profiles.currentprofile,
    )
        ? profiles.profiles[profiles.currentprofile]
        : undefined;
    if (selected) settings = { ...selected, profiles };
    loadingStatus("Loading settings controls…");
    await populateSettings(settings);
}

function loadingStatus(text: string) {
    const label = document.getElementById("settings-status");
    if (label) label.textContent = text;
}

let population: Promise<void> = Promise.resolve();
let pendingPopulations = 0;

export function settingsArePopulating() {
    return pendingPopulations > 0;
}

export async function waitForSettingsPopulation(): Promise<void> {
    let current: Promise<void>;
    do {
        current = population;
        await current;
    } while (current !== population);
}

export function populateSettings(settings: Settings): Promise<void> {
    pendingPopulations++;
    population = population
        .catch(() => {})
        .then(() => populateSettingsForm(settings))
        .finally(() => {
            pendingPopulations--;
        });
    return population;
}

async function populateSettingsForm(settings: Settings): Promise<void> {
    state.currentSettings = settings;
    initializeTargetBarControls(settings);

    state.currentFont.default = settings.font;
    state.currentFont.health = settings.healthbar.font;
    state.currentFont.mana = settings.manabar.font;
    state.currentFont.pulltimer = settings.timerbar.font;
    state.currentFont.buff = settings.bufftimerbar.font;
    state.currentFont.dot = settings.dottimerbar.font;
    state.currentFont.raidbuff = settings.raidbuffs.font;
    state.currentFont.mitigation = settings.mitigation.font;
    state.currentFont.party = settings.party.font;
    state.currentFont.customcd = settings.customcd.font;

    $("#skin").remove();
    await loadLanguageData(settings.language);
    processLanguage();
    createProfileSelects();
    createJobProfileSelect();
    createColorSelects();
    createSkinSelects(settings.skin);
    await createFontSelects();
    populateTargetBarControls(settings);
    $("#overrideSelect").empty();
    createOverrideSelects();

    $("#skinSelect").val(settings.skin);
    populateLanguageControls(settings);

    $("#debugEnabled").prop("checked", settings.debug.enabled);

    populateSpeechControls(settings);
    $("#useHDIcons").prop("checked", settings.general.usehdicons);
    $("#ttsEarly").val(settings.general.ttsearly);
    $("#preventDoubleTTS").prop("checked", settings.general.preventdoubletts);

    $("#customcss").val(settings.general.customcss);

    $("#includeAlliance").prop("checked", settings.includealliance);
    $("#partyOrder").empty();
    $("#partyRole").val("tank");
    state.currentPartyRole = "tank";
    setPartyOrder(settings.rolepartyorder.tank);

    $("#healthBarEnabled").prop("checked", settings.healthbar.enabled);
    $("#healthHideOutOfCombat").prop(
        "checked",
        settings.healthbar.hideoutofcombat,
    );
    $("#healthTextEnabled").prop("checked", settings.healthbar.textenabled);
    $("#healthFormat").val(settings.healthbar.textformat);
    $("#healthColor").val(settings.healthbar.color);
    setExampleColor($("#healthColor"));
    $("#healthScale").val(settings.healthbar.scale);
    $("#healthRotationRange").val(settings.healthbar.rotation);
    $("#healthRotation").val(settings.healthbar.rotation);
    $("#healthX").val(settings.healthbar.x);
    $("#healthY").val(settings.healthbar.y);
    $("#healthAlign").val(settings.healthbar.align);

    $("#healthFontXOffset").val(settings.healthbar.fontxoffset);
    $("#healthFontYOffset").val(settings.healthbar.fontyoffset);
    $("#healthStaticFontSizeEnabled").prop(
        "checked",
        settings.healthbar.staticfontsize,
    );
    $("#healthFontSize").val(settings.healthbar.fontsize);

    $("#manaBarEnabled").prop("checked", settings.manabar.enabled);
    $("#manaHideOutOfCombat").prop("checked", settings.manabar.hideoutofcombat);
    $("#manaTextEnabled").prop("checked", settings.manabar.textenabled);
    $("#manaJobThresholdsEnabled").prop(
        "checked",
        settings.manabar.jobthresholdsenabled,
    );
    $("#manaFormat").val(settings.manabar.textformat);
    $("#manaColor").val(settings.manabar.color);
    $("#manaLowColor").val(settings.manabar.lowcolor);
    $("#manaMedColor").val(settings.manabar.medcolor);
    setExampleColor($("#manaColor"));
    $("#manaScale").val(settings.manabar.scale);
    $("#manaRotationRange").val(settings.manabar.rotation);
    $("#manaRotation").val(settings.manabar.rotation);
    $("#manaX").val(settings.manabar.x);
    $("#manaY").val(settings.manabar.y);
    $("#manaAlign").val(settings.manabar.align);

    $("#manaFontXOffset").val(settings.manabar.fontxoffset);
    $("#manaFontYOffset").val(settings.manabar.fontyoffset);
    $("#manaStaticFontSizeEnabled").prop(
        "checked",
        settings.manabar.staticfontsize,
    );
    $("#manaFontSize").val(settings.manabar.fontsize);

    $("#mptickerEnabled").prop("checked", settings.mpticker.enabled);
    $("#mptickerHideOutOfCombat").prop(
        "checked",
        settings.mpticker.hideoutofcombat,
    );
    $("#mptickerColor").val(settings.mpticker.color);
    setExampleColor($("#mptickerColor"));
    $("#mptickerScale").val(settings.mpticker.scale);
    $("#mptickerRotationRange").val(settings.mpticker.rotation);
    $("#mptickerRotation").val(settings.mpticker.rotation);
    $("#mptickerX").val(settings.mpticker.x);
    $("#mptickerY").val(settings.mpticker.y);
    $("#mptickerSpecificJobsEnabled").prop(
        "checked",
        settings.mpticker.specificjobsenabled,
    );
    $("#mptickerAlwaysTick").prop("checked", settings.mpticker.alwaystick);
    $("#mptickerSpecificJobs").empty();
    createSpecificJobs("#mptickerSpecificJobs", settings.mpticker.specificjobs);

    $("#dottickerEnabled").prop("checked", settings.dotticker.enabled);
    $("#dottickerHideOutOfCombat").prop(
        "checked",
        settings.dotticker.hideoutofcombat,
    );
    $("#dottickerColor").val(settings.dotticker.color);
    setExampleColor($("#dottickerColor"));
    $("#dottickerScale").val(settings.dotticker.scale);
    $("#dottickerRotationRange").val(settings.dotticker.rotation);
    $("#dottickerRotation").val(settings.dotticker.rotation);
    $("#dottickerX").val(settings.dotticker.x);
    $("#dottickerY").val(settings.dotticker.y);
    $("#dottickerSpecificJobsEnabled").prop(
        "checked",
        settings.dotticker.specificjobsenabled,
    );
    $("#dottickerSpecificJobs").empty();
    createSpecificJobs(
        "#dottickerSpecificJobs",
        settings.dotticker.specificjobs,
    );

    $("#hottickerEnabled").prop("checked", settings.hotticker.enabled);
    $("#hottickerHideOutOfCombat").prop(
        "checked",
        settings.hotticker.hideoutofcombat,
    );
    $("#hottickerColor").val(settings.hotticker.color);
    setExampleColor($("#hottickerColor"));
    $("#hottickerScale").val(settings.hotticker.scale);
    $("#hottickerRotationRange").val(settings.hotticker.rotation);
    $("#hottickerRotation").val(settings.hotticker.rotation);
    $("#hottickerX").val(settings.hotticker.x);
    $("#hottickerY").val(settings.hotticker.y);
    $("#hottickerSpecificJobsEnabled").prop(
        "checked",
        settings.hotticker.specificjobsenabled,
    );
    $("#hottickerSpecificJobs").empty();
    createSpecificJobs(
        "#hottickerSpecificJobs",
        settings.hotticker.specificjobs,
    );

    $("#pulltimerBarEnabled").prop("checked", settings.timerbar.enabled);
    $("#pulltimerTextEnabled").prop("checked", settings.timerbar.textenabled);
    $("#pulltimerColor").val(settings.timerbar.color);
    setExampleColor($("#pulltimerColor"));
    $("#pulltimerScale").val(settings.timerbar.scale);
    $("#pulltimerRotationRange").val(settings.timerbar.rotation);
    $("#pulltimerRotation").val(settings.timerbar.rotation);
    $("#pulltimerX").val(settings.timerbar.x);
    $("#pulltimerY").val(settings.timerbar.y);

    $("#pulltimerFontXOffset").val(settings.timerbar.fontxoffset);
    $("#pulltimerFontYOffset").val(settings.timerbar.fontyoffset);
    $("#pulltimerStaticFontSizeEnabled").prop(
        "checked",
        settings.timerbar.staticfontsize,
    );
    $("#pulltimerFontSize").val(settings.timerbar.fontsize);

    $("#dotBarEnabled").prop("checked", settings.dottimerbar.enabled);
    $("#dotHideOutOfCombat").prop(
        "checked",
        settings.dottimerbar.hideoutofcombat,
    );
    $("#dotHideWhenDroppedOff").prop(
        "checked",
        settings.dottimerbar.hidewhendroppedoff,
    );
    $("#dotTextEnabled").prop("checked", settings.dottimerbar.textenabled);
    $("#dotTTSEnabled").prop("checked", settings.dottimerbar.ttsenabled);
    $("#multiDotEnabled").prop("checked", settings.dottimerbar.multidotenabled);
    $("#dotImageEnabled").prop("checked", settings.dottimerbar.imageenabled);
    $("#dotGrowDirection").val(settings.dottimerbar.growdirection);
    $("#dotPadding").val(settings.dottimerbar.padding);
    $("#dotScale").val(settings.dottimerbar.scale);
    $("#dotRotationRange").val(settings.dottimerbar.rotation);
    $("#dotRotation").val(settings.dottimerbar.rotation);
    $("#dotX").val(settings.dottimerbar.x);
    $("#dotY").val(settings.dottimerbar.y);

    $("#dotFontXOffset").val(settings.dottimerbar.fontxoffset);
    $("#dotFontYOffset").val(settings.dottimerbar.fontyoffset);
    $("#dotStaticFontSizeEnabled").prop(
        "checked",
        settings.dottimerbar.staticfontsize,
    );
    $("#dotFontSize").val(settings.dottimerbar.fontsize);

    $("#buffBarEnabled").prop("checked", settings.bufftimerbar.enabled);
    $("#buffHideOutOfCombat").prop(
        "checked",
        settings.bufftimerbar.hideoutofcombat,
    );
    $("#buffHideWhenDroppedOff").prop(
        "checked",
        settings.bufftimerbar.hidewhendroppedoff,
    );
    $("#buffTextEnabled").prop("checked", settings.bufftimerbar.textenabled);
    $("#buffTTSEnabled").prop("checked", settings.bufftimerbar.ttsenabled);
    $("#buffImageEnabled").prop("checked", settings.bufftimerbar.imageenabled);
    $("#buffGrowDirection").val(settings.bufftimerbar.growdirection);
    $("#buffPadding").val(settings.bufftimerbar.padding);
    $("#buffScale").val(settings.bufftimerbar.scale);
    $("#buffRotationRange").val(settings.bufftimerbar.rotation);
    $("#buffRotation").val(settings.bufftimerbar.rotation);
    $("#buffX").val(settings.bufftimerbar.x);
    $("#buffY").val(settings.bufftimerbar.y);

    $("#buffFontXOffset").val(settings.bufftimerbar.fontxoffset);
    $("#buffFontYOffset").val(settings.bufftimerbar.fontyoffset);
    $("#buffStaticFontSizeEnabled").prop(
        "checked",
        settings.bufftimerbar.staticfontsize,
    );
    $("#buffFontSize").val(settings.bufftimerbar.fontsize);

    $("#stacksBarEnabled").prop("checked", settings.stacksbar.enabled);
    $("#stacksHideOutOfCombat").prop(
        "checked",
        settings.stacksbar.hideoutofcombat,
    );
    $("#stacksColor").val(settings.stacksbar.color);
    setExampleColor($("#stacksColor"));
    $("#stacksScale").val(settings.stacksbar.scale);
    $("#stacksX").val(settings.stacksbar.x);
    $("#stacksY").val(settings.stacksbar.y);

    $("#raidbuffBarEnabled").prop("checked", settings.raidbuffs.enabled);
    $("#raidbuffTTSEnabled").prop("checked", settings.raidbuffs.ttsenabled);
    $("#raidbuffHideOutOfCombat").prop(
        "checked",
        settings.raidbuffs.hideoutofcombat,
    );
    $("#raidbuffHideWhenSolo").prop("checked", settings.raidbuffs.hidewhensolo);
    $("#raidbuffOrderByPartyMember").prop(
        "checked",
        settings.raidbuffs.orderbypartymember,
    );
    $("#raidbuffAlwaysShow").prop("checked", settings.raidbuffs.alwaysshow);
    $("#raidbuffGrowLeft").prop("checked", settings.raidbuffs.growleft);
    $("#raidbuffColumns").val(settings.raidbuffs.columns);
    $("#raidbuffPadding").val(settings.raidbuffs.padding);
    $("#raidbuffScale").val(settings.raidbuffs.scale);
    $("#raidbuffX").val(settings.raidbuffs.x);
    $("#raidbuffY").val(settings.raidbuffs.y);

    $("#raidbuffFontXOffset").val(settings.raidbuffs.fontxoffset);
    $("#raidbuffFontYOffset").val(settings.raidbuffs.fontyoffset);
    $("#raidbuffStaticFontSizeEnabled").prop(
        "checked",
        settings.raidbuffs.staticfontsize,
    );
    $("#raidbuffFontSize").val(settings.raidbuffs.fontsize);

    $("#raidbuffDurationOutline").prop(
        "checked",
        settings.raidbuffs.durationoutline,
    );
    $("#raidbuffDurationBold").prop("checked", settings.raidbuffs.durationbold);
    $("#raidbuffCooldownOutline").prop(
        "checked",
        settings.raidbuffs.cooldownoutline,
    );
    $("#raidbuffCooldownBold").prop("checked", settings.raidbuffs.cooldownbold);
    $("#raidbuffDurationColorPicker").val(settings.raidbuffs.durationcolor);
    $("#raidbuffCooldownColorPicker").val(settings.raidbuffs.cooldowncolor);
    $("#raidbuffDurationOutlineColorPicker").val(
        settings.raidbuffs.durationoutlinecolor,
    );
    $("#raidbuffCooldownOutlineColorPicker").val(
        settings.raidbuffs.cooldownoutlinecolor,
    );

    $("#mitigationBarEnabled").prop("checked", settings.mitigation.enabled);
    $("#mitigationTTSEnabled").prop("checked", settings.mitigation.ttsenabled);
    $("#mitigationHideOutOfCombat").prop(
        "checked",
        settings.mitigation.hideoutofcombat,
    );
    $("#mitigationHideWhenSolo").prop(
        "checked",
        settings.mitigation.hidewhensolo,
    );
    $("#mitigationAlwaysShow").prop("checked", settings.mitigation.alwaysshow);
    $("#mitigationGrowLeft").prop("checked", settings.mitigation.growleft);
    $("#mitigationColumns").val(settings.mitigation.columns);
    $("#mitigationPadding").val(settings.mitigation.padding);
    $("#mitigationScale").val(settings.mitigation.scale);
    $("#mitigationX").val(settings.mitigation.x);
    $("#mitigationY").val(settings.mitigation.y);

    $("#mitigationFontXOffset").val(settings.mitigation.fontxoffset);
    $("#mitigationFontYOffset").val(settings.mitigation.fontyoffset);
    $("#mitigationStaticFontSizeEnabled").prop(
        "checked",
        settings.mitigation.staticfontsize,
    );
    $("#mitigationFontSize").val(settings.mitigation.fontsize);

    $("#mitigationDurationOutline").prop(
        "checked",
        settings.mitigation.durationoutline,
    );
    $("#mitigationDurationBold").prop(
        "checked",
        settings.mitigation.durationbold,
    );
    $("#mitigationCooldownOutline").prop(
        "checked",
        settings.mitigation.cooldownoutline,
    );
    $("#mitigationCooldownBold").prop(
        "checked",
        settings.mitigation.cooldownbold,
    );
    $("#mitigationDurationColorPicker").val(settings.mitigation.durationcolor);
    $("#mitigationCooldownColorPicker").val(settings.mitigation.cooldowncolor);
    $("#mitigationDurationOutlineColorPicker").val(
        settings.mitigation.durationoutlinecolor,
    );
    $("#mitigationCooldownOutlineColorPicker").val(
        settings.mitigation.cooldownoutlinecolor,
    );

    $("#partyBarEnabled").prop("checked", settings.party.enabled);
    $("#partyTTSEnabled").prop("checked", settings.party.ttsenabled);
    $("#partyHideOutOfCombat").prop("checked", settings.party.hideoutofcombat);
    $("#partyHideWhenSolo").prop("checked", settings.party.hidewhensolo);
    $("#partyAlwaysShow").prop("checked", settings.party.alwaysshow);
    $("#partyGrowLeft").prop("checked", settings.party.growleft);
    $("#partyPadding").val(settings.party.padding);
    $("#partyScale").val(settings.party.scale);
    $("#partyX").val(settings.party.x);
    $("#partyY").val(settings.party.y);

    $("#partyFontXOffset").val(settings.party.fontxoffset);
    $("#partyFontYOffset").val(settings.party.fontyoffset);
    $("#partyStaticFontSizeEnabled").prop(
        "checked",
        settings.party.staticfontsize,
    );
    $("#partyFontSize").val(settings.party.fontsize);

    $("#partyDurationOutline").prop("checked", settings.party.durationoutline);
    $("#partyDurationBold").prop("checked", settings.party.durationbold);
    $("#partyCooldownOutline").prop("checked", settings.party.cooldownoutline);
    $("#partyCooldownBold").prop("checked", settings.party.cooldownbold);
    $("#partyDurationColorPicker").val(settings.party.durationcolor);
    $("#partyCooldownColorPicker").val(settings.party.cooldowncolor);
    $("#partyDurationOutlineColorPicker").val(
        settings.party.durationoutlinecolor,
    );
    $("#partyCooldownOutlineColorPicker").val(
        settings.party.cooldownoutlinecolor,
    );

    $("#customcdEnabled").prop("checked", settings.customcd.enabled);
    $("#customcdTTSEnabled").prop("checked", settings.customcd.ttsenabled);
    $("#customcdHideOutOfCombat").prop(
        "checked",
        settings.customcd.hideoutofcombat,
    );
    $("#customcdHideWhenSolo").prop("checked", settings.customcd.hidewhensolo);
    $("#customcdAlwaysShow").prop("checked", settings.customcd.alwaysshow);
    $("#customcdGrowLeft").prop("checked", settings.customcd.growleft);
    $("#customcdPadding").val(settings.customcd.padding);
    $("#customcdScale").val(settings.customcd.scale);
    $("#customcdColumns").val(settings.customcd.columns);
    $("#customcdX").val(settings.customcd.x);
    $("#customcdY").val(settings.customcd.y);

    $("#customcdFontXOffset").val(settings.customcd.fontxoffset);
    $("#customcdFontYOffset").val(settings.customcd.fontyoffset);
    $("#customcdStaticFontSizeEnabled").prop(
        "checked",
        settings.customcd.staticfontsize,
    );
    $("#customcdFontSize").val(settings.customcd.fontsize);

    $("#customcdDurationOutline").prop(
        "checked",
        settings.customcd.durationoutline,
    );
    $("#customcdDurationBold").prop("checked", settings.customcd.durationbold);
    $("#customcdCooldownOutline").prop(
        "checked",
        settings.customcd.cooldownoutline,
    );
    $("#customcdCooldownBold").prop("checked", settings.customcd.cooldownbold);
    $("#customcdDurationColorPicker").val(settings.customcd.durationcolor);
    $("#customcdCooldownColorPicker").val(settings.customcd.cooldowncolor);
    $("#customcdDurationOutlineColorPicker").val(
        settings.customcd.durationoutlinecolor,
    );
    $("#customcdCooldownOutlineColorPicker").val(
        settings.customcd.cooldownoutlinecolor,
    );
    switchCustomcdMode();

    initializeColorPickers();
    populateBarAttachments(settings);
}
