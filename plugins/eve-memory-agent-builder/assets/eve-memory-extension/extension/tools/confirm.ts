import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

import { requireMemoryScope } from "../lib/scope";
import { confirmMemory } from "../lib/store";

export default defineTool({
  description: "Confirm a proposed long-term memory after the user approves storing it.",
  inputSchema: z.object({ id: z.string().uuid() }),
  approval: always(),
  async execute({ id }, ctx) {
    return await confirmMemory(requireMemoryScope(ctx), id);
  }
});
