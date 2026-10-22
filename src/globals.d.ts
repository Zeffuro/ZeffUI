import "jquery";
import "jquery.contextmenu";
import type { OverlayRequest } from "./plugin/types";

declare global {
    interface ColorPickerOptions {
        popover?: boolean;
        container?: HTMLElement | JQuery;
        useAlpha?: boolean;
        format?: string | null;
    }
    interface JQuery<TElement = HTMLElement> {
        colorpicker(options?: ColorPickerOptions): this;
    }
    const interact: typeof import("interactjs").default;
    function sortable(
        selector: string,
        command: "serialize",
    ): Array<{ items: string[] }>;
    function sortable(
        selector: string,
        options?: { itemSerializer: (item: { html: string }) => string },
    ): HTMLElement[];
    const Base64: Pick<typeof import("js-base64"), "encodeURI" | "decode">;
    const language: Array<{ id: string; string: string }>;
    function addOverlayListener(
        name: string,
        handler: (event: unknown) => void,
    ): void;
    function startOverlayEvents(): void;
    function callOverlayHandler(request: OverlayRequest): Promise<unknown>;
    interface Window {
        zeffuiSettingsMessage?: (packet: unknown) => boolean;
        callOverlayHandler: typeof callOverlayHandler;
        addOverlayListener: typeof addOverlayListener;
        language?: typeof language;
        testLog?: (line: string) => void;
    }
    interface DocumentEventMap {
        onOverlayStateUpdate: CustomEvent<{ isLocked: boolean }>;
    }
}
