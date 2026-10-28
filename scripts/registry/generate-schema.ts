// Regenerates registry/schema/*.schema.json from schema.ts.
//
//   npm run registry:schema

import { writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { REPO_ROOT } from "./args.ts";
import { CategoriesFile, Component, Utility } from "./schema.ts";

const outputs = {
  "component.schema.json": Component,
  "utility.schema.json": Utility,
  "categories.schema.json": CategoriesFile,
};

for (const [file, schema] of Object.entries(outputs)) {
  const json = z.toJSONSchema(schema, { io: "input" });
  writeFileSync(path.join(REPO_ROOT, "registry/schema", file), JSON.stringify(json, null, 2) + "\n");
  console.log(`wrote registry/schema/${file}`);
}
