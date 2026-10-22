export interface IconSettings {
    general?: { usehdicons?: boolean };
    language?: string;
    gamelanguage?: string | null;
}

export function getAbilityIconUrl<T>(
    icon: T,
    settings: IconSettings = {},
): T | string {
    if (typeof icon !== "string") return icon;

    let url: URL;
    try {
        url = new URL(icon, "https://xivapi.com");
    } catch {
        return icon;
    }

    let path: string | null | undefined;
    if (["v2.xivapi.com", "beta.xivapi.com"].includes(url.hostname)) {
        path =
            url.pathname === "/api/asset"
                ? url.searchParams.get("path")
                : url.pathname.match(
                      /^\/api\/(?:1\/)?asset\/(ui\/icon\/.+\.tex)$/,
                  )?.[1];
    } else if (
        ["xivapi.com", "cafemaker.wakingsands.com"].includes(url.hostname)
    ) {
        const match = url.pathname.match(
            /^\/i\/(\d{6})\/(\d{6}(?:_hr1)?)\.png$/,
        );
        if (match) path = `ui/icon/${match[1]}/${match[2]}.tex`;
    }

    if (!path || !/^ui\/icon\/\d{6}\/\d{6}(?:_hr1)?\.tex$/.test(path)) {
        return icon;
    }
    if (settings.general?.usehdicons) {
        path = path.replace(/(?:_hr1)?\.tex$/, "_hr1.tex");
    } else if (settings.general?.usehdicons === false) {
        path = path.replace(/_hr1\.tex$/, ".tex");
    }
    if ((settings.gamelanguage ?? settings.language) === "cn") {
        return `https://cafemaker.wakingsands.com/i/${path
            .slice(8)
            .replace(".tex", ".png")}`;
    }

    const version = url.searchParams.get("version");
    return (
        `https://v2.xivapi.com/api/asset?path=${path}&format=png` +
        (version ? `&version=${encodeURIComponent(version)}` : "")
    );
}
