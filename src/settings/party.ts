import type { Role } from "../shared/settings";
import { formValue } from "../shared/dom";
import { translation } from "./state";
import { state, defaultJobOrder } from "./state";

function partyRole(value: string): Role {
    return value === "healer" || value === "dps" || value === "other"
        ? value
        : "tank";
}

export function saveCurrentPartyRoleOrder() {
    state.currentSettings.rolepartyorder[state.currentPartyRole] = sortable(
        "#partyOrder",
        "serialize",
    )[0].items;
}

export function setPartyOrder(partyOrder?: string[]) {
    if (!partyOrder) {
        partyOrder =
            state.currentSettings.rolepartyorder[
                partyRole(formValue("#partyRole"))
            ];
        saveCurrentPartyRoleOrder();
        $("#partyOrder").empty();
        state.currentPartyRole = partyRole(formValue("#partyRole"));
    }
    for (let job of partyOrder) {
        // Initially used the wrong job shorthand, need this to not break people's party orders.
        if (job == "GLD") job = "GLA";
        $("#partyOrder").append(
            `<tr data-job="${job}"><td style="width:5%"><img src="data/images/jobicons/${job}.png"></td><td style="width:95%">${translation(
                job.toLowerCase(),
            )}</td></tr>`,
        );
        sortable("#partyOrder", {
            itemSerializer: (item) => {
                const job: unknown = $(item.html).data("job");
                return typeof job === "string" ? job : "";
            },
        });
    }
}

export function createSpecificJobs(selector: string, enabledJobs: string[]) {
    for (let job of defaultJobOrder) {
        let enabled = enabledJobs.includes(job);
        $(selector).append(
            `<a data-job="${job}" href="#" onclick="toggleJob(this);return false;"><img src="data/images/jobicons/${job}.png" class="${
                enabled ? "" : "job-disabled"
            }" width="29" height="29"></a>`,
        );
    }
}

export function toggleJob(element: HTMLElement) {
    let job = element.dataset.job;
    if (!job) return;
    let type = element.parentElement?.id.replace("SpecificJobs", "");
    if (type !== "mpticker" && type !== "dotticker" && type !== "hotticker")
        return;

    let enabled = !$(element).find("img").hasClass("job-disabled");

    if (enabled) {
        $(element).find("img").addClass("job-disabled");
        state.currentSettings[type].specificjobs.splice(
            state.currentSettings[type].specificjobs.indexOf(job),
            1,
        );
    } else {
        $(element).find("img").removeClass("job-disabled");
        state.currentSettings[type].specificjobs.push(job);
    }
}
