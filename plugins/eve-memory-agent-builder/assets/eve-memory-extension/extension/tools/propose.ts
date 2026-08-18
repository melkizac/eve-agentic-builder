import { defineTool } from "eve/tools";
import { z } from "zod";

import { requireMemoryScope } from "../lib/scope";
import { proposeMemory } from "../lib/store";
import { MEMORY_KINDS, SENSITIVITY_LEVELS } from "../lib/types";

export default defineTool({
  description: "Propose one stable fact, preference, decision, procedure, relationship, or commitment for long-term memory.",
  inputSchema: z.object({
    kind: z.enum(MEMORY_KINDS),
    content: z.string().min(1).max(4000),
    sensitivity: z.enum(SENSITIVITY_LEVELS).default("normal"),
    sourceEventId: z.string().min(1).optional()
  }),
  async execute(input, ctx) {
    return await proposeMemory(requireMemoryScope(ctx), {
      ...input,
      sourceSessionId: ctx.session.id
    });
  }
});
