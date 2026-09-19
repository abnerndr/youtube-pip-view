const fs = require("fs");

for (const target of process.argv.slice(2)) {
  fs.rmSync(target, { recursive: true, force: true });
}
