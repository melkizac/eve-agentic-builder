import { defineTool } from "eve/tools";
import { z } from "zod";

const RELATIVE_WIKI_FILE = /^[a-z0-9][a-z0-9/_-]*\.md$/;

function wikiPath(input: string): string {
  const normalized = input.replace(/\\/g, "/").replace(/^\/workspace\//, "").replace(/^wiki\//, "");
  if (!RELATIVE_WIKI_FILE.test(normalized) || normalized.includes("..")) {
    throw new Error("Wiki path must be a lowercase Markdown path under wiki/.");
  }
  return `wiki/${normalized}`;
}

export default defineTool({
  description: "List source references recorded in one LLM Wiki page so an answer can cite its evidence.",
  inputSchema: z.object({ path: z.string().min(3).max(300) }),
  async execute({ path }, ctx) {
    const sandbox = await ctx.getSandbox();
    const resolved = wikiPath(path);
    const content = await sandbox.readTextFile({ path: resolved, abortSignal: ctx.abortSignal });
    if (content === null) return { found: false, path: resolved, references: [] };

    const references = new Set<string>();
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const value = match[1]?.trim();
      if (value && /(raw|sources)\//i.test(value)) references.add(value);
    }
    for (const match of content.matchAll(/`((?:\.\.\/)*raw\/[^`]+|sources\/[^`]+)`/g)) {
      if (match[1]) references.add(match[1].trim());
    }
    const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/m)?.[1] ?? "";
    const sourceLine = frontmatter.match(/^sources:\s*\[(.*)\]\s*$/m)?.[1];
    if (sourceLine) {
      for (const value of sourceLine.split(",")) {
        const cleaned = value.trim().replace(/^['"]|['"]$/g, "");
        if (cleaned) references.add(cleaned);
      }
    }
    return { found: true, path: resolved, references: [...references].sort() };
  },
});
