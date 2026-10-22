export function element(id: string): HTMLElement;
export function element<T extends HTMLElement>(
    id: string,
    constructor: new () => T,
): T;
export function element(
    id: string,
    constructor: new () => HTMLElement = HTMLElement,
): HTMLElement {
    const found = document.getElementById(id);
    if (!(found instanceof constructor))
        throw new Error(`Missing or invalid element: ${id}`);
    return found;
}

export function formValue(selector: string | HTMLElement | JQuery): string {
    const value: unknown =
        typeof selector === "string" ? $(selector).val() : $(selector).val();
    return typeof value === "string" || typeof value === "number"
        ? String(value)
        : "";
}

export function formNumber(
    selector: string | HTMLElement | JQuery,
    fallback = 0,
): number {
    const text = formValue(selector);
    const value = Number(text);
    return text.trim() && Number.isFinite(value) ? value : fallback;
}

export function translate(id: string): string {
    return language.find((entry) => entry.id === id)?.string ?? id;
}
