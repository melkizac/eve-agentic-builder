import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

import { requireMemoryScope } from "../lib/scope";
import { forgetMemory } from "../lib/store";

export default defineTool({
  description: "Forget one proposed or confirmed long-term memory belonging to the current user and project.",
  inputSchema: z.object({ id: z.string().uuid() }),
  approval: always(),
  async execute({ id }, ctx) {
    return { deleted: await forgetMemory(requireMemoryScope(ctx), id) };
  }
});
