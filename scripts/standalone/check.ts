// Standalone copy-paste check (technical-decisions TD-05).
//
// Typechecks exactly what the website ships, as a plain iOS app target would
// compile it: no Tessera package, no SWIFT_PACKAGE, Swift 6 language mode,
// iOS 17 deployment target. Each component is checked twice: its separate
// files together, and the "all files in one" bundle on its own.
//
// Reads apps/web/.generated/registry.json, so run `npm run registry -w web`
// first (`make standalone` does both). Requires macOS with Xcode.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { REPO_ROOT } from "../registry/args.ts";
import type { RegistryOutput } from "../registry/output.ts";

const SWIFTC_ARGS = [
  "--sdk",
  "iphonesimulator",
  "swiftc",
  "-typecheck",
  "-swift-version",
  "6",
  "-target",
  "arm64-apple-ios17.0-simulator",
  "-parse-as-library",
];

/** Patterns that would make pasted code depend on the package. */
const FORBIDDEN: [RegExp, string][] = [
  [/^\s*(@_exported\s+)?import\s+Tessera/m, "imports Tessera"],
  [/Bundle\.module/, "uses Bundle.module, which a pasted file doesn't have"],
];

const registryPath = path.join(REPO_ROOT, "apps/web/.generated/registry.json");
if (!fs.existsSync(registryPath)) {
  console.error(`Missing ${path.relative(REPO_ROOT, registryPath)}. Run \`npm run registry -w web\` first.`);
  process.exit(1);
}
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8")) as RegistryOutput;

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "tessera-standalone-"));
let failures = 0;

function typecheck(label: string, files: { name: string; content: string }[]): void {
  const dir = fs.mkdtempSync(path.join(workDir, "check-"));
  const paths = files.map((file) => {
    const target = path.join(dir, file.name);
    fs.writeFileSync(target, file.content);
    return target;
  });

  for (const file of files) {
    for (const [pattern, problem] of FORBIDDEN) {
      if (pattern.test(file.content)) {
        console.error(`✖ ${label}: ${file.name} ${problem}`);
        failures++;
      }
    }
  }

  const result = spawnSync("xcrun", [...SWIFTC_ARGS, ...paths], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    console.error(`✖ ${label}`);
    console.error((result.error?.message ?? result.stderr).replaceAll(dir + path.sep, ""));
    failures++;
  } else {
    console.log(`✔ ${label}`);
  }
}

for (const component of registry.components) {
  typecheck(
    `${component.id}: ${component.files.length} separate file(s)`,
    component.files.map((f) => ({ name: f.name, content: f.content })),
  );
  typecheck(`${component.id}: all files in one`, [
    { name: `${component.name.replaceAll(" ", "")}Combined.swift`, content: component.singleFile },
  ]);
}

fs.rmSync(workDir, { recursive: true, force: true });

if (registry.components.length === 0) {
  console.log("No components to check.");
} else if (failures > 0) {
  console.error(`\nStandalone check failed: ${failures} problem(s).`);
  process.exit(1);
} else {
  console.log(`\nStandalone check passed for ${registry.components.length} component(s).`);
}
