import type { Settings } from "../shared/settings";
import { barAnchors, isBarAnchor } from "../shared/bar-attachment";

const pairs = [
    ["manabar", "mana"],
    ["targetmanabar", "targetMana"],
] as const;

function field(prefix: string, suffix: string, label: string, control: string) {
    return `<div class="form-group row text-right">
        <label class="control-label col-sm-4" for="${prefix}${suffix}">${label}</label>
        <div class="col-sm-6">${control}</div>
    </div>`;
}

function anchorSelect(prefix: string, suffix: string, label: string) {
    const options = Object.keys(barAnchors)
        .map(
            (anchor) =>
                `<option value="${anchor}">${anchor.replace(/-/g, " ")}</option>`,
        )
        .join("");
    return field(
        prefix,
        suffix,
        label,
        `<select class="form-select form-select-sm" id="${prefix}${suffix}">${options}</select>`,
    );
}

function updateControls(prefix: string) {
    const toggle = document.getElementById(
        `${prefix}Attach`,
    ) as HTMLInputElement;
    const options = document.getElementById(`${prefix}AttachmentOptions`);
    if (options) options.hidden = !toggle.checked;
    for (const suffix of ["X", "Y"]) {
        const input = document.getElementById(
            `${prefix}${suffix}`,
        ) as HTMLInputElement;
        input.disabled = toggle.checked;
    }
}

export function populateBarAttachments(settings: Settings) {
    for (const [key, prefix] of pairs) {
        if (!document.getElementById(`${prefix}Attach`)) {
            const position = document
                .getElementById(`${prefix}Y`)
                ?.closest(".form-group");
            if (!position) continue;
            position.insertAdjacentHTML(
                "afterend",
                `<div class="form-group"><div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="${prefix}Attach">
                <label class="form-check-label" for="${prefix}Attach">Attach to health bar</label>
            </div></div>
            <div id="${prefix}AttachmentOptions">
                ${anchorSelect(prefix, "HealthAnchor", "Health anchor")}
                ${anchorSelect(prefix, "ManaAnchor", "Mana anchor")}
                ${["X", "Y"]
                    .map((axis) =>
                        field(
                            prefix,
                            `Attach${axis}`,
                            `Offset ${axis}`,
                            `<input class="form-control form-control-sm" type="number" step="1" id="${prefix}Attach${axis}">`,
                        ),
                    )
                    .join("")}
                <p class="form-text">Offsets move the mana bar in screen pixels. Turning this off restores its own position.</p>
            </div>`,
            );
            document
                .getElementById(`${prefix}Attach`)
                ?.addEventListener("change", () => updateControls(prefix));
        }
        const attachment = settings[key].attachment;
        $(`#${prefix}Attach`).prop("checked", attachment.enabled);
        $(`#${prefix}HealthAnchor`).val(attachment.anchor);
        $(`#${prefix}ManaAnchor`).val(attachment.ownanchor);
        $(`#${prefix}AttachX`).val(attachment.x);
        $(`#${prefix}AttachY`).val(attachment.y);
        updateControls(prefix);
    }
}

export function readBarAttachments(settings: Settings) {
    for (const [key, prefix] of pairs) {
        const toggle = document.getElementById(
            `${prefix}Attach`,
        ) as HTMLInputElement | null;
        if (!toggle) continue;
        const attachment = settings[key].attachment;
        const anchor = $(`#${prefix}HealthAnchor`).val();
        const ownanchor = $(`#${prefix}ManaAnchor`).val();
        attachment.enabled = toggle.checked;
        if (isBarAnchor(anchor)) attachment.anchor = anchor;
        if (isBarAnchor(ownanchor)) attachment.ownanchor = ownanchor;
        for (const [axis, suffix] of [
            ["x", "X"],
            ["y", "Y"],
        ] as const) {
            const value = Number($(`#${prefix}Attach${suffix}`).val());
            if (Number.isFinite(value)) attachment[axis] = value;
        }
    }
}
