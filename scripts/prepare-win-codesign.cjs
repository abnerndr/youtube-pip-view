/**
 * O electron-builder baixa winCodeSign com symlinks do macOS.
 * No Windows, sem modo desenvolvedor/admin, o 7-Zip aborta a extração
 * e o .exe nunca é gerado. Extraímos tudo menos a pasta darwin.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const VERSION = "2.6.0";

function resolve7za() {
  const pkg = require.resolve("7zip-bin/package.json", {
    paths: [process.cwd(), path.join(__dirname, "..")],
  });
  return require(path.dirname(pkg)).path7za;
}

async function main() {
  if (process.platform !== "win32") {
    return;
  }

  const cacheRoot = path.join(
    process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, "AppData", "Local"),
    "electron-builder",
    "Cache",
    "winCodeSign",
  );
  const dest = path.join(cacheRoot, `winCodeSign-${VERSION}`);
  const ready = path.join(dest, "rcedit-x64.exe");

  if (fs.existsSync(ready)) {
    return;
  }

  fs.mkdirSync(cacheRoot, { recursive: true });

  const archive = path.join(cacheRoot, `winCodeSign-${VERSION}.7z`);
  if (!fs.existsSync(archive)) {
    const url = `https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-${VERSION}/winCodeSign-${VERSION}.7z`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Falha ao baixar winCodeSign: ${res.status} ${url}`);
    }
    fs.writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
  }

  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });

  execFileSync(
    resolve7za(),
    ["x", archive, `-o${dest}`, "-y", "-xr!darwin"],
    { stdio: "inherit" },
  );

  if (!fs.existsSync(ready)) {
    throw new Error(`winCodeSign extraído, mas ${ready} não existe`);
  }

  console.log(`winCodeSign ${VERSION} pronto (sem symlinks do macOS)`);
}

main().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
