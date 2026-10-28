import { codeToHtml } from "shiki";

/**
 * Highlights code at build time. Emits both themes as CSS variables
 * (--shiki-light / --shiki-dark); globals.css picks one per site theme.
 */
export async function highlight(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
