interface Picker {
    picker: JQuery<HTMLElement>;
    setValue(value: string): void;
    hide(event?: Event): void;
}

let active: { input: HTMLInputElement; instance: Picker } | null = null;
let listening = false;

function placePicker() {
    if (!active) return;
    const { input, instance } = active;
    const picker = instance.picker[0];
    if (!picker) return;
    const field = input.getBoundingClientRect();
    if (field.bottom < 0 || field.top > innerHeight) {
        instance.hide();
        return;
    }
    const bounds = picker.getBoundingClientRect();
    const left = Math.max(
        6,
        Math.min(field.left, innerWidth - bounds.width - 6),
    );
    const top =
        field.bottom + bounds.height + 6 <= innerHeight
            ? field.bottom + 4
            : Math.max(6, field.top - bounds.height - 4);
    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
}

export function initializeColorPickers() {
    if (typeof $.fn.colorpicker !== "function") return;
    $("[id$=ColorPicker]").each(function () {
        if (!(this instanceof HTMLInputElement)) return;
        const input = this;
        const field = $(input);
        const existing = field.data("colorpicker") as Picker | undefined;
        if (existing) {
            existing.setValue(input.value);
            return;
        }
        field.colorpicker({
            popover: false,
            container: $(document.body),
            useAlpha: true,
            format: null,
        });
        const instance = field.data("colorpicker") as Picker | undefined;
        if (!instance) return;
        instance.picker.addClass("settings-color-picker");
        instance.picker.on("mousedown.settingsPicker", (event) =>
            event.preventDefault(),
        );
        field.on("colorpickerShow.settingsPicker", () => {
            if (active && active.input !== input) active.instance.hide();
            active = { input, instance };
            placePicker();
        });
        field.on("colorpickerHide.settingsPicker", () => {
            if (active?.input === input) active = null;
        });
        field.on("change.settingsPicker", (event) => {
            if (!event.originalEvent)
                input.dispatchEvent(new Event("input", { bubbles: true }));
        });
    });
    if (listening) return;
    listening = true;
    window.addEventListener("scroll", placePicker, true);
    window.addEventListener("resize", placePicker);
    document.addEventListener("pointerdown", (event) => {
        if (
            active &&
            event.target instanceof Node &&
            event.target !== active.input &&
            !active.instance.picker[0]?.contains(event.target)
        )
            active.instance.hide(event);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") active?.instance.hide(event);
    });
}
