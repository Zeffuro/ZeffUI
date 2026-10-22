export const barAnchors = {
    "top-left": [0, 0],
    "top-center": [0.5, 0],
    "top-right": [1, 0],
    "center-left": [0, 0.5],
    center: [0.5, 0.5],
    "center-right": [1, 0.5],
    "bottom-left": [0, 1],
    "bottom-center": [0.5, 1],
    "bottom-right": [1, 1],
} as const;

export type BarAnchor = keyof typeof barAnchors;
export interface BarAttachment {
    enabled: boolean;
    anchor: BarAnchor;
    ownanchor: BarAnchor;
    x: number;
    y: number;
}
export const defaultBarAttachment: BarAttachment = {
    enabled: false,
    anchor: "bottom-left",
    ownanchor: "top-left",
    x: 0,
    y: 0,
};

export function isBarAnchor(value: unknown): value is BarAnchor {
    return (
        typeof value === "string" &&
        Object.prototype.hasOwnProperty.call(barAnchors, value)
    );
}

export function normalizeBarAttachment(value: unknown): BarAttachment {
    const source = typeof value === "object" && value !== null ? value : {};
    const field = (key: string): unknown => Reflect.get(source, key);
    const number = (key: string) => {
        const raw = field(key);
        const parsed =
            typeof raw === "string" && raw.trim() ? Number(raw) : raw;
        return typeof parsed === "number" && Number.isFinite(parsed)
            ? parsed
            : 0;
    };
    const anchor = field("anchor"),
        ownanchor = field("ownanchor");
    return {
        ...source,
        enabled: field("enabled") === true,
        anchor: isBarAnchor(anchor) ? anchor : defaultBarAttachment.anchor,
        ownanchor: isBarAnchor(ownanchor)
            ? ownanchor
            : defaultBarAttachment.ownanchor,
        x: number("x"),
        y: number("y"),
    };
}

interface BarGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

function anchorPoint(bar: BarGeometry, anchor: BarAnchor) {
    const [horizontal, vertical] = barAnchors[anchor];
    const angle = (bar.rotation * Math.PI) / 180;
    const x = horizontal * bar.width,
        y = vertical * bar.height;
    return {
        x: Math.cos(angle) * x - Math.sin(angle) * y,
        y: Math.sin(angle) * x + Math.cos(angle) * y,
    };
}

export function attachedBarPosition(
    health: BarGeometry,
    mana: BarGeometry,
    attachment: BarAttachment,
) {
    const anchor = anchorPoint(health, attachment.anchor);
    const own = anchorPoint(mana, attachment.ownanchor);
    return {
        x: health.x + anchor.x - own.x + attachment.x,
        y: health.y + anchor.y - own.y + attachment.y,
    };
}
