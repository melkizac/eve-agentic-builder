import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

import { requireMemoryScope } from "../lib/scope";
import { correctMemory } from "../lib/store";

export default defineTool({
  description: "Supersede one confirmed memory with corrected content while preserving provenance.",
  inputSchema: z.object({
    id: z.string().uuid(),
    content: z.string().min(1).max(4000),
    sourceEventId: z.string().min(1).optional()
  }),
  approval: always(),
  async execute(input, ctx) {
    return await correctMemory(requireMemoryScope(ctx), {
      ...input,
      sourceSessionId: ctx.session.id
    });
  }
});
