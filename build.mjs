import { build, context, transform } from "esbuild";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const options = {
    entryPoints: {
        overlay: "src/overlay/main.ts",
        settings: "src/settings/main.ts",
        preview: "src/overlay/preview-main.ts",
    },
    outdir: "dist",
    bundle: true,
    format: "iife",
    target: "chrome80",
    sourcemap: true,
};

await mkdir("dist", { recursive: true });
for (const item of [
    "index.html",
    "settings.html",
    "styles",
    "skins",
    "data/language",
    "data/fonts",
    "data/images",
]) {
    await cp(item, `dist/${item}`, { recursive: true });
}

const vendors = [
    { name: "jquery", files: { "dist/jquery.min.js": "jquery.min.js" } },
    {
        name: "jquery-contextmenu",
        files: {
            "dist/jquery.contextMenu.min.js": "jquery.contextMenu.min.js",
            "dist/jquery.contextMenu.min.css": "jquery.contextMenu.min.css",
            "dist/font": "font",
        },
    },
    {
        name: "interactjs",
        files: { "dist/interact.min.js": "interact.min.js" },
    },
    {
        name: "bootstrap",
        files: { "dist/js/bootstrap.bundle.min.js": "bootstrap.bundle.min.js" },
    },
    {
        name: "bootswatch",
        files: { "dist/slate/bootstrap.min.css": "bootstrap.min.css" },
    },
    {
        name: "html5sortable",
        files: { "dist/html5sortable.min.js": "html5sortable.min.js" },
    },
    { name: "js-base64", files: { "base64.js": "base64.min.js" } },
    {
        name: "bootstrap-colorpicker",
        files: {
            "dist/js/bootstrap-colorpicker.min.js":
                "bootstrap-colorpicker.min.js",
            "dist/css/bootstrap-colorpicker.min.css":
                "bootstrap-colorpicker.min.css",
        },
    },
    {
        name: "@fortawesome/fontawesome-free",
        directory: "fontawesome",
        files: {
            "css/fontawesome.min.css": "css/fontawesome.min.css",
            "css/solid.min.css": "css/solid.min.css",
            "webfonts/fa-solid-900.woff2": "webfonts/fa-solid-900.woff2",
        },
    },
    { name: "@popperjs/core", directory: "popper", files: {} },
];
const versions = {};
for (const { name, directory = name, files } of vendors) {
    const source = `node_modules/${name}`;
    const target = `dist/vendor/${directory}`;
    const metadata = JSON.parse(
        await readFile(`${source}/package.json`, "utf8"),
    );
    const licenses = (await readdir(source)).filter((file) =>
        /^licen[sc]e(?:\..+)?$/i.test(file),
    );
    if (!licenses.length) throw new Error(`Missing license for ${name}`);
    await mkdir(target, { recursive: true });
    for (const file of licenses)
        await cp(`${source}/${file}`, `${target}/${file}`);
    for (const [file, output] of Object.entries(files)) {
        const destination = `${target}/${output}`;
        await mkdir(destination.slice(0, destination.lastIndexOf("/")), {
            recursive: true,
        });
        if (/\.(js|css)$/.test(file)) {
            const input = (await readFile(`${source}/${file}`, "utf8")).replace(
                /\/\/# sourceMappingURL=.*|\/\*# sourceMappingURL=.*?\*\//g,
                "",
            );
            const result = await transform(input, {
                loader: file.endsWith(".css") ? "css" : "js",
                target: options.target,
                minify: true,
                legalComments: "inline",
                sourcefile: file,
            });
            await writeFile(destination, result.code);
        } else {
            await cp(`${source}/${file}`, destination, { recursive: true });
        }
    }
    versions[name] = { version: metadata.version, license: metadata.license };
}

await writeFile(
    "dist/vendor/versions.json",
    JSON.stringify(versions, null, 2) + "\n",
);

const previewHtml = (await readFile("index.html", "utf8"))
    .replace(/<script src="[^\"]+"><\/script>\r?\n/g, "")
    .replace('src="overlay.js"', 'src="preview.js"');
await writeFile("dist/preview.html", previewHtml);

if (process.argv.includes("--watch")) {
    const session = await context(options);
    await session.watch();
    await session.serve({ servedir: "dist", host: "127.0.0.1", port: 4173 });
    console.log("ZeffUI: http://127.0.0.1:4173");
} else {
    await build(options);
}
