const targets = [
    ["Player HP", "#health-bar"],
    ["Player MP", "#mana-bar"],
    ["Target HP", "#target-health-bar"],
    ["Target MP", "#target-mana-bar"],
    ["Timers", '#timer-bar, [id$="-buff-timer"], [id$="-dot-timer"]'],
    ["Cooldown icons", ".ability-image"],
    ["Whole overlay", "body"],
] as const;

const presets = [
    ["Glow", "filter: drop-shadow(0 0 4px #80d2c2) !important;"],
    ["Outline", "outline: 1px solid #80d2c2;\n    outline-offset: 2px;"],
    ["Opacity", "opacity: 0.8 !important;"],
    ["Text color", "color: #ffffff !important;"],
    ["Rounded corners", "border-radius: 6px !important;"],
] as const;

function ruleSelector(target: string, preset: string) {
    const text = preset === presets[3][1];
    const rounded = preset === presets[4][1];
    if (!text && !rounded) return target;
    if (target === ".ability-image") return text ? ".ability-text" : target;
    const bars = target === "body" ? [".styled-bar"] : target.split(", ");
    const selectors = bars.flatMap((bar) =>
        text
            ? [`${bar}::after`]
            : [
                  `${bar}::-webkit-progress-bar`,
                  `${bar}::-webkit-progress-value`,
              ],
    );
    if (target === "body")
        selectors.push(text ? ".ability-text" : ".ability-image");
    return selectors.join(",\n");
}

function picker(
    id: string,
    label: string,
    options: ReadonlyArray<readonly [string, string]>,
) {
    const field = document.createElement("label");
    field.className = "custom-css-picker";
    field.textContent = label;
    const select = document.createElement("select");
    select.id = id;
    select.className = "form-control form-control-sm";
    for (const [text, value] of options) select.add(new Option(text, value));
    field.append(select);
    return { field, select };
}

function changed(editor: HTMLTextAreaElement) {
    editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function indent(editor: HTMLTextAreaElement, outdent: boolean) {
    const { value, selectionStart: start, selectionEnd: end } = editor;
    if (!outdent && start === end) {
        editor.setRangeText("    ", start, end, "end");
    } else {
        const lineStart =
            start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
        const block = value.slice(lineStart, end);
        let removedAtStart = 0;
        let removed = 0;
        const lines = block.split("\n").map((line, index) => {
            if (!outdent) return `    ${line}`;
            const count = line.startsWith("\t")
                ? 1
                : (line.match(/^ {1,4}/)?.[0].length ?? 0);
            if (index === 0) removedAtStart = count;
            removed += count;
            return line.slice(count);
        });
        editor.setRangeText(lines.join("\n"), lineStart, end, "preserve");
        editor.setSelectionRange(
            outdent ? Math.max(lineStart, start - removedAtStart) : start + 4,
            outdent
                ? Math.max(lineStart, end - removed)
                : end + lines.length * 4,
        );
    }
    changed(editor);
}

export function initializeCustomCssEditor() {
    const editor = document.getElementById("customcss");
    if (!(editor instanceof HTMLTextAreaElement)) return;
    const row = editor.closest(".form-group");
    if (!row || row.classList.contains("custom-css-editor")) return;
    row.classList.add("custom-css-editor");
    editor.rows = 14;
    editor.spellcheck = false;
    editor.wrap = "off";
    editor.autocomplete = "off";
    editor.placeholder = "#health-bar {\n    opacity: 0.8 !important;\n}";

    const tools = document.createElement("div");
    tools.className = "custom-css-tools";
    const target = picker("customcss-target", "Selector", targets);
    const preset = picker("customcss-preset", "Example", presets);
    const insert = document.createElement("button");
    insert.type = "button";
    insert.id = "customcss-insert";
    insert.className = "btn btn-primary btn-sm";
    insert.textContent = "Insert rule";
    const insertSelector = document.createElement("button");
    insertSelector.type = "button";
    insertSelector.id = "customcss-insert-selector";
    insertSelector.className = "btn btn-primary btn-sm";
    insertSelector.textContent = "Insert selector";
    tools.append(target.field, preset.field, insertSelector, insert);

    const example = document.createElement("pre");
    example.className = "custom-css-example";
    const snippet = () =>
        `${ruleSelector(target.select.value, preset.select.value)} {\n    ${preset.select.value}\n}`;
    const updateExample = () => (example.textContent = snippet());
    target.select.addEventListener("change", updateExample);
    preset.select.addEventListener("change", updateExample);
    updateExample();

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "btn btn-outline-secondary btn-sm custom-css-clear";
    clear.textContent = "Clear CSS";
    clear.addEventListener("click", () => {
        if (
            !editor.value ||
            !window.confirm(
                "Clear all custom CSS? Save Settings to keep this change.",
            )
        )
            return;
        editor.value = "";
        editor.focus();
        changed(editor);
    });
    editor.before(tools, example);
    editor.after(clear);

    insertSelector.addEventListener("click", () => {
        editor.setRangeText(
            target.select.value,
            editor.selectionStart,
            editor.selectionEnd,
            "end",
        );
        editor.focus();
        changed(editor);
    });

    insert.addEventListener("click", () => {
        const caret = editor.selectionEnd;
        const before =
            caret > 0 && editor.value[caret - 1] !== "\n" ? "\n" : "";
        const after = editor.value[caret] === "\n" ? "" : "\n";
        editor.setRangeText(
            `${before}${snippet()}${after}`,
            caret,
            caret,
            "end",
        );
        editor.focus();
        changed(editor);
    });
    let leaveEditor = false;
    editor.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            leaveEditor = true;
            return;
        }
        if (
            event.key !== "Tab" ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
        )
            return;
        if (leaveEditor) {
            leaveEditor = false;
            return;
        }
        event.preventDefault();
        indent(editor, event.shiftKey);
    });
    editor.addEventListener("blur", () => (leaveEditor = false));
}
