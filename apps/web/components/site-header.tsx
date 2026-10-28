import Link from "next/link";
import { docs } from "@/content/docs";
import { categoryTitle, registry } from "@/lib/registry";
import { searchText } from "@/lib/search";
import { NavLinks } from "./nav-links";
import { SiteSearch, type SearchItem } from "./site-search";
import { ThemeToggle } from "./theme-toggle";
import { TileMark } from "./tile-mark";

function searchItems(): SearchItem[] {
  return [
    ...registry.components.map((c) => ({
      group: "Components" as const,
      title: c.name,
      detail: categoryTitle(c.category),
      href: `/components/${c.id}`,
      text: searchText(c),
    })),
    ...registry.categories
      .filter((c) => c.componentCount > 0)
      .map((c) => ({
        group: "Categories" as const,
        title: c.title,
        detail: `${c.componentCount} ${c.componentCount === 1 ? "component" : "components"}`,
        href: `/components?category=${c.id}`,
        text: `${c.title} ${c.description}`.toLowerCase(),
      })),
    ...docs.map((d) => ({
      group: "Docs" as const,
      title: d.title,
      detail: d.description,
      href: `/docs/${d.slug}`,
      text: `${d.title} ${d.description}`.toLowerCase(),
    })),
  ];
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.02em]">
          <TileMark className="size-[18px]" />
          Tessera
        </Link>
        <NavLinks />
        <div className="ml-auto flex items-center gap-1.5">
          <SiteSearch items={searchItems()} />
          {registry.repositoryUrl && (
            <a
              href={registry.repositoryUrl}
              className="rounded-[var(--radius-control)] px-2.5 py-1.5 text-small text-muted hover:text-fg max-sm:hidden"
            >
              GitHub
            </a>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
