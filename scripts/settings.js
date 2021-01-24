// ZeffUI globals
/* global abilityList, language */

var currentSettings = null;
var currentFont = {};
var foundAbilities = [];
var removedAbility = {};

$(function() {
    $("[id$=Color]").each(function () {
        setExampleColor(this);
    });

    $("[id$=Color]").change(function() {
        setExampleColor(this);
    });

    $("[id$=GrowDirection]").change(function() {
        setPadding(this);
    });

    $("#dotScale").change(function() {
        setPadding($(`#${$(this).attr("id").replace("Scale", "GrowDirection")}`));
    });

    $("#buffScale").change(function() {
        setPadding($(`#${$(this).attr("id").replace("Scale", "GrowDirection")}`));
    });
    
    $("#customcdSearch").keyup(function(event){
        if(event.keyCode == 13){
            $("#customcdSearchButton").click();
        }
    });

    loadSettings();
});



function setPadding(element){
    let selector = $(element).attr("id").replace("GrowDirection", "");
    if($(element).val() <= 2){
        $(`#${selector}Padding`).val($(`#${selector}Scale`).val() * 20);
    }else{
        $(`#${selector}Padding`).val($(`#${selector}Scale`).val() * 180);
    }
}

function setExampleColor(element){
    let selector = $(element).attr("id").replace("Color", "");
    if(!selector.startsWith("stacks")){
        $(`#${selector}Example`).css(`--${selector}Color`, `var(${$(element).val()})`);
    }else{
        $(`#${selector}-1`).css(`--${selector}Color`, `var(${$(element).val()})`);
        $(`#${selector}-2`).css(`--${selector}Color`, `var(${$(element).val()})`);
        $(`#${selector}-3`).css(`--${selector}Color`, `var(${$(element).val()})`);
        $(`#${selector}-4`).css(`--${selector}Color`, `var(${$(element).val()})`);
    }
}

function setPartyOrder(partyOrder){
    for(let job of partyOrder){
        // Initially used the wrong job shorthand, need this to not break people's party orders.
        if(job == "GLD") job = "GLA";
        $("#partyOrder").append(`<tr data-job="${job}"><td style="width:5%"><img src="data/images/jobicons/${job}.png"></td><td style="width:95%">${language.find(x => x.id === job.toLowerCase()).string}</td></tr>`);
        $("#partyOrder").sortable();
    }
}

function titleCase(string){
    return string.toLowerCase().split(" ").map(function(word) {
        return word.replace(word[0], word[0].toUpperCase());
    }).join(" ");
}

function createColorSelects(){
    for (let colorFilter of getBarColors()){
        let color = colorFilter.replace("--filter-", "").replace("-", "");
        let colorString = language.find(x => x.id === `color${color}`).string;
        $("[id$=Color]").append(`<option value="${colorFilter}">${titleCase(colorString)}</option>`);
    }
}

function createSkinSelects(){
    $("#skinSelect").append(`<option value="default">${language.find(x => x.id === "skindefault").string}</option>`);
    $("#skinSelect").append(`<option value="material-dark">${language.find(x => x.id === "skinmaterialdark").string}</option>`);
    $("#skinSelect").append(`<option value="material-discord">${language.find(x => x.id === "skinmaterialdiscord").string}</option>`);
}

