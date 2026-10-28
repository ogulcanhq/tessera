// Prints the source hash of a component's copy-paste bundle. Paste it into
// `previews[].capture.sourceHash` after capturing previews.
//
//   npm run registry:hash -- <component-id>

import { parseCommonArgs } from "./args.ts";
import { bundleSourcePaths, loadRegistry, sourceHash } from "./load.ts";

const { root, positionals } = parseCommonArgs();
const id = positionals[0];
const registry = loadRegistry(root);
const component = registry.components.find((c) => c.id === id);

if (!component) {
  console.error(id ? `Unknown component "${id}".` : "Usage: npm run registry:hash -- <component-id>");
  process.exit(1);
}

const utilities = new Map(registry.utilities.map((u) => [u.id, u]));
console.log(sourceHash(root, bundleSourcePaths(component, utilities)));
