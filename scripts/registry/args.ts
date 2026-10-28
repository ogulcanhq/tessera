import path from "node:path";
import { parseArgs } from "node:util";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

/** `--root <dir>` selects the registry content root (default: the repository). */
export function parseCommonArgs(extra: Record<string, { type: "string" }> = {}) {
  const { values, positionals } = parseArgs({
    options: { root: { type: "string" }, ...extra },
    allowPositionals: true,
  });
  const root = values.root ? path.resolve(values.root) : REPO_ROOT;
  return { root, values: values as Record<string, string | undefined>, positionals };
}
