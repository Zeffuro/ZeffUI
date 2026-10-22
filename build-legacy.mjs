import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? "dist/legacy");
const bridge =
    '<script src="https://ngld.github.io/OverlayPlugin/assets/shared/common.min.js"></script>';
const storageScript = '<script src="settings-storage.js"></script>';
for (const file of ["index.html", "settings.html"]) {
    const path = `${root}/${file}`;
    const source = await readFile(path, "utf8");
    if (!source.includes(bridge))
        throw new Error(`OverlayPlugin bridge missing in legacy ${file}`);
    await writeFile(
        path,
        source.includes(storageScript)
            ? source
            : source.replace(bridge, `${bridge}\n${storageScript}`),
    );
}
for (const file of ["scripts/index.js", "scripts/settings.js"]) {
    const path = `${root}/${file}`;
    const source = await readFile(path, "utf8");
    await writeFile(
        path,
        source.replace(
            /localStorage\.(getItem|setItem|removeItem)\("settings"/g,
            'localStorage.$1("zeffUI-legacy-settings"',
        ),
    );
}
await build({
    entryPoints: ["src/legacy/settings.ts"],
    outfile: `${root}/settings-storage.js`,
    bundle: true,
    format: "iife",
    target: "chrome80",
});
