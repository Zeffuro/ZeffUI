import { isLocale } from "../shared/defaults";
import { formNumber, formValue } from "../shared/dom";
import { translation } from "./state";
import { state } from "./state";
import { setOption } from "./save";
import type { Locale } from "../shared/settings";
import { createProfileSelects, createJobProfileSelect } from "./profiles";
import { abilityList } from "../data/abilities";
import { gameLanguage } from "../shared/language";
import { getAbilityIconUrl } from "../shared/icons";
import { syncGameLanguageControl } from "./language";

export function setPadding(element: HTMLElement | JQuery) {
    let selector = ($(element).attr("id") ?? "").replace("GrowDirection", "");
    if (formNumber(element) <= 2) {
        $(`#${selector}Padding`).val(formNumber(`#${selector}Scale`) * 20);
    } else {
        $(`#${selector}Padding`).val(formNumber(`#${selector}Scale`) * 180);
    }
}

export function setExampleColor(element: HTMLElement | JQuery) {
    let selector = ($(element).attr("id") ?? "").replace("Color", "");
    if (!selector.startsWith("stacks")) {
        $(`#${selector}Example`).css(
            `--${selector}Color`,
            `var(${formValue(element)})`,
        );
        $(`#${selector}Example`).css("width", "154px");
    } else {
        $(`#${selector}-1`).css(
            `--${selector}Color`,
            `var(${formValue(element)})`,
        );
        $(`#${selector}-2`).css(
            `--${selector}Color`,
            `var(${formValue(element)})`,
        );
        $(`#${selector}-3`).css(
            `--${selector}Color`,
            `var(${formValue(element)})`,
        );
        $(`#${selector}-4`).css(
            `--${selector}Color`,
            `var(${formValue(element)})`,
        );
    }
}

export function titleCase(string: string) {
    return string
        .toLowerCase()
        .split(" ")
        .map(function (word) {
            return word.replace(word[0], word[0].toUpperCase());
        })
        .join(" ");
}

export function createColorSelects() {
    const settings = state.currentSettings;
    const colors = new Set([
        ...getBarColors(),
        settings.healthbar.color,
        settings.manabar.color,
        settings.targethealthbar.color,
        settings.targetmanabar.color,
        settings.manabar.lowcolor,
        settings.manabar.medcolor,
        settings.mpticker.color,
        settings.dotticker.color,
        settings.hotticker.color,
        settings.timerbar.color,
        settings.stacksbar.color,
    ]);
    for (const select of Array.from(
        document.querySelectorAll<HTMLSelectElement>('select[id$="Color"]'),
    )) {
        const selected = select.value;
        select.replaceChildren();
        for (const color of colors) {
            const label = translation(
                `color${color.replace("--filter-", "").replace("-", "")}`,
            );
            select.add(new Option(titleCase(label), color));
        }
        if (selected) select.value = selected;
    }
}

export function createSkinSelects(selectedSkin?: string) {
    const select = document.getElementById("skinSelect");
    if (!(select instanceof HTMLSelectElement)) return;
    const selected =
        selectedSkin ?? (select.value || state.currentSettings.skin);
    select.replaceChildren();
    for (const [value, label] of [
        ["default", "skindefault"],
        ["material-dark", "skinmaterialdark"],
        ["material-discord", "skinmaterialdiscord"],
        ["hydaelyn", "skinhydaelyn"],
    ]) {
        select.add(new Option(translation(label), value));
    }
    for (const value of [selected, state.currentSettings.skin]) {
        if (
            !Array.from(select.options).some((option) => option.value === value)
        )
            select.add(new Option(value, value));
    }
    select.value = selected;
}

