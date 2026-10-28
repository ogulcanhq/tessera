import type { MDXComponents } from "mdx/types";
import type { ReactElement } from "react";
import { CodeBlock } from "@/components/code-block";
import { headingId, textContent } from "@/lib/headings";

type CodeElement = ReactElement<{ className?: string; children?: string }>;

/**
 * Fenced code blocks in MDX become highlighted, copyable CodeBlocks. `##`
 * headings get anchor ids, which the component page's table of contents links to.
 */
const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 id={headingId(textContent(children))} className="scroll-mt-24">
      {children}
    </h2>
  ),
  pre: ({ children }) => {
    const code = children as CodeElement;
    const lang = code.props.className?.replace("language-", "") ?? "text";
    return <CodeBlock code={String(code.props.children ?? "")} lang={lang} title={lang === "swift" ? "Swift" : lang} />;
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}
