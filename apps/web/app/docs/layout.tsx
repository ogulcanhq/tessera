import { DocsNav } from "@/components/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-8 px-4 pt-8 sm:px-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-14 md:pt-14 lg:px-8">
      <aside className="md:sticky md:top-24 md:self-start">
        <DocsNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
