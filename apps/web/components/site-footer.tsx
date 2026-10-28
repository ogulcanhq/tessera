import Link from "next/link";
import { registry } from "@/lib/registry";

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-8 text-meta text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Tessera is free and open source under the MIT License.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/components" className="hover:text-fg">
            Components
          </Link>
          <Link href="/docs/introduction" className="hover:text-fg">
            Docs
          </Link>
          <Link href="/docs/contributing" className="hover:text-fg">
            Contribute
          </Link>
          {registry.repositoryUrl && (
            <a href={registry.repositoryUrl} className="hover:text-fg">
              GitHub
            </a>
          )}
          <span>{registry.latestRelease ? `Version ${registry.latestRelease}` : "Not yet released"}</span>
        </nav>
      </div>
    </footer>
  );
}
