import { parseAbilitySearchResults } from "../shared/abilities";
import { normalizeAbilities } from "../shared/settings-input";
import { formNumber, formValue } from "../shared/dom";
import { translation } from "./state";
import { state } from "./state";
import { getAbilityIconUrl } from "../shared/icons";
import { gameLanguage } from "../shared/language";

export function searchCustomAbility() {
    let query = formValue("#customcdSearch");
    $("#customcdAbilitySelectDiv").hide();
    $("#customcdIconPreview").hide();
    toggleCustomCdOptions(false);
    $("#customcdIconPreviewDiv").append(
        '<div id="customcdLoading" class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>',
    );
    const locale = gameLanguage(state.currentSettings);
    let url = `https://www.fakegaming.eu/ffxiv/spellname/index.php?name=${query}&type=action&lang=${locale}`;
    if (locale === "cn")
        url = `https://act.diemoe.net/FFXIVSpellNamesXIVAPI/index.php?name=${query}&type=action&lang=${locale}`;
    $.getJSON(url, function (data: unknown) {
        state.foundAbilities = parseAbilitySearchResults(data);
        $("#customcdAbilitySelect").empty();
        $("#customcdLoading").remove();
        $("#customcdIconPreview").show();
        $("#customcdAbilitySelectDiv").show();
        toggleCustomCdOptions(state.foundAbilities.length !== 0);
        if (state.foundAbilities.length === 0) {
            $("#customcdAbilityNoAbilitiesDiv").show();
            return;
        }

        for (let ability of state.foundAbilities) {
            if (ability.IsPlayerAction) {
                let name =
                    ability[`Name_${gameLanguage(state.currentSettings)}`];
                if (ability.IsPvP) name = `[${translation("pvp")}] ${name}`;
                $("#customcdAbilitySelect").append(
                    `<option value="${ability.ID}">${name}</option>`,
                );
            }
        }

        loadCustomCdAbility();
    });
}

export function switchCustomcdMode() {
    switch (formValue("#customcdMode")) {
        case "0":
            $("#customcdSearchDiv").hide();
            $("#customcdSearchButtonDiv").hide();
            $("#customcdAbilitySelectDiv").show();
            loadCustomCdAbilitySelect();
            $("#customcdAddButtonDiv").hide();
            $("#customcdSaveButtonDiv").show();
            $("#customcdDeleteButtonDiv").show();
            break;
        case "1":
            $("#customcdIconPreview").attr("src", "");
            $("#customcdSearchDiv").show();
            $("#customcdSearchButtonDiv").show();
            $("#customcdAbilitySelectDiv").hide();
            $("#customcdAbilitySelect").empty();
            $("#customcdAbilityNoAbilitiesDiv").hide();
            $("#customcdAddButtonDiv").show();
            $("#customcdSaveButtonDiv").hide();
            $("#customcdDeleteButtonDiv").hide();
            toggleCustomCdOptions(false);
            break;
    }
}

export function loadCustomCdAbilitySelect() {
    $("#customcdAbilitySelect").empty();
    $("#customcdAbilityNoAbilitiesDiv").hide();
    toggleCustomCdOptions(true);
    if (state.currentSettings.customcd.abilities.length === 0) {
        $("#customcdAbilitySelectDiv").hide();
        $("#customcdAbilityNoAbilitiesDiv").show();
        toggleCustomCdOptions(false);
        return;
    }
    for (let ability of state.currentSettings.customcd.abilities) {
        let name = ability[`name_${gameLanguage(state.currentSettings)}`];
        $("#customcdAbilitySelect").append(
            `<option value="${ability.id}">${
                ability.job != null
                    ? translation(ability.job.toLowerCase())
                    : translation("setjob")
            }: ${name}</option>`,
        );
    }
    loadCustomCdAbility();
}

