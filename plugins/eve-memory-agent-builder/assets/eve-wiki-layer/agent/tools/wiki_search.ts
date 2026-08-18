import { defineTool } from "eve/tools";
import { z } from "zod";

const WIKI_FILE = /^wiki\/[a-z0-9][a-z0-9/_-]*\.md$/;
const MAX_FILES = 300;
const MAX_LINES_PER_FILE = 600;

function titleOf(content: string, path: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || path.split("/").at(-1)?.replace(/\.md$/, "") || path;
}

export default defineTool({
  description:
    "Search the read-only LLM Wiki snapshot. Use for source-backed project, research, entity, and concept knowledge; do not use for user preferences.",
  inputSchema: z.object({
    query: z.string().min(2).max(300),
    limit: z.number().int().min(1).max(12).default(6),
  }),
  async execute({ query, limit }, ctx) {
    const sandbox = await ctx.getSandbox();
    const listing = await sandbox.run({
      command: "find wiki -type f -name '*.md' -print | sort",
    });
    const paths = String(listing.stdout)
      .split(/\r?\n/)
      .map((value) => value.trim().replace(/^\.\//, ""))
      .filter((value) => WIKI_FILE.test(value))
      .slice(0, MAX_FILES);
    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 1);
    const results: Array<{ path: string; title: string; score: number; snippets: string[] }> = [];

    for (const path of paths) {
      const content = await sandbox.readTextFile({
        path,
        startLine: 1,
        endLine: MAX_LINES_PER_FILE,
        abortSignal: ctx.abortSignal,
      });
      if (!content) continue;
      const lines = content.split(/\r?\n/);
      let score = 0;
      const snippets: string[] = [];
      for (const line of lines) {
        const lower = line.toLowerCase();
        const hits = terms.reduce((count, term) => count + (lower.includes(term) ? 1 : 0), 0);
        if (hits > 0) {
          score += hits;
          if (snippets.length < 3) snippets.push(line.trim().slice(0, 400));
        }
      }
      if (score > 0) results.push({ path, title: titleOf(content, path), score, snippets });
    }

    return {
      query,
      searchedFiles: paths.length,
      results: results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit),
    };
  },
});
