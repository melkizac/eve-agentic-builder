import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireMemoryScope } from "../lib/scope";
import { searchMemories } from "../lib/store";

export default defineTool({
  description: "Search confirmed long-term memories for the current authenticated user and project.",
  inputSchema: z.object({
    query: z.string().min(1).max(500),
    limit: z.number().int().min(1).max(20).default(8)
  }),
  async execute({ query, limit }, ctx) {
    return await searchMemories(requireMemoryScope(ctx), query, limit);
  }
});