export function loadCustomCdAbility() {
    let id = formValue("#customcdAbilitySelect");
    toggleCustomCdOptions(true);
    switch (formValue("#customcdMode")) {
        case "0": {
            const ability = state.currentSettings.customcd.abilities.find(
                (x) => x.id == Number(id),
            );
            if (!ability) {
                toggleCustomCdOptions(false);
                return;
            }
            $("#customcdIconPreview").prop(
                "src",
                getAbilityIconUrl(ability.icon, state.currentSettings),
            );
            $("#customcdAbilityId").val(ability.id);
            $("#customcdAbilityEnabled").prop("checked", ability.enabled);
            $("#customcdAbilityTTSEnabled").prop("checked", ability.tts);
            $("#customcdAbilityTTSType").val(ability.ttstype);
            $("#customcdAbilityJob").val(ability.job);
            $("#customcdAbilityDuration").val(ability.duration ?? 0);
            $("#customcdAbilityCooldown").val(ability.cooldown ?? 0);
            if (ability.extra?.charges) {
                $("#customcdAbilityCharges").val(ability.extra.charges);
            } else {
                $("#customcdAbilityCharges").val(0);
            }
            $("#customcdAbilityOrder").val(ability.order);
            $("#customcdAbilityType").val(ability.type);
            break;
        }
        case "1": {
            const ability = state.foundAbilities.find(
                (x) => x.ID == Number(id),
            );
            if (!ability) {
                toggleCustomCdOptions(false);
                return;
            }
            $("#customcdIconPreview").prop(
                "src",
                getAbilityIconUrl(ability.Icon, state.currentSettings),
            );
            $("#customcdAbilityId").val(ability.ID);
            $("#customcdAbilityEnabled").prop("checked", true);
            $("#customcdAbilityTTSEnabled").prop("checked", true);
            $("#customcdAbilityTTSType").val(0);
            ability.ClassJob.Abbreviation !== null
                ? $("#customcdAbilityJob").val(ability.ClassJob.Abbreviation)
                : $("#customcdAbilityJob").val("Tank");

            $("#customcdAbilityDuration").val(ability.Duration);
            $("#customcdAbilityCooldown").val(ability.Cooldown);
            $("#customcdAbilityCharges").val(ability.Charges);
            $("#customcdAbilityOrder").val(0);
            $("#customcdAbilityType").val("CustomCooldown");
            break;
        }
    }
}

export function addCustomAbility() {
    const id = formNumber("#customcdAbilitySelect");
    let base = state.removedAbility;
    if (formValue("#customcdMode") === "1") {
        if (
            state.currentSettings.customcd.abilities.some(
                (ability) => ability.id === id,
            )
        )
            return;
        const found = state.foundAbilities.find((ability) => ability.ID === id);
        if (!found) return;
        base = normalizeAbilities([
            {
                id: found.ID,
                name: found.Name_en,
                name_en: found.Name_en,
                name_cn: found.Name_cn,
                name_de: found.Name_de,
                name_fr: found.Name_fr,
                name_jp: found.Name_jp,
                name_kr: found.Name_kr,
                name_tc: found.Name_tc,
                level: found.ClassJobLevel,
                icon: found.Icon,
                type: "CustomCooldown",
            },
        ])[0];
    }
    if (!base) return;
    const ability = normalizeAbilities([
        {
            ...base,
            id: formNumber("#customcdAbilityId"),
            enabled: $("#customcdAbilityEnabled").is(":checked"),
            tts: $("#customcdAbilityTTSEnabled").is(":checked"),
            ttstype: formNumber("#customcdAbilityTTSType"),
            job: formValue("#customcdAbilityJob"),
            duration: formNumber("#customcdAbilityDuration"),
            cooldown: formNumber("#customcdAbilityCooldown"),
            type: formValue("#customcdAbilityType"),
            color: "--filter-light-blue",
            order: formNumber("#customcdAbilityOrder"),
            extra: {
                ...base.extra,
                charges: formNumber("#customcdAbilityCharges"),
            },
        },
    ])[0];
    if (!ability) return;
    state.currentSettings.customcd.abilities.push(ability);
    toggleCustomCdOptions(false);
}

export function saveCustomAbility() {
    deleteCustomAbility(false);
    addCustomAbility();
}

export function deleteCustomAbility(removeFromSelect = true) {
    let id = parseInt(formValue("#customcdAbilitySelect"));
    state.removedAbility = state.currentSettings.customcd.abilities.find(
        (x) => x.id == Number(id),
    );
    state.currentSettings.customcd.abilities =
        state.currentSettings.customcd.abilities.filter((x) => x.id != id);
    if (removeFromSelect) {
        $(`#customcdAbilitySelect option[value='${id}']`).remove();
        if ($("#customcdAbilitySelect option").length === 0) {
            toggleCustomCdOptions(false);
            $("#customcdAbilitySelectDiv").hide();
            $("#customcdIconPreview").hide();
            return;
        }
        loadCustomCdAbility();
    }
}

export function toggleCustomCdOptions(show = false) {
    show ? $("#customcdOptionsDiv").show() : $("#customcdOptionsDiv").hide();
}
