import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localSource = path.resolve(projectRoot, "..", "..", "tactile");
const cachedSource = path.join(projectRoot, ".cache", "tactile");
const configuredSource = process.env.TACTILE_SOURCE_DIR
  ? path.resolve(process.env.TACTILE_SOURCE_DIR)
  : null;
let sourceRoot = configuredSource || localSource;

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, env: process.env, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status || 1);
}

if (!existsSync(path.join(sourceRoot, "package.json"))) {
  sourceRoot = cachedSource;
  rmSync(sourceRoot, { recursive: true, force: true });
  mkdirSync(path.dirname(sourceRoot), { recursive: true });
  run("git", ["clone", "--depth", "1", "--branch", process.env.TACTILE_REF || "main", "https://github.com/dysfunctionin/tactile.git", sourceRoot], projectRoot);
}

if (!existsSync(path.join(sourceRoot, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite"))) {
  run("npm", ["ci"], sourceRoot);
}

const destination = path.join(projectRoot, "dist", "app");
mkdirSync(destination, { recursive: true });
run("npm", ["exec", "vite", "--", "build", "--base", "/app/", "--outDir", destination, "--emptyOutDir", "false"], sourceRoot);
console.log(`Built Tactile web app from ${sourceRoot} into ${destination}`);