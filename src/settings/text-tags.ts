const resourceTags = [
    ["Current", "current"],
    ["Maximum", "max"],
    ["Current, short", "current-short"],
    ["Maximum, short", "max-short"],
    ["Percent", "percent"],
    ["Current / maximum", "current-max"],
    ["Deficit", "deficit"],
    ["Current and percent", "current-percent"],
    ["Current and percent, short", "current-percent-short"],
] as const;

const nameTags = [
    ["Full name", "name"],
    ["Name, 5 characters", "name:veryshort"],
    ["Name, 10 characters", "name:short"],
    ["Name, 15 characters", "name:medium"],
    ["Name, 20 characters", "name:long"],
] as const;

const fields = [
    ["healthFormat", "health", "Player HP"],
    ["manaFormat", "mana", "Player MP"],
    ["targetHealthFormat", "health", "Target HP"],
    ["targetManaFormat", "mana", "Target MP"],
] as const;

function option(label: string, token: string) {
    return new Option(`${label} [${token}]`, `[${token}]`);
}

export function initializeTextTagInserters() {
    for (const [id, resource, label] of fields) {
        const input = document.getElementById(id);
        if (!(input instanceof HTMLInputElement)) continue;
        if (document.getElementById(`${id}Tag`)) continue;
        const target = id.startsWith("target");
        const tools = document.createElement("div");
        tools.className = "text-tag-tools";
        const select = document.createElement("select");
        select.id = `${id}Tag`;
        select.className = "form-select form-select-sm text-tag-select";
        select.setAttribute("aria-label", `${label} text tag`);
        const resources = target
            ? [resource, resource === "health" ? "mana" : "health"]
            : [resource];
        for (const key of resources) {
            const group = document.createElement("optgroup");
            const name = key === "health" ? "HP" : "MP";
            group.label = name;
            for (const [name, suffix] of resourceTags)
                group.append(option(name, `${key}:${suffix}`));
            select.append(group);
        }
        const names = document.createElement("optgroup");
        names.label = "Name";
        for (const [name, token] of nameTags) names.append(option(name, token));
        select.append(names);
        if (!target) {
            const jobs = document.createElement("optgroup");
            jobs.label = "Job";
            jobs.append(
                option("Job name", "job"),
                option("Job abbreviation", "job:short"),
            );
            select.append(jobs);
        }
        const insert = document.createElement("button");
        insert.type = "button";
        insert.id = `${id}InsertTag`;
        insert.className = "btn btn-primary btn-sm";
        insert.textContent = "Insert tag";
        insert.addEventListener("click", () => {
            input.setRangeText(
                select.value,
                input.selectionStart ?? input.value.length,
                input.selectionEnd ?? input.value.length,
                "end",
            );
            input.focus();
            input.dispatchEvent(new Event("input", { bubbles: true }));
        });
        tools.append(select, insert);
        input.after(tools);
        const help = document.getElementById(`${id}Help`);
        help?.remove();
        input.removeAttribute("aria-describedby");
    }
}
