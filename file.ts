import fs from "fs";
import path from "path";

const root = process.cwd();

const ignored = ["node_modules", ".git", "dist", "build"];

let count = 0;

function convert(dir) {
  for (const item of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    const oldPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (!ignored.includes(item.name)) {
        convert(oldPath);
      }
      continue;
    }

    if (!item.isFile() || !item.name.endsWith(".js")) {
      continue;
    }

    const newPath = oldPath.slice(0, -3) + ".ts";

    if (fs.existsSync(newPath)) {
      console.log(`Skipped: ${newPath}`);
      continue;
    }

    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldPath} -> ${newPath}`);
    count++;
  }
}

convert(root);

console.log(`\n${count} JavaScript files renamed to TypeScript.`);
