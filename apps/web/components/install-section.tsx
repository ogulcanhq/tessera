import { REPOSITORY_PLACEHOLDER, registry, type ComponentOutput } from "@/lib/registry";
import { CodeBlock } from "./code-block";
import { Tabs } from "./tabs";

/** Package dependency line: pinned to the latest release, or `main` before the first release. */
export function packageDependency(): string {
  const url = registry.repositoryUrl ?? REPOSITORY_PLACEHOLDER;
  return registry.latestRelease
    ? `.package(url: "${url}", from: "${registry.latestRelease}")`
    : `.package(url: "${url}", branch: "main")`;
}

/**
 * The `Package.swift` snippet, with a note while it isn't a stable install:
 * until the root package.json names the public repository, the URL is a
 * placeholder, and until the first release, it follows `main`.
 * Used on component pages and in the Installation docs.
 */
export function PackageSnippet() {
  const provisional = registry.repositoryUrl === null;
  const unreleased = !provisional && !registry.latestRelease;
  return (
    <div className="space-y-3">
      {provisional && (
        <p role="note" className={NOTE}>
          <span className="font-medium text-fg">Not available yet.</span> Tessera&rsquo;s public repository
          hasn&rsquo;t been published, so <code className="font-mono text-[12.5px] text-fg">&lt;owner&gt;</code> below
          is a placeholder and the dependency won&rsquo;t resolve. Copying the source works today.
        </p>
      )}
      {unreleased && (
        <p role="note" className={NOTE}>
          <span className="font-medium text-fg">Pre-release.</span> Tessera has no tagged version yet, so this
          follows the <code className="font-mono text-[12.5px] text-fg">main</code> branch, which can change
          without notice. Switch to a version once one is released.
        </p>
      )}
      <CodeBlock
        title={provisional ? "Package.swift (provisional)" : unreleased ? "Package.swift (tracks main)" : "Package.swift"}
        code={`dependencies: [\n    ${packageDependency()}\n],\ntargets: [\n    .target(name: "YourApp", dependencies: [\n        .product(name: "Tessera", package: "tessera")\n    ])\n]`}
      />
    </div>
  );
}

const NOTE = "rounded-[var(--radius-card)] border border-line bg-stage px-4 py-3 text-small text-muted";

export function InstallSection({ component }: { component: ComponentOutput }) {
  const utilities = component.files.filter((f) => f.role === "utility");

  return (
    <Tabs
      label="Installation method"
      items={[
        {
          id: "package",
          label: "Swift Package",
          content: (
            <div className="space-y-4">
              <p className="text-body text-muted">
                In Xcode, choose File › Add Package Dependencies, or add Tessera to <code className="font-mono text-[13px] text-fg">Package.swift</code>:
              </p>
              <PackageSnippet />
              <p className="text-body text-muted">
                Then <code className="font-mono text-[13px] text-fg">import Tessera</code> where you use {component.name}.
              </p>
            </div>
          ),
        },
        {
          id: "copy",
          label: "Copy the source",
          content: (
            <div className="space-y-4 text-body">
              <p className="text-muted">
                Add these files to your app target. They need only {component.frameworks.join(" and ")}, with no package
                and no other dependencies.
              </p>
              <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
                {component.files.map((file) => (
                  <li key={file.path} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="font-mono text-[12.5px]">{file.name}</span>
                    <span className="text-meta text-muted">
                      {file.role === "utility" ? "Shared helper, add once" : "Component"}
                    </span>
                  </li>
                ))}
              </ul>
              {utilities.length > 0 && (
                <p className="text-muted">
                  Shared helpers are reused by several components. If you already copied one for another component,
                  skip it.
                </p>
              )}
              <p className="text-muted">The files are in the Source section below. Copy them one by one, or all at once as a single file.</p>
            </div>
          ),
        },
      ]}
    />
  );
}
