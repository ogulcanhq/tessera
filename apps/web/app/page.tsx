import Link from "next/link";
import { CatalogEmpty } from "@/components/catalog-empty";
import { CategoryIndex } from "@/components/category-index";
import { CodeBlock } from "@/components/code-block";
import { ComponentCard } from "@/components/component-card";
import { ComponentSpotlight } from "@/components/component-spotlight";
import { packageDependency } from "@/components/install-section";
import { docs } from "@/content/docs";
import { categoryTitle, registry } from "@/lib/registry";

const facts = [
  { term: "iOS 17+", detail: "Pure SwiftUI, Swift 6" },
  { term: "No dependencies", detail: "Apple frameworks only" },
  { term: "Accessible", detail: "VoiceOver, Dynamic Type, Reduce Motion" },
  { term: "MIT licensed", detail: "Use it in commercial apps" },
];

/**
 * How many components to feature. From three on, the first card leads across
 * two columns and rows, so counts are chosen to fill whole rows: lead + 2, or
 * lead + 5 for a full 3×3 grid on wide screens.
 */
function featuredCount(total: number): number {
  if (total >= 6) return 6;
  if (total >= 3) return 3;
  return total;
}

export default function Home() {
  const { components, categories } = registry;
  const featured = components.slice(0, featuredCount(components.length));
  const leadLayout = featured.length >= 3;

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-4 pt-14 pb-14 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-[36rem]">
            <h1 className="heading text-[36px] leading-[1.06] sm:text-display">
              SwiftUI components, shown running on iOS.
            </h1>
            <p className="mt-5 text-lead text-muted">
              Tessera is a free, open-source library of native SwiftUI components. Every preview is recorded in the iOS
              Simulator, beside the exact source you install as a package or paste into your app.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/components"
                className="inline-flex h-10 items-center rounded-[var(--radius-control)] bg-fg px-4 text-body font-medium text-bg hover:bg-fg/85"
              >
                Browse components
              </Link>
              <Link href="/docs/introduction" className="text-body font-medium text-muted hover:text-fg">
                Read the docs
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-6 lg:w-[400px] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            {facts.map((fact) => (
              <div key={fact.term}>
                <dt className="text-small font-medium">{fact.term}</dt>
                <dd className="mt-0.5 text-meta text-muted">{fact.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8" aria-labelledby="featured">
        <SectionHeader
          id="featured"
          title={components.length === 0 ? "Coming first" : components.length === 1 ? "Featured component" : "Featured components"}
        >
          {components.length > 0 && (
            <Link href="/components" className="text-small font-medium text-accent hover:underline">
              View all {components.length}
            </Link>
          )}
        </SectionHeader>
        {featured.length === 1 ? (
          <ComponentSpotlight component={featured[0]} categoryTitle={categoryTitle(featured[0].category)} />
        ) : featured.length > 0 ? (
          <ul
            className={`grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 ${leadLayout ? "lg:grid-cols-3 lg:grid-rows-[auto_auto]" : "lg:grid-cols-3"}`}
          >
            {featured.map((c, index) => {
              const lead = leadLayout && index === 0;
              return (
                <li
                  key={c.id}
                  // On two-column screens the sixth card would sit alone in its row.
                  className={lead ? "sm:col-span-2 lg:row-span-2" : index === 5 ? "sm:max-lg:hidden" : ""}
                >
                  <ComponentCard component={c} categoryTitle={categoryTitle(c.category)} size={lead ? "large" : "default"} />
                </li>
              );
            })}
          </ul>
        ) : (
          <CatalogEmpty />
        )}
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-24 sm:px-6 lg:px-8" aria-labelledby="browse">
        <SectionHeader id="browse" title="Browse by category">
          <Link href="/components" className="text-small font-medium text-accent hover:underline">
            Open the catalog
          </Link>
        </SectionHeader>
        <CategoryIndex categories={categories} />
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-24 sm:px-6 lg:px-8" aria-labelledby="start">
        <SectionHeader id="start" title="Get started" />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <h3 className="font-medium">Install with Swift Package Manager</h3>
            <p className="mt-1.5 mb-4 text-small text-muted">
              Add the package in Xcode or in <code className="font-mono text-[12.5px]">Package.swift</code>, then{" "}
              <code className="font-mono text-[12.5px]">import Tessera</code>. Prefer to own the code? Every component
              page has the source to copy.
            </p>
            <CodeBlock title="Package.swift" code={`dependencies: [\n    ${packageDependency()}\n]`} />
          </div>
          <nav aria-labelledby="docs-heading">
            <h3 id="docs-heading" className="font-medium">
              Documentation
            </h3>
            <ul className="mt-3 border-t border-line">
              {docs.map((doc) => (
                <li key={doc.slug} className="border-b border-line">
                  <Link href={`/docs/${doc.slug}`} className="group block py-3">
                    <span className="text-body font-medium group-hover:text-accent">{doc.title}</span>
                    <span className="mt-0.5 block text-small text-muted">{doc.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-baseline justify-between gap-4">
      <h2 id={id} className="heading text-title">
        {title}
      </h2>
      {children}
    </div>
  );
}