export async function createFontSelects(): Promise<void> {
    /* prettier-ignore */
    let fontCheck = new Set([
		// Windows 10
		"Arial", "Arial Black", "Bahnschrift", "Calibri", "Cambria", "Cambria Math", "Candara", "Comic Sans MS", "Consolas", "Constantia", "Corbel", "Courier New", "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia", "HoloLens MDL2 Assets", "Impact", "Ink Free", "Javanese Text", "Leelawadee UI", "Lucida Console", "Lucida Sans Unicode", "Malgun Gothic", "Marlett", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB", "Mongolian Baiti", "MS Gothic", "MV Boli", "Myanmar Text", "Nirmala UI", "Palatino Linotype", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Historic", "Segoe UI Emoji", "Segoe UI Symbol", "SimSun", "Sitka", "Sylfaen", "Symbol", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana", "Webdings", "Wingdings", "Yu Gothic",
		// macOS
		"American Typewriter", "Andale Mono", "Arial", "Arial Black", "Arial Narrow", "Arial Rounded MT Bold", "Arial Unicode MS", "Avenir", "Avenir Next", "Avenir Next Condensed", "Baskerville", "Big Caslon", "Bodoni 72", "Bodoni 72 Oldstyle", "Bodoni 72 Smallcaps", "Bradley Hand", "Brush Script MT", "Chalkboard", "Chalkboard SE", "Chalkduster", "Charter", "Cochin", "Comic Sans MS", "Copperplate", "Courier", "Courier New", "Didot", "DIN Alternate", "DIN Condensed", "Futura", "Geneva", "Georgia", "Gill Sans", "Helvetica", "Helvetica Neue", "Herculanum", "Hoefler Text", "Impact", "Lucida Grande", "Luminari", "Marker Felt", "Menlo", "Microsoft Sans Serif", "Monaco", "Noteworthy", "Optima", "Palatino", "Papyrus", "Phosphate", "Rockwell", "Savoye LET", "SignPainter", "Skia", "Snell Roundhand", "Tahoma", "Times", "Times New Roman", "Trattatello", "Trebuchet MS", "Verdana", "Zapfino",
        // Custom Fonts that might be installed but won't be included/embedded due to licensing
        "Expressway"
	].sort());
    for (const font of state.currentSettings.customfonts) fontCheck.add(font);
    for (const font of Object.values(state.currentFont)) fontCheck.add(font);
    await document.fonts.ready;
    const available = [...fontCheck].filter(
        (font) =>
            Object.values(state.currentFont).includes(font) ||
            state.currentSettings.customfonts.includes(font) ||
            document.fonts.check(`12px ${JSON.stringify(font)}`),
    );
    available.push("ITC Avant Garde Gothic LT");
    for (const [type, selected] of Object.entries(state.currentFont)) {
        const select = document.getElementById(`${type}Font`);
        if (!(select instanceof HTMLSelectElement)) continue;
        select.replaceChildren();
        for (const font of new Set(available)) {
            const option = new Option(font, font);
            option.style.fontFamily = font;
            select.add(option);
        }
        select.value = selected;
    }
    const customFonts = document.getElementById("customFonts");
    if (customFonts instanceof HTMLSelectElement) {
        const selected = customFonts.value;
        customFonts.replaceChildren();
        for (const font of state.currentSettings.customfonts)
            customFonts.add(new Option(font, font));
        if (selected) customFonts.value = selected;
    }
}

export function processLanguage() {
    $("[id^=lang_]").each(function () {
        const id = this.id.split("_")[1];
        const entry = window.language?.find((item) => item.id === id);
        if (entry) $(this).text(entry.string);
    });
}

export function refreshLocalizedSelects() {
    const selectedJob = formValue("#jobProfileSelect");
    processLanguage();
    createColorSelects();
    createSkinSelects();
    createProfileSelects();
    createJobProfileSelect();
    if (selectedJob) $("#jobProfileSelect").val(selectedJob);
    const locale = gameLanguage(state.currentSettings);
    for (const option of Array.from(
        document.querySelectorAll<HTMLOptionElement>("#overrideSelect option"),
    )) {
        const ability = abilityList.find(
            (item) => `${item.id}-${item.type}` === option.value,
        );
        if (!ability) continue;
        const overridden = state.currentSettings.override.abilities.some(
            (item) => item.id === ability.id && item.type === ability.type,
        );
        option.textContent = `${overridden ? "[Override] " : ""}${translation(ability.job.toLowerCase())}: ${ability[`name_${locale}`]} (${ability.type})`;
    }
    for (const option of Array.from(
        document.querySelectorAll<HTMLOptionElement>(
            "#customcdAbilitySelect option",
        ),
    )) {
        const ability = state.currentSettings.customcd.abilities.find(
            (item) => String(item.id) === option.value,
        );
        if (ability && formValue("#customcdMode") === "0")
            option.textContent = `${translation(ability.job.toLowerCase())}: ${ability[`name_${locale}`]}`;
        const found = state.foundAbilities.find(
            (item) => String(item.ID) === option.value,
        );
        if (found && formValue("#customcdMode") === "1")
            option.textContent = `${found.IsPvP ? `[${translation("pvp")}] ` : ""}${found[`Name_${locale}`]}`;
    }
    const overrideKey = formValue("#overrideSelect");
    const overrideAbility = [
        ...state.currentSettings.override.abilities,
        ...abilityList,
    ].find((ability) => `${ability.id}-${ability.type}` === overrideKey);
    if (overrideAbility)
        $("#abilityIconPreview").prop(
            "src",
            getAbilityIconUrl(overrideAbility.icon, state.currentSettings),
        );
    const customId = formValue("#customcdAbilitySelect");
    const customIcon =
        formValue("#customcdMode") === "0"
            ? state.currentSettings.customcd.abilities.find(
                  (ability) => String(ability.id) === customId,
              )?.icon
            : state.foundAbilities.find(
                  (ability) => String(ability.ID) === customId,
              )?.Icon;
    if (customIcon)
        $("#customcdIconPreview").prop(
            "src",
            getAbilityIconUrl(customIcon, state.currentSettings),
        );
    for (const row of Array.from(
        document.querySelectorAll<HTMLTableRowElement>("#partyOrder tr"),
    )) {
        if (row.dataset.job && row.cells[1])
            row.cells[1].textContent = translation(
                row.dataset.job.toLowerCase(),
            );
    }
}

