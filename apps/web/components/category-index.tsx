import Link from "next/link";
import type { CategoryOutput } from "@/lib/registry";

/**
 * Every registry category as an index row. Rows with components link to the
 * filtered catalog; empty ones say so instead of leading to an empty page.
 */
export function CategoryIndex({ categories }: { categories: CategoryOutput[] }) {
  return (
    <ul className="grid pt-px sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
      {categories.map((category) => {
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-4">
              <span className="font-medium">{category.title}</span>
              <span className="text-meta text-muted tabular-nums">
                {category.componentCount > 0 ? category.componentCount : "None yet"}
              </span>
            </span>
            <span className="mt-1 block text-small text-muted">{category.description}</span>
          </>
        );
        return (
          <li key={category.id} className="-mt-px border-y border-line">
            {category.componentCount > 0 ? (
              <Link href={`/components?category=${category.id}`} className="group block py-4 hover:[&_.font-medium]:text-accent">
                {body}
              </Link>
            ) : (
              <div className="py-4">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
