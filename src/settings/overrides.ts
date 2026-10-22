import { formNumber, formValue } from "../shared/dom";
import { translation } from "./state";
import { state } from "./state";
import { abilityList } from "../data/abilities";
import { getAbilityIconUrl } from "../shared/icons";
import { gameLanguage } from "../shared/language";

export function createOverrideSelects() {
    for (let ability of abilityList) {
        let override = state.currentSettings.override.abilities.find(
            (x) => x.id == ability.id && x.type == ability.type,
        );
        let name = ability[`name_${gameLanguage(state.currentSettings)}`];
        $("#overrideSelect").append(
            `<option value="${ability.id}-${ability.type}">${
                override != null ? "[Override] " : ""
            }${translation(
                ability.job.toLowerCase(),
            )}: ${name} (${ability.type})</option>`,
        );
    }
    loadAbility();
    toggleOverride();
}

export function toggleOverride() {
    let checked = $("#abilityOverrideEnabled").is(":checked");
    let currentAbility = formValue("#overrideSelect");
    let id = parseInt(currentAbility.split("-")[0]);
    let type = currentAbility.split("-")[1];
    let override = state.currentSettings.override.abilities.find(
        (x) => x.id == id && x.type == type,
    );

    if (checked) {
        $("#abilityEnabled").removeAttr("disabled");
        $("#abilityColor").removeAttr("disabled");
        $("#abilityDuration").removeAttr("disabled");
        $("#abilityCooldown").removeAttr("disabled");
        $("#abilityOrder").removeAttr("disabled");
        $("#abilityTTSEnabled").removeAttr("disabled");
        $("#abilityTTSType").removeAttr("disabled");
        if (override == null) {
            const original = abilityList.find(
                (x) => x.id == id && x.type == type,
            );
            if (original)
                state.currentSettings.override.abilities.push({ ...original });
        }
    } else {
        $("#abilityEnabled").attr("disabled", "disabled");
        $("#abilityColor").attr("disabled", "disabled");
        $("#abilityDuration").attr("disabled", "disabled");
        $("#abilityCooldown").attr("disabled", "disabled");
        $("#abilityOrder").attr("disabled", "disabled");
        $("#abilityTTSEnabled").attr("disabled", "disabled");
        $("#abilityTTSType").attr("disabled", "disabled");

        let index = state.currentSettings.override.abilities.findIndex(
            (x) => x.id === id && x.type == type,
        );
        if (index !== -1)
            state.currentSettings.override.abilities.splice(index, 1);
    }
}

export function saveOverride(type: string) {
    let currentAbility = formValue("#overrideSelect");
    let id = parseInt(currentAbility.split("-")[0]);
    let abilityType = currentAbility.split("-")[1];
    const override = state.currentSettings.override.abilities.find(
        (x) => x.id === id && x.type === abilityType,
    );
    if (!override) return;
    switch (type) {
        case "color":
            override.color = formValue("#abilityColor");
            break;
        case "enabled":
            override.enabled = $("#abilityEnabled").is(":checked");
            break;
        case "cooldown":
            override.cooldown = formNumber("#abilityCooldown");
            break;
        case "order":
            override.order = formNumber("#abilityOrder");
            break;
        case "duration":
            override.duration = formNumber("#abilityDuration");
            break;
        case "tts":
            override.tts = $("#abilityTTSEnabled").is(":checked");
            break;
        case "ttstype":
            override.ttstype = formNumber("#abilityTTSType");
            break;
    }
}

export function loadAbility() {
    let currentAbility = formValue("#overrideSelect");
    let id = parseInt(currentAbility.split("-")[0]);
    let type = currentAbility.split("-")[1];
    let ability = abilityList.find((x) => x.id == id && x.type == type);
    let override = state.currentSettings.override.abilities.find(
        (x) => x.id == id && x.type == type,
    );
    if (override != null) ability = override;
    if (!ability) return;
    $("#abilityEnabled").prop("checked", ability.enabled);
    $("#abilityIconPreview").prop(
        "src",
        getAbilityIconUrl(ability.icon, state.currentSettings),
    );
    $("#abilityOverrideEnabled").prop("checked", override != null);
    switch (ability.type) {
        case "Buff":
            $("#abilityColorDiv").show();
            $("#abilityColor").val(ability.color);
            $("#abilityDurationDiv").hide();
            $("#abilityCooldownDiv").hide();
            $("#abilityOrderDiv").show();
            $("#abilityOrder").val(ability.order);
            $("#abilityTTSEnabled").show();
            $("#abilityTTSEnabled").prop("checked", ability.tts);
            $("#abilityTTSType").show();
            $("#abilityTTSType").val(ability.ttstype);
            break;
        case "DoT":
            $("#abilityColorDiv").show();
            $("#abilityColor").val(ability.color);
            $("#abilityDurationDiv").hide();
            $("#abilityCooldownDiv").hide();
            $("#abilityOrderDiv").show();
            $("#abilityOrder").val(ability.order);
            $("#abilityTTSEnabled").show();
            $("#abilityTTSEnabled").prop("checked", ability.tts);
            $("#abilityTTSType").show();
            $("#abilityTTSType").val(ability.ttstype);
            break;
        case "Stacks":
            $("#abilityColorDiv").show();
            $("#abilityColor").val(ability.color);
            $("#abilityDurationDiv").hide();
            $("#abilityCooldownDiv").hide();
            $("#abilityTTSEnabled").hide();
            $("#abilityTTSType").hide();
            break;
        case "StackSpender":
            $("#abilityColorDiv").hide();
            $("#abilityDurationDiv").hide();
            $("#abilityCooldownDiv").hide();
            $("#abilityTTSEnabled").hide();
            $("#abilityTTSType").hide();
            break;
        case "RaidBuff":
            $("#abilityColorDiv").hide();
            $("#abilityDurationDiv").show();
            $("#abilityDuration").val(ability.duration ?? 0);
            $("#abilityCooldownDiv").show();
            $("#abilityCooldown").val(ability.cooldown ?? 0);
            $("#abilityOrderDiv").show();
            $("#abilityOrder").val(ability.order);
            $("#abilityTTSEnabled").show();
            $("#abilityTTSEnabled").prop("checked", ability.tts);
            $("#abilityTTSType").show();
            $("#abilityTTSType").val(ability.ttstype);
            break;
        case "Mitigation":
            $("#abilityColorDiv").hide();
            $("#abilityDurationDiv").show();
            $("#abilityDuration").val(ability.duration ?? 0);
            $("#abilityCooldownDiv").show();
            $("#abilityCooldown").val(ability.cooldown ?? 0);
            $("#abilityOrderDiv").show();
            $("#abilityOrder").val(ability.order);
            $("#abilityTTSEnabled").show();
            $("#abilityTTSEnabled").prop("checked", ability.tts);
            $("#abilityTTSType").show();
            $("#abilityTTSType").val(ability.ttstype);
            break;
        case "Party":
            $("#abilityColorDiv").hide();
            $("#abilityDurationDiv").show();
            $("#abilityDuration").val(ability.duration ?? 0);
            $("#abilityCooldownDiv").show();
            $("#abilityCooldown").val(ability.cooldown ?? 0);
            $("#abilityOrderDiv").show();
            $("#abilityOrder").val(ability.order);
            $("#abilityTTSEnabled").show();
            $("#abilityTTSEnabled").prop("checked", ability.tts);
            $("#abilityTTSType").show();
            $("#abilityTTSType").val(ability.ttstype);
            break;
    }
    toggleOverride();
}
