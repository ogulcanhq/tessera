import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { docs } from "@/content/docs";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = docs.find((d) => d.slug === slug);
  return doc ? { title: doc.title, description: doc.description } : {};
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const index = docs.findIndex((d) => d.slug === slug);
  const doc = docs[index];
  if (!doc) notFound();
  const { default: Content } = await import(`@/content/docs/${slug}.mdx`);
  const previous = docs[index - 1];
  const next = docs[index + 1];

  return (
    <article className="max-w-[70ch]">
      <h1 className="heading text-page sm:text-[40px]">{doc.title}</h1>
      <p className="mt-3 text-lead text-muted">{doc.description}</p>
      <div className="prose mt-10">
        <Content />
      </div>
      <nav aria-label="More documentation" className="mt-16 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {previous && (
          <Link href={`/docs/${previous.slug}`} className="group rounded-[var(--radius-card)] border border-line px-4 py-3 hover:border-line-strong">
            <span className="block text-meta text-muted">Previous</span>
            <span className="font-medium group-hover:text-accent">{previous.title}</span>
          </Link>
        )}
        {next && (
          <Link
            href={`/docs/${next.slug}`}
            className="group rounded-[var(--radius-card)] border border-line px-4 py-3 text-right hover:border-line-strong sm:col-start-2"
          >
            <span className="block text-meta text-muted">Next</span>
            <span className="font-medium group-hover:text-accent">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
