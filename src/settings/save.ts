import type { ProfileSettings } from "../shared/settings";
import { formValue } from "../shared/dom";
import { translation } from "./state";
import { state } from "./state";
import { saveProfile } from "./profiles";
import { commitLiveSettings } from "./live";
import { saveCurrentPartyRoleOrder } from "./party";
import { settingsArePopulating, waitForSettingsPopulation } from "./load";
import { readTargetBarControls } from "./target-bars";
import {
    hasPendingSettings,
    setSettingsSaving,
    reportSettingsSaveFailure,
} from "./dirty";
import { readGameLanguageControl } from "./language";
import { readBarAttachments } from "./bar-attachments";
import { readSpeechControls } from "./speech";
import {
    normalizeSettings,
    checkAndInitializeDefaultSettingsObject,
} from "../shared/defaults";

export function setOption<K extends keyof ProfileSettings>(
    option: K,
    value: ProfileSettings[K],
) {
    if (state.currentSettings.profiles.currentprofile) {
        const profile =
            state.currentSettings.profiles.profiles[
                state.currentSettings.profiles.currentprofile
            ];
        if (
            profile &&
            Object.prototype.hasOwnProperty.call(
                state.currentSettings.profiles.profiles,
                state.currentSettings.profiles.currentprofile,
            )
        )
            profile[option] = value;
    }
    const settings: ProfileSettings = state.currentSettings;
    settings[option] = value;
}

