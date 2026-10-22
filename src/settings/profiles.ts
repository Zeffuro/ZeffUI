import { normalizeSettings, profileSnapshot } from "../shared/defaults";
import { formValue } from "../shared/dom";
import { translation } from "./state";
import { state } from "./state";
import { saveAllSettings, saveSettings } from "./save";
import { jobList } from "../data/jobs";
import { populateSettings, waitForSettingsPopulation } from "./load";
import { refreshLiveSettings } from "./live";

export async function loadProfile() {
    let profileName = formValue("#profileSelect");
    const profiles = state.currentSettings.profiles;
    if (!Object.prototype.hasOwnProperty.call(profiles.profiles, profileName))
        return;
    profiles.currentprofile = profileName;
    const settings = normalizeSettings(
        { ...profiles.profiles[profileName], profiles },
        state.currentSettings.language,
    );
    await populateSettings(settings);
    refreshLiveSettings();
}

export async function saveProfile(
    currentProfile = false,
    closeWindow = false,
    showPopup = false,
    dontReload = false,
    dontUseForms = false,
) {
    await waitForSettingsPopulation();
    if (!dontUseForms) saveAllSettings();

    let profileName = currentProfile
        ? state.currentSettings.profiles.currentprofile
        : formValue("#profileName");
    if (profileName) {
        Object.defineProperty(
            state.currentSettings.profiles.profiles,
            profileName,
            {
                value: profileSnapshot(state.currentSettings),
                enumerable: true,
                writable: true,
                configurable: true,
            },
        );
        state.currentSettings.profiles.currentprofile = profileName;
        const saved = saveSettings(
            closeWindow,
            showPopup,
            dontReload,
            dontUseForms,
        );
        createProfileSelects();
        return saved;
    }
}

export function saveJobProfile() {
    let profileName = formValue("#profileSelect");
    let job = formValue("#jobProfileSelect");
    if (profileName) {
        state.currentSettings.profiles.jobprofiles[job] = profileName;
        let jobName = translation(job);
        $(`#jobProfileSelect option[value=${job}]`).html(
            `[${jobName}] ${profileName}`,
        );
    }
    saveAllSettings();
}

export function saveAllJobProfile() {
    let profileName = formValue("#profileSelect");
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
            state.currentSettings.profiles.jobprofiles[job] = profileName;

            let jobName = translation(job);
            $(`#jobProfileSelect option[value=${job}]`).html(
                `[${jobName}] ${profileName}`,
            );
        }
    }
    saveAllSettings();
}

export function deleteJobProfile() {
    let profileName = formValue("#profileSelect");
    let job = formValue("#jobProfileSelect");
    if (profileName) {
        delete state.currentSettings.profiles.jobprofiles[job];
        let jobName = translation(job);
        $(`#jobProfileSelect option[value=${job}]`).html(`[${jobName}]`);
    }
    saveAllSettings();
}

export function deleteProfile() {
    let profileName = formValue("#profileSelect");
    if (
        Object.prototype.hasOwnProperty.call(
            state.currentSettings.profiles.profiles,
            profileName,
        )
    ) {
        if (confirm(`${translation("deleteprofile")}\n\n${profileName}`)) {
            for (let [job, profile] of Object.entries(
                state.currentSettings.profiles.jobprofiles,
            )) {
                if (profile == profileName) {
                    delete state.currentSettings.profiles.jobprofiles[job];
                }
            }
            delete state.currentSettings.profiles.profiles[profileName];
            if (state.currentSettings.profiles.currentprofile == profileName) {
                let profileList = Object.keys(
                    state.currentSettings.profiles.profiles,
                );
                if (profileList.length > 0) {
                    state.currentSettings.profiles.currentprofile =
                        profileList[0];
                } else {
                    state.currentSettings.profiles.currentprofile = "";
                }
            }
            saveSettings(false, false, true);
            createProfileSelects();
            createJobProfileSelect();
        }
    }
}

export function createProfileSelects() {
    $("#profileSelect").empty();
    for (let profile in state.currentSettings.profiles.profiles) {
        $("#profileSelect").append(
            `<option value="${profile}">${profile}</option>`,
        );
    }
    $("#profileSelect").val(state.currentSettings.profiles.currentprofile);
}

export function createJobProfileSelect() {
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
        let jobName = translation(job);
        let jobString = `[${jobName}]`;
        if (
            Object.prototype.hasOwnProperty.call(
                state.currentSettings.profiles.jobprofiles,
                job,
            )
        ) {
            jobString = `[${jobName}] ${state.currentSettings.profiles.jobprofiles[job]}`;
        }
        $("#jobProfileSelect").append(
            `<option value="${job}">${jobString}</option>`,
        );
    }
}
