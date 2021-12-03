// ZeffUI globals
/* global abilityList, jobList, language, Base64, checkAndInitializeDefaultSettingsObject */

// External Globals
/* global startOverlayEvents, callOverlayHandler, sortable */

var currentSettings = null;
var currentFont = {};
var currentPartyRole = "tank";
var foundAbilities = [];
var removedAbility = {};
var callCurrentOverlayHandler = null;

/* prettier-ignore */
var defaultJobOrder = [
	// Tanks
	"PLD", "GLA", "WAR", "MRD", "DRK", "GNB",
	// Healers
	"WHM", "CNJ", "SCH", "AST", "SGE",
	// Melee DPS
	"MNK", "PGL", "DRG", "LNC", "NIN", "ROG", "SAM", "RPR",
	// Physical Ranged DPS
	"BRD", "ARC", "MCH", "DNC",
	// Caster DPS
	"BLM", "THM", "SMN", "ACN", "RDM", "BLU"
];

$(function () {
    loadZeffUISettings();
});

function initializeOverlayPluginHandlers() {
    if (window.opener) {
        if (window.opener.callOverlayHandler) {
            callCurrentOverlayHandler = window.opener.callOverlayHandler;
            return;
        }
    }
    startOverlayEvents();
    callCurrentOverlayHandler = callOverlayHandler;
}

async function loadZeffUISettings() {
    initializeOverlayPluginHandlers();

    $("[id$=Color]").each(function () {
        setExampleColor(this);
    });

    $("[id$=Color]").change(function () {
        setExampleColor(this);
    });

    $("[id$=GrowDirection]").change(function () {
        setPadding(this);
    });

    $("#dotScale").change(function () {
        setPadding(
            $(`#${$(this).attr("id").replace("Scale", "GrowDirection")}`),
        );
    });

    $("#buffScale").change(function () {
        setPadding(
            $(`#${$(this).attr("id").replace("Scale", "GrowDirection")}`),
        );
    });

    $("#customcdSearch").keyup(function (event) {
        if (event.keyCode == 13) {
            $("#customcdSearchButton").click();
        }
    });

    if (window.location.hash) shiftWindow();
    window.addEventListener("hashchange", shiftWindow);

    await loadSettings();
}

function removeHashFromUrl() {
    var uri = window.location.toString();

    if (uri.indexOf("#") > 0) {
        var clean_uri = uri.substring(0, uri.indexOf("#"));

        window.history.replaceState({}, document.title, clean_uri);
    }
}

function shiftWindow() {
    removeHashFromUrl();
}

function setPadding(element) {
    let selector = $(element).attr("id").replace("GrowDirection", "");
    if ($(element).val() <= 2) {
        $(`#${selector}Padding`).val($(`#${selector}Scale`).val() * 20);
    } else {
        $(`#${selector}Padding`).val($(`#${selector}Scale`).val() * 180);
    }
}

function setExampleColor(element) {
    let selector = $(element).attr("id").replace("Color", "");
    if (!selector.startsWith("stacks")) {
        $(`#${selector}Example`).css(
            `--${selector}Color`,
            `var(${$(element).val()})`,
        );
        $(`#${selector}Example`).css("width", "154px");
    } else {
        $(`#${selector}-1`).css(
            `--${selector}Color`,
            `var(${$(element).val()})`,
        );
        $(`#${selector}-2`).css(
            `--${selector}Color`,
            `var(${$(element).val()})`,
        );
        $(`#${selector}-3`).css(
            `--${selector}Color`,
            `var(${$(element).val()})`,
        );
        $(`#${selector}-4`).css(
            `--${selector}Color`,
            `var(${$(element).val()})`,
        );
    }
}

/* exported loadProfile */
function loadProfile() {
    let profileName = $("#profileSelect").val();
    if (profileName) {
        currentSettings.profiles.currentprofile = profileName;
        saveSettings(false);
    }
}

/* exported saveProfile */
function saveProfile(
    currentProfile = false,
    closeWindow = false,
    showPopup = false,
    dontReload = false,
    dontUseForms = false,
) {
    if (!dontUseForms) saveAllSettings();

    let profileName = currentProfile
        ? currentSettings.profiles.currentprofile
        : $("#profileName").val();
    if (profileName) {
        if (
            Object.prototype.hasOwnProperty.call(
                currentSettings.profiles.profiles,
                profileName && currentProfile,
            )
        ) {
            return;
        }

        let profileSettings = JSON.parse(JSON.stringify(currentSettings));
        delete profileSettings.profiles;
        currentSettings.profiles.profiles[profileName] = JSON.parse(
            JSON.stringify(profileSettings),
        );
        currentSettings.profiles.currentprofile = profileName;
        saveSettings(closeWindow, showPopup, dontReload, dontUseForms);
        createProfileSelects();
    }
}

/* exported saveJobProfile */
function saveJobProfile() {
    let profileName = $("#profileSelect").val();
    let job = $("#jobProfileSelect").val();
    if (profileName) {
        currentSettings.profiles.jobprofiles[job] = profileName;
        let jobName = language.find((x) => x.id === job).string;
        $(`#jobProfileSelect option[value=${job}]`).html(
            `[${jobName}] ${profileName}`,
        );
    }
    saveAllSettings();
}

/* exported saveAllJobProfile */
function saveAllJobProfile() {
    let profileName = $("#profileSelect").val();
    if (profileName) {
        let list = jobList.filter(
            (x) => x.id != 0 && x.type != "Gatherer" && x.type != "Crafter",
        );
        list.sort(function (a, b) {
            if (a.name > b.name) return 1;
            if (a.name < b.name) return -1;
            return 0;
        });

        for (let i in list) {
            let job = list[i].name.toLocaleLowerCase();
            currentSettings.profiles.jobprofiles[job] = profileName;

            let jobName = language.find((x) => x.id === job).string;
            $(`#jobProfileSelect option[value=${job}]`).html(
                `[${jobName}] ${profileName}`,
            );
        }
    }
    saveAllSettings();
}

/* exported deleteJobProfile */
function deleteJobProfile() {
    let profileName = $("#profileSelect").val();
    let job = $("#jobProfileSelect").val();
    if (profileName) {
        delete currentSettings.profiles.jobprofiles[job];
        let jobName = language.find((x) => x.id === job).string;
        $(`#jobProfileSelect option[value=${job}]`).html(`[${jobName}]`);
    }
    saveAllSettings();
}

/* exported deleteProfile */
function deleteProfile() {
    let profileName = $("#profileSelect").val();
    if (
        Object.prototype.hasOwnProperty.call(
            currentSettings.profiles.profiles,
            profileName,
        )
    ) {
        if (
            confirm(
                `${
                    language.find((x) => x.id === "deleteprofile").string
                }\n\n${profileName}`,
            )
        ) {
            for (let [job, profile] of Object.entries(
                currentSettings.profiles.jobprofiles,
            )) {
                if (profile == profileName) {
                    delete currentSettings.profiles.jobprofiles[job];
                }
            }
            delete currentSettings.profiles.profiles[profileName];
            if (currentSettings.profiles.currentprofile == profileName) {
                let profileList = Object.keys(
                    currentSettings.profiles.profiles,
                );
                if (profileList.length > 0) {
                    currentSettings.profiles.currentprofile = profileList[0];
                } else {
                    currentSettings.profiles.currentprofile = "";
                }
            }
            saveSettings(false, false, true);
            createProfileSelects();
            createJobProfileSelect();
        }
    }
}

function saveCurrentPartyRoleOrder() {
    currentSettings.rolepartyorder[currentPartyRole] = sortable(
        "#partyOrder",
        "serialize",
    )[0].items;
}

function setPartyOrder(partyOrder) {
    if (!partyOrder) {
        partyOrder = currentSettings.rolepartyorder[$("#partyRole").val()];
        saveCurrentPartyRoleOrder();
        $("#partyOrder").empty();
        currentPartyRole = $("#partyRole").val();
    }
    for (let job of partyOrder) {
        // Initially used the wrong job shorthand, need this to not break people's party orders.
        if (job == "GLD") job = "GLA";
        $("#partyOrder").append(
            `<tr data-job="${job}"><td style="width:5%"><img src="data/images/jobicons/${job}.png"></td><td style="width:95%">${
                language.find((x) => x.id === job.toLowerCase()).string
            }</td></tr>`,
        );
        sortable("#partyOrder", {
            itemSerializer: (item) => {
                return $(item.html).data("job");
            },
        });
    }
}

function titleCase(string) {
    return string
        .toLowerCase()
        .split(" ")
        .map(function (word) {
            return word.replace(word[0], word[0].toUpperCase());
        })
        .join(" ");
}

function createProfileSelects() {
    $("#profileSelect").empty();
    for (let profile in currentSettings.profiles.profiles) {
        $("#profileSelect").append(
            `<option value="${profile}">${profile}</option>`,
        );
    }
    $("#profileSelect").val(currentSettings.profiles.currentprofile);
}