function createFontSelects(){
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
    let fontCheck = new Set([
        // Windows 10
        "Arial", "Arial Black", "Bahnschrift", "Calibri", "Cambria", "Cambria Math", "Candara", "Comic Sans MS", "Consolas", "Constantia", "Corbel", "Courier New", "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia", "HoloLens MDL2 Assets", "Impact", "Ink Free", "Javanese Text", "Leelawadee UI", "Lucida Console", "Lucida Sans Unicode", "Malgun Gothic", "Marlett", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB", "Mongolian Baiti", "MS Gothic", "MV Boli", "Myanmar Text", "Nirmala UI", "Palatino Linotype", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Historic", "Segoe UI Emoji", "Segoe UI Symbol", "SimSun", "Sitka", "Sylfaen", "Symbol", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana", "Webdings", "Wingdings", "Yu Gothic",
        // macOS
        "American Typewriter", "Andale Mono", "Arial", "Arial Black", "Arial Narrow", "Arial Rounded MT Bold", "Arial Unicode MS", "Avenir", "Avenir Next", "Avenir Next Condensed", "Baskerville", "Big Caslon", "Bodoni 72", "Bodoni 72 Oldstyle", "Bodoni 72 Smallcaps", "Bradley Hand", "Brush Script MT", "Chalkboard", "Chalkboard SE", "Chalkduster", "Charter", "Cochin", "Comic Sans MS", "Copperplate", "Courier", "Courier New", "Didot", "DIN Alternate", "DIN Condensed", "Futura", "Geneva", "Georgia", "Gill Sans", "Helvetica", "Helvetica Neue", "Herculanum", "Hoefler Text", "Impact", "Lucida Grande", "Luminari", "Marker Felt", "Menlo", "Microsoft Sans Serif", "Monaco", "Noteworthy", "Optima", "Palatino", "Papyrus", "Phosphate", "Rockwell", "Savoye LET", "SignPainter", "Skia", "Snell Roundhand", "Tahoma", "Times", "Times New Roman", "Trattatello", "Trebuchet MS", "Verdana", "Zapfino",
    ].sort());

    (async() => {
        await document.fonts.ready;
        for (const font of fontCheck.values()) {
            if (document.fonts.check(`12px "${font}"`)) {                            
                $("#defaultFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#healthFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#manaFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#pulltimerFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#buffFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#dotFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#raidbuffFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#mitigationFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#partyFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
                $("#customcdFont").append(`<option value="${font}" style="font-family:${font}">${font}</option>`);
            }
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

function createOverrideSelects(){
    for (let ability of abilityList){
        let override = currentSettings.override.abilities.find(x => x.id == ability.id);
        let name = ability[`name_${currentSettings.language}`];
        $("#overrideSelect").append(`<option value="${ability.id}">${override != null ? "[Override] " : "" }${language.find(x => x.id === ability.job.toLowerCase()).string}: ${name} (${ability.type})</option>`);
    }
    loadAbility();
    toggleOverride();
}

function processLanguage(){
    $("[id^=lang_]").each(function() {
        let id = $(this).attr("id").split("_")[1];
        let object = language.find(x => x.id === id);
        if(object != null){
            let string = language.find(x => x.id === id).string;
            $(this).text(string);
        }else{
            console.log(`Missing translation for ${id}`);
        }
    });
}

function toggleOverride(){
    let checked = $("#abilityOverrideEnabled").is(":checked");
    let id = $("#overrideSelect").val();
    let override = currentSettings.override.abilities.find(x => x.id == id);
    
    if(checked){
        $("#abilityEnabled").removeAttr("disabled");
        $("#abilityColor").removeAttr("disabled");
        $("#abilityDuration").removeAttr("disabled");
        $("#abilityCooldown").removeAttr("disabled");
        $("#abilityOrder").removeAttr("disabled");
        $("#abilityTTSEnabled").removeAttr("disabled");
        $("#abilityTTSType").removeAttr("disabled");
        if (override == null) currentSettings.override.abilities.push(abilityList.find(x => x.id == id));
    }else{
        $("#abilityEnabled").attr("disabled","disabled");
        $("#abilityColor").attr("disabled","disabled");
        $("#abilityDuration").attr("disabled","disabled");
        $("#abilityCooldown").attr("disabled","disabled");
        $("#abilityOrder").attr("disabled","disabled");
        $("#abilityTTSEnabled").attr("disabled","disabled");
        $("#abilityTTSType").attr("disabled","disabled");
        currentSettings.override.abilities = currentSettings.override.abilities.filter(x => x.id != id);
    }
}

/* exported saveOverride */
function saveOverride(type){
    let id = $("#overrideSelect").val();
    switch(type){
    case "color":
        currentSettings.override.abilities.find(x => x.id == id).color = $("#abilityColor").val();
        break;
    case "enabled":
        currentSettings.override.abilities.find(x => x.id == id).enabled = $("#abilityEnabled").is(":checked");
        break;
    case "cooldown":
        currentSettings.override.abilities.find(x => x.id == id).cooldown = $("#abilityCooldown").val();
        break;
    case "order":
        currentSettings.override.abilities.find(x => x.id == id).order = $("#abilityOrder").val();
        break;
    case "duration":
        currentSettings.override.abilities.find(x => x.id == id).duration = $("#abilityDuration").val();
        break;
    case "tts":
        currentSettings.override.abilities.find(x => x.id == id).tts = $("#abilityTTSEnabled").is(":checked");
        break;
    case "ttstype":
        currentSettings.override.abilities.find(x => x.id == id).ttstype = parseInt($("#abilityTTSType").val());
        break;
    }
}

/* exported searchCustomAbility */
function searchCustomAbility(){
    let query = $("#customcdSearch").val();
    $("#customcdAbilitySelectDiv").hide();
    $("#customcdIconPreview").hide();
    toggleCustomCdOptions(false);
    $("#customcdIconPreviewDiv").append("<div id=\"customcdLoading\" class=\"spinner-border\" role=\"status\"><span class=\"sr-only\">Loading...</span></div>");
    $.getJSON(`http://fakegaming.eu/ffxiv/spellname/index.php?name=${query}&type=action&lang=${currentSettings.language}`, function(data){
        foundAbilities = data;
        $("#customcdAbilitySelect").empty();
        $("#customcdLoading").remove();
        $("#customcdIconPreview").show();
        $("#customcdAbilitySelectDiv").show();
        toggleCustomCdOptions(foundAbilities.length !== 0);
        if(foundAbilities.length === 0){
            $("#customcdAbilityNoAbilitiesDiv").show();
            return;
        }
        
        for(let ability of data){
            if(ability.IsPlayerAction){
                let name = ability[`Name_${currentSettings.language}`];
                if(ability.IsPvP) name = `[${language.find(x => x.id === "pvp").string}] ${name}`;
                $("#customcdAbilitySelect").append(`<option value="${ability.ID}">${name}</option>`);
            }
        }
        
        loadCustomCdAbility();
    });
}

function switchCustomcdMode(){
    switch($("#customcdMode").val()){
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

function loadCustomCdAbilitySelect(){
    $("#customcdAbilitySelect").empty();
    $("#customcdAbilityNoAbilitiesDiv").hide();
    toggleCustomCdOptions(true);
    if (currentSettings.customcd.abilities.length === 0){                    
        $("#customcdAbilitySelectDiv").hide();
        $("#customcdAbilityNoAbilitiesDiv").show();
        toggleCustomCdOptions(false);
        return;
    }
    for(let ability of currentSettings.customcd.abilities){
        let name = ability[`name_${currentSettings.language}`];
        $("#customcdAbilitySelect").append(`<option value="${ability.id}">${language.find(x => x.id === ability.job.toLowerCase()).string}: ${name}</option>`);
    }
    loadCustomCdAbility();
}

function loadCustomCdAbility(){
    let id = $("#customcdAbilitySelect").val();
    let ability = {};				
    toggleCustomCdOptions(true);
    switch($("#customcdMode").val()){
    case "0":
        ability = currentSettings.customcd.abilities.find(x => x.id == id);
        $("#customcdIconPreview").prop("src", ability.icon);
        $("#customcdAbilityId").val(ability.id);
        $("#customcdAbilityEnabled").prop("checked", ability.enabled);
        $("#customcdAbilityTTSEnabled").prop("checked", ability.tts);
        $("#customcdAbilityTTSType").val(ability.ttstype);
        $("#customcdAbilityJob").val(ability.job);
        $("#customcdAbilityDuration").val(ability.duration);
        $("#customcdAbilityCooldown").val(ability.cooldown);
        $("#customcdAbilityOrder").val(ability.order);
        break;
    case "1":					
        ability = foundAbilities.find(x => x.ID == id);
        $("#customcdIconPreview").prop("src", `https://xivapi.com${ability.Icon}`);
        $("#customcdAbilityId").val(ability.ID);
        $("#customcdAbilityEnabled").prop("checked", true);
        $("#customcdAbilityTTSEnabled").prop("checked", true);
        $("#customcdAbilityTTSType").val(0);
        ability.ClassJob.Abbreviation !== null ? $("#customcdAbilityJob").val(ability.ClassJob.Abbreviation) : $("#customcdAbilityJob").val("Tank");
        $("#customcdAbilityJob").val(ability.ClassJob.Abbreviation);
        $("#customcdAbilityDuration").val(ability.Duration);
        $("#customcdAbilityCooldown").val(ability.Cooldown);
        $("#customcdAbilityOrder").val(0);
        break;
    }
}

/* exported addCustomAbility */
function addCustomAbility(){
    let addAbility = {};
    let ability = {};
    let id = $("#customcdAbilitySelect").val();
    switch($("#customcdMode").val()){
    case "0":
    {
        ability = removedAbility;
        addAbility = 
            {
                id: $("#customcdAbilityId").val(),
                name: ability.name,
                name_cn: ability.name_cn,
                name_de: ability.name_de,
                name_en: ability.name_en,
                name_fr: ability.name_fr,
                name_jp: ability.name_jp,
                name_kr: ability.name_kr,
                enabled: $("#customcdAbilityEnabled").is(":checked"),
                tts: $("#customcdAbilityTTSEnabled").is(":checked"),
                ttstype: $("#customcdAbilityTTSType").val(),
                job: $("#customcdAbilityJob").val(),
                level: ability.ClassJobLevel,
                duration: $("#customcdAbilityDuration").val(),
                cooldown: $("#customcdAbilityCooldown").val(),
                type: "CustomCooldown",
                icon: ability.icon,
                color: "--filter-light-blue",
                order: $("#customcdAbilityOrder").val()
            };
        break;
    }
    case "1":
    {
        if(currentSettings.customcd.abilities.find(x => x.id == id) !== undefined) return;
        ability = foundAbilities.find(x => x.ID == id);
        addAbility = 
        {
            id: $("#customcdAbilityId").val(),
            name: ability.Name,
            name_cn: ability.Name_cn,
            name_de: ability.Name_de,
            name_en: ability.Name_en,
            name_fr: ability.Name_fr,
            name_jp: ability.Name_jp,
            name_kr: ability.Name_kr,
            enabled: $("#customcdAbilityEnabled").is(":checked"),
            tts: $("#customcdAbilityTTSEnabled").is(":checked"),
            ttstype: $("#customcdAbilityTTSType").val(),
            job: $("#customcdAbilityJob").val(),
            level: ability.ClassJobLevel,
            duration: $("#customcdAbilityDuration").val(),
            cooldown: $("#customcdAbilityCooldown").val(),
            type: "CustomCooldown",
            icon: `https://xivapi.com${ability.Icon}`,
            color: "--filter-light-blue",
            order: $("#customcdAbilityOrder").val()
        };
        break;
    }
    }
    currentSettings.customcd.abilities.push(addAbility);
    toggleCustomCdOptions(false);
}

/* exported saveCustomAbility */
function saveCustomAbility(){
    deleteCustomAbility(false);
    addCustomAbility();
}

function deleteCustomAbility(removeFromSelect = true){
    let id = $("#customcdAbilitySelect").val();
    removedAbility = currentSettings.customcd.abilities.find(x => x.id === id);
    currentSettings.customcd.abilities = currentSettings.customcd.abilities.filter(x => x.id != id);
    if(removeFromSelect){
        $(`#customcdAbilitySelect option[value='${id}']`).remove();
        if($("#customcdAbilitySelect option").length === 0){
            toggleCustomCdOptions(false);
            $("#customcdAbilitySelectDiv").hide();
            $("#customcdIconPreview").hide();
            return;
        }					
        loadCustomCdAbility();
    }
}

function toggleCustomCdOptions(show = false){
    show ? $("#customcdOptionsDiv").show() : $("#customcdOptionsDiv").hide();
}

function loadAbility(){
    let id = $("#overrideSelect").val();
    let ability = abilityList.find(x => x.id == id);
    let override = currentSettings.override.abilities.find(x => x.id == id);
    if (override != null) ability = override;
    $("#abilityEnabled").prop("checked", ability.enabled);
    $("#abilityIconPreview").prop("src", ability.icon);
    $("#abilityOverrideEnabled").prop("checked", override != null);
    switch(ability.type){
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
function loadSkin(){
    $("#skin").attr("href", `skins/${$("#skinSelect").val()}/styles/resources.css`);
}

/* exported loadFont */
function loadFont(type){                
    currentFont[type] = $(`#${type}Font`).val();
    switch(type){
    case "default":
        $("*").css("font-family", currentFont.default);
        break;
    case "health":
        $("#healthExample").attr("style", `font-family: ${currentFont.health}`);
        break;
    case "mana":
        $("#manaExample").attr("style", `font-family: ${currentFont.mana}`);
        break;
    case "pulltimer":
        $("#pulltimerExample").attr("style", `font-family: ${currentFont.pulltimer}`);
        break;
    }
    createFontSelects();
}

/* exported loadLanguage */
function loadLanguage(){
    $("#language").attr("src", `data/language/${$("#langSelect").val()}.js`);
    saveSettings(false);
}

function getBarColors(){
    let colorArray = Array.from(
        document.styleSheets).filter(sheet => sheet.href === null || sheet.href.startsWith(window.location.origin))
        .reduce((acc, sheet) => (acc = [...acc, ...Array.from(sheet.cssRules).reduce((def, rule) => (def = rule.selectorText === ":root" ? [...def, ...Array.from(rule.style).filter(name => name.startsWith("--"))]: def), [])]), []
        );
    return colorArray;
}

/* exported applyDefaultFont */
function applyDefaultFont(){
    for(let type in currentFont) {
        currentFont[type] = $("#defaultFont").val();
        $(`#${type}Font`).val(currentFont[type]);
    }
}

/* exported exportSettings */
function exportSettings(){
    if(localStorage.getItem("settings") == null){
        saveSettings();
    }
    $("#settingsText").val(btoa(localStorage.getItem("settings")));
    $("#settingsText").select();
    document.execCommand("copy");
    alert("Your current settings have been copied to your clipboard.");
}

/* exported importSettings */
function importSettings(){
    try{
        let settings = JSON.parse(atob($("#settingsText").val()));
        if(settings.hasOwnProperty("healthbar")){
            if(confirm("Are you sure you want to import these settings? This will completely overwrite your previous settings!")){
                localStorage.setItem("settings", JSON.stringify(settings));
                loadSettings();
                location.reload();
                this.close();
            }
        }else{
            alert("Invalid settings string, please doublecheck what you have pasted in.");
        }        
    }catch{
        alert("Invalid settings string, please doublecheck what you have pasted in.");
    }            	    			
}

function loadSettings(){
    if(localStorage.getItem("settings") !== null){
        let settings = JSON.parse(localStorage.getItem("settings"));
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

        if($("#skin").length == 0){
            $("head").append(`<link id="skin" rel="stylesheet" href="skins/${settings.skin}/styles/resources.css">`);
        }else{
            $("#skin").attr("href", `skins/${settings.skin}/styles/resources.css`);
        }

        if($("#language").length == 0){
            // eslint-disable-next-line no-useless-escape
            $.getScript(`data/language/${settings.language}.js`, function() {
                processLanguage();
                createColorSelects();
                createSkinSelects();
                createFontSelects();
                createOverrideSelects();
                
                $("*").css("font-family", currentFont.default);

                $("#skinSelect").val(settings.skin);
                $("#langSelect").val(settings.language);
                
                $("#debugEnabled").prop("checked", settings.debug.enabled);
                
                $("#includeAlliance").prop("checked", settings.includealliance);
                setPartyOrder(settings.partyorder);

                $("#healthBarEnabled").prop("checked", settings.healthbar.enabled);
                $("#healthHideOutOfCombat").prop("checked", settings.healthbar.hideoutofcombat);
                $("#healthTextEnabled").prop("checked", settings.healthbar.textenabled);
                $("#healthColor").val(settings.healthbar.color);
                setExampleColor($("#healthColor"));
                $("#healthScale").attr("value", settings.healthbar.scale);
                $("#healthRotationRange").val(settings.healthbar.rotation);
                $("#healthRotation").val(settings.healthbar.rotation);
                $("#healthX").attr("value", settings.healthbar.x);
                $("#healthY").attr("value", settings.healthbar.y);
            
                $("#manaBarEnabled").prop("checked", settings.manabar.enabled);
                $("#manaHideOutOfCombat").prop("checked", settings.manabar.hideoutofcombat);
                $("#manaTextEnabled").prop("checked", settings.manabar.textenabled);
                $("#manaColor").val(settings.manabar.color);
                setExampleColor($("#manaColor"));
                $("#manaScale").attr("value", settings.manabar.scale);
                $("#manaRotationRange").val(settings.manabar.rotation);
                $("#manaRotation").val(settings.manabar.rotation);
                $("#manaX").attr("value", settings.manabar.x);
                $("#manaY").attr("value", settings.manabar.y);

                $("#pulltimerBarEnabled").prop("checked", settings.timerbar.enabled);
                $("#pulltimerTextEnabled").prop("checked", settings.timerbar.textenabled);
                $("#pulltimerColor").val(settings.timerbar.color);
                setExampleColor($("#pulltimerColor"));
                $("#pulltimerScale").attr("value", settings.timerbar.scale);
                $("#pulltimerRotationRange").val(settings.timerbar.rotation);
                $("#pulltimerRotation").val(settings.timerbar.rotation);
                $("#pulltimerX").attr("value", settings.timerbar.x);
                $("#pulltimerY").attr("value", settings.timerbar.y);

                $("#dotBarEnabled").prop("checked", settings.dottimerbar.enabled);
                $("#dotHideOutOfCombat").prop("checked", settings.dottimerbar.hideoutofcombat);
                $("#dotHideWhenDroppedOff").prop("checked", settings.dottimerbar.hidewhendroppedoff);
                $("#dotTextEnabled").prop("checked", settings.dottimerbar.textenabled);
                $("#dotTTSEnabled").prop("checked", settings.dottimerbar.ttsenabled);
                $("#multiDotEnabled").prop("checked", settings.dottimerbar.multidotenabled);
                $("#dotImageEnabled").prop("checked", settings.dottimerbar.imageenabled);
                $("#dotGrowDirection").val(settings.dottimerbar.growdirection);
                $("#dotPadding").attr("value", settings.dottimerbar.padding);
                $("#dotScale").attr("value", settings.dottimerbar.scale);
                $("#dotRotationRange").val(settings.dottimerbar.rotation);
                $("#dotRotation").val(settings.dottimerbar.rotation);
                $("#dotX").attr("value", settings.dottimerbar.x);
                $("#dotY").attr("value", settings.dottimerbar.y);
            
                $("#buffBarEnabled").prop("checked", settings.bufftimerbar.enabled);
                $("#buffHideOutOfCombat").prop("checked", settings.bufftimerbar.hideoutofcombat);
                $("#buffHideWhenDroppedOff").prop("checked", settings.bufftimerbar.hidewhendroppedoff);
                $("#buffTextEnabled").prop("checked", settings.bufftimerbar.textenabled);
                $("#buffTTSEnabled").prop("checked", settings.bufftimerbar.ttsenabled);
                $("#buffImageEnabled").prop("checked", settings.bufftimerbar.imageenabled);
                $("#buffGrowDirection").val(settings.bufftimerbar.growdirection);
                $("#buffPadding").attr("value", settings.bufftimerbar.padding);
                $("#buffScale").attr("value", settings.bufftimerbar.scale);
                $("#buffRotationRange").val(settings.bufftimerbar.rotation);
                $("#buffRotation").val(settings.bufftimerbar.rotation);
                $("#buffX").attr("value", settings.bufftimerbar.x);
                $("#buffY").attr("value", settings.bufftimerbar.y);

                $("#stacksBarEnabled").prop("checked", settings.stacksbar.enabled);
                $("#stacksHideOutOfCombat").prop("checked", settings.stacksbar.hideoutofcombat);
                $("#stacksColor").val(settings.stacksbar.color);
                setExampleColor($("#stacksColor"));
                $("#stacksScale").attr("value", settings.stacksbar.scale);
                $("#stacksX").attr("value", settings.stacksbar.x);
                $("#stacksY").attr("value", settings.stacksbar.y);

                $("#raidbuffBarEnabled").prop("checked", settings.raidbuffs.enabled);
                $("#raidbuffTTSEnabled").prop("checked", settings.raidbuffs.ttsenabled);
                $("#raidbuffHideOutOfCombat").prop("checked", settings.raidbuffs.hideoutofcombat);
                $("#raidbuffHideWhenSolo").prop("checked", settings.raidbuffs.hidewhensolo);
                $("#raidbuffOrderByPartyMember").prop("checked", settings.raidbuffs.orderbypartymember);
                $("#raidbuffAlwaysShow").prop("checked", settings.raidbuffs.alwaysshow);
                $("#raidbuffGrowLeft").prop("checked", settings.raidbuffs.growleft);
                $("#raidbuffColumns").attr("value", settings.raidbuffs.columns);
                $("#raidbuffPadding").attr("value", settings.raidbuffs.padding);
                $("#raidbuffScale").attr("value", settings.raidbuffs.scale);
                $("#raidbuffX").attr("value", settings.raidbuffs.x);
                $("#raidbuffY").attr("value", settings.raidbuffs.y);
                $("#raidbuffDurationOutline").prop("checked", settings.raidbuffs.durationoutline);
                $("#raidbuffDurationBold").prop("checked", settings.raidbuffs.durationbold);
                $("#raidbuffCooldownOutline").prop("checked", settings.raidbuffs.cooldownoutline);
                $("#raidbuffCooldownBold").prop("checked", settings.raidbuffs.cooldownbold);
                $("#raidbuffDurationColorPicker").attr("value", settings.raidbuffs.durationcolor);
                $("#raidbuffCooldownColorPicker").attr("value", settings.raidbuffs.cooldowncolor);
                $("#raidbuffDurationOutlineColorPicker").attr("value", settings.raidbuffs.durationoutlinecolor);
                $("#raidbuffCooldownOutlineColorPicker").attr("value", settings.raidbuffs.cooldownoutlinecolor);
            
                $("#mitigationBarEnabled").prop("checked", settings.mitigation.enabled);
                $("#mitigationTTSEnabled").prop("checked", settings.mitigation.ttsenabled);
                $("#mitigationHideOutOfCombat").prop("checked", settings.mitigation.hideoutofcombat);
                $("#mitigationHideWhenSolo").prop("checked", settings.mitigation.hidewhensolo);
                $("#mitigationAlwaysShow").prop("checked", settings.mitigation.alwaysshow);
                $("#mitigationGrowLeft").prop("checked", settings.mitigation.growleft);
                $("#mitigationColumns").attr("value", settings.mitigation.columns);
                $("#mitigationPadding").attr("value", settings.mitigation.padding);
                $("#mitigationScale").attr("value", settings.mitigation.scale);
                $("#mitigationX").attr("value", settings.mitigation.x);
                $("#mitigationY").attr("value", settings.mitigation.y);
                $("#mitigationDurationOutline").prop("checked", settings.mitigation.durationoutline);
                $("#mitigationDurationBold").prop("checked", settings.mitigation.durationbold);
                $("#mitigationCooldownOutline").prop("checked", settings.mitigation.cooldownoutline);
                $("#mitigationCooldownBold").prop("checked", settings.mitigation.cooldownbold);
                $("#mitigationDurationColorPicker").attr("value", settings.mitigation.durationcolor);
                $("#mitigationCooldownColorPicker").attr("value", settings.mitigation.cooldowncolor);
                $("#mitigationDurationOutlineColorPicker").attr("value", settings.mitigation.durationoutlinecolor);
                $("#mitigationCooldownOutlineColorPicker").attr("value", settings.mitigation.cooldownoutlinecolor);
                
                $("#partyBarEnabled").prop("checked", settings.party.enabled);
                $("#partyTTSEnabled").prop("checked", settings.party.ttsenabled);
                $("#partyHideOutOfCombat").prop("checked", settings.party.hideoutofcombat);
                $("#partyHideWhenSolo").prop("checked", settings.party.hidewhensolo);
                $("#partyAlwaysShow").prop("checked", settings.party.alwaysshow);
                $("#partyGrowLeft").prop("checked", settings.party.growleft);
                $("#partyPadding").attr("value", settings.party.padding);
                $("#partyScale").attr("value", settings.party.scale);
                $("#partyX").attr("value", settings.party.x);
                $("#partyY").attr("value", settings.party.y);
                $("#partyDurationOutline").prop("checked", settings.party.durationoutline);
                $("#partyDurationBold").prop("checked", settings.party.durationbold);
                $("#partyCooldownOutline").prop("checked", settings.party.cooldownoutline);
                $("#partyCooldownBold").prop("checked", settings.party.cooldownbold);
                $("#partyDurationColorPicker").attr("value", settings.party.durationcolor);
                $("#partyCooldownColorPicker").attr("value", settings.party.cooldowncolor);
                $("#partyDurationOutlineColorPicker").attr("value", settings.party.durationoutlinecolor);
                $("#partyCooldownOutlineColorPicker").attr("value", settings.party.cooldownoutlinecolor);
                
                $("#customcdEnabled").prop("checked", settings.customcd.enabled);
                $("#customcdTTSEnabled").prop("checked", settings.customcd.ttsenabled);
                $("#customcdHideOutOfCombat").prop("checked", settings.customcd.hideoutofcombat);
                $("#customcdHideWhenSolo").prop("checked", settings.customcd.hidewhensolo);
                $("#customcdAlwaysShow").prop("checked", settings.customcd.alwaysshow);
                $("#customcdGrowLeft").prop("checked", settings.customcd.growleft);
                $("#customcdPadding").attr("value", settings.customcd.padding);
                $("#customcdScale").attr("value", settings.customcd.scale);
                $("#customcdColumns").attr("value", settings.customcd.columns);
                $("#customcdX").attr("value", settings.customcd.x);
                $("#customcdY").attr("value", settings.customcd.y);
                $("#customcdDurationOutline").prop("checked", settings.customcd.durationoutline);
                $("#customcdDurationBold").prop("checked", settings.customcd.durationbold);
                $("#customcdCooldownOutline").prop("checked", settings.customcd.cooldownoutline);
                $("#customcdCooldownBold").prop("checked", settings.customcd.cooldownbold);
                $("#customcdDurationColorPicker").attr("value", settings.customcd.durationcolor);
                $("#customcdCooldownColorPicker").attr("value", settings.customcd.cooldowncolor);
                $("#customcdDurationOutlineColorPicker").attr("value", settings.customcd.durationoutlinecolor);
                $("#customcdCooldownOutlineColorPicker").attr("value", settings.customcd.cooldownoutlinecolor);
                switchCustomcdMode();
                
                $("[id$=ColorPicker]").colorpicker();
        
            });
        }else{
            $("#language").attr("src", `data/language/${settings.language}.js`);
        }                           		
        
        
    }
}

function saveSettings(closeWindow = true){
    let settings = {
        skin: $("#skinSelect").val(),
        language: $("#langSelect").val(),
        font: $("#defaultFont").val(),
        includealliance: $("#includeAlliance").is(":checked"),
        partyorder: $("#partyOrder").sortable("toArray", {attribute: "data-job"}),
        override: currentSettings.override,
        debug: {
            enabled: $("#debugEnabled").is(":checked")
        },
        healthbar: {
            enabled: $("#healthBarEnabled").is(":checked"),
            hideoutofcombat: $("#healthHideOutOfCombat").is(":checked"),
            textenabled: $("#healthTextEnabled").is(":checked"),
            color: $("#healthColor").val(),
            scale: $("#healthScale").val(),
            rotation: $("#healthRotation").val(),
            x: $("#healthX").val(),
            y: $("#healthY").val(),
            font: $("#healthFont").val()
        },
        manabar: {
            enabled: $("#manaBarEnabled").is(":checked"),
            hideoutofcombat: $("#manaHideOutOfCombat").is(":checked"),
            textenabled: $("#manaTextEnabled").is(":checked"),
            color: $("#manaColor").val(),
            scale: $("#manaScale").val(),
            rotation: $("#manaRotation").val(),
            x: $("#manaX").val(),
            y: $("#manaY").val(),
            font: $("#manaFont").val()
        },
        timerbar: {
            enabled: $("#pulltimerBarEnabled").is(":checked"),
            textenabled: $("#pulltimerTextEnabled").is(":checked"),
            color: $("#pulltimerColor").val(),
            scale: $("#pulltimerScale").val(),
            rotation: $("#pulltimerRotation").val(),
            x: $("#pulltimerX").val(),
            y: $("#pulltimerY").val(),
            font: $("#pulltimerFont").val()
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
            x: $("#dotX").val(),
            y: $("#dotY").val(),
            font: $("#dotFont").val()
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
            x: $("#buffX").val(),
            y: $("#buffY").val(),
            font: $("#buffFont").val()
        },
        stacksbar: {
            enabled: $("#stacksBarEnabled").is(":checked"),
            hideoutofcombat: $("#stacksHideOutOfCombat").is(":checked"),
            color: $("#stacksColor").val(),
            scale: $("#stacksScale").val(),
            x: $("#stacksX").val(),
            y: $("#stacksY").val()
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
            x: $("#raidbuffX").val(),
            y: $("#raidbuffY").val(),
            font: $("#raidbuffFont").val(),
            durationoutline: $("#raidbuffDurationOutline").is(":checked"),
            durationbold: $("#raidbuffDurationBold").is(":checked"),
            cooldownoutline: $("#raidbuffCooldownOutline").is(":checked"),
            cooldownbold: $("#raidbuffCooldownBold").is(":checked"),
            durationcolor: $("#raidbuffDurationColorPicker").val(),
            cooldowncolor: $("#raidbuffCooldownColorPicker").val(),
            durationoutlinecolor: $("#raidbuffDurationOutlineColorPicker").val(),
            cooldownoutlinecolor: $("#raidbuffCooldownOutlineColorPicker").val()                        
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
            x: $("#mitigationX").val(),
            y: $("#mitigationY").val(),
            font: $("#mitigationFont").val(),
            durationoutline: $("#mitigationDurationOutline").is(":checked"),
            durationbold: $("#mitigationDurationBold").is(":checked"),
            cooldownoutline: $("#mitigationCooldownOutline").is(":checked"),
            cooldownbold: $("#mitigationCooldownBold").is(":checked"),
            durationcolor: $("#mitigationDurationColorPicker").val(),
            cooldowncolor: $("#mitigationCooldownColorPicker").val(),
            durationoutlinecolor: $("#mitigationDurationOutlineColorPicker").val(),
            cooldownoutlinecolor: $("#mitigationCooldownOutlineColorPicker").val()    
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
            x: $("#partyX").val(),
            y: $("#partyY").val(),
            font: $("#partyFont").val(),
            durationoutline: $("#partyDurationOutline").is(":checked"),
            durationbold: $("#partyDurationBold").is(":checked"),
            cooldownoutline: $("#partyCooldownOutline").is(":checked"),
            cooldownbold: $("#partyCooldownBold").is(":checked"),
            durationcolor: $("#partyDurationColorPicker").val(),
            cooldowncolor: $("#partyCooldownColorPicker").val(),
            durationoutlinecolor: $("#partyDurationOutlineColorPicker").val(),
            cooldownoutlinecolor: $("#partyCooldownOutlineColorPicker").val() 
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
            x: $("#customcdX").val(),
            y: $("#customcdY").val(),
            font: $("#customcdFont").val(),
            durationoutline: $("#customcdDurationOutline").is(":checked"),
            durationbold: $("#customcdDurationBold").is(":checked"),
            cooldownoutline: $("#customcdCooldownOutline").is(":checked"),
            cooldownbold: $("#customcdCooldownBold").is(":checked"),
            durationcolor: $("#customcdDurationColorPicker").val(),
            cooldowncolor: $("#customcdCooldownColorPicker").val(),
            durationoutlinecolor: $("#customcdDurationOutlineColorPicker").val(),
            cooldownoutlinecolor: $("#customcdCooldownOutlineColorPicker").val() 
        },
    };
    localStorage.setItem("settings", JSON.stringify(settings));
    if(closeWindow)	
        window.close();
    else
        location.reload();
}

/* exported deleteSettings */
function deleteSettings(){
    if(confirm("Are you sure you want to delete all settings?")){
        localStorage.clear();
        alert("Please reload overlay to finish clearing the settings and to receive the default settings.");
        window.close();
    }
}