export function changeXY(type: string) {
    $(`#${type}X`).val(formNumber(`#${type}X`) * -1);
    $(`#${type}Y`).val(formNumber(`#${type}Y`) * -1);
}

export function addCustomFont() {
    const font = formValue("#customFontText");
    if (!font || state.currentSettings.customfonts.includes(font)) return;
    state.currentSettings.customfonts.push(font);
    void createFontSelects().then(() => $("#customFonts").val(font));
}

export function removeCustomFont() {
    const font = formValue("#customFonts");
    state.currentSettings.customfonts =
        state.currentSettings.customfonts.filter((item) => item !== font);
    void createFontSelects();
}

export function loadSkin() {
    setOption("skin", formValue("#skinSelect"));
}

export function loadFont(type: string) {
    state.currentFont[type] = formValue(`#${type}Font`);
    $(`#${type}Example`).css("font-family", state.currentFont[type]);
}

let languageLoad: Promise<void> = Promise.resolve();
let loadedLocale: Locale | null = null;

function appendLanguageScript(locale: Locale): Promise<void> {
    return new Promise((resolve, reject) => {
        document.getElementById("language")?.remove();
        const script = document.createElement("script");
        script.id = "language";
        script.src = `data/language/${locale}.js`;
        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error(`Could not load ${script.src}`));
        document.head.append(script);
    });
}

export function loadLanguageData(locale: Locale): Promise<void> {
    if (!Array.isArray(window.language)) window.language = [];
    languageLoad = languageLoad
        .catch(() => {})
        .then(async () => {
            if (loadedLocale === locale) return;
            try {
                await appendLanguageScript(locale);
                loadedLocale = locale;
            } catch (error) {
                console.warn(error);
                if (locale !== "en") {
                    try {
                        await appendLanguageScript("en");
                        loadedLocale = "en";
                    } catch (fallbackError) {
                        console.warn(fallbackError);
                    }
                }
            }
        });
    return languageLoad;
}

export async function loadLanguage() {
    const locale = formValue("#langSelect");
    if (!isLocale(locale)) return;
    setOption("language", locale);
    syncGameLanguageControl();
    await loadLanguageData(locale);
    if (formValue("#langSelect") === locale) refreshLocalizedSelects();
}

export function getBarColors(): string[] {
    const colors = new Set(
        [
            "dark-red",
            "bright-red",
            "baby-blue",
            "green-blue",
            "toxic-green",
            "light-blue",
            "dark-blue",
            "dark-green",
            "jungle-green",
            "purple",
            "fuchsia",
            "light-pink",
            "light-gold",
            "dark-gold",
            "orange",
            "grey",
        ].map((name) => `--filter-${name}`),
    );
    for (const sheet of Array.from(document.styleSheets)) {
        try {
            for (const rule of Array.from(sheet.cssRules)) {
                if (
                    rule instanceof CSSStyleRule &&
                    rule.selectorText === ":root"
                ) {
                    for (const name of Array.from(rule.style))
                        if (name.startsWith("--filter-")) colors.add(name);
                }
            }
        } catch {
            /* Cross-origin and file URLs can hide stylesheet rules. */
        }
    }
    return [...colors];
}

export function applyDefaultFont() {
    for (const type of Object.keys(state.currentFont)) {
        state.currentFont[type] = formValue("#defaultFont");
        $(`#${type}Font`).val(state.currentFont[type]);
    }
}
