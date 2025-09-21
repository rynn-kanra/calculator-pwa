import { Glob } from "bun";
import path from "path";
import { watch } from "fs/promises";

let isDev;
let isPublish;
for (const arg of process.argv.slice(2)) {
    switch (arg) {
        case "--dev": {
            isDev = true;
            break;
        }
        case "--publish": {
            isPublish = true;
            break;
        }
    }
}

// CONFIG
const distDir = "./docs";
const sourceDir = "./src";
const workerDir = "./src/workers";
const versionFile = "./docs/assets/data/version.json";
const defaultAppFiles = [
    "./",
    "./manifest.json"
];
const entryPoints = [
    `${sourceDir}/index.ts`,
    `${sourceDir}/sw.ts`
];
if (true) {
    const glob = new Glob('*.ts');
    const wks = (await Array.fromAsync(glob.scan({ cwd: workerDir })))
        .map(o => `${workerDir}/${o}`);
    entryPoints.splice(entryPoints.length, 0, ...wks);
}

const buildConfig = {
    entrypoints: entryPoints,
    outdir: './docs',
    splitting: true,
    minify: !isDev,
    naming: {
        chunk: '[name]-[hash].chunk.[ext]',
    },
    drop: isDev ? [] : ["console", "debugger"]
};

async function clean() {
    // Step 1: Read all .js files in the folder
    const glob = new Glob('*.{js,css}');
    await Array.fromAsync(glob.scan({ cwd: distDir }))
        .then(files => Promise.all(files.map(file => {
            try {
                return Bun.file(`${distDir}/${file}`).delete();
            } catch { }
        })));
}
async function run() {
    await Bun.build(buildConfig);
}
async function updateVersion() {
    const glob = new Glob('*.{js,css}');
    const files = await Array.fromAsync(glob.scan({ cwd: distDir }));
    const jsFiles = files
        .map(file => {
            const fileInfo = path.parse(file);
            return `${fileInfo.name}${fileInfo.ext}`;
        })
        .filter(o => o != "sw.js");

    // Step 2: Load existing JSON (or create one if missing)
    let json;
    try {
        const jsonText = await Bun.file(versionFile).text();
        json = JSON.parse(jsonText);
    } catch (e) {
        json = {}; // fallback if file doesn't exist or is empty
    }

    // Step 3: Update JSON content based on filenames
    // For example: add a key for each script
    if (isPublish) {
        json.version = (json.version || "1.0.0").split('.').map((v, i) => i == 2 ? Number(v) + 1 : v).join('.')
    }
    json.app_files = defaultAppFiles.concat(jsFiles.map(o => `./${o}`));

    // Step 4: Write updated JSON back to file
    await Bun.write(versionFile, JSON.stringify(json, null, 2));
}

try {
    await clean();
    await run();
    await updateVersion();
    console.log("✅ build done.");
}
catch (err) {
    console.error("❌ Error in build script:", err);
}

if (isDev) {
    const watcher = watch(
        sourceDir,
        { recursive: true }
    );

    function getContentType(path) {
        return {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "application/javascript",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
            ".woff": "font/woff",
            ".woff2": "font/woff2",
            ".ttf": "font/ttf",
            ".otf": "font/otf",
            ".txt": "text/plain",
            ".wasm": "application/wasm",
        }[path.slice(path.lastIndexOf("."))] || "application/octet-stream";
    }
    function generateETag(buffer) {
        const hash = Bun.hash(new Uint8Array(buffer), "sha1").toString(16);
        return `"${hash}"`;
    }
    function getCacheControl(path) {
        const ext = path.slice(path.lastIndexOf("."));
        if ([".js", ".css", ".woff2", ".png", ".jpg", ".svg"].includes(ext)) {
            return "public, max-age=31536000, immutable"; // 1 year
        }
        if (ext === ".html") {
            return "no-cache";
        }
        return "public, max-age=0";
    }
    function logRequest(req) {
        const url = new URL(req.url);
        const timestamp = new Date().toLocaleString("en-US", {
            dateStyle: "short",
            timeStyle: "medium",
        });

        console.log(`HTTP ${timestamp} ${req.method} ${url.pathname}`);
    }
    const server = Bun.serve({
        port: 3000,
        async fetch(req) {
            logRequest(req);
            const url = new URL(req.url);
            let pathname = decodeURIComponent(url.pathname);

            if (pathname === "/") pathname = "/index.html";

            const filePath = `${distDir}${pathname}`;
            const file = Bun.file(filePath);
            if (!(await file.exists())) {
                return new Response("404 Not Found", { status: 404 });
            }

            const contentType = getContentType(filePath);
            const buffer = await file.arrayBuffer();
            const etag = generateETag(buffer);

            // Check for If-None-Match
            const clientETag = req.headers.get("if-none-match");
            if (clientETag === etag) {
                return new Response(null, {
                    status: 304,
                    headers: {
                        "ETag": etag,
                    },
                });
            }

            // Set cache-control headers
            const cacheControl = getCacheControl(filePath);

            console.log(`HTTP: `);
            return new Response(buffer, {
                headers: {
                    "Content-Type": contentType,
                    "ETag": etag,
                    "Cache-Control": cacheControl,
                },
            });
        },
    });

    console.log(`Serving static files with ETag caching on http://localhost:${server.port}`);

    let t, isRunning;
    for await (const event of watcher) {
        clearTimeout(t);
        t = setTimeout(async function () {
            if (isRunning) {
                return;
            }

            isRunning = true;
            try {
                await clean();
                await run();
                await updateVersion();
                console.log("✅ build done.");
            }
            catch (err) {
                console.error("❌ Error in build script:", err);
            }
            isRunning = false;
        }, 300);
    }
}