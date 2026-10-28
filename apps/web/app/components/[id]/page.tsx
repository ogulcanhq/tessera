import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { componentDocs } from "@/.generated/docs-map";
import { CopyButton } from "@/components/copy-button";
import { InstallSection } from "@/components/install-section";
import { PreviewPlayer } from "@/components/preview-player";
import { SourceSection } from "@/components/source-section";
import { StatusBadge } from "@/components/status-badge";
import { mdxHeadings, type Heading } from "@/lib/headings";
import { categoryTitle, getComponent, registry } from "@/lib/registry";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

// Static export rejects an empty params list. While the registry has no
// components, emit one placeholder that renders the 404 page.
const EMPTY_REGISTRY_PLACEHOLDER = "_none";

export function generateStaticParams() {
  const ids = registry.components.map((c) => ({ id: c.id }));
  return ids.length > 0 ? ids : [{ id: EMPTY_REGISTRY_PLACEHOLDER }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const component = getComponent((await params).id);
  return component ? { title: component.name, description: component.summary } : {};
}

/** Page sections, with the docs' own `##` headings nested under Usage. */
function tableOfContents(docHeadings: Heading[]): (Heading & { children?: Heading[] })[] {
  return [
    { id: "install", title: "Installation" },
    { id: "source", title: "Source" },
    { id: "usage", title: "Usage", children: docHeadings },
    { id: "accessibility", title: "Accessibility" },
  ];
}

export default async function ComponentPage({ params }: Props) {
  const component = getComponent((await params).id);
  const loadDocs = component && componentDocs[component.id];
  if (!component || !loadDocs) notFound();
  const { default: Docs } = await loadDocs();
  // Written next to the docs map by scripts/registry/build.ts.
  const sections = tableOfContents(
    mdxHeadings(readFileSync(path.join(process.cwd(), ".generated/docs", `${component.id}.mdx`), "utf8")),
  );

  const a11y = [
    { label: "VoiceOver", supported: component.accessibility.voiceOver },
    { label: "Dynamic Type", supported: component.accessibility.dynamicType },
    { label: "Reduce Motion", supported: component.accessibility.reduceMotion },
  ];
  const lineCount = component.singleFile.trimEnd().split("\n").length;

  return (
    <article className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-meta text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/components" className="hover:text-fg">
              Components
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/components?category=${component.category}`} className="hover:text-fg">
              {categoryTitle(component.category)}
            </Link>
          </li>
        </ol>
      </nav>

      <header className="mt-5 flex flex-col gap-6 pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="heading text-page sm:text-[40px]">{component.name}</h1>
            <StatusBadge component={component} />
          </div>
          <p className="mt-3 text-lead text-muted">{component.summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="#source"
            className="inline-flex h-8 items-center rounded-[var(--radius-control)] px-3 text-meta font-medium text-muted hover:bg-stage hover:text-fg"
          >
            View source
          </a>
          <CopyButton text={component.singleFile} label="Copy source" tone="strong" />
        </div>
      </header>

      <PreviewPlayer previews={component.previews} name={component.name} />

      <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
        <div className="min-w-0 space-y-16">
          <Section id="install" title="Installation">
            <InstallSection component={component} />
          </Section>

          <Section
            id="source"
            title="Source"
            lead={`The exact code behind the preview above: ${component.files.length} ${component.files.length === 1 ? "file" : "files"}, ${lineCount} lines.`}
          >
            <SourceSection component={component} />
          </Section>

          <Section id="usage" title="Usage">
            <div className="prose">
              <Docs />
            </div>
          </Section>

          <Section id="accessibility" title="Accessibility">
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3">
              {a11y.map((item) => (
                <li key={item.label} className="bg-surface px-4 py-3.5">
                  <span className="block text-small font-medium">{item.label}</span>
                  <span className={`mt-0.5 block text-meta ${item.supported ? "text-accent" : "text-muted"}`}>
                    {item.supported ? "Supported" : "Not supported"}
                  </span>
                </li>
              ))}
            </ul>
            {component.accessibility.notes && (
              <p className="mt-4 max-w-[70ch] text-body text-muted">{component.accessibility.notes}</p>
            )}
          </Section>
        </div>

        <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="On this page" className="max-lg:hidden">
            <p className="text-meta font-medium">On this page</p>
            <ul className="mt-3 space-y-2 border-l border-line">
              {sections.map((s) => (
                <li key={s.id}>
                  <TocLink heading={s} />
                  {s.children && s.children.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {s.children.map((child) => (
                        <li key={child.id}>
                          <TocLink heading={child} nested />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-meta font-medium">Details</p>
            <dl className="mt-3 divide-y divide-line border-y border-line text-small">
              <Detail term="Category" value={categoryTitle(component.category)} />
              <Detail term="Requires" value={`iOS ${component.platforms.iOS}+`} />
              <Detail term="Frameworks" value={component.frameworks.join(", ")} />
              <Detail term="Available since" value={component.since ?? "Unreleased"} />
            </dl>
          </div>
        </aside>
      </div>
    </article>
  );
}

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <h2 id={id} className="heading scroll-mt-24 text-heading">
        {title}
      </h2>
      {lead && <p className="mt-1.5 text-small text-muted">{lead}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TocLink({ heading, nested = false }: { heading: Heading; nested?: boolean }) {
  return (
    <a
      href={`#${heading.id}`}
      className={`-ml-px block border-l border-transparent text-small text-muted hover:border-fg hover:text-fg ${nested ? "pl-6" : "pl-3"}`}
    >
      {heading.title}
    </a>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-muted">{term}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
