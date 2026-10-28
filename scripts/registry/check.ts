// Validates registry metadata, source references, docs, previews and Showcase
// entries. Exit code 1 on errors; warnings (e.g. possibly stale previews) don't fail,
// but on GitHub Actions every issue is also emitted as an annotation, so a stale
// preview shows on the pull request.
//
//   npm run registry:check [-- --root <dir>]

import { parseCommonArgs } from "./args.ts";
import { formatIssues, loadRegistry } from "./load.ts";

const { root } = parseCommonArgs();
const registry = loadRegistry(root);
const errors = registry.issues.filter((i) => i.level === "error");
const warnings = registry.issues.filter((i) => i.level === "warning");

if (registry.issues.length > 0) console.log(formatIssues(registry.issues) + "\n");
if (process.env.GITHUB_ACTIONS === "true") {
  for (const issue of registry.issues) {
    const title = escape(`Registry: ${issue.where}`).replace(/:/g, "%3A").replace(/,/g, "%2C");
    console.log(`::${issue.level} title=${title}::${escape(issue.message)}`);
  }
}

/** Workflow command escaping (https://github.com/actions/toolkit, `command.ts`). */
function escape(text: string): string {
  return text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

console.log(
  `Registry: ${registry.components.length} component(s), ${registry.utilities.length} utility(ies), ` +
    `${registry.categories.length} categories — ${errors.length} error(s), ${warnings.length} warning(s).`,
);
process.exitCode = errors.length > 0 ? 1 : 0;
