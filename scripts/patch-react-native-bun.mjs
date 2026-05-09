import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const source = join(root, "node_modules", "react-native");
const bunStore = join(root, "node_modules", ".bun");

const requiredFiles = [
  "src",
  "scripts",
  "sdks",
  "third-party-podspecs",
  "types",
  "types_generated",
  "rn-get-polyfills.js",
  "README.md",
  "settings.gradle.kts",
];

if (!existsSync(source) || !existsSync(bunStore)) {
  process.exit(0);
}

const targets = readdirSync(bunStore)
  .filter((name) => name.startsWith("react-native@0.81.5"))
  .map((name) => join(bunStore, name, "node_modules", "react-native"))
  .filter((target) => existsSync(target));

for (const target of targets) {
  for (const item of requiredFiles) {
    const from = join(source, item);
    const to = join(target, item);
    if (!existsSync(from)) continue;
    if (existsSync(to)) rmSync(to, { force: true, recursive: true });
    cpSync(from, to, { recursive: true });
  }
}

if (targets.length > 0) {
  console.log(`Patched React Native Bun package files for ${targets.length} target(s).`);
}
