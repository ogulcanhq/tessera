import type { Metadata } from "next";
import Link from "next/link";
import { docs } from "@/content/docs";

export const metadata: Metadata = { title: "Docs" };

export default function DocsIndex() {
  return (
    <div className="max-w-[70ch]">
      <h1 className="heading text-page sm:text-[40px]">Documentation</h1>
      <p className="mt-3 text-lead text-muted">How Tessera is organized, how to install it and how to contribute.</p>
      <ul className="mt-10 border-t border-line">
        {docs.map((doc) => (
          <li key={doc.slug} className="border-b border-line">
            <Link href={`/docs/${doc.slug}`} className="group block py-4">
              <span className="font-medium group-hover:text-accent">{doc.title}</span>
              <span className="mt-0.5 block text-small text-muted">{doc.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
