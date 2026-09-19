/**
 * O postinstall do Electron 28 usa extract-zip, que no Node recente
 * (ex.: 26 no Windows) pode encerrar sem extrair o binário. Este script
 * baixa (ou reusa o cache) e extrai com o tar do sistema.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function resolveElectronDir() {
  const pkg = require.resolve("electron/package.json", {
    paths: [process.cwd(), path.join(__dirname, "..")],
  });
  return path.dirname(pkg);
}

function requireFrom(electronDir, id) {
  return require(
    require.resolve(id, {
      paths: [electronDir, path.join(electronDir, ".."), process.cwd()],
    }),
  );
}

function platformPath(platform) {
  switch (platform) {
    case "mas":
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "win32":
      return "electron.exe";
    default:
      return "electron";
  }
}

function isReady(electronDir, binaryRel) {
  try {
    const pathTxt = fs
      .readFileSync(path.join(electronDir, "path.txt"), "utf8")
      .trim();
    const binary = path.join(electronDir, "dist", binaryRel);
    return pathTxt === binaryRel && fs.existsSync(binary);
  } catch {
    return false;
  }
}

function tarBin() {
  if (process.platform === "win32") {
    const systemTar = path.join(
      process.env.SystemRoot || "C:\\Windows",
      "System32",
      "tar.exe",
    );
    if (fs.existsSync(systemTar)) {
      return systemTar;
    }
  }
  return "tar";
}

function extractZip(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execFileSync(tarBin(), ["-xf", zipPath, "-C", destDir], { stdio: "inherit" });
}

async function main() {
  const electronDir = resolveElectronDir();
  const { version } = require(path.join(electronDir, "package.json"));
  const platform = process.env.npm_config_platform || process.platform;
  const arch = process.env.npm_config_arch || process.arch;
  const binaryRel = platformPath(platform);

  if (isReady(electronDir, binaryRel)) {
    return;
  }

  const { downloadArtifact } = requireFrom(electronDir, "@electron/get");
  const checksumsPath = path.join(electronDir, "checksums.json");
  const zipPath = await downloadArtifact({
    version,
    artifactName: "electron",
    platform,
    arch,
    checksums: fs.existsSync(checksumsPath)
      ? require(checksumsPath)
      : undefined,
  });

  const distDir = path.join(electronDir, "dist");
  fs.rmSync(distDir, { recursive: true, force: true });
  extractZip(zipPath, distDir);
  fs.writeFileSync(path.join(electronDir, "path.txt"), binaryRel);

  if (!fs.existsSync(path.join(distDir, binaryRel))) {
    throw new Error(`Electron extract finished but ${binaryRel} is missing`);
  }

  console.log(`Electron ${version} ready (${platform}-${arch})`);
}

main().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