export function saveAllSettings() {
    if (settingsArePopulating()) return;
    saveCurrentPartyRoleOrder();

    let settings = {
        ...state.currentSettings,
        ...readTargetBarControls(state.currentSettings),
        profiles: normalizeSettings(
            state.currentSettings,
            state.currentSettings.language,
        ).profiles,
        skin: formValue("#skinSelect"),
        language: formValue("#langSelect"),
        gamelanguage: readGameLanguageControl(),
        font: formValue("#defaultFont"),
        customfonts: state.currentSettings.customfonts,
        includealliance: $("#includeAlliance").is(":checked"),
        partyorder: sortable("#partyOrder", "serialize")[0].items,
        rolepartyorder: state.currentSettings.rolepartyorder,
        override: state.currentSettings.override,
        debug: {
            ...state.currentSettings.debug,
            enabled: $("#debugEnabled").is(":checked"),
        },
        general: {
            ...state.currentSettings.general,
            ...readSpeechControls(),
            ttsearly: formValue("#ttsEarly"),
            preventdoubletts: $("#preventDoubleTTS").is(":checked"),
            usehdicons: $("#useHDIcons").is(":checked"),
            customcss: formValue("#customcss"),
        },
        healthbar: {
            ...state.currentSettings.healthbar,
            enabled: $("#healthBarEnabled").is(":checked"),
            hideoutofcombat: $("#healthHideOutOfCombat").is(":checked"),
            textenabled: $("#healthTextEnabled").is(":checked"),
            textformat: formValue("#healthFormat"),
            color: formValue("#healthColor"),
            scale: formValue("#healthScale"),
            rotation: formValue("#healthRotation"),
            x: parseInt(formValue("#healthX")),
            y: parseInt(formValue("#healthY")),
            align: formValue("#healthAlign"),
            font: formValue("#healthFont"),
            fontxoffset: parseInt(formValue("#healthFontXOffset")),
            fontyoffset: parseInt(formValue("#healthFontYOffset")),
            staticfontsize: $("#healthStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt(formValue("#healthFontSize")),
        },
        manabar: {
            ...state.currentSettings.manabar,
            BLM: state.currentSettings.manabar.BLM,
            DRK: state.currentSettings.manabar.DRK,
            PLD: state.currentSettings.manabar.PLD,
            enabled: $("#manaBarEnabled").is(":checked"),
            hideoutofcombat: $("#manaHideOutOfCombat").is(":checked"),
            textenabled: $("#manaTextEnabled").is(":checked"),
            jobthresholdsenabled: $("#manaJobThresholdsEnabled").is(":checked"),
            textformat: formValue("#manaFormat"),
            color: formValue("#manaColor"),
            lowcolor: formValue("#manaLowColor"),
            medcolor: formValue("#manaMedColor"),
            scale: formValue("#manaScale"),
            rotation: formValue("#manaRotation"),
            x: parseInt(formValue("#manaX")),
            y: parseInt(formValue("#manaY")),
            align: formValue("#manaAlign"),
            font: formValue("#manaFont"),
            fontxoffset: parseInt(formValue("#manaFontXOffset")),
            fontyoffset: parseInt(formValue("#manaFontYOffset")),
            staticfontsize: $("#manaStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt(formValue("#manaFontSize")),
        },
        mpticker: {
            ...state.currentSettings.mpticker,
            enabled: $("#mptickerEnabled").is(":checked"),
            hideoutofcombat: $("#mptickerHideOutOfCombat").is(":checked"),
            color: formValue("#mptickerColor"),
            scale: formValue("#mptickerScale"),
            rotation: formValue("#mptickerRotation"),
            x: parseInt(formValue("#mptickerX")),
            y: parseInt(formValue("#mptickerY")),
            specificjobsenabled: $("#mptickerSpecificJobsEnabled").is(
                ":checked",
            ),
            specificjobs: state.currentSettings.mpticker.specificjobs,
            alwaystick: $("#mptickerAlwaysTick").is(":checked"),
        },
        dotticker: {
            ...state.currentSettings.dotticker,
            enabled: $("#dottickerEnabled").is(":checked"),
            hideoutofcombat: $("#dottickerHideOutOfCombat").is(":checked"),
            color: formValue("#dottickerColor"),
            scale: formValue("#dottickerScale"),
            rotation: formValue("#dottickerRotation"),
            x: parseInt(formValue("#dottickerX")),
            y: parseInt(formValue("#dottickerY")),
            specificjobsenabled: $("#dottickerSpecificJobsEnabled").is(
                ":checked",
            ),
            specificjobs: state.currentSettings.dotticker.specificjobs,
        },
        hotticker: {
            ...state.currentSettings.hotticker,
            enabled: $("#hottickerEnabled").is(":checked"),
            hideoutofcombat: $("#hottickerHideOutOfCombat").is(":checked"),
            color: formValue("#hottickerColor"),
            scale: formValue("#hottickerScale"),
            rotation: formValue("#hottickerRotation"),
            x: parseInt(formValue("#hottickerX")),
            y: parseInt(formValue("#hottickerY")),
            specificjobsenabled: $("#hottickerSpecificJobsEnabled").is(
                ":checked",
            ),
            specificjobs: state.currentSettings.hotticker.specificjobs,
        },
        timerbar: {
            ...state.currentSettings.timerbar,
            enabled: $("#pulltimerBarEnabled").is(":checked"),
            textenabled: $("#pulltimerTextEnabled").is(":checked"),
            color: formValue("#pulltimerColor"),
            scale: formValue("#pulltimerScale"),
            rotation: formValue("#pulltimerRotation"),
            x: parseInt(formValue("#pulltimerX")),
            y: parseInt(formValue("#pulltimerY")),
            font: formValue("#pulltimerFont"),
            fontxoffset: parseInt(formValue("#pulltimerFontXOffset")),
            fontyoffset: parseInt(formValue("#pulltimerFontYOffset")),
            staticfontsize: $("#pulltimerStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt(formValue("#pulltimerFontSize")),
        },
        dottimerbar: {
            ...state.currentSettings.dottimerbar,
            enabled: $("#dotBarEnabled").is(":checked"),
            hideoutofcombat: $("#dotHideOutOfCombat").is(":checked"),
            hidewhendroppedoff: $("#dotHideWhenDroppedOff").is(":checked"),
            textenabled: $("#dotTextEnabled").is(":checked"),
            ttsenabled: $("#dotTTSEnabled").is(":checked"),
            imageenabled: $("#dotImageEnabled").is(":checked"),
            multidotenabled: $("#multiDotEnabled").is(":checked"),
            growdirection: formValue("#dotGrowDirection"),
            padding: formValue("#dotPadding"),
            scale: formValue("#dotScale"),
            rotation: formValue("#dotRotation"),
            x: parseInt(formValue("#dotX")),
            y: parseInt(formValue("#dotY")),
            font: formValue("#dotFont"),
            fontxoffset: parseInt(formValue("#dotFontXOffset")),
            fontyoffset: parseInt(formValue("#dotFontYOffset")),
            staticfontsize: $("#dotStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt(formValue("#dotFontSize")),
        },
        bufftimerbar: {
            ...state.currentSettings.bufftimerbar,
            enabled: $("#buffBarEnabled").is(":checked"),
            hideoutofcombat: $("#buffHideOutOfCombat").is(":checked"),
            hidewhendroppedoff: $("#buffHideWhenDroppedOff").is(":checked"),
            textenabled: $("#buffTextEnabled").is(":checked"),
            ttsenabled: $("#buffTTSEnabled").is(":checked"),
            imageenabled: $("#buffImageEnabled").is(":checked"),
            growdirection: formValue("#buffGrowDirection"),
            padding: formValue("#buffPadding"),
            scale: formValue("#buffScale"),
            rotation: formValue("#buffRotation"),
            x: parseInt(formValue("#buffX")),
            y: parseInt(formValue("#buffY")),
            font: formValue("#buffFont"),
            fontxoffset: parseInt(formValue("#buffFontXOffset")),
            fontyoffset: parseInt(formValue("#buffFontYOffset")),
            staticfontsize: $("#buffStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt(formValue("#buffFontSize")),
        },
        stacksbar: {
            ...state.currentSettings.stacksbar,
            enabled: $("#stacksBarEnabled").is(":checked"),
            hideoutofcombat: $("#stacksHideOutOfCombat").is(":checked"),
            color: formValue("#stacksColor"),
            scale: formValue("#stacksScale"),
            x: parseInt(formValue("#stacksX")),
            y: parseInt(formValue("#stacksY")),
        },
        raidbuffs: {
            ...state.currentSettings.raidbuffs,
            enabled: $("#raidbuffBarEnabled").is(":checked"),
            ttsenabled: $("#raidbuffTTSEnabled").is(":checked"),
            hideoutofcombat: $("#raidbuffHideOutOfCombat").is(":checked"),
            hidewhensolo: $("#raidbuffHideWhenSolo").is(":checked"),
            orderbypartymember: $("#raidbuffOrderByPartyMember").is(":checked"),
            alwaysshow: $("#raidbuffAlwaysShow").is(":checked"),
            growleft: $("#raidbuffGrowLeft").is(":checked"),
            columns: formValue("#raidbuffColumns"),
            padding: formValue("#raidbuffPadding"),
            scale: formValue("#raidbuffScale"),
            x: parseInt(formValue("#raidbuffX")),
            y: parseInt(formValue("#raidbuffY")),
            font: formValue("#raidbuffFont"),
            fontxoffset: parseInt(formValue("#raidbuffFontXOffset")),
            fontyoffset: parseInt(formValue("#raidbuffFontYOffset")),
            staticfontsize: $("#raidbuffStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt(formValue("#raidbuffFontSize")),
            durationoutline: $("#raidbuffDurationOutline").is(":checked"),
            durationbold: $("#raidbuffDurationBold").is(":checked"),
            cooldownoutline: $("#raidbuffCooldownOutline").is(":checked"),
            cooldownbold: $("#raidbuffCooldownBold").is(":checked"),
            durationcolor: formValue("#raidbuffDurationColorPicker"),
            cooldowncolor: formValue("#raidbuffCooldownColorPicker"),
            durationoutlinecolor: formValue(
                "#raidbuffDurationOutlineColorPicker",
            ),
            cooldownoutlinecolor: formValue(
                "#raidbuffCooldownOutlineColorPicker",
            ),
        },
        mitigation: {
            ...state.currentSettings.mitigation,
            enabled: $("#mitigationBarEnabled").is(":checked"),
            ttsenabled: $("#mitigationTTSEnabled").is(":checked"),
            hideoutofcombat: $("#mitigationHideOutOfCombat").is(":checked"),
            hidewhensolo: $("#mitigationHideWhenSolo").is(":checked"),
            alwaysshow: $("#mitigationAlwaysShow").is(":checked"),
            growleft: $("#mitigationGrowLeft").is(":checked"),
            columns: formValue("#mitigationColumns"),
            padding: formValue("#mitigationPadding"),
            scale: formValue("#mitigationScale"),
            x: parseInt(formValue("#mitigationX")),
            y: parseInt(formValue("#mitigationY")),
            font: formValue("#mitigationFont"),
            fontxoffset: parseInt(formValue("#mitigationFontXOffset")),
            fontyoffset: parseInt(formValue("#mitigationFontYOffset")),
            staticfontsize: $("#mitigationStaticFontSizeEnabled").is(
                ":checked",
            ),
            fontsize: parseInt(formValue("#mitigationFontSize")),
            durationoutline: $("#mitigationDurationOutline").is(":checked"),
            durationbold: $("#mitigationDurationBold").is(":checked"),
            cooldownoutline: $("#mitigationCooldownOutline").is(":checked"),
            cooldownbold: $("#mitigationCooldownBold").is(":checked"),
            durationcolor: formValue("#mitigationDurationColorPicker"),
            cooldowncolor: formValue("#mitigationCooldownColorPicker"),
            durationoutlinecolor: formValue(
                "#mitigationDurationOutlineColorPicker",
            ),
            cooldownoutlinecolor: formValue(
                "#mitigationCooldownOutlineColorPicker",
            ),
        },
        party: {
            ...state.currentSettings.party,
            enabled: $("#partyBarEnabled").is(":checked"),
            ttsenabled: $("#partyTTSEnabled").is(":checked"),
            hideoutofcombat: $("#partyHideOutOfCombat").is(":checked"),
            hidewhensolo: $("#partyHideWhenSolo").is(":checked"),
            alwaysshow: $("#partyAlwaysShow").is(":checked"),
            growleft: $("#partyGrowLeft").is(":checked"),
            padding: formValue("#partyPadding"),
            scale: formValue("#partyScale"),
            x: parseInt(formValue("#partyX")),
            y: parseInt(formValue("#partyY")),
            font: formValue("#partyFont"),
            fontxoffset: parseInt(formValue("#partyFontXOffset")),
            fontyoffset: parseInt(formValue("#partyFontYOffset")),
            staticfontsize: $("#partyStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt(formValue("#partyFontSize")),
            durationoutline: $("#partyDurationOutline").is(":checked"),
            durationbold: $("#partyDurationBold").is(":checked"),
            cooldownoutline: $("#partyCooldownOutline").is(":checked"),
            cooldownbold: $("#partyCooldownBold").is(":checked"),
            durationcolor: formValue("#partyDurationColorPicker"),
            cooldowncolor: formValue("#partyCooldownColorPicker"),
            durationoutlinecolor: formValue("#partyDurationOutlineColorPicker"),
            cooldownoutlinecolor: formValue("#partyCooldownOutlineColorPicker"),
        },
        customcd: {
            ...state.currentSettings.customcd,
            abilities: state.currentSettings.customcd.abilities,
            enabled: $("#customcdEnabled").is(":checked"),
            ttsenabled: $("#customcdTTSEnabled").is(":checked"),
            hideoutofcombat: $("#customcdHideOutOfCombat").is(":checked"),
            hidewhensolo: $("#customcdHideWhenSolo").is(":checked"),
            alwaysshow: $("#customcdAlwaysShow").is(":checked"),
            growleft: $("#customcdGrowLeft").is(":checked"),
            padding: formValue("#customcdPadding"),
            scale: formValue("#customcdScale"),
            columns: formValue("#customcdColumns"),
            x: parseInt(formValue("#customcdX")),
            y: parseInt(formValue("#customcdY")),
            font: formValue("#customcdFont"),
            fontxoffset: parseInt(formValue("#customcdFontXOffset")),
            fontyoffset: parseInt(formValue("#customcdFontYOffset")),
            staticfontsize: $("#customcdStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt(formValue("#customcdFontSize")),
            durationoutline: $("#customcdDurationOutline").is(":checked"),
            durationbold: $("#customcdDurationBold").is(":checked"),
            cooldownoutline: $("#customcdCooldownOutline").is(":checked"),
            cooldownbold: $("#customcdCooldownBold").is(":checked"),
            durationcolor: formValue("#customcdDurationColorPicker"),
            cooldowncolor: formValue("#customcdCooldownColorPicker"),
            durationoutlinecolor: formValue(
                "#customcdDurationOutlineColorPicker",
            ),
            cooldownoutlinecolor: formValue(
                "#customcdCooldownOutlineColorPicker",
            ),
        },
    };

    state.currentSettings = normalizeSettings(
        settings,
        state.currentSettings.language,
    );
    readBarAttachments(state.currentSettings);
}

export async function saveSettingsAndProfile(
    closeWindow = true,
    showPopup = false,
    dontUseForms = false,
) {
    await waitForSettingsPopulation();
    if (state.currentSettings.profiles.currentprofile) {
        return saveProfile(true, closeWindow, showPopup, false, dontUseForms);
    } else {
        return saveSettings(closeWindow, showPopup, false, dontUseForms);
    }
}

export async function saveSettings(
    closeWindow = true,
    showPopup = false,
    dontReload = false,
    dontUseForms = false,
) {
    await waitForSettingsPopulation();
    if (!dontUseForms) saveAllSettings();

    let settings = normalizeSettings(
        state.currentSettings,
        state.currentSettings.language,
    );

    setSettingsSaving(true);
    try {
        await state.callCurrentOverlayHandler({
            call: "saveData",
            key: "zeffUI",
            data: settings,
        });
        localStorage.setItem("settings", JSON.stringify(settings));
        await commitLiveSettings(settings, !dontUseForms);
    } catch (error) {
        reportSettingsSaveFailure();
        console.error("Settings could not be saved.", error);
        return;
    } finally {
        setSettingsSaving(false);
    }
    if (hasPendingSettings()) return;
    if (closeWindow) {
        if (showPopup) {
            if (!confirm(translation("saveandclosewindow"))) {
                return;
            }
        }
        window.close();
    } else {
        if (
            !dontReload &&
            !new URLSearchParams(location.search).has("settingsSession")
        )
            location.reload();
    }
}

export async function deleteSettings() {
    await waitForSettingsPopulation();
    if (confirm(translation("deleteallsettings"))) {
        let lang = state.currentSettings.language;
        let profiles = normalizeSettings(state.currentSettings, lang).profiles;
        let newSettings = await checkAndInitializeDefaultSettingsObject(
            {},
            lang,
        );
        let includeProfiles = $("#includeProfiles").prop("checked");
        state.currentSettings = newSettings;

        if (!includeProfiles) {
            state.currentSettings.profiles = profiles;
        }

        saveSettingsAndProfile(true, true, true);
    }
}
