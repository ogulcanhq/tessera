import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
      <p className="text-meta text-muted">404</p>
      <h1 className="heading mt-2 text-page sm:text-[40px]">Page not found</h1>
      <p className="mt-3 max-w-[50ch] text-lead text-muted">This page doesn’t exist. It may have been renamed or removed.</p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href="/components"
          className="inline-flex h-10 items-center rounded-[var(--radius-control)] bg-fg px-4 font-medium text-bg hover:bg-fg/85"
        >
          Browse components
        </Link>
        <Link href="/" className="font-medium text-muted hover:text-fg">
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
