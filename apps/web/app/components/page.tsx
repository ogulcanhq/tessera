import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser, CatalogBrowserFromURL } from "@/components/catalog-browser";
import { CatalogEmpty } from "@/components/catalog-empty";
import { CategoryIndex } from "@/components/category-index";
import { registry } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Components",
  description: "Browse Tessera's SwiftUI components, each with a Simulator recording, source and docs.",
};

export default function ComponentsPage() {
  const { components, categories } = registry;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <header className="max-w-2xl pb-8">
        <h1 className="heading text-page sm:text-[40px]">Components</h1>
        <p className="mt-3 text-lead text-muted">
          Native SwiftUI building blocks. Each one is recorded in the iOS Simulator and comes with its full source.
        </p>
      </header>

      {components.length > 0 ? (
        <Suspense fallback={<CatalogBrowser components={components} categories={categories} />}>
          <CatalogBrowserFromURL components={components} categories={categories} />
        </Suspense>
      ) : (
        <div className="space-y-16">
          <CatalogEmpty />
          <section aria-labelledby="categories">
            <h2 id="categories" className="heading text-title">
              How the catalog is organized
            </h2>
            <p className="mt-1.5 mb-6 text-small text-muted">Components are filed under these categories as they are published.</p>
            <CategoryIndex categories={categories} />
          </section>
        </div>
      )}
    </div>
  );
}