function createColorSelects() {
    for (let colorFilter of getBarColors()) {
        let color = colorFilter.replace("--filter-", "").replace("-", "");
        let colorString = language.find((x) => x.id === `color${color}`).string;
        $("[id$=Color]").append(
            `<option value="${colorFilter}">${titleCase(colorString)}</option>`,
        );
    }
}

function createSkinSelects() {
    $("#skinSelect").append(
        `<option value="default">${
            language.find((x) => x.id === "skindefault").string
        }</option>`,
    );
    $("#skinSelect").append(
        `<option value="material-dark">${
            language.find((x) => x.id === "skinmaterialdark").string
        }</option>`,
    );
    $("#skinSelect").append(
        `<option value="material-discord">${
            language.find((x) => x.id === "skinmaterialdiscord").string
        }</option>`,
    );
    $("#skinSelect").append(
        `<option value="hydaelyn">${
            language.find((x) => x.id === "skinhydaelyn").string
        }</option>`,
    );
}

function createFontSelects() {
    $("#defaultFont").empty();
    $("#healthFont").empty();
    $("#manaFont").empty();
    $("#pulltimerFont").empty();
    $("#buffFont").empty();
    $("#dotFont").empty();
    $("#raidbuffFont").empty();
    $("#mitigationFont").empty();
    $("#partyFont").empty();
    $("#customcdFont").empty();
    $("#customFonts").empty();

    currentSettings.customfonts.forEach((font) => {
        $("#customFonts").append(`<option value="${font}">${font}</option>`);
    });

    /* prettier-ignore */
    let fontCheck = new Set([
		// Windows 10
		"Arial", "Arial Black", "Bahnschrift", "Calibri", "Cambria", "Cambria Math", "Candara", "Comic Sans MS", "Consolas", "Constantia", "Corbel", "Courier New", "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia", "HoloLens MDL2 Assets", "Impact", "Ink Free", "Javanese Text", "Leelawadee UI", "Lucida Console", "Lucida Sans Unicode", "Malgun Gothic", "Marlett", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB", "Mongolian Baiti", "MS Gothic", "MV Boli", "Myanmar Text", "Nirmala UI", "Palatino Linotype", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Historic", "Segoe UI Emoji", "Segoe UI Symbol", "SimSun", "Sitka", "Sylfaen", "Symbol", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana", "Webdings", "Wingdings", "Yu Gothic",
		// macOS
		"American Typewriter", "Andale Mono", "Arial", "Arial Black", "Arial Narrow", "Arial Rounded MT Bold", "Arial Unicode MS", "Avenir", "Avenir Next", "Avenir Next Condensed", "Baskerville", "Big Caslon", "Bodoni 72", "Bodoni 72 Oldstyle", "Bodoni 72 Smallcaps", "Bradley Hand", "Brush Script MT", "Chalkboard", "Chalkboard SE", "Chalkduster", "Charter", "Cochin", "Comic Sans MS", "Copperplate", "Courier", "Courier New", "Didot", "DIN Alternate", "DIN Condensed", "Futura", "Geneva", "Georgia", "Gill Sans", "Helvetica", "Helvetica Neue", "Herculanum", "Hoefler Text", "Impact", "Lucida Grande", "Luminari", "Marker Felt", "Menlo", "Microsoft Sans Serif", "Monaco", "Noteworthy", "Optima", "Palatino", "Papyrus", "Phosphate", "Rockwell", "Savoye LET", "SignPainter", "Skia", "Snell Roundhand", "Tahoma", "Times", "Times New Roman", "Trattatello", "Trebuchet MS", "Verdana", "Zapfino",
        // Custom Fonts that might be installed but won't be included/embedded due to licensing
        "Expressway"
	].sort());

    currentSettings.customfonts.forEach((font) => fontCheck.add(font));

    let customFonts = new Set(["ITC Avant Garde Gothic LT"]);

    (async () => {
        await document.fonts.ready;
        for (const font of fontCheck.values()) {
            if (document.fonts.check(`12px "${font}"`)) {
                $("#defaultFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#healthFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#manaFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#pulltimerFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#buffFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#dotFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#raidbuffFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#mitigationFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#partyFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
                $("#customcdFont").append(
                    `<option value="${font}" style="font-family:${font}">${font}</option>`,
                );
            }
        }
        for (const font of customFonts.values()) {
            $("#defaultFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#healthFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#manaFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#pulltimerFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#buffFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#dotFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#raidbuffFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#mitigationFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#partyFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
            $("#customcdFont").append(
                `<option value="${font}" style="font-family:${font}">${font}</option>`,
            );
        }
        $("#defaultFont").val(currentFont.default);
        $("#healthFont").val(currentFont.health);
        $("#manaFont").val(currentFont.mana);
        $("#pulltimerFont").val(currentFont.pulltimer);
        $("#buffFont").val(currentFont.buff);
        $("#dotFont").val(currentFont.dot);
        $("#raidbuffFont").val(currentFont.raidbuff);
        $("#mitigationFont").val(currentFont.mitigation);
        $("#partyFont").val(currentFont.party);
        $("#customcdFont").val(currentFont.customcd);
    })();
}

function createJobProfileSelect() {
    $("#jobProfileSelect").empty();
    let list = jobList.filter(
        (x) => x.id != 0 && x.type != "Gatherer" && x.type != "Crafter",
    );
    list.sort(function (a, b) {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    });
    for (let i in list) {
        let job = list[i].name.toLowerCase();
        let jobName = language.find((x) => x.id === job).string;
        let jobString = `[${jobName}]`;
        if (
            Object.prototype.hasOwnProperty.call(
                currentSettings.profiles.jobprofiles,
                job,
            )
        ) {
            jobString = `[${jobName}] ${currentSettings.profiles.jobprofiles[job]}`;
        }
        $("#jobProfileSelect").append(
            `<option value="${job}">${jobString}</option>`,
        );
    }
}

function createSpecificJobs(selector, enabledJobs) {
    for (let job of defaultJobOrder) {
        let enabled = enabledJobs.includes(job);
        $(selector).append(
            `<a data-job="${job}" href="#" onclick="toggleJob(this);return false;"><img src="data/images/jobicons/${job}.png" class="${
                enabled ? "" : "job-disabled"
            }" width="29" height="29"></a>`,
        );
    }
}

function createOverrideSelects() {
    for (let ability of abilityList) {
        let override = currentSettings.override.abilities.find(
            (x) => x.id == ability.id && x.type == ability.type,
        );
        let name = ability[`name_${currentSettings.language}`];
        $("#overrideSelect").append(
            `<option value="${ability.id}-${ability.type}">${
                override != null ? "[Override] " : ""
            }${
                language.find((x) => x.id === ability.job.toLowerCase()).string
            }: ${name} (${ability.type})</option>`,
        );
    }
    loadAbility();
    toggleOverride();
}

function processLanguage() {
    $("[id^=lang_]").each(function () {
        let id = $(this).attr("id").split("_")[1];
        let object = language.find((x) => x.id === id);
        if (object != null) {
            let string = language.find((x) => x.id === id).string;
            $(this).text(string);
        } else {
            console.log(`Missing translation for ${id}`);
        }
    });
}

/* exported toggleJob */
function toggleJob(element) {
    let job = $(element).data("job");
    let type = $(element).parent()[0].id.replace("SpecificJobs", "");

    let enabled = !$(element).find("img").hasClass("job-disabled");

    if (enabled) {
        $(element).find("img").addClass("job-disabled");
        currentSettings[type].specificjobs.splice(
            currentSettings[type].specificjobs.indexOf(job),
            1,
        );
    } else {
        $(element).find("img").removeClass("job-disabled");
        currentSettings[type].specificjobs.push(job);
    }
}

function toggleOverride() {
    let checked = $("#abilityOverrideEnabled").is(":checked");
    let currentAbility = $("#overrideSelect").val();
    let id = parseInt(currentAbility.split("-")[0]);
    let type = currentAbility.split("-")[1];
    let override = currentSettings.override.abilities.find(
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
        if (override == null)
            currentSettings.override.abilities.push(
                abilityList.find((x) => x.id == id && x.type == type),
            );
    } else {
        $("#abilityEnabled").attr("disabled", "disabled");
        $("#abilityColor").attr("disabled", "disabled");
        $("#abilityDuration").attr("disabled", "disabled");
        $("#abilityCooldown").attr("disabled", "disabled");
        $("#abilityOrder").attr("disabled", "disabled");
        $("#abilityTTSEnabled").attr("disabled", "disabled");
        $("#abilityTTSType").attr("disabled", "disabled");

        let index = currentSettings.override.abilities.findIndex(
            (x) => x.id === id && x.type == type,
        );
        if (index !== -1) currentSettings.override.abilities.splice(index, 1);
    }
}

/* exported changeXY */
function changeXY(type) {
    $(`#${type}X`).val($(`#${type}X`).val() * -1);
    $(`#${type}Y`).val($(`#${type}Y`).val() * -1);
}

/* exported addCustomFont */
function addCustomFont() {
    let font = $("#customFontText").val();

    if (!font || currentSettings.customfonts.includes(font)) {
        return;
    }

    currentSettings.customfonts.push(font);
    $("#customFonts").append(`<option value="${font}">${font}</option>`);
    $("#customFonts").val(font);
}

/* exported removeCustomFont */
function removeCustomFont() {
    let font = $("#customFonts").val();
    currentSettings.customfonts = currentSettings.customfonts.filter(
        (x) => x !== font,
    );
    $(`#customFonts option[value="${font}"]`).remove();
}

/* exported saveOverride */
function saveOverride(type) {
    let currentAbility = $("#overrideSelect").val();
    let id = parseInt(currentAbility.split("-")[0]);
    let abilityType = currentAbility.split("-")[1];
    switch (type) {
        case "color":
            currentSettings.override.abilities.find(
                (x) => x.id == id && x.type == abilityType,
            ).color = $("#abilityColor").val();
            break;
        case "enabled":
            currentSettings.override.abilities.find(
                (x) => x.id == id && x.type == abilityType,
            ).enabled = $("#abilityEnabled").is(":checked");
            break;
        case "cooldown":
            currentSettings.override.abilities.find(
                (x) => x.id == id && x.type == abilityType,
            ).cooldown = parseInt($("#abilityCooldown").val());
            break;
        case "order":
            currentSettings.override.abilities.find(
                (x) => x.id == id && x.type == abilityType,
            ).order = parseInt($("#abilityOrder").val());
            break;
        case "duration":
            currentSettings.override.abilities.find(
                (x) => x.id == id && x.type == abilityType,
            ).duration = parseInt($("#abilityDuration").val());
            break;
        case "tts":
            currentSettings.override.abilities.find(
                (x) => x.id == id && x.type == abilityType,
            ).tts = $("#abilityTTSEnabled").is(":checked");
            break;
        case "ttstype":
            currentSettings.override.abilities.find(
                (x) => x.id == id && x.type == abilityType,
            ).ttstype = parseInt($("#abilityTTSType").val());
            break;
    }
}

/* exported searchCustomAbility */
function searchCustomAbility() {
    let query = $("#customcdSearch").val();
    $("#customcdAbilitySelectDiv").hide();
    $("#customcdIconPreview").hide();
    toggleCustomCdOptions(false);
    $("#customcdIconPreviewDiv").append(
        '<div id="customcdLoading" class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>',
    );
    let url = `https://fakegaming.eu/ffxiv/spellname/index.php?name=${query}&type=action&lang=${currentSettings.language}`;
    if (currentSettings.language == "cn")
        url = `https://act.diemoe.net/FFXIVSpellNamesXIVAPI/index.php?name=${query}&type=action&lang=${currentSettings.language}`;
    $.getJSON(url, function (data) {
        foundAbilities = data;
        $("#customcdAbilitySelect").empty();
        $("#customcdLoading").remove();
        $("#customcdIconPreview").show();
        $("#customcdAbilitySelectDiv").show();
        toggleCustomCdOptions(foundAbilities.length !== 0);
        if (foundAbilities.length === 0) {
            $("#customcdAbilityNoAbilitiesDiv").show();
            return;
        }

        for (let ability of data) {
            if (ability.IsPlayerAction) {
                let name = ability[`Name_${currentSettings.language}`];
                if (ability.IsPvP)
                    name = `[${
                        language.find((x) => x.id === "pvp").string
                    }] ${name}`;
                $("#customcdAbilitySelect").append(
                    `<option value="${ability.ID}">${name}</option>`,
                );
            }
        }

        loadCustomCdAbility();
    });
}

function switchCustomcdMode() {
    switch ($("#customcdMode").val()) {
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

function loadCustomCdAbilitySelect() {
    $("#customcdAbilitySelect").empty();
    $("#customcdAbilityNoAbilitiesDiv").hide();
    toggleCustomCdOptions(true);
    if (currentSettings.customcd.abilities.length === 0) {
        $("#customcdAbilitySelectDiv").hide();
        $("#customcdAbilityNoAbilitiesDiv").show();
        toggleCustomCdOptions(false);
        return;
    }
    for (let ability of currentSettings.customcd.abilities) {
        let name = ability[`name_${currentSettings.language}`];
        $("#customcdAbilitySelect").append(
            `<option value="${ability.id}">${
                ability.job != null
                    ? language.find((x) => x.id === ability.job.toLowerCase())
                          .string
                    : language.find((x) => x.id === "setjob").string
            }: ${name}</option>`,
        );
    }
    loadCustomCdAbility();
}

function loadCustomCdAbility() {
    let id = $("#customcdAbilitySelect").val();
    let ability = {};
    toggleCustomCdOptions(true);
    switch ($("#customcdMode").val()) {
        case "0":
            ability = currentSettings.customcd.abilities.find(
                (x) => x.id == id,
            );
            $("#customcdIconPreview").prop("src", ability.icon);
            $("#customcdAbilityId").val(ability.id);
            $("#customcdAbilityEnabled").prop("checked", ability.enabled);
            $("#customcdAbilityTTSEnabled").prop("checked", ability.tts);
            $("#customcdAbilityTTSType").val(ability.ttstype);
            $("#customcdAbilityJob").val(ability.job);
            $("#customcdAbilityDuration").val(ability.duration);
            $("#customcdAbilityCooldown").val(ability.cooldown);
            if (ability.extra.charges) {
                $("#customcdAbilityCharges").val(ability.extra.charges);
            } else {
                $("#customcdAbilityCharges").val(0);
            }
            $("#customcdAbilityOrder").val(ability.order);
            $("#customcdAbilityType").val(ability.type);
            break;
        case "1":
            ability = foundAbilities.find((x) => x.ID == id);
            $("#customcdIconPreview").prop(
                "src",
                `https://xivapi.com${ability.Icon}`,
            );
            $("#customcdAbilityId").val(ability.ID);
            $("#customcdAbilityEnabled").prop("checked", true);
            $("#customcdAbilityTTSEnabled").prop("checked", true);
            $("#customcdAbilityTTSType").val(0);
            ability.ClassJob.Abbreviation !== null
                ? $("#customcdAbilityJob").val(ability.ClassJob.Abbreviation)
                : $("#customcdAbilityJob").val("Tank");
            $("#customcdAbilityJob").val(ability.ClassJob.Abbreviation);
            $("#customcdAbilityDuration").val(ability.Duration);
            $("#customcdAbilityCooldown").val(ability.Cooldown);
            $("#customcdAbilityCharges").val(ability.Charges);
            $("#customcdAbilityOrder").val(0);
            $("#customcdAbilityType").val("CustomCooldown");
            break;
    }
}

/* exported addCustomAbility */
function addCustomAbility() {
    let addAbility = {};
    let ability = {};
    let id = $("#customcdAbilitySelect").val();
    switch ($("#customcdMode").val()) {
        case "0": {
            ability = removedAbility;
            addAbility = {
                id: parseInt($("#customcdAbilityId").val()),
                name: ability.name,
                name_cn: ability.name_cn,
                name_de: ability.name_de,
                name_en: ability.name_en,
                name_fr: ability.name_fr,
                name_jp: ability.name_jp,
                name_kr: ability.name_kr,
                enabled: $("#customcdAbilityEnabled").is(":checked"),
                tts: $("#customcdAbilityTTSEnabled").is(":checked"),
                ttstype: parseInt($("#customcdAbilityTTSType").val()),
                job: $("#customcdAbilityJob").val(),
                level: parseInt(ability.level),
                duration: parseInt($("#customcdAbilityDuration").val()),
                cooldown: parseInt($("#customcdAbilityCooldown").val()),
                type: $("#customcdAbilityType").val(),
                icon: ability.icon,
                color: "--filter-light-blue",
                order: parseInt($("#customcdAbilityOrder").val()),
                extra: {
                    charges: parseInt($("#customcdAbilityCharges").val()),
                },
            };
            break;
        }
        case "1": {
            if (
                currentSettings.customcd.abilities.find((x) => x.id == id) !==
                undefined
            )
                return;
            ability = foundAbilities.find((x) => x.ID == id);
            addAbility = {
                id: parseInt($("#customcdAbilityId").val()),
                name: ability.Name_en,
                name_cn: ability.Name_cn,
                name_de: ability.Name_de,
                name_en: ability.Name_en,
                name_fr: ability.Name_fr,
                name_jp: ability.Name_ja,
                name_kr: ability.Name_kr,
                enabled: $("#customcdAbilityEnabled").is(":checked"),
                tts: $("#customcdAbilityTTSEnabled").is(":checked"),
                ttstype: $("#customcdAbilityTTSType").val(),
                job: $("#customcdAbilityJob").val(),
                level: ability.ClassJobLevel,
                duration: $("#customcdAbilityDuration").val(),
                cooldown: $("#customcdAbilityCooldown").val(),
                type: $("#customcdAbilityType").val(),
                icon: `https://xivapi.com${ability.Icon}`,
                color: "--filter-light-blue",
                order: $("#customcdAbilityOrder").val(),
                extra: {
                    charges: $("#customcdAbilityCharges").val(),
                },
            };
            break;
        }
    }
    currentSettings.customcd.abilities.push(addAbility);
    toggleCustomCdOptions(false);
}

/* exported saveCustomAbility */
function saveCustomAbility() {
    deleteCustomAbility(false);
    addCustomAbility();
}

function deleteCustomAbility(removeFromSelect = true) {
    let id = parseInt($("#customcdAbilitySelect").val());
    removedAbility = currentSettings.customcd.abilities.find((x) => x.id == id);
    currentSettings.customcd.abilities = currentSettings.customcd.abilities.filter(
        (x) => x.id != id,
    );
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

function toggleCustomCdOptions(show = false) {
    show ? $("#customcdOptionsDiv").show() : $("#customcdOptionsDiv").hide();
}

function loadAbility() {
    let currentAbility = $("#overrideSelect").val();
    let id = parseInt(currentAbility.split("-")[0]);
    let type = currentAbility.split("-")[1];
    let ability = abilityList.find((x) => x.id == id && x.type == type);
    let override = currentSettings.override.abilities.find(
        (x) => x.id == id && x.type == type,
    );
    if (override != null) ability = override;
    $("#abilityEnabled").prop("checked", ability.enabled);
    $("#abilityIconPreview").prop("src", ability.icon);
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
            $("#abilityDuration").val(ability.duration);
            $("#abilityCooldownDiv").show();
            $("#abilityCooldown").val(ability.cooldown);
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
            $("#abilityDuration").val(ability.duration);
            $("#abilityCooldownDiv").show();
            $("#abilityCooldown").val(ability.cooldown);
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
            $("#abilityDuration").val(ability.duration);
            $("#abilityCooldownDiv").show();
            $("#abilityCooldown").val(ability.cooldown);
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

/* exported loadSkin */
function loadSkin() {
    $("#skin").attr(
        "href",
        `skins/${$("#skinSelect").val()}/styles/resources.css`,
    );
}

/* exported loadFont */
function loadFont(type) {
    currentFont[type] = $(`#${type}Font`).val();
    switch (type) {
        case "default":
            $("*").css("font-family", currentFont.default);
            break;
        case "health":
            $("#healthExample").attr(
                "style",
                `font-family: ${currentFont.health}`,
            );
            break;
        case "mana":
            $("#manaExample").attr("style", `font-family: ${currentFont.mana}`);
            break;
        case "pulltimer":
            $("#pulltimerExample").attr(
                "style",
                `font-family: ${currentFont.pulltimer}`,
            );
            break;
    }
    createFontSelects();
}

/* exported loadLanguage */
async function loadLanguage() {
    let lang = $("#langSelect").val();
    $("#language").attr("src", `data/language/${lang}.js`);
    setOption("language", lang);
    await saveSettings(false);
}

function getBarColors() {
    let colorArray = Array.from(document.styleSheets)
        .filter(
            (sheet) =>
                sheet.href === null ||
                sheet.href.startsWith(window.location.origin),
        )
        .reduce(
            (acc, sheet) =>
                (acc = [
                    ...acc,
                    ...Array.from(sheet.cssRules).reduce(
                        (def, rule) =>
                            (def =
                                rule.selectorText === ":root"
                                    ? [
                                          ...def,
                                          ...Array.from(
                                              rule.style,
                                          ).filter((name) =>
                                              name.startsWith("--"),
                                          ),
                                      ]
                                    : def),
                        [],
                    ),
                ]),
            [],
        );
    return colorArray;
}

/* exported applyDefaultFont */
function applyDefaultFont() {
    for (let type in currentFont) {
        currentFont[type] = $("#defaultFont").val();
        $(`#${type}Font`).val(currentFont[type]);
    }
}

/* exported exportSettings */
async function exportSettings() {
    if (currentSettings == null) {
        await saveSettings();
    }
    let exportSettings = JSON.parse(JSON.stringify(currentSettings));
    if (!$("#includeProfiles").prop("checked")) {
        delete exportSettings.profiles;
    }
    $("#settingsText").val(Base64.encodeURI(JSON.stringify(exportSettings)));
    $("#settingsText").select();
    document.execCommand("copy");
    alert(language.find((x) => x.id === "currentsettingscopied").string);
}

/* exported exportSettingsJson */
async function exportSettingsJson() {
    if (currentSettings == null) {
        await saveSettings();
    }
    let exportSettings = JSON.parse(JSON.stringify(currentSettings));
    if (!$("#includeProfiles").prop("checked")) {
        let exportSettings = JSON.parse(JSON.stringify(currentSettings));
        delete exportSettings.profiles;
    }
    $("#settingsText").val(JSON.stringify(exportSettings, null, 2));
    $("#settingsText").select();
    document.execCommand("copy");
    alert(language.find((x) => x.id === "currentsettingscopied").string);
}

/* exported importSettings */
async function importSettings() {
    try {
        let decoded = Base64.decode($("#settingsText").val());
        let settings = JSON.parse(decoded);
        if (!$("#includeProfiles").prop("checked")) {
            delete settings.profiles;
        }
        if (Object.prototype.hasOwnProperty.call(settings, "healthbar")) {
            if (
                confirm(
                    language.find((x) => x.id === "importsettingsoverwrite")
                        .string,
                )
            ) {
                let saveSettings = { ...currentSettings, ...settings };
                if (currentSettings.profiles.currentprofile) {
                    let profileSettings = JSON.parse(
                        JSON.stringify(saveSettings),
                    );
                    delete profileSettings.profiles;
                    saveSettings.profiles.profiles[
                        currentSettings.profiles.currentprofile
                    ] = profileSettings;
                }
                await callCurrentOverlayHandler({
                    call: "saveData",
                    key: "zeffUI",
                    data: saveSettings,
                });
                localStorage.setItem("settings", JSON.stringify(saveSettings));
                loadSettings();
                location.reload();
                this.close();
            }
        } else {
            alert(
                language.find((x) => x.id === "invalidsettingsstring").string,
            );
        }
    } catch {
        alert(language.find((x) => x.id === "invalidsettingsstring").string);
    }
}

/* exported importSettingsJson */
async function importSettingsJson() {
    try {
        let decoded = $("#settingsText").val();
        let settings = JSON.parse(decoded);
        if (!$("#includeProfiles").prop("checked")) {
            delete settings.profiles;
        }
        if (Object.prototype.hasOwnProperty.call(settings, "healthbar")) {
            if (
                confirm(
                    language.find((x) => x.id === "importsettingsoverwrite")
                        .string,
                )
            ) {
                let saveSettings = { ...currentSettings, ...settings };
                await callCurrentOverlayHandler({
                    call: "saveData",
                    key: "zeffUI",
                    data: saveSettings,
                });
                localStorage.setItem("settings", JSON.stringify(saveSettings));
                loadSettings();
                location.reload();
                this.close();
            }
        } else {
            alert(
                language.find((x) => x.id === "invalidsettingsstring").string,
            );
        }
    } catch {
        alert(language.find((x) => x.id === "invalidsettingsstring").string);
    }
}

async function loadSettings() {
    let settings = await callCurrentOverlayHandler({
        call: "loadData",
        key: "zeffUI",
    });
    if (settings.data !== undefined) {
        settings = settings.data;

        console.log(settings);

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

        currentFont.default = settings.font;
        currentFont.health = settings.healthbar.font;
        currentFont.mana = settings.manabar.font;
        currentFont.pulltimer = settings.timerbar.font;
        currentFont.buff = settings.bufftimerbar.font;
        currentFont.dot = settings.dottimerbar.font;
        currentFont.raidbuff = settings.raidbuffs.font;
        currentFont.mitigation = settings.mitigation.font;
        currentFont.party = settings.party.font;
        currentFont.customcd = settings.customcd.font;

        if ($("#skin").length == 0) {
            $("head").append(
                `<link id="skin" rel="stylesheet" href="skins/${settings.skin}/styles/resources.css">`,
            );
        } else {
            $("#skin").attr(
                "href",
                `skins/${settings.skin}/styles/resources.css`,
            );
        }

        if ($("#language").length == 0) {
            // eslint-disable-next-line no-useless-escape
            $.getScript(`data/language/${settings.language}.js`, function () {
                processLanguage();
                createProfileSelects();
                createJobProfileSelect();
                createColorSelects();
                createSkinSelects();
                createFontSelects();
                createOverrideSelects();

                $("*").css("font-family", currentFont.default);

                $("#skinSelect").val(settings.skin);
                $("#langSelect").val(settings.language);

                $("#debugEnabled").prop("checked", settings.debug.enabled);

                $("#useWebTTS").prop("checked", settings.general.usewebtts);
                $("#useHDIcons").prop("checked", settings.general.usehdicons);
                $("#ttsEarly").val(settings.general.ttsearly);

                $("#customcss").val(settings.general.customcss);

                $("#includeAlliance").prop("checked", settings.includealliance);
                setPartyOrder(settings.rolepartyorder.tank);

                $("#healthBarEnabled").prop(
                    "checked",
                    settings.healthbar.enabled,
                );
                $("#healthHideOutOfCombat").prop(
                    "checked",
                    settings.healthbar.hideoutofcombat,
                );
                $("#healthTextEnabled").prop(
                    "checked",
                    settings.healthbar.textenabled,
                );
                $("#healthFormat").val(settings.healthbar.textformat);
                $("#healthColor").val(settings.healthbar.color);
                setExampleColor($("#healthColor"));
                $("#healthScale").attr("value", settings.healthbar.scale);
                $("#healthRotationRange").val(settings.healthbar.rotation);
                $("#healthRotation").val(settings.healthbar.rotation);
                $("#healthX").attr("value", settings.healthbar.x);
                $("#healthY").attr("value", settings.healthbar.y);
                $("#healthAlign").val(settings.healthbar.align);

                $("#healthFontXOffset").attr(
                    "value",
                    settings.healthbar.fontxoffset,
                );
                $("#healthFontYOffset").attr(
                    "value",
                    settings.healthbar.fontyoffset,
                );
                $("#healthStaticFontSizeEnabled").prop(
                    "checked",
                    settings.healthbar.staticfontsize,
                );
                $("#healthFontSize").attr("value", settings.healthbar.fontsize);

                $("#manaBarEnabled").prop("checked", settings.manabar.enabled);
                $("#manaHideOutOfCombat").prop(
                    "checked",
                    settings.manabar.hideoutofcombat,
                );
                $("#manaTextEnabled").prop(
                    "checked",
                    settings.manabar.textenabled,
                );
                $("#manaJobThresholdsEnabled").prop(
                    "checked",
                    settings.manabar.jobthresholdsenabled,
                );
                $("#manaFormat").val(settings.manabar.textformat);
                $("#manaColor").val(settings.manabar.color);
                $("#manaLowColor").val(settings.manabar.lowcolor);
                $("#manaMedColor").val(settings.manabar.medcolor);
                setExampleColor($("#manaColor"));
                $("#manaScale").attr("value", settings.manabar.scale);
                $("#manaRotationRange").val(settings.manabar.rotation);
                $("#manaRotation").val(settings.manabar.rotation);
                $("#manaX").attr("value", settings.manabar.x);
                $("#manaY").attr("value", settings.manabar.y);
                $("#manaAlign").val(settings.manabar.align);

                $("#manaFontXOffset").attr(
                    "value",
                    settings.manabar.fontxoffset,
                );
                $("#manaFontYOffset").attr(
                    "value",
                    settings.manabar.fontyoffset,
                );
                $("#manaStaticFontSizeEnabled").prop(
                    "checked",
                    settings.manabar.staticfontsize,
                );
                $("#manaFontSize").attr("value", settings.manabar.fontsize);

                $("#mptickerEnabled").prop(
                    "checked",
                    settings.mpticker.enabled,
                );
                $("#mptickerHideOutOfCombat").prop(
                    "checked",
                    settings.mpticker.hideoutofcombat,
                );
                $("#mptickerColor").val(settings.mpticker.color);
                setExampleColor($("#mptickerColor"));
                $("#mptickerScale").attr("value", settings.mpticker.scale);
                $("#mptickerRotationRange").val(settings.mpticker.rotation);
                $("#mptickerRotation").val(settings.mpticker.rotation);
                $("#mptickerX").attr("value", settings.mpticker.x);
                $("#mptickerY").attr("value", settings.mpticker.y);
                $("#mptickerSpecificJobsEnabled").prop(
                    "checked",
                    settings.mpticker.specificjobsenabled,
                );
                $("#mptickerAlwaysTick").prop(
                    "checked",
                    settings.mpticker.alwaystick,
                );
                createSpecificJobs(
                    "#mptickerSpecificJobs",
                    settings.mpticker.specificjobs,
                );

                $("#dottickerEnabled").prop(
                    "checked",
                    settings.dotticker.enabled,
                );
                $("#dottickerHideOutOfCombat").prop(
                    "checked",
                    settings.dotticker.hideoutofcombat,
                );
                $("#dottickerColor").val(settings.dotticker.color);
                setExampleColor($("#dottickerColor"));
                $("#dottickerScale").attr("value", settings.dotticker.scale);
                $("#dottickerRotationRange").val(settings.dotticker.rotation);
                $("#dottickerRotation").val(settings.dotticker.rotation);
                $("#dottickerX").attr("value", settings.dotticker.x);
                $("#dottickerY").attr("value", settings.dotticker.y);
                $("#dottickerSpecificJobsEnabled").prop(
                    "checked",
                    settings.dotticker.specificjobsenabled,
                );
                createSpecificJobs(
                    "#dottickerSpecificJobs",
                    settings.dotticker.specificjobs,
                );

                $("#hottickerEnabled").prop(
                    "checked",
                    settings.hotticker.enabled,
                );
                $("#hottickerHideOutOfCombat").prop(
                    "checked",
                    settings.hotticker.hideoutofcombat,
                );
                $("#hottickerColor").val(settings.hotticker.color);
                setExampleColor($("#hottickerColor"));
                $("#hottickerScale").attr("value", settings.hotticker.scale);
                $("#hottickerRotationRange").val(settings.hotticker.rotation);
                $("#hottickerRotation").val(settings.hotticker.rotation);
                $("#hottickerX").attr("value", settings.hotticker.x);
                $("#hottickerY").attr("value", settings.hotticker.y);
                $("#hottickerSpecificJobsEnabled").prop(
                    "checked",
                    settings.hotticker.specificjobsenabled,
                );
                createSpecificJobs(
                    "#hottickerSpecificJobs",
                    settings.hotticker.specificjobs,
                );

                $("#pulltimerBarEnabled").prop(
                    "checked",
                    settings.timerbar.enabled,
                );
                $("#pulltimerTextEnabled").prop(
                    "checked",
                    settings.timerbar.textenabled,
                );
                $("#pulltimerColor").val(settings.timerbar.color);
                setExampleColor($("#pulltimerColor"));
                $("#pulltimerScale").attr("value", settings.timerbar.scale);
                $("#pulltimerRotationRange").val(settings.timerbar.rotation);
                $("#pulltimerRotation").val(settings.timerbar.rotation);
                $("#pulltimerX").attr("value", settings.timerbar.x);
                $("#pulltimerY").attr("value", settings.timerbar.y);

                $("#pulltimerFontXOffset").attr(
                    "value",
                    settings.timerbar.fontxoffset,
                );
                $("#pulltimerFontYOffset").attr(
                    "value",
                    settings.timerbar.fontyoffset,
                );
                $("#pulltimerStaticFontSizeEnabled").prop(
                    "checked",
                    settings.timerbar.staticfontsize,
                );
                $("#pulltimerFontSize").attr(
                    "value",
                    settings.timerbar.fontsize,
                );

                $("#dotBarEnabled").prop(
                    "checked",
                    settings.dottimerbar.enabled,
                );
                $("#dotHideOutOfCombat").prop(
                    "checked",
                    settings.dottimerbar.hideoutofcombat,
                );
                $("#dotHideWhenDroppedOff").prop(
                    "checked",
                    settings.dottimerbar.hidewhendroppedoff,
                );
                $("#dotTextEnabled").prop(
                    "checked",
                    settings.dottimerbar.textenabled,
                );
                $("#dotTTSEnabled").prop(
                    "checked",
                    settings.dottimerbar.ttsenabled,
                );
                $("#multiDotEnabled").prop(
                    "checked",
                    settings.dottimerbar.multidotenabled,
                );
                $("#dotImageEnabled").prop(
                    "checked",
                    settings.dottimerbar.imageenabled,
                );
                $("#dotGrowDirection").val(settings.dottimerbar.growdirection);
                $("#dotPadding").attr("value", settings.dottimerbar.padding);
                $("#dotScale").attr("value", settings.dottimerbar.scale);
                $("#dotRotationRange").val(settings.dottimerbar.rotation);
                $("#dotRotation").val(settings.dottimerbar.rotation);
                $("#dotX").attr("value", settings.dottimerbar.x);
                $("#dotY").attr("value", settings.dottimerbar.y);

                $("#dotFontXOffset").attr(
                    "value",
                    settings.dottimerbar.fontxoffset,
                );
                $("#dotFontYOffset").attr(
                    "value",
                    settings.dottimerbar.fontyoffset,
                );
                $("#dotStaticFontSizeEnabled").prop(
                    "checked",
                    settings.dottimerbar.staticfontsize,
                );
                $("#dotFontSize").attr("value", settings.dottimerbar.fontsize);

                $("#buffBarEnabled").prop(
                    "checked",
                    settings.bufftimerbar.enabled,
                );
                $("#buffHideOutOfCombat").prop(
                    "checked",
                    settings.bufftimerbar.hideoutofcombat,
                );
                $("#buffHideWhenDroppedOff").prop(
                    "checked",
                    settings.bufftimerbar.hidewhendroppedoff,
                );
                $("#buffTextEnabled").prop(
                    "checked",
                    settings.bufftimerbar.textenabled,
                );
                $("#buffTTSEnabled").prop(
                    "checked",
                    settings.bufftimerbar.ttsenabled,
                );
                $("#buffImageEnabled").prop(
                    "checked",
                    settings.bufftimerbar.imageenabled,
                );
                $("#buffGrowDirection").val(
                    settings.bufftimerbar.growdirection,
                );
                $("#buffPadding").attr("value", settings.bufftimerbar.padding);
                $("#buffScale").attr("value", settings.bufftimerbar.scale);
                $("#buffRotationRange").val(settings.bufftimerbar.rotation);
                $("#buffRotation").val(settings.bufftimerbar.rotation);
                $("#buffX").attr("value", settings.bufftimerbar.x);
                $("#buffY").attr("value", settings.bufftimerbar.y);

                $("#buffFontXOffset").attr(
                    "value",
                    settings.bufftimerbar.fontxoffset,
                );
                $("#buffFontYOffset").attr(
                    "value",
                    settings.bufftimerbar.fontyoffset,
                );
                $("#buffStaticFontSizeEnabled").prop(
                    "checked",
                    settings.bufftimerbar.staticfontsize,
                );
                $("#buffFontSize").attr(
                    "value",
                    settings.bufftimerbar.fontsize,
                );

                $("#stacksBarEnabled").prop(
                    "checked",
                    settings.stacksbar.enabled,
                );
                $("#stacksHideOutOfCombat").prop(
                    "checked",
                    settings.stacksbar.hideoutofcombat,
                );
                $("#stacksColor").val(settings.stacksbar.color);
                setExampleColor($("#stacksColor"));
                $("#stacksScale").attr("value", settings.stacksbar.scale);
                $("#stacksX").attr("value", settings.stacksbar.x);
                $("#stacksY").attr("value", settings.stacksbar.y);

                $("#raidbuffBarEnabled").prop(
                    "checked",
                    settings.raidbuffs.enabled,
                );
                $("#raidbuffTTSEnabled").prop(
                    "checked",
                    settings.raidbuffs.ttsenabled,
                );
                $("#raidbuffHideOutOfCombat").prop(
                    "checked",
                    settings.raidbuffs.hideoutofcombat,
                );
                $("#raidbuffHideWhenSolo").prop(
                    "checked",
                    settings.raidbuffs.hidewhensolo,
                );
                $("#raidbuffOrderByPartyMember").prop(
                    "checked",
                    settings.raidbuffs.orderbypartymember,
                );
                $("#raidbuffAlwaysShow").prop(
                    "checked",
                    settings.raidbuffs.alwaysshow,
                );
                $("#raidbuffGrowLeft").prop(
                    "checked",
                    settings.raidbuffs.growleft,
                );
                $("#raidbuffColumns").attr("value", settings.raidbuffs.columns);
                $("#raidbuffPadding").attr("value", settings.raidbuffs.padding);
                $("#raidbuffScale").attr("value", settings.raidbuffs.scale);
                $("#raidbuffX").attr("value", settings.raidbuffs.x);
                $("#raidbuffY").attr("value", settings.raidbuffs.y);

                $("#raidbuffFontXOffset").attr(
                    "value",
                    settings.raidbuffs.fontxoffset,
                );
                $("#raidbuffFontYOffset").attr(
                    "value",
                    settings.raidbuffs.fontyoffset,
                );
                $("#raidbuffStaticFontSizeEnabled").prop(
                    "checked",
                    settings.raidbuffs.staticfontsize,
                );
                $("#raidbuffFontSize").attr(
                    "value",
                    settings.raidbuffs.fontsize,
                );

                $("#raidbuffDurationOutline").prop(
                    "checked",
                    settings.raidbuffs.durationoutline,
                );
                $("#raidbuffDurationBold").prop(
                    "checked",
                    settings.raidbuffs.durationbold,
                );
                $("#raidbuffCooldownOutline").prop(
                    "checked",
                    settings.raidbuffs.cooldownoutline,
                );
                $("#raidbuffCooldownBold").prop(
                    "checked",
                    settings.raidbuffs.cooldownbold,
                );
                $("#raidbuffDurationColorPicker").attr(
                    "value",
                    settings.raidbuffs.durationcolor,
                );
                $("#raidbuffCooldownColorPicker").attr(
                    "value",
                    settings.raidbuffs.cooldowncolor,
                );
                $("#raidbuffDurationOutlineColorPicker").attr(
                    "value",
                    settings.raidbuffs.durationoutlinecolor,
                );
                $("#raidbuffCooldownOutlineColorPicker").attr(
                    "value",
                    settings.raidbuffs.cooldownoutlinecolor,
                );

                $("#mitigationBarEnabled").prop(
                    "checked",
                    settings.mitigation.enabled,
                );
                $("#mitigationTTSEnabled").prop(
                    "checked",
                    settings.mitigation.ttsenabled,
                );
                $("#mitigationHideOutOfCombat").prop(
                    "checked",
                    settings.mitigation.hideoutofcombat,
                );
                $("#mitigationHideWhenSolo").prop(
                    "checked",
                    settings.mitigation.hidewhensolo,
                );
                $("#mitigationAlwaysShow").prop(
                    "checked",
                    settings.mitigation.alwaysshow,
                );
                $("#mitigationGrowLeft").prop(
                    "checked",
                    settings.mitigation.growleft,
                );
                $("#mitigationColumns").attr(
                    "value",
                    settings.mitigation.columns,
                );
                $("#mitigationPadding").attr(
                    "value",
                    settings.mitigation.padding,
                );
                $("#mitigationScale").attr("value", settings.mitigation.scale);
                $("#mitigationX").attr("value", settings.mitigation.x);
                $("#mitigationY").attr("value", settings.mitigation.y);

                $("#mitigationFontXOffset").attr(
                    "value",
                    settings.mitigation.fontxoffset,
                );
                $("#mitigationFontYOffset").attr(
                    "value",
                    settings.mitigation.fontyoffset,
                );
                $("#mitigationStaticFontSizeEnabled").prop(
                    "checked",
                    settings.mitigation.staticfontsize,
                );
                $("#mitigationFontSize").attr(
                    "value",
                    settings.mitigation.fontsize,
                );

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
                $("#mitigationDurationColorPicker").attr(
                    "value",
                    settings.mitigation.durationcolor,
                );
                $("#mitigationCooldownColorPicker").attr(
                    "value",
                    settings.mitigation.cooldowncolor,
                );
                $("#mitigationDurationOutlineColorPicker").attr(
                    "value",
                    settings.mitigation.durationoutlinecolor,
                );
                $("#mitigationCooldownOutlineColorPicker").attr(
                    "value",
                    settings.mitigation.cooldownoutlinecolor,
                );

                $("#partyBarEnabled").prop("checked", settings.party.enabled);
                $("#partyTTSEnabled").prop(
                    "checked",
                    settings.party.ttsenabled,
                );
                $("#partyHideOutOfCombat").prop(
                    "checked",
                    settings.party.hideoutofcombat,
                );
                $("#partyHideWhenSolo").prop(
                    "checked",
                    settings.party.hidewhensolo,
                );
                $("#partyAlwaysShow").prop(
                    "checked",
                    settings.party.alwaysshow,
                );
                $("#partyGrowLeft").prop("checked", settings.party.growleft);
                $("#partyPadding").attr("value", settings.party.padding);
                $("#partyScale").attr("value", settings.party.scale);
                $("#partyX").attr("value", settings.party.x);
                $("#partyY").attr("value", settings.party.y);

                $("#partyFontXOffset").attr(
                    "value",
                    settings.party.fontxoffset,
                );
                $("#partyFontYOffset").attr(
                    "value",
                    settings.party.fontyoffset,
                );
                $("#partyStaticFontSizeEnabled").prop(
                    "checked",
                    settings.party.staticfontsize,
                );
                $("#partyFontSize").attr("value", settings.party.fontsize);

                $("#partyDurationOutline").prop(
                    "checked",
                    settings.party.durationoutline,
                );
                $("#partyDurationBold").prop(
                    "checked",
                    settings.party.durationbold,
                );
                $("#partyCooldownOutline").prop(
                    "checked",
                    settings.party.cooldownoutline,
                );
                $("#partyCooldownBold").prop(
                    "checked",
                    settings.party.cooldownbold,
                );
                $("#partyDurationColorPicker").attr(
                    "value",
                    settings.party.durationcolor,
                );
                $("#partyCooldownColorPicker").attr(
                    "value",
                    settings.party.cooldowncolor,
                );
                $("#partyDurationOutlineColorPicker").attr(
                    "value",
                    settings.party.durationoutlinecolor,
                );
                $("#partyCooldownOutlineColorPicker").attr(
                    "value",
                    settings.party.cooldownoutlinecolor,
                );

                $("#customcdEnabled").prop(
                    "checked",
                    settings.customcd.enabled,
                );
                $("#customcdTTSEnabled").prop(
                    "checked",
                    settings.customcd.ttsenabled,
                );
                $("#customcdHideOutOfCombat").prop(
                    "checked",
                    settings.customcd.hideoutofcombat,
                );
                $("#customcdHideWhenSolo").prop(
                    "checked",
                    settings.customcd.hidewhensolo,
                );
                $("#customcdAlwaysShow").prop(
                    "checked",
                    settings.customcd.alwaysshow,
                );
                $("#customcdGrowLeft").prop(
                    "checked",
                    settings.customcd.growleft,
                );
                $("#customcdPadding").attr("value", settings.customcd.padding);
                $("#customcdScale").attr("value", settings.customcd.scale);
                $("#customcdColumns").attr("value", settings.customcd.columns);
                $("#customcdX").attr("value", settings.customcd.x);
                $("#customcdY").attr("value", settings.customcd.y);

                $("#customcdFontXOffset").attr(
                    "value",
                    settings.customcd.fontxoffset,
                );
                $("#customcdFontYOffset").attr(
                    "value",
                    settings.customcd.fontyoffset,
                );
                $("#customcdStaticFontSizeEnabled").prop(
                    "checked",
                    settings.customcd.staticfontsize,
                );
                $("#customcdFontSize").attr(
                    "value",
                    settings.customcd.fontsize,
                );

                $("#customcdDurationOutline").prop(
                    "checked",
                    settings.customcd.durationoutline,
                );
                $("#customcdDurationBold").prop(
                    "checked",
                    settings.customcd.durationbold,
                );
                $("#customcdCooldownOutline").prop(
                    "checked",
                    settings.customcd.cooldownoutline,
                );
                $("#customcdCooldownBold").prop(
                    "checked",
                    settings.customcd.cooldownbold,
                );
                $("#customcdDurationColorPicker").attr(
                    "value",
                    settings.customcd.durationcolor,
                );
                $("#customcdCooldownColorPicker").attr(
                    "value",
                    settings.customcd.cooldowncolor,
                );
                $("#customcdDurationOutlineColorPicker").attr(
                    "value",
                    settings.customcd.durationoutlinecolor,
                );
                $("#customcdCooldownOutlineColorPicker").attr(
                    "value",
                    settings.customcd.cooldownoutlinecolor,
                );
                switchCustomcdMode();

                $("[id$=ColorPicker]").colorpicker();
            });
        } else {
            $("#language").attr("src", `data/language/${settings.language}.js`);
        }
    }
}

function setOption(option, value) {
    if (currentSettings.profiles.currentprofile) {
        currentSettings.profiles.profiles[
            currentSettings.profiles.currentprofile
        ][option] = value;
    }
    currentSettings[option] = value;
}

function saveAllSettings() {
    saveCurrentPartyRoleOrder();

    let settings = {
        profiles: JSON.parse(JSON.stringify(currentSettings.profiles)),
        skin: $("#skinSelect").val(),
        language: $("#langSelect").val(),
        font: $("#defaultFont").val(),
        customfonts: currentSettings.customfonts,
        includealliance: $("#includeAlliance").is(":checked"),
        partyorder: sortable("#partyOrder", "serialize")[0].items,
        rolepartyorder: currentSettings.rolepartyorder,
        override: currentSettings.override,
        debug: {
            enabled: $("#debugEnabled").is(":checked"),
        },
        general: {
            usewebtts: $("#useWebTTS").is(":checked"),
            ttsearly: $("#ttsEarly").val(),
            usehdicons: $("#useHDIcons").is(":checked"),
            customcss: $("#customcss").val(),
        },
        healthbar: {
            enabled: $("#healthBarEnabled").is(":checked"),
            hideoutofcombat: $("#healthHideOutOfCombat").is(":checked"),
            textenabled: $("#healthTextEnabled").is(":checked"),
            textformat: $("#healthFormat").val(),
            color: $("#healthColor").val(),
            scale: $("#healthScale").val(),
            rotation: $("#healthRotation").val(),
            x: parseInt($("#healthX").val()),
            y: parseInt($("#healthY").val()),
            align: $("#healthAlign").val(),
            font: $("#healthFont").val(),
            fontxoffset: parseInt($("#healthFontXOffset").val()),
            fontyoffset: parseInt($("#healthFontYOffset").val()),
            staticfontsize: $("#healthStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt($("#healthFontSize").val()),
        },
        manabar: {
            BLM: currentSettings.manabar.BLM,
            DRK: currentSettings.manabar.DRK,
            PLD: currentSettings.manabar.PLD,
            enabled: $("#manaBarEnabled").is(":checked"),
            hideoutofcombat: $("#manaHideOutOfCombat").is(":checked"),
            textenabled: $("#manaTextEnabled").is(":checked"),
            jobthresholdsenabled: $("#manaJobThresholdsEnabled").is(":checked"),
            textformat: $("#manaFormat").val(),
            color: $("#manaColor").val(),
            lowcolor: $("#manaLowColor").val(),
            medcolor: $("#manaMedColor").val(),
            scale: $("#manaScale").val(),
            rotation: $("#manaRotation").val(),
            x: parseInt($("#manaX").val()),
            y: parseInt($("#manaY").val()),
            align: $("#manaAlign").val(),
            font: $("#manaFont").val(),
            fontxoffset: parseInt($("#manaFontXOffset").val()),
            fontyoffset: parseInt($("#manaFontYOffset").val()),
            staticfontsize: $("#manaStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt($("#manaFontSize").val()),
        },
        mpticker: {
            enabled: $("#mptickerEnabled").is(":checked"),
            hideoutofcombat: $("#mptickerHideOutOfCombat").is(":checked"),
            color: $("#mptickerColor").val(),
            scale: $("#mptickerScale").val(),
            rotation: $("#mptickerRotation").val(),
            x: parseInt($("#mptickerX").val()),
            y: parseInt($("#mptickerY").val()),
            specificjobsenabled: $("#mptickerSpecificJobsEnabled").is(
                ":checked",
            ),
            specificjobs: currentSettings.mpticker.specificjobs,
            alwaystick: $("#mptickerAlwaysTick").is(":checked"),
        },
        dotticker: {
            enabled: $("#dottickerEnabled").is(":checked"),
            hideoutofcombat: $("#dottickerHideOutOfCombat").is(":checked"),
            color: $("#dottickerColor").val(),
            scale: $("#dottickerScale").val(),
            rotation: $("#dottickerRotation").val(),
            x: parseInt($("#dottickerX").val()),
            y: parseInt($("#dottickerY").val()),
            specificjobsenabled: $("#dottickerSpecificJobsEnabled").is(
                ":checked",
            ),
            specificjobs: currentSettings.dotticker.specificjobs,
        },
        hotticker: {
            enabled: $("#hottickerEnabled").is(":checked"),
            hideoutofcombat: $("#hottickerHideOutOfCombat").is(":checked"),
            color: $("#hottickerColor").val(),
            scale: $("#hottickerScale").val(),
            rotation: $("#hottickerRotation").val(),
            x: parseInt($("#hottickerX").val()),
            y: parseInt($("#hottickerY").val()),
            specificjobsenabled: $("#hottickerSpecificJobsEnabled").is(
                ":checked",
            ),
            specificjobs: currentSettings.hotticker.specificjobs,
        },
        timerbar: {
            enabled: $("#pulltimerBarEnabled").is(":checked"),
            textenabled: $("#pulltimerTextEnabled").is(":checked"),
            color: $("#pulltimerColor").val(),
            scale: $("#pulltimerScale").val(),
            rotation: $("#pulltimerRotation").val(),
            x: parseInt($("#pulltimerX").val()),
            y: parseInt($("#pulltimerY").val()),
            font: $("#pulltimerFont").val(),
            fontxoffset: parseInt($("#pulltimerFontXOffset").val()),
            fontyoffset: parseInt($("#pulltimerFontYOffset").val()),
            staticfontsize: $("#pulltimerStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt($("#pulltimerFontSize").val()),
        },
        dottimerbar: {
            enabled: $("#dotBarEnabled").is(":checked"),
            hideoutofcombat: $("#dotHideOutOfCombat").is(":checked"),
            hidewhendroppedoff: $("#dotHideWhenDroppedOff").is(":checked"),
            textenabled: $("#dotBarTextEnabled").is(":checked"),
            ttsenabled: $("#dotTTSEnabled").is(":checked"),
            imageenabled: $("#dotImageEnabled").is(":checked"),
            multidotenabled: $("#multiDotEnabled").is(":checked"),
            growdirection: $("#dotGrowDirection").val(),
            padding: $("#dotPadding").val(),
            scale: $("#dotScale").val(),
            rotation: $("#dotRotation").val(),
            x: parseInt($("#dotX").val()),
            y: parseInt($("#dotY").val()),
            font: $("#dotFont").val(),
            fontxoffset: parseInt($("#dotFontXOffset").val()),
            fontyoffset: parseInt($("#dotFontYOffset").val()),
            staticfontsize: $("#dotStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt($("#dotFontSize").val()),
        },
        bufftimerbar: {
            enabled: $("#buffBarEnabled").is(":checked"),
            hideoutofcombat: $("#buffHideOutOfCombat").is(":checked"),
            hidewhendroppedoff: $("#buffHideWhenDroppedOff").is(":checked"),
            textenabled: $("#buffBarTextEnabled").is(":checked"),
            ttsenabled: $("#buffTTSEnabled").is(":checked"),
            imageenabled: $("#buffImageEnabled").is(":checked"),
            growdirection: $("#buffGrowDirection").val(),
            padding: $("#buffPadding").val(),
            scale: $("#buffScale").val(),
            rotation: $("#buffRotation").val(),
            x: parseInt($("#buffX").val()),
            y: parseInt($("#buffY").val()),
            font: $("#buffFont").val(),
            fontxoffset: parseInt($("#buffFontXOffset").val()),
            fontyoffset: parseInt($("#buffFontYOffset").val()),
            staticfontsize: $("#buffStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt($("#buffFontSize").val()),
        },
        stacksbar: {
            enabled: $("#stacksBarEnabled").is(":checked"),
            hideoutofcombat: $("#stacksHideOutOfCombat").is(":checked"),
            color: $("#stacksColor").val(),
            scale: $("#stacksScale").val(),
            x: parseInt($("#stacksX").val()),
            y: parseInt($("#stacksY").val()),
        },
        raidbuffs: {
            enabled: $("#raidbuffBarEnabled").is(":checked"),
            ttsenabled: $("#raidbuffTTSEnabled").is(":checked"),
            hideoutofcombat: $("#raidbuffHideOutOfCombat").is(":checked"),
            hidewhensolo: $("#raidbuffHideWhenSolo").is(":checked"),
            orderbypartymember: $("#raidbuffOrderByPartyMember").is(":checked"),
            alwaysshow: $("#raidbuffAlwaysShow").is(":checked"),
            growleft: $("#raidbuffGrowLeft").is(":checked"),
            columns: $("#raidbuffColumns").val(),
            padding: $("#raidbuffPadding").val(),
            scale: $("#raidbuffScale").val(),
            x: parseInt($("#raidbuffX").val()),
            y: parseInt($("#raidbuffY").val()),
            font: $("#raidbuffFont").val(),
            fontxoffset: parseInt($("#raidbuffFontXOffset").val()),
            fontyoffset: parseInt($("#raidbuffFontYOffset").val()),
            staticfontsize: $("#raidbuffStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt($("#raidbuffFontSize").val()),
            durationoutline: $("#raidbuffDurationOutline").is(":checked"),
            durationbold: $("#raidbuffDurationBold").is(":checked"),
            cooldownoutline: $("#raidbuffCooldownOutline").is(":checked"),
            cooldownbold: $("#raidbuffCooldownBold").is(":checked"),
            durationcolor: $("#raidbuffDurationColorPicker").val(),
            cooldowncolor: $("#raidbuffCooldownColorPicker").val(),
            durationoutlinecolor: $(
                "#raidbuffDurationOutlineColorPicker",
            ).val(),
            cooldownoutlinecolor: $(
                "#raidbuffCooldownOutlineColorPicker",
            ).val(),
        },
        mitigation: {
            enabled: $("#mitigationBarEnabled").is(":checked"),
            ttsenabled: $("#mitigationTTSEnabled").is(":checked"),
            hideoutofcombat: $("#mitigationHideOutOfCombat").is(":checked"),
            hidewhensolo: $("#mitigationHideWhenSolo").is(":checked"),
            alwaysshow: $("#mitigationAlwaysShow").is(":checked"),
            growleft: $("#mitigationGrowLeft").is(":checked"),
            columns: $("#mitigationColumns").val(),
            padding: $("#mitigationPadding").val(),
            scale: $("#mitigationScale").val(),
            x: parseInt($("#mitigationX").val()),
            y: parseInt($("#mitigationY").val()),
            font: $("#mitigationFont").val(),
            fontxoffset: parseInt($("#mitigationFontXOffset").val()),
            fontyoffset: parseInt($("#mitigationFontYOffset").val()),
            staticfontsize: $("#mitigationStaticFontSizeEnabled").is(
                ":checked",
            ),
            fontsize: parseInt($("#mitigationFontSize").val()),
            durationoutline: $("#mitigationDurationOutline").is(":checked"),
            durationbold: $("#mitigationDurationBold").is(":checked"),
            cooldownoutline: $("#mitigationCooldownOutline").is(":checked"),
            cooldownbold: $("#mitigationCooldownBold").is(":checked"),
            durationcolor: $("#mitigationDurationColorPicker").val(),
            cooldowncolor: $("#mitigationCooldownColorPicker").val(),
            durationoutlinecolor: $(
                "#mitigationDurationOutlineColorPicker",
            ).val(),
            cooldownoutlinecolor: $(
                "#mitigationCooldownOutlineColorPicker",
            ).val(),
        },
        party: {
            enabled: $("#partyBarEnabled").is(":checked"),
            ttsenabled: $("#partyTTSEnabled").is(":checked"),
            hideoutofcombat: $("#partyHideOutOfCombat").is(":checked"),
            hidewhensolo: $("#partyHideWhenSolo").is(":checked"),
            alwaysshow: $("#partyAlwaysShow").is(":checked"),
            growleft: $("#partyGrowLeft").is(":checked"),
            padding: $("#partyPadding").val(),
            scale: $("#partyScale").val(),
            x: parseInt($("#partyX").val()),
            y: parseInt($("#partyY").val()),
            font: $("#partyFont").val(),
            fontxoffset: parseInt($("#partyFontXOffset").val()),
            fontyoffset: parseInt($("#partyFontYOffset").val()),
            staticfontsize: $("#partyStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt($("#partyFontSize").val()),
            durationoutline: $("#partyDurationOutline").is(":checked"),
            durationbold: $("#partyDurationBold").is(":checked"),
            cooldownoutline: $("#partyCooldownOutline").is(":checked"),
            cooldownbold: $("#partyCooldownBold").is(":checked"),
            durationcolor: $("#partyDurationColorPicker").val(),
            cooldowncolor: $("#partyCooldownColorPicker").val(),
            durationoutlinecolor: $("#partyDurationOutlineColorPicker").val(),
            cooldownoutlinecolor: $("#partyCooldownOutlineColorPicker").val(),
        },
        customcd: {
            abilities: currentSettings.customcd.abilities,
            enabled: $("#customcdEnabled").is(":checked"),
            ttsenabled: $("#customcdTTSEnabled").is(":checked"),
            hideoutofcombat: $("#customcdHideOutOfCombat").is(":checked"),
            hidewhensolo: $("#customcdHideWhenSolo").is(":checked"),
            alwaysshow: $("#customcdAlwaysShow").is(":checked"),
            growleft: $("#customcdGrowLeft").is(":checked"),
            padding: $("#customcdPadding").val(),
            scale: $("#customcdScale").val(),
            columns: $("#customcdColumns").val(),
            x: parseInt($("#customcdX").val()),
            y: parseInt($("#customcdY").val()),
            font: $("#customcdFont").val(),
            fontxoffset: parseInt($("#customcdFontXOffset").val()),
            fontyoffset: parseInt($("#customcdFontYOffset").val()),
            staticfontsize: $("#customcdStaticFontSizeEnabled").is(":checked"),
            fontsize: parseInt($("#customcdFontSize").val()),
            durationoutline: $("#customcdDurationOutline").is(":checked"),
            durationbold: $("#customcdDurationBold").is(":checked"),
            cooldownoutline: $("#customcdCooldownOutline").is(":checked"),
            cooldownbold: $("#customcdCooldownBold").is(":checked"),
            durationcolor: $("#customcdDurationColorPicker").val(),
            cooldowncolor: $("#customcdCooldownColorPicker").val(),
            durationoutlinecolor: $(
                "#customcdDurationOutlineColorPicker",
            ).val(),
            cooldownoutlinecolor: $(
                "#customcdCooldownOutlineColorPicker",
            ).val(),
        },
    };

    currentSettings = settings;
}

/* exported saveSettingsAndProfile */
function saveSettingsAndProfile(
    closeWindow = true,
    showPopup = false,
    dontUseForms = false,
) {
    if (currentSettings.profiles.currentprofile) {
        saveProfile(true, closeWindow, showPopup, false, dontUseForms);
    } else {
        saveSettings(closeWindow, showPopup, false, dontUseForms);
    }
}

async function saveSettings(
    closeWindow = true,
    showPopup = false,
    dontReload = false,
    dontUseForms = false,
) {
    if (!dontUseForms) saveAllSettings();

    let settings = JSON.parse(JSON.stringify(currentSettings));

    await callCurrentOverlayHandler({
        call: "saveData",
        key: "zeffUI",
        data: settings,
    });
    localStorage.setItem("settings", JSON.stringify(settings));
    if (closeWindow) {
        if (showPopup) {
            if (
                !confirm(
                    language.find((x) => x.id === "saveandclosewindow").string,
                )
            ) {
                return;
            }
        }
        window.close();
    } else {
        if (!dontReload) location.reload();
    }
}

/* exported deleteSettings */
async function deleteSettings() {
    if (confirm(language.find((x) => x.id === "deleteallsettings").string)) {
        let lang = currentSettings.language;
        let profiles = JSON.parse(JSON.stringify(currentSettings.profiles));
        let newSettings = await checkAndInitializeDefaultSettingsObject(
            {},
            lang,
        );
        let includeProfiles = $("#includeProfiles").prop("checked");
        currentSettings = newSettings;

        if (!includeProfiles) {
            currentSettings.profiles = profiles;
        }

        saveSettingsAndProfile(true, true, true);
    }
}
