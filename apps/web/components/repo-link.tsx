import type { ReactNode } from "react";
import { registry } from "@/lib/registry";

/** A link into the GitHub repository, or plain text while `repository` isn't set. */
export function RepoLink({ path, children }: { path: string; children: ReactNode }) {
  if (!registry.repositoryUrl) return <>{children}</>;
  return <a href={`${registry.repositoryUrl}/${path}`}>{children}</a>;
}
