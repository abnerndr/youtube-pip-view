const fs = require("fs");
const path = require("path");

const [src, dest] = process.argv.slice(2);

if (!src || !dest) {
  console.error("usage: node copy-file.cjs <src> <dest>");
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
