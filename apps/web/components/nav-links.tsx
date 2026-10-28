"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/components", match: "/components", label: "Components" },
  { href: "/docs/introduction", match: "/docs", label: "Docs" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center">
      {nav.map((item) => {
        const current = pathname === item.match || pathname.startsWith(`${item.match}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`rounded-[var(--radius-control)] px-2.5 py-1.5 text-small ${
              current ? "text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
