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
  description: "Read one page from the read-only LLM Wiki snapshot after locating it with wiki_search.",
  inputSchema: z.object({ path: z.string().min(3).max(300) }),
  async execute({ path }, ctx) {
    const sandbox = await ctx.getSandbox();
    const resolved = wikiPath(path);
    const content = await sandbox.readTextFile({
      path: resolved,
      startLine: 1,
      endLine: 500,
      abortSignal: ctx.abortSignal,
    });
    if (content === null) return { found: false, path: resolved, content: null, truncated: false };
    const tail = await sandbox.readTextFile({
      path: resolved,
      startLine: 501,
      endLine: 501,
      abortSignal: ctx.abortSignal,
    });
    return { found: true, path: resolved, content, truncated: Boolean(tail) };
  },
});
