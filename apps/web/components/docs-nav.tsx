"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docs } from "@/content/docs";

export function DocsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation">
      <p className="mb-2 text-meta font-medium max-md:sr-only">Documentation</p>
      <ul className="scroll-row -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 md:mx-0 md:flex-col md:gap-0 md:border-b-0 md:border-l md:px-0">
        {docs.map((doc) => {
          const href = `/docs/${doc.slug}`;
          const current = pathname === href;
          return (
            <li key={doc.slug} className="shrink-0">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`-mb-px block border-b py-2 text-small whitespace-nowrap max-md:px-2 md:mb-0 md:-ml-px md:border-b-0 md:border-l md:py-1.5 md:pl-3 ${
                  current ? "border-fg font-medium text-fg" : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {doc.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
