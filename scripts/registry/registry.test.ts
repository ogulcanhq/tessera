import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { loadRegistry, resolveUtilities, toCopyPasteSource } from "./load.ts";
import type { Utility } from "./schema.ts";

const FIXTURE = path.join(import.meta.dirname, "fixtures/basic");
const temporaryDirs: string[] = [];
after(() => temporaryDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

/** Copies the fixture to a temp dir and applies `mutate` to it. */
function fixture(mutate: (root: string) => void = () => {}): string {
  const root = mkdtempSync(path.join(tmpdir(), "tessera-registry-"));
  temporaryDirs.push(root);
  cpSync(FIXTURE, root, { recursive: true });
  mutate(root);
  return root;
}

function editJson(root: string, file: string, edit: (json: Record<string, unknown>) => void) {
  const absolute = path.join(root, file);
  const json = JSON.parse(readFileSync(absolute, "utf8")) as Record<string, unknown>;
  edit(json);
  writeFileSync(absolute, JSON.stringify(json));
}

function errors(root: string): string[] {
  return loadRegistry(root)
    .issues.filter((i) => i.level === "error")
    .map((i) => i.message);
}

const COMPONENT = "registry/components/example-card/component.json";

describe("registry validation", () => {
  test("valid fixture has no errors", () => {
    assert.deepEqual(errors(fixture()), []);
  });

  test("missing source file", () => {
    const root = fixture((r) => rmSync(path.join(r, "Sources/Tessera/Components/ExampleCard/ExampleCard.swift")));
    assert.match(errors(root).join("\n"), /source file not found: Sources\/Tessera\/Components\/ExampleCard/);
  });

  test("source path outside Sources/", () => {
    const root = fixture((r) =>
      editJson(r, COMPONENT, (json) => {
        json.source = { files: ["apps/web/page.swift"] };
      }),
    );
    assert.match(errors(root).join("\n"), /source\.files\.0: must be a repository-relative \.swift path/);
  });

  test("unknown utility", () => {
    const root = fixture((r) =>
      editJson(r, COMPONENT, (json) => {
        json.dependencies = { utilities: ["missing-helper"] };
      }),
    );
    assert.match(errors(root).join("\n"), /unknown utility "missing-helper"/);
  });

  test("id must match folder", () => {
    const root = fixture((r) =>
      editJson(r, COMPONENT, (json) => {
        json.id = "other-card";
      }),
    );
    assert.match(errors(root).join("\n"), /must match its folder name/);
  });

  test("unknown category", () => {
    const root = fixture((r) =>
      editJson(r, COMPONENT, (json) => {
        json.category = "widgets";
      }),
    );
    assert.match(errors(root).join("\n"), /unknown category "widgets"/);
  });

  test("missing docs", () => {
    const root = fixture((r) => rmSync(path.join(r, "registry/components/example-card/docs.mdx")));
    assert.match(errors(root).join("\n"), /documentation file not found/);
  });

  test("docs heading that duplicates a page section", () => {
    const root = fixture((r) =>
      writeFileSync(path.join(r, "registry/components/example-card/docs.mdx"), "Intro.\n\n## Accessibility\n\nText.\n"),
    );
    assert.match(errors(root).join("\n"), /must not use the heading "Accessibility"/);
  });

  test("missing Showcase entry", () => {
    const root = fixture((r) => writeFileSync(path.join(r, "apps/showcase/TesseraShowcase/Catalog.swift"), ""));
    assert.match(errors(root).join("\n"), /no Showcase entry with id: "example-card"/);
  });

  test("non-draft status requires light and dark previews", () => {
    const root = fixture((r) =>
      editJson(r, COMPONENT, (json) => {
        json.status = "beta";
      }),
    );
    assert.match(errors(root).join("\n"), /requires light and dark previews/);
  });

  test("referenced preview media must exist", () => {
    const root = fixture((r) =>
      editJson(r, COMPONENT, (json) => {
        json.previews = [
          {
            id: "default",
            title: "Default",
            media: [{ kind: "image", scheme: "light", file: "previews/default-light.png", width: 10, height: 10 }],
            capture: {
              method: "manual",
              device: "iPhone 17 Pro",
              os: "iOS 26.2",
              xcode: "26.2",
              capturedAt: "2026-10-22",
              sourceHash: "0".repeat(64),
            },
          },
        ];
      }),
    );
    const messages = errors(root).join("\n");
    assert.match(messages, /preview file not found: registry\/components\/example-card\/previews\/default-light\.png/);
  });
});

describe("copy-paste bundle", () => {
  test("strips only Tessera imports", () => {
    const source = "import SwiftUI\nimport Tessera\nimport TesseraFeatures\nimport TesseraKit\n\nstruct A {}\n";
    assert.equal(toCopyPasteSource(source), "import SwiftUI\nimport TesseraKit\n\nstruct A {}\n");
  });

  test("resolves utilities transitively, dependencies first, and detects cycles", () => {
    const utility = (id: string, deps: string[]): Utility => ({
      id,
      kind: "utility",
      summary: id,
      source: { files: [`Sources/Tessera/Core/${id}.swift`] },
      dependencies: { utilities: deps },
    });
    const byId = new Map([utility("a", ["b"]), utility("b", ["c"]), utility("c", [])].map((u) => [u.id, u]));
    assert.deepEqual(resolveUtilities(["a", "c"], byId), ["c", "b", "a"]);

    byId.set("c", utility("c", ["a"]));
    assert.throws(() => resolveUtilities(["a"], byId), /cycle: a → b → c → a/);
  });

  test("build output contains copy-paste files and resolved utilities", () => {
    const out = fixture();
    execFileSync(process.execPath, [path.join(import.meta.dirname, "build.ts"), "--root", FIXTURE, "--out", out], {
      stdio: "pipe",
    });
    const output = JSON.parse(readFileSync(path.join(out, ".generated/registry.json"), "utf8"));
    const [component] = output.components;
    assert.equal(component.id, "example-card");
    assert.deepEqual(
      component.files.map((f: { name: string; role: string }) => `${f.role}:${f.name}`),
      ["component:ExampleCard.swift", "utility:ExampleHelper.swift"],
    );
    assert.equal(
      component.files[0].content,
      readFileSync(path.join(FIXTURE, "Sources/Tessera/Components/ExampleCard/ExampleCard.swift"), "utf8"),
    );
    assert.match(component.singleFile, /\/\/ MARK: - ExampleHelper\.swift/);
    assert.match(readFileSync(path.join(out, ".generated/docs-map.ts"), "utf8"), /"example-card": \(\) => import/);
  });
});
