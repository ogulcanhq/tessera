import { githubFileUrl, type ComponentOutput } from "@/lib/registry";
import { CodeBlock } from "./code-block";
import { Tabs } from "./tabs";

/**
 * Exact source from Sources/ in the repository. The only difference from the
 * package is that `import Tessera` lines are removed (technical-decisions TD-05).
 */
export function SourceSection({ component }: { component: ComponentOutput }) {
  const items = component.files.map((file) => ({
    id: file.path,
    label: file.name,
    content: (
      <CodeBlock code={file.content} title={file.path} href={githubFileUrl(file.path)} maxHeight={560} />
    ),
  }));

  if (component.files.length > 1) {
    items.push({
      id: "single-file",
      label: "All files in one",
      content: (
        <CodeBlock
          code={component.singleFile}
          title={`${component.name.replaceAll(" ", "")}Combined.swift`}
          copyLabel="Copy all"
          maxHeight={560}
        />
      ),
    });
  }

  return <Tabs label="Source files" size="sm" items={items} />;
}
