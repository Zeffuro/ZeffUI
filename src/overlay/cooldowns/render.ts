import type { Ability, AbilityType } from "../../shared/abilities";
export interface IconAbility {
    playerIndex: number;
    ability: Ability;
}
import { element } from "../../shared/dom";
import { getSelectorProperties } from "../display/visibility";
import { runtime } from "../state";
import { processIconUrl } from "../timers/speech";

export function generateIconBarElements(
    selector: Exclude<AbilityType, "DoT" | "Buff">,
    iconAbilityList: IconAbility[],
    columns: number,
) {
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

    let barElement = element(`${barSelector}-bar`);
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
        if (runtime.currentSettings.includealliance) players = 24;
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
                dummyContainer.style.width = String(
                    `${selectedSettings.scale * 48}px`,
                );
                dummyContainer.style.height = String(
                    `${selectedSettings.scale * 48}px`,
                );
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
        barRowArray.forEach((barRow) => {
            barFragment.appendChild(barRow);
        });
        barElement.appendChild(barFragment);
    }
}

export function generateAbilityIcon(
    playerIndex: number,
    ability: Ability,
    row: number,
    generateRow = false,
) {
    if (ability.type === "DoT" || ability.type === "Buff")
        throw new Error("Bar abilities cannot use icon rendering");
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

            element(`${barSelector}-bar`).appendChild(barElement);
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
    abilityContainer.style.width = String(`${boxWidth}px`);
    abilityContainer.style.height = String(`${boxHeight}px`);
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
    abilityActive.src = `skins/${runtime.currentSettings.skin}/images/combo.gif`;
    abilityActive.width = activeWidth;
    abilityActive.height = activeHeight;
    abilityActive.style.top = `${selectedSettings.scale * 1}px`;
    abilityActive.style.display = "none";

    abilityContainer.appendChild(abilityActive);

    let abilityOverlay = document.createElement("img");
    abilityOverlay.id = `${abilitySelector}-overlay`;
    abilityOverlay.className = "icon-overlay";
    abilityOverlay.src = `skins/${runtime.currentSettings.skin}/images/icon-overlay.png`;
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
    abilityCooldown.style.fontSize = `${
        selectedSettings.staticfontsize
            ? selectedSettings.fontsize
            : selectedSettings.scale * 24
    }px`;
    abilityCooldown.style.fontWeight = selectedSettings.cooldownbold
        ? "bold"
        : "normal";

    if (selectedSettings.cooldownoutline) {
        abilityCooldown.style.webkitTextStroke = `1.5px ${selectedSettings.cooldownoutlinecolor}`;
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
    abilityDuration.style.fontSize = `${
        selectedSettings.staticfontsize
            ? selectedSettings.fontsize
            : selectedSettings.scale * 24
    }px`;
    abilityDuration.style.fontWeight = selectedSettings.durationbold
        ? "bold"
        : "normal";

    if (selectedSettings.durationoutline) {
        abilityDuration.style.webkitTextStroke = `1.5px ${selectedSettings.durationoutlinecolor}`;
    }

    abilityContainer.appendChild(abilityDuration);

    return abilityContainer;
}